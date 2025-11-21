const transporter = require('../config/email');

// Gửi email
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
    });
    console.log('Email đã được gửi');
  } catch (error) {
    console.error('Lỗi gửi email:', error);
  }
};

module.exports = { sendEmail };