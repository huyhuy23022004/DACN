const User = require('../models/User');
const News = require('../models/News');
const Comment = require('../models/Comment');
const Category = require('../models/Category');
const Notification = require('../models/Notification');
const cloudinary = require('../config/cloudinary');

// Lấy thống kê dashboard
exports.getStats = async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const newsCount = await News.countDocuments();
    const commentCount = await Comment.countDocuments();
    const categoryCount = await Category.countDocuments();
    const totalViews = await News.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]);
    res.json({
      users: userCount,
      news: newsCount,
      comments: commentCount,
      categories: categoryCount,
      views: totalViews[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy tất cả người dùng
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Cập nhật vai trò người dùng
exports.updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'Người dùng không tìm thấy' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy tất cả tin tức (bao gồm chưa xuất bản)
exports.getAllNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category || '';

    let query = {};
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }

    const news = await News.find(query)
      .populate('author category')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await News.countDocuments(query);

    res.json({
      news,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xuất bản/hủy xuất bản tin tức
exports.togglePublish = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ error: 'Tin tức không tìm thấy' });
    news.published = !news.published;
    await news.save();
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy tất cả bình luận
exports.getAllComments = async (req, res) => {
  try {
    const comments = await Comment.find().populate('author news');
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa bình luận
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Bình luận không tìm thấy' });
    res.json({ message: 'Bình luận đã được xóa' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Ban user
exports.banUser = async (req, res) => {
  try {
    const { reason, duration } = req.body; // duration: '1d', '1w', '1m', 'permanent'
    
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Người dùng không tìm thấy' });
    
    if (user.role === 'admin') return res.status(403).json({ error: 'Không thể ban admin' });
    
    let banExpiresAt = null;
    if (duration !== 'permanent') {
      const now = new Date();
      switch (duration) {
        case '1d':
          banExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          break;
        case '1w':
          banExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case '1m':
          banExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
          break;
      }
    }
    
    user.isBanned = true;
    user.banReason = reason;
    user.banExpiresAt = banExpiresAt;
    user.bannedBy = req.user.id;
    user.banDate = new Date();
    await user.save();
    
    await user.populate('bannedBy');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// (Admin level feature removed)

// Unban user
exports.unbanUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Người dùng không tìm thấy' });
    
    // (No special admin-level checks for unban)
    
    user.isBanned = false;
    user.banReason = null;
    user.banExpiresAt = null;
    user.bannedBy = null;
    user.banDate = null;
    await user.save();
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Gửi thông báo cho người dùng
exports.sendNotification = async (req, res) => {
  try {
    const { title, message, type, recipientId } = req.body;

    // Kiểm tra người nhận tồn tại
    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ error: 'Người nhận không tìm thấy' });

    const notification = new Notification({
      title,
      message,
      type: type || 'info',
      recipient: recipientId,
      createdBy: req.user.id
    });

    await notification.save();
    await notification.populate('recipient createdBy');

    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Gửi thông báo cho tất cả người dùng
exports.sendNotificationToAll = async (req, res) => {
  try {
    const { title, message, type } = req.body;

    // Lấy tất cả users (bao gồm admin) để gửi broadcast
    const users = await User.find({});

    const notifications = users.map(user => ({
      title,
      message,
      type: type || 'info',
      recipient: user._id,
      createdBy: req.user.id
    }));

    // Tất cả users bao gồm admin đều nhận broadcast notification
    const createdNotifications = await Notification.insertMany(notifications);

    res.status(201).json({
      message: `Đã gửi thông báo cho ${users.length} người dùng`,
      count: users.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy tất cả thông báo (cho admin xem)
exports.getAllNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    let notifications;
    try {
      notifications = await Notification.find()
        .populate('recipient', 'username email')
        .populate('createdBy', 'username role')
        .populate('editedBy', 'username role')
        .populate({ path: 'editHistory.editedBy', select: 'username role' })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    } catch (populateError) {
      console.error('Lỗi populate:', populateError);
      // Fallback without populate
      notifications = await Notification.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
    }

    const total = await Notification.countDocuments();

    res.json({
      notifications,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa thông báo
// Sửa thông báo
exports.updateNotification = async (req, res) => {
  try {
    const { title, message, type } = req.body;

    // Validate type nếu có
    const allowedTypes = ['info', 'warning', 'success', 'error'];
    if (type && !allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Loại thông báo không hợp lệ' });
    }

    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ error: 'Thông báo không tìm thấy' });
    // Trước khi cập nhật, push snapshot current state vào editHistory
    const snapshot = {
      title: notification.title,
      message: notification.message,
      type: notification.type,
      editedAt: new Date(),
      editedBy: req.user.id
    };
    // Add snapshot to history
    if (!notification.editHistory) notification.editHistory = [];
    notification.editHistory.push(snapshot);

    // Update các field cho phép
    if (title !== undefined) notification.title = title;
    if (message !== undefined) notification.message = message;
    if (type !== undefined) notification.type = type;

    // Set edited meta
    notification.editedAt = new Date();
    notification.editedBy = req.user.id;

    await notification.save();
  await notification.populate('recipient createdBy editedBy');
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa thông báo
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) return res.status(404).json({ error: 'Thông báo không tìm thấy' });
    res.json({ message: 'Thông báo đã được xóa' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa người dùng (admin only) - xóa ảnh liên quan, tin, comment, notifications, likes
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Người dùng không tìm thấy' });

    // Không cho xóa admin
    if (user.role === 'admin') return res.status(403).json({ error: 'Không thể xóa admin' });

    // Không cho admin xóa chính họ
    if (req.user.id === user._id.toString()) return res.status(403).json({ error: 'Bạn không thể xóa chính mình' });

    // Try delete avatar if it's a cloudinary resource
    try {
      if (user.avatar && cloudinary.config().api_key) {
        const parts = user.avatar.split('/upload/');
        if (parts[1]) {
          let rest = parts[1];
          rest = rest.replace(/^v\d+\//, '');
          const dotIndex = rest.lastIndexOf('.');
          const publicId = dotIndex === -1 ? rest : rest.substring(0, dotIndex);
          if (publicId) await cloudinary.uploader.destroy(publicId);
        }
      }
    } catch (e) {
      console.warn('Error deleting user avatar from Cloudinary:', e.message || e);
    }

    // Delete all news by this user and remove cloudinary images if present
    const userNews = await News.find({ author: user._id });
    for (const n of userNews) {
      if (n.images && n.images.length > 0 && cloudinary.config().api_key) {
        for (const img of n.images) {
          try {
            const parts = img.split('/upload/');
            if (!parts[1]) continue;
            let rest = parts[1];
            rest = rest.replace(/^v\d+\//, '');
            const dotIndex = rest.lastIndexOf('.');
            const publicId = dotIndex === -1 ? rest : rest.substring(0, dotIndex);
            if (publicId) await cloudinary.uploader.destroy(publicId);
          } catch (e) {
            console.warn('Error deleting Cloudinary image for user news:', e.message || e);
          }
        }
      }
    }
    await News.deleteMany({ author: user._id });

    // Remove likes (pull user id from likes array in News)
    try {
      await News.updateMany({}, { $pull: { likes: user._id } });
    } catch (e) {
      console.warn('Error removing likes from News:', e.message || e);
    }

    // Delete comments
    await Comment.deleteMany({ author: user._id });

    // Delete notifications where user is recipient or createdBy
    await Notification.deleteMany({ $or: [{ recipient: user._id }, { createdBy: user._id }] });

    // Finally delete user
    await User.findByIdAndDelete(user._id);

    res.json({ message: 'Người dùng đã được xóa' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
};