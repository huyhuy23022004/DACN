const News = require('../models/News');
const Comment = require('../models/Comment');

// Lấy stats cá nhân cho editor, tổng quan cho admin
exports.getEditorStats = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      // Admin thấy tổng quan
      const totalNews = await News.countDocuments();
      const totalComments = await Comment.countDocuments();
      res.json({
        totalNews,
        totalComments
      });
    } else {
      // Editor thấy cá nhân
      const myNewsCount = await News.countDocuments({ author: req.user.id });
      const myApprovedComments = await Comment.countDocuments({ approved: true });
      res.json({
        myNews: myNewsCount,
        approvedComments: myApprovedComments
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy danh sách news của editor, tất cả cho admin
exports.getMyNews = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.author = req.user.id; // Editor chỉ thấy của mình
    }
    const news = await News.find(query).populate('category');
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa bình luận (editor và admin đều có quyền)
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findByIdAndDelete(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Bình luận không tìm thấy' });
    res.json({ message: 'Bình luận đã được xóa' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};