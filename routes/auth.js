const express = require("express");
const User = require("../models/User");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

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

// ✅ ROUTE: Send Verification Code to User Email
router.post("/send-verification-code", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  try {
    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeExpires = Date.now() + 5 * 60 * 1000; // expires in 5 minutes

    // Update user or create if not exists
    const user = await User.findOneAndUpdate(
      { email },
      {
        verificationCode: code,
        codeExpires,
        isVerified: false,
      },
      { upsert: true, new: true }
    );

    // Send email using Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Quiz App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Verification Code",
      text: `Your verification code is: ${code}`,
    });

    return res.json({ success: true, message: "Verification code sent to your email" });
  } catch (error) {
    console.error("Error sending verification code:", error);
    return res.status(500).json({ success: false, message: "Failed to send code" });
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
