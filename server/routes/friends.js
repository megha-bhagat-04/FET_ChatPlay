const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Send friend request
router.post("/request", async (req, res) => {
  const { user_id, friend_id } = req.body;
  try {
    const [existing] = await pool.query(
      "SELECT * FROM friends WHERE (user_id=? AND friend_id=?) OR (user_id=? AND friend_id=?)",
      [user_id, friend_id, friend_id, user_id]
    );
    if (existing.length > 0) return res.status(400).json({ message: "Request already exists or already friends" });
    await pool.query("INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, 'pending')", [user_id, friend_id]);
    res.status(201).json({ message: "Friend request sent" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

// Get pending requests received by userId
router.get("/requests/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  try {
    const [rows] = await pool.query(
      `SELECT f.id, f.user_id, u.username FROM friends f
       JOIN users u ON f.user_id = u.user_id
       WHERE f.friend_id = ? AND f.status = 'pending'`,
      [userId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

// Get friendship status between two users
router.get("/status", async (req, res) => {
  const { userId, friendId } = req.query;
  try {
    const [rows] = await pool.query(
      "SELECT status FROM friends WHERE (user_id=? AND friend_id=?) OR (user_id=? AND friend_id=?)",
      [userId, friendId, friendId, userId]
    );
    res.json({ status: rows.length > 0 ? rows[0].status : "none" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

// Accept request
router.post("/accept", async (req, res) => {
  const { user_id, friend_id } = req.body;
  try {
    await pool.query(
      "UPDATE friends SET status='accepted' WHERE user_id=? AND friend_id=? AND status='pending'",
      [friend_id, user_id]
    );
    res.json({ message: "Friend request accepted" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

// Reject request
router.post("/reject", async (req, res) => {
  const { user_id, friend_id } = req.body;
  try {
    await pool.query(
      "DELETE FROM friends WHERE user_id=? AND friend_id=? AND status='pending'",
      [friend_id, user_id]
    );
    res.json({ message: "Friend request rejected" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

// Remove friend
router.post("/remove", async (req, res) => {
  const { user_id, friend_id } = req.body;
  try {
    await pool.query(
      "DELETE FROM friends WHERE ((user_id=? AND friend_id=?) OR (user_id=? AND friend_id=?)) AND status='accepted'",
      [user_id, friend_id, friend_id, user_id]
    );
    res.json({ message: "Friend removed" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

module.exports = router;
