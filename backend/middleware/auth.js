const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Xác thực token JWT
const verifyToken = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Truy cập bị từ chối' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Lấy user hiện tại từ DB để đảm bảo role được cập nhật sau khi thay đổi
  const user = await User.findById(decoded.id).select('-password');
  if (!user) return res.status(401).json({ error: 'Token không hợp lệ' });

  // Gán req.user từ DB (id, role) — không còn dùng adminLevel
  req.user = { id: user._id.toString(), role: user.role };

    // Update last activity và set online
    await User.findByIdAndUpdate(user._id, {
      lastActivity: new Date(),
      isOnline: true
    });

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token đã hết hạn' });
    }
    res.status(401).json({ error: 'Token không hợp lệ' });
  }
};

// Kiểm tra vai trò người dùng
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bị cấm' });
    }
    next();
  };
};

// Kiểm tra trạng thái ban
const checkBanStatus = async (req, res, next) => {
  const User = require('../models/User');
  const user = await User.findById(req.user.id);
  
  if (user.isBanned) {
    // Kiểm tra ban vĩnh viễn hoặc ban tạm thời chưa hết hạn
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
  next();
};

module.exports = { verifyToken, checkRole, checkBanStatus };