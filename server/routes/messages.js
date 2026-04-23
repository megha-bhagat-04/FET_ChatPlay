const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Get recent message previews for home page
router.get("/recent/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.username, u.profile_pic,
        (SELECT m.message FROM messages m
         WHERE (m.sender_id = u.user_id AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = u.user_id)
         ORDER BY m.timestamp DESC LIMIT 1) as last_msg,
        (SELECT COUNT(*) FROM messages WHERE sender_id = u.user_id AND receiver_id = ? AND is_read = 0) as unread_count,
        (SELECT MAX(timestamp) FROM messages WHERE (sender_id = u.user_id AND receiver_id = ?) OR (sender_id = ? AND receiver_id = u.user_id)) as last_time
       FROM users u
       WHERE u.user_id IN (
         SELECT DISTINCT sender_id FROM messages WHERE receiver_id = ?
         UNION
         SELECT DISTINCT receiver_id FROM messages WHERE sender_id = ?
       )
       ORDER BY last_time DESC LIMIT 5`,
      [userId, userId, userId, userId, userId, userId, userId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all conversations for Inbox
router.get("/inbox/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  try {
    const [rows] = await pool.query(
      `SELECT DISTINCT u.user_id, u.username, u.profile_pic FROM users u
       JOIN messages msg ON (u.user_id = msg.sender_id OR u.user_id = msg.receiver_id)
       WHERE (msg.sender_id = ? OR msg.receiver_id = ?) AND u.user_id != ?`,
      [userId, userId, userId]
    );
    
    // Now fetch details for each conversation manually or with map to be safe
    const enriched = await Promise.all(rows.map(async (row) => {
      const [lastMsg] = await pool.query(
        "SELECT message, timestamp FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY timestamp DESC LIMIT 1",
        [userId, row.user_id, row.user_id, userId]
      );
      const [unread] = await pool.query(
        "SELECT COUNT(*) as count FROM messages WHERE sender_id = ? AND receiver_id = ? AND is_read = 0",
        [row.user_id, userId]
      );
      return {
        ...row,
        last_msg: lastMsg[0]?.message || "",
        last_time: lastMsg[0]?.timestamp || null,
        unread_count: unread[0]?.count || 0
      };
    }));

    enriched.sort((a, b) => new Date(b.last_time) - new Date(a.last_time));
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get messages between two users (mark as read)
router.get("/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT * FROM messages
       WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
       ORDER BY timestamp ASC`,
      [user1, user2, user2, user1]
    );
    // Mark messages from user2 to user1 as read
    await pool.query(
      "UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0",
      [user2, user1]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete entire conversation
router.delete("/conversation/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    await pool.query(
      "DELETE FROM messages WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)",
      [user1, user2, user2, user1]
    );
    res.json({ success: true, message: "Conversation deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get total unread count for sidebar
router.get("/count/unread/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const [rows] = await pool.query(
      "SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0",
      [userId]
    );
    res.json({ count: rows[0].count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark messages as read
router.post("/read/:user1/:user2", async (req, res) => {
  const { user1, user2 } = req.params;
  try {
    await pool.query(
      "UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0",
      [user2, user1]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Mark all as read for a user
router.post("/read-all/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    await pool.query(
      "UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND is_read = 0",
      [userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
