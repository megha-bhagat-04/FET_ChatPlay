const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Multer setup for profile pics
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `user_${req.body.userId || Date.now()}_${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage });

// Get user profile
router.get("/profile/:userId", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT user_id, username, email, bio, profile_pic, role, status, wins, losses, streak FROM users WHERE user_id = ?",
      [req.params.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get all users (for find friends) - excluding current friends
router.get("/all", async (req, res) => {
  const { userId } = req.query;
  try {
    const [rows] = await pool.query(
      `SELECT user_id, username, bio, profile_pic, status 
       FROM users 
       WHERE user_id != ? 
         AND role != 'admin' 
         AND status = 'active'
         AND NOT EXISTS (
           SELECT 1 FROM friends f 
           WHERE f.status = 'accepted' 
             AND (
               (f.user_id = users.user_id AND f.friend_id = ?) OR 
               (f.friend_id = users.user_id AND f.user_id = ?)
             )
         )`,
      [Number(userId), Number(userId), Number(userId)]


    );
    console.log("Find Friends SQL Result for user", userId, ":", rows.map(r => r.username));
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


// Edit user profile (with optional file upload)
router.put("/profile", upload.single("profile_pic"), async (req, res) => {
  const { userId, username, email, bio } = req.body;
  try {
    let picPath = null;
    if (req.file) picPath = `uploads/${req.file.filename}`;

    if (picPath) {
      await pool.query("UPDATE users SET username=?, email=?, bio=?, profile_pic=? WHERE user_id=?", [username, email, bio, picPath, userId]);
    } else {
      await pool.query("UPDATE users SET username=?, email=?, bio=? WHERE user_id=?", [username, email, bio, userId]);
    }

    const [rows] = await pool.query("SELECT user_id, username, email, bio, profile_pic, role, status, wins, losses, streak FROM users WHERE user_id=?", [userId]);
    res.json({ message: "Profile updated successfully", user: rows[0] });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Change password
router.put("/change-password", async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  try {
    const [rows] = await pool.query("SELECT password FROM users WHERE user_id = ?", [userId]);
    if (rows.length === 0) return res.status(404).json({ message: "User not found" });
    if (rows[0].password !== currentPassword) return res.status(400).json({ message: "Current password is incorrect" });
    await pool.query("UPDATE users SET password = ? WHERE user_id = ?", [newPassword, userId]);
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete user account
router.delete("/profile/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    await pool.query("DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?", [userId, userId]);
    await pool.query("DELETE FROM friends WHERE user_id = ? OR friend_id = ?", [userId, userId]);
    await pool.query("DELETE FROM game_invites WHERE sender_id = ? OR receiver_id = ?", [userId, userId]);
    await pool.query("DELETE FROM notifications WHERE user_id = ? OR target_id = ?", [userId, userId]);
    await pool.query("DELETE FROM games WHERE player1 = ? OR player2 = ?", [userId, userId]);
    await pool.query("DELETE FROM users WHERE user_id = ?", [userId]);
    res.json({ message: "Account deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
