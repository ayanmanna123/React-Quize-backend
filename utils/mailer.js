// utils/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: `"Quiz App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your email',
    html: `<h3>Your verification code is <b>${code}</b></h3><p>This will expire in 10 minutes.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendVerificationEmail;
