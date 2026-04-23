const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Fetch all reports with user details
router.get("/reports", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.id, r.reason, r.status, r.timestamp,
              u1.username as reported_username, u1.user_id as reported_user_id,
              u2.username as reporter_username 
       FROM reports r
       JOIN users u1 ON r.reported_user = u1.user_id
       JOIN users u2 ON r.reported_by = u2.user_id
       ORDER BY r.timestamp DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch all users with report counts
router.get("/users", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.username, u.email, u.status, u.role,
              (SELECT COUNT(*) FROM reports WHERE reported_user = u.user_id) as report_count
       FROM users u
       WHERE u.role != 'admin'
       ORDER BY report_count DESC`
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Ban/Unban user
router.put("/user/:userId/status", async (req, res) => {
  const { status } = req.body; // 'active' or 'banned'
  try {
    await pool.query("UPDATE users SET status = ? WHERE user_id = ?", [status, req.params.userId]);
    res.json({ message: `User ${status === 'banned' ? 'banned' : 'unbanned'} successfully` });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Resolve a report
router.put("/report/:reportId/resolve", async (req, res) => {
  try {
    await pool.query("UPDATE reports SET status = 'resolved' WHERE id = ?", [req.params.reportId]);
    res.json({ message: "Report resolved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
