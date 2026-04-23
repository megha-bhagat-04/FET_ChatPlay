const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

// Login Route
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const identifier = username.trim().toLowerCase();
  
  try {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?",
      [identifier, identifier]
    );
    
    if (rows.length === 0) return res.status(401).json({ message: "Invalid username or email" });
    
    // Find user with matching password (plain text as per user requirement to keep logic same as mavenproject5)
    const user = rows.find(u => u.password === password);
    if (!user) return res.status(401).json({ message: "Incorrect password" });
    
    if (user.status === "banned") return res.status(403).json({ message: "Your account is banned" });

    const token = jwt.sign(
      { id: user.user_id, username: user.username, role: user.role },
      process.env.JWT_SECRET || "supersecretkey_chatplay",
      { expiresIn: "24h" }
    );
    
    res.json({
      token,
      user: { 
        id: user.user_id, 
        username: user.username, 
        email: user.email, 
        role: user.role, 
        status: user.status, 
        profile_pic: user.profile_pic, 
        bio: user.bio 
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Register Route
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const userTrim = username.trim();
  const emailTrim = email.trim().toLowerCase();
  
  try {
    const [existing] = await pool.query(
      "SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(email) = ?", 
      [userTrim.toLowerCase(), emailTrim]
    );
    
    if (existing.length > 0) {
      const isEmail = existing.some(u => u.email.toLowerCase() === emailTrim);
      return res.status(400).json({ 
        message: isEmail ? "Email already exists" : "Username already exists" 
      });
    }
    
    await pool.query(
      "INSERT INTO users (username, email, password, role, status) VALUES (?, ?, ?, 'user', 'active')",
      [userTrim, emailTrim, password]
    );
    
    res.status(201).json({ message: "Registration successful. Please login." });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Check email exists (for forgot password)
router.get("/check-email", async (req, res) => {
  const { email } = req.query;
  const emailTrim = email.trim().toLowerCase();
  try {
    const [rows] = await pool.query("SELECT user_id FROM users WHERE LOWER(email) = ?", [emailTrim]);
    if (rows.length === 0) return res.status(404).json({ message: "No account found with this email address" });
    res.json({ exists: true });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  const emailTrim = email.trim().toLowerCase();
  try {
    const [result] = await pool.query("UPDATE users SET password = ? WHERE LOWER(email) = ?", [newPassword, emailTrim]);
    if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
