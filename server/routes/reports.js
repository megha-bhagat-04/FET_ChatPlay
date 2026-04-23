const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Submit a user report
router.post("/submit", async (req, res) => {
  const { reported_user, reported_by, reason } = req.body;
  try {
    await pool.query(
      "INSERT INTO reports (reported_user, reported_by, reason, status) VALUES (?, ?, ?, 'pending')",
      [reported_user, reported_by, reason]
    );
    res.status(201).json({ message: "Report submitted successfully" });
  } catch (error) {
    console.error("Error submitting report:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
