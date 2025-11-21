const { sendEmail } = require('../utils/emailHelper');

// Xử lý gửi feedback
const sendFeedback = async (req, res) => {
  try {
    const { content, location, email } = req.body;

    // Kiểm tra dữ liệu
    if (!content || !location || !email) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Gửi email đến admin
    const adminEmail = process.env.EMAIL_USER;
    const subject = 'Phản hồi từ người dùng';
    const html = `
      <h3>Phản hồi mới từ người dùng</h3>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Nơi ở:</strong> ${location}</p>
      <p><strong>Nội dung:</strong></p>
      <p>${content}</p>
    `;

    await sendEmail(adminEmail, subject, html);

    res.status(200).json({ message: 'Phản hồi đã được gửi thành công' });
  } catch (error) {
    console.error('Lỗi gửi feedback:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi gửi phản hồi' });
  }
};

module.exports = { sendFeedback };