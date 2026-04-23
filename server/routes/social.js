const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Get accepted friends of a user
router.get("/friends/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  try {
    // Select users who have an 'accepted' friendship with the requester
    const [rows] = await pool.query(
      `SELECT u.user_id, u.username, u.bio, u.profile_pic, u.status
       FROM users u
       INNER JOIN friends f ON (
         (f.user_id = ? AND f.friend_id = u.user_id) OR
         (f.friend_id = ? AND f.user_id = u.user_id)
       )
       WHERE f.status = 'accepted' 
         AND u.user_id != ? 
         AND u.status = 'active'`,
      [userId, userId, userId]
    );
    res.json(rows);
  } catch (err) {
    console.error("Fetch friends error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get head-to-head stats between two users
router.get("/head-to-head/:userId/:friendId", async (req, res) => {
  const { userId, friendId } = req.params;
  try {
    const [games] = await pool.query(
      `SELECT winner, player1, player2 
       FROM games 
       WHERE ((player1 = ? AND player2 = ?) OR (player1 = ? AND player2 = ?))
         AND winner != 0
       ORDER BY game_id DESC`,
      [userId, friendId, friendId, userId]
    );

    let wins = 0;
    let losses = 0;
    let currentStreak = 0;
    let streakCount = 0;

    games.forEach((g, index) => {
      if (g.winner == userId) {
        wins++;
        if (index === streakCount) {
          currentStreak++;
          streakCount++;
        }
      } else if (g.winner == friendId) {
        losses++;
        if (index === streakCount) {
          streakCount = -1; // Streak broken
        }
      }
    });

    res.json({ wins, losses, currentStreak });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Report a user
router.post("/report", async (req, res) => {
  const { reported_user, reported_by, reason } = req.body;
  try {
    await pool.query(
      "INSERT INTO reports (reported_user, reported_by, reason, status) VALUES (?, ?, ?, 'pending')",
      [reported_user, reported_by, reason]
    );
    res.json({ message: "Report submitted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
