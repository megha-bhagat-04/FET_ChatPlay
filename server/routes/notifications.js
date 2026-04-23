const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Get unread notifications
router.get("/:userId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY id DESC LIMIT 50",
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Mark notification as read
router.put("/read/:notifId", async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET is_read = 1 WHERE id = ?", [req.params.notifId]);
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Clear all (Mark all as read)
router.put("/clear/:userId", async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET is_read = 1 WHERE user_id = ?", [req.params.userId]);
    res.json({ message: "All notifications cleared" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
