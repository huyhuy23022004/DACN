const User = require('../models/User');
const jwt = require('jsonwebtoken');
const transporter = require('../config/email');
const { sendEmail } = require('../utils/emailHelper');
const Notification = require('../models/Notification');

// Đăng ký người dùng
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email đã được sử dụng' });
    }

    // Kiểm tra username đã tồn tại
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: 'Tên đăng nhập đã được sử dụng' });
    }

    const user = new User({
      username,
      email,
      password,
      isVerified: false
    });

    // Tạo token xác thực email
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 giờ

    await user.save();

    // Gửi email xác thực
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Xác nhận tài khoản',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="http://localhost:5000/assets/HUNRE_Logo.png" alt="HCNRE Logo" style="max-width: 150px; height: auto;">
          </div>
          <h2 style="color: #333; text-align: center;">Xác nhận tài khoản</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấp vào liên kết dưới đây để xác nhận tài khoản của bạn:
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${verificationLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Xác nhận tài khoản</a>
          </div>
          <p style="color: #777; font-size: 14px;">
            Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này. Liên kết sẽ hết hạn sau 24 giờ.
          </p>
          <p style="color: #777; font-size: 14px; text-align: center;">
            Trân trọng,<br>
            Đội ngũ HCMUNRE(Admin)
          </p>
        </div>
      `,
    });

    res.status(201).json({ 
      message: 'Đăng ký người dùng thành công. Vui lòng kiểm tra email để xác nhận tài khoản.',
      requiresVerification: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xác thực email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(400).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    const user = await User.findOne({
      email: decoded.email,
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    // Cập nhật trạng thái xác thực
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save();

    res.json({ message: 'Email đã được xác thực thành công. Bạn có thể đăng nhập ngay bây giờ.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Đăng nhập người dùng
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Thông tin đăng nhập không hợp lệ' });
    }

    // Kiểm tra email đã xác thực
    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Email chưa được xác thực. Vui lòng kiểm tra email và xác nhận tài khoản.',
        requiresVerification: true
      });
    }

    // Kiểm tra trạng thái ban
    if (user.isBanned) {
      if (!user.banExpiresAt || user.banExpiresAt > new Date()) {
        return res.status(403).json({ 
          error: 'Tài khoản đã bị cấm', 
          reason: user.banReason,
          expiresAt: user.banExpiresAt 
        });
      } else {
        // Ban đã hết hạn, tự động unban
        user.isBanned = false;
        user.banReason = null;
        user.banExpiresAt = null;
        user.bannedBy = null;
        user.banDate = null;
        await user.save();
      }
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.isOnline = true;
    user.lastActivity = new Date();
    await user.save();
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Quên mật khẩu
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Người dùng không tìm thấy' });

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Xác nhận đặt lại mật khẩu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="http://localhost:5000/assets/HUNRE_Logo.png" alt="HCNRE Logo" style="max-width: 150px; height: auto;">
          </div>
          <h2 style="color: #333; text-align: center;">Đặt lại mật khẩu</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng nhấp vào liên kết dưới đây để đặt lại mật khẩu:
          </p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Đặt lại mật khẩu</a>
          </div>
          <p style="color: #777; font-size: 14px;">
            Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Liên kết sẽ hết hạn sau 15 phút.
          </p>
          <p style="color: #777; font-size: 14px; text-align: center;">
            Trân trọng,<br>
            Đội ngũ HCMUNRE(Admin)
          </p>
        </div>
      `,
    });

    res.json({ message: 'Liên kết đặt lại mật khẩu đã được gửi đến email' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Đặt lại mật khẩu
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(400).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.resetToken !== token || user.resetTokenExpiry < Date.now()) {
      return res.status(400).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
    }
    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    res.json({ message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy thông tin profile người dùng
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cập nhật profile
exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy bình luận của người dùng hiện tại
exports.getUserComments = async (req, res) => {
  try {
    const Comment = require('../models/Comment');
    const comments = await Comment.find({ author: req.user.id }).populate('news', 'title');
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy tin tức yêu thích của người dùng hiện tại
exports.getUserLikedNews = async (req, res) => {
  try {
    console.log('getUserLikedNews được gọi');
    if (!req.user) {
      console.log('Không có user trong request');
      return res.status(401).json({ error: 'Không được phép truy cập' });
    }
    console.log('getUserLikedNews được gọi cho user:', req.user.id);
    const News = require('../models/News');
    const likedNews = await News.find({ likes: req.user.id, published: true })
      .populate('author', 'username')
      .populate('category', 'name')
      .sort({ createdAt: -1 });
    console.log('Tìm thấy tin tức yêu thích:', likedNews.length);
    res.json(likedNews);
  } catch (error) {
    console.error('Lỗi trong getUserLikedNews:', error);
    res.status(500).json({ error: error.message });
  }
};

// Đổi mật khẩu
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    // Kiểm tra mật khẩu hiện tại
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: 'Mật khẩu hiện tại không đúng' });
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;
    await user.save();

    // Gửi email thông báo đổi mật khẩu thành công
    await sendEmail(
      user.email,
      'Mật khẩu đã được thay đổi thành công',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="http://localhost:5000/assets/HUNRE_Logo.png" alt="HCNRE Logo" style="max-width: 150px; height: auto;">
          </div>
          <h2 style="color: #333; text-align: center;">Mật khẩu đã được thay đổi</h2>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Mật khẩu của tài khoản <strong>${user.username}</strong> đã được thay đổi thành công.
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Nếu bạn không thực hiện thay đổi này, vui lòng liên hệ với chúng tôi ngay lập tức để bảo vệ tài khoản của bạn.
          </p>
          <p style="color: #777; font-size: 14px; text-align: center;">
            Trân trọng,<br>
            Đội ngũ HCMUNRE(Admin)
          </p>
        </div>
      `
    );

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Đăng xuất người dùng
exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { isOnline: false });
    res.json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy thông báo của người dùng hiện tại
exports.getUserNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const notifications = await Notification.find({ recipient: req.user.id })
      .populate('createdBy', 'username role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Notification.countDocuments({ recipient: req.user.id });
    const unreadCount = await Notification.countDocuments({ recipient: req.user.id, isRead: false });

    res.json({
      notifications,
      total,
      unreadCount,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Đánh dấu thông báo đã đọc
exports.markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) return res.status(404).json({ error: 'Thông báo không tìm thấy' });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Đánh dấu tất cả thông báo đã đọc
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'Tất cả thông báo đã được đánh dấu là đã đọc' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};