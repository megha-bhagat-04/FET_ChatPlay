const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Get current game state
router.get("/state/:id", async (req, res) => {
  try {
    const gameId = req.params.id;
    const [rows] = await pool.query("SELECT * FROM games WHERE game_id = ?", [gameId]);
    if (rows.length === 0) return res.status(404).json({ message: "Game not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get received invites
router.get("/invites/received/:userId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT gi.*, u.username as sender_username 
       FROM game_invites gi 
       JOIN users u ON gi.sender_id = u.user_id 
       WHERE gi.receiver_id = ? AND gi.status = 'pending'`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get sent invites
router.get("/invites/sent/:userId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT gi.*, u.username as receiver_username 
       FROM game_invites gi 
       JOIN users u ON gi.receiver_id = u.user_id 
       WHERE gi.sender_id = ? AND (gi.status = 'pending' OR gi.status = 'declined')`,
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Accept invite (rest of the logic is in sockets.js, but we need an endpoint for the UI)
router.post("/invites/accept", async (req, res) => {
  const { invite_id } = req.body;
  try {
    await pool.query("UPDATE game_invites SET status = 'accepted' WHERE id = ?", [invite_id]);
    res.json({ message: "Invite accepted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Decline invite
router.post("/invites/decline", async (req, res) => {
  const { invite_id } = req.body;
  try {
    await pool.query("UPDATE game_invites SET status = 'declined' WHERE id = ?", [invite_id]);
    res.json({ message: "Invite declined" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Cancel/Dismiss invite
router.post("/invites/cancel", async (req, res) => {
  const { invite_id } = req.body;
  try {
    await pool.query("DELETE FROM game_invites WHERE id = ?", [invite_id]);
    res.json({ message: "Invite removed" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
