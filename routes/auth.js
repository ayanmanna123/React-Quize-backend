const express = require("express");
const User = require("../models/User");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendVerificationEmail = require("../utils/mailer");
const fetchUser = require("../middleware/fetchUser");
const dotenv = require("dotenv");
dotenv.config();

const JWT_SECRET = "Harryisagoodb$oy";

// ROUTE 1: Create a User
router.post(
  "/createuser",
  [
    body("name", "Enter a valid name").isLength({ min: 3 }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password must be at least 5 characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success, errors: errors.array() });
    }
    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ success, error: "User with this email already exists" });
      }
      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);

      user = await User.create({
        name: req.body.name,
        password: secPass,
        email: req.body.email,
      });

      const data = { user: { id: user.id } };
      const authtoken = jwt.sign(data, JWT_SECRET);
      success = true;
      res.json({ success, authtoken });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  }
);

// ROUTE 2: Login User
router.post(
  "/login",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password cannot be blank").exists(),
  ],
  async (req, res) => {
    let success = false;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ success, error: "Invalid credentials" });
      }

      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        return res.status(400).json({ success, error: "Invalid credentials" });
      }

      const data = { user: { id: user.id } };
      const authtoken = jwt.sign(data, JWT_SECRET);
      success = true;
      res.json({ success, authtoken });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal Server Error");
    }
  }
);

// ROUTE 3: Get logged-in user's name and email
router.post("/getuser", fetchUser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email date");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    console.error("Error fetching user details:", error.message);
    res.status(500).send("Internal Server Error");
  }
});

// ✅ ROUTE 4: Send Email Verification Code
router.post("/send-code", async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Requested email:", email); // ✅ Add this

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000);

    // Create reusable transporter using Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // your Gmail
        pass: process.env.EMAIL_PASS, // your App password
      },
    });

    // Send mail
    const info = await transporter.sendMail({
      from: `"Quiz App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your verification code",
      text: `Your verification code is ${code}`,
    });

    console.log("Email sent:", info.response); // ✅ Log success

    res.json({ success: true, message: "Code sent", code }); // optional: send code for testing
  } catch (error) {
    console.error("Error in /send-code:", error); // ✅ Log error
    res.status(500).json({ success: false, message: "Failed to send code" });
  }
});


// ✅ ROUTE 5: Verify Email Code
router.post("/verify-code", async (req, res) => {
  const { email, code } = req.body;
  try {
    const user = await User.findOne({ email });
    if (
      !user ||
      user.verificationCode !== code ||
      Date.now() > user.codeExpires
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired code" });
    }

    user.isVerified = true;
    user.verificationCode = null;
    user.codeExpires = null;
    await user.save();

    res.json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Verification failed" });
  }
});

module.exports = router;
