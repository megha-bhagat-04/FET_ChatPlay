module.exports = (io, pool) => {
  const connectedUsers = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // When a user logs in and connects
    socket.on("register_user", (userId) => {
      connectedUsers.set(userId, socket.id);
      io.emit("user_status_change", { userId, status: "online" });
    });

    // Chat messages
    socket.on("send_message", async (data) => {
      const { sender_id, receiver_id, message } = data;
      console.log("Sending message from", sender_id, "to", receiver_id, ":", message);
      try {
        const [result] = await pool.query(
          "INSERT INTO messages (sender_id, receiver_id, message, is_read) VALUES (?, ?, ?, 0)",
          [sender_id, receiver_id, message]
        );
        console.log("Message saved with ID:", result.insertId);
        
        const newMessage = {
          message_id: result.insertId,
          sender_id,
          receiver_id,
          message,
          timestamp: new Date(),
          is_read: 0
        };

        const receiverSocketId = connectedUsers.get(receiver_id);
        
        // Add persistent notification
        const [sRows] = await pool.query("SELECT username FROM users WHERE user_id = ?", [sender_id]);
        const senderName = sRows[0]?.username || "A user";
        const msgText = `A new message from ${senderName}`;
        const [notifRes] = await pool.query("INSERT INTO notifications (user_id, message, is_read, type, target_id) VALUES (?, ?, 0, 'message', ?)", [receiver_id, msgText, sender_id]);

        if (receiverSocketId) {
          console.log("Emitting receive_message to receiver:", receiver_id);
          io.to(receiverSocketId).emit("receive_message", { ...newMessage, notif_id: notifRes.insertId, message_text: msgText, sender_username: senderName });
        }
        
        // Also send back to sender to confirm
        console.log("Emitting message_sent back to sender:", sender_id);
        socket.emit("message_sent", newMessage);
      } catch (err) {
        console.error("Error sending message:", err);
      }
    });

    // Friend Requests
    socket.on("send_friend_request", async (data) => {
      const { sender_id, receiver_id, sender_username } = data;
      try {
        const msg = `${sender_username} sent you a friend request.`;
        const [res] = await pool.query("INSERT INTO notifications (user_id, message, is_read, type, target_id) VALUES (?, ?, 0, 'friend_request', ?)", [receiver_id, msg, sender_id]);
        
        const receiverSocketId = connectedUsers.get(receiver_id);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_friend_request", {
            id: res.insertId,
            sender_id,
            sender_username,
            timestamp: new Date(),
            message: msg,
            type: 'friend_request',
            target_id: sender_id
          });
        }
      } catch (err) {
        console.error("Error saving friend request notification:", err);
      }
    });

    socket.on("accept_friend_request", async (data) => {
      const { sender_id, receiver_id } = data;
      try {
        const [rows] = await pool.query("SELECT username FROM users WHERE user_id = ?", [receiver_id]);
        const receiverName = rows[0]?.username || "A user";
        const msg = `${receiverName} accepted your friend request.`;
        const [res] = await pool.query("INSERT INTO notifications (user_id, message, is_read, type, target_id) VALUES (?, ?, 0, 'friend_accepted', ?)", [sender_id, msg, receiver_id]);

        const senderSocketId = connectedUsers.get(sender_id);
        if (senderSocketId) {
          io.to(senderSocketId).emit("friend_request_accepted", { id: res.insertId, receiver_id, message: msg, type: 'friend_accepted', target_id: receiver_id });
        }
      } catch (err) {
        console.error("Error saving accept notification:", err);
      }
    });

    // Game Invites
    socket.on("send_game_invite", async (data) => {
      const { sender_id, receiver_id, game_type, source } = data;
      try {
        const [sRows] = await pool.query("SELECT username FROM users WHERE user_id = ?", [sender_id]);
        const senderName = sRows[0]?.username || "A user";
        const msg = `${senderName} invited you to play`;
        
        const [result] = await pool.query(
          "INSERT INTO game_invites (sender_id, receiver_id, game_type, status) VALUES (?, ?, ?, 'pending')",
          [sender_id, receiver_id, game_type]
        );
        const inviteId = result.insertId;

        const [notifRes] = await pool.query("INSERT INTO notifications (user_id, message, is_read, type, target_id) VALUES (?, ?, 0, 'game_invite', ?)", [receiver_id, msg, inviteId]);

        const receiverSocketId = connectedUsers.get(receiver_id);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("receive_game_invite", {
            id: inviteId,
            notif_id: notifRes.insertId,
            sender_id,
            sender_username: senderName,
            game_type,
            message: msg,
            source: source || 'friends'
          });
        }
      } catch (err) {
        console.error("Error sending game invite:", err);
      }
    });

    // Accept Game Invite
    socket.on("accept_game_invite", async (data) => {
      const { invite_id, sender_id, receiver_id, game_type } = data;
      try {
        await pool.query("UPDATE game_invites SET status = 'accepted' WHERE id = ?", [invite_id]);
        
        const [result] = await pool.query(
          "INSERT INTO games (player1, player2, board, turn, winner, game_type) VALUES (?, ?, '---------', ?, 0, ?)",
          [sender_id, receiver_id, sender_id, game_type]
        );
        const gameId = result.insertId;

        await pool.query("UPDATE game_invites SET game_id = ? WHERE id = ?", [gameId, invite_id]);

        const senderSocketId = connectedUsers.get(sender_id);
        if (senderSocketId) {
          io.to(senderSocketId).emit("game_started", { game_id: gameId, opponent_id: receiver_id, game_type, turn: sender_id });
        }
        socket.emit("game_started", { game_id: gameId, opponent_id: sender_id, game_type, turn: sender_id });

      } catch (err) {
        console.error("Error accepting game invite:", err);
      }
    });

    // Make Game Move (Tic Tac Toe)
    socket.on("make_move", async (data) => {
      const { game_id, player_id, index } = data;
      try {
        const [rows] = await pool.query("SELECT * FROM games WHERE game_id = ?", [game_id]);
        if (rows.length === 0) return;
        
        const game = rows[0];
        if (game.winner !== 0) return; // Game already over
        if (game.turn !== player_id) return; // Not this player's turn
        
        let boardArr = game.board.split('');
        if (boardArr[index] !== '-') return; // Cell already taken
        
        const isPlayer1 = player_id === game.player1;
        boardArr[index] = isPlayer1 ? 'X' : 'O';
        const newBoard = boardArr.join('');
        
        // Check winner
        const lines = [
          [0, 1, 2], [3, 4, 5], [6, 7, 8],
          [0, 3, 6], [1, 4, 7], [2, 5, 8],
          [0, 4, 8], [2, 4, 6]
        ];
        
        let newWinner = 0;
        for (let i = 0; i < lines.length; i++) {
          const [a, b, c] = lines[i];
          if (boardArr[a] !== '-' && boardArr[a] === boardArr[b] && boardArr[a] === boardArr[c]) {
            newWinner = player_id;
            break;
          }
        }
        
        if (newWinner === 0 && !boardArr.includes('-')) {
          newWinner = -1; // Draw
        }
        
        const nextTurn = isPlayer1 ? game.player2 : game.player1;
        
        await pool.query("UPDATE games SET board = ?, turn = ?, winner = ? WHERE game_id = ?", [newBoard, nextTurn, newWinner, game_id]);
        
        // --- START OF STATS UPDATE ---
        if (newWinner !== 0) {
          if (newWinner === -1) {
            // Draw: Reset streaks or just leave them? Usually streak is for wins.
            // Let's just leave it for now or increment nothing.
          } else {
            const loserId = (newWinner === game.player1) ? game.player2 : game.player1;
            
            // Update Winner Stats
            await pool.query("UPDATE users SET wins = wins + 1, streak = streak + 1 WHERE user_id = ?", [newWinner]);
            // Update Loser Stats
            await pool.query("UPDATE users SET losses = losses + 1, streak = 0 WHERE user_id = ?", [loserId]);
          }
        }
        // --- END OF STATS UPDATE ---

        const opponentId = isPlayer1 ? game.player2 : game.player1;

        const opponentSocketId = connectedUsers.get(opponentId);
        
        const updatePayload = { game_id, board: newBoard, turn: nextTurn, winner: newWinner };
        
        if (opponentSocketId) {
          io.to(opponentSocketId).emit("game_updated", updatePayload);
        }
        // Send back to the player who made the move too
        socket.emit("game_updated", updatePayload);
        
      } catch (err) {
        console.error("Error updating game move:", err);
      }
    });

    socket.on("profile_updated", (userData) => {
      socket.broadcast.emit("user_profile_updated", userData);
    });

    socket.on("disconnect", () => {
      let disconnectedUserId = null;
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          connectedUsers.delete(userId);
          break;
        }
      }
      if (disconnectedUserId) {
        io.emit("user_status_change", { userId: disconnectedUserId, status: "offline" });
      }
      console.log("User disconnected:", socket.id);
    });
  });
};
