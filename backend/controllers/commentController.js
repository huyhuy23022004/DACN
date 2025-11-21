const Comment = require('../models/Comment');

// Lấy bình luận của một tin tức
exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ news: req.params.newsId })
      .populate('author')
      .populate({
        path: 'parentId',
        populate: { path: 'author' }
      })
      .sort({ createdAt: 1 }); // Sắp xếp theo thời gian tạo
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Tạo bình luận mới
exports.createComment = async (req, res) => {
  try {
    const { newsId, content, parentId } = req.body;
    const News = require('../models/News');
    const news = await News.findById(newsId);
    if (!news) return res.status(404).json({ error: 'Tin tức không tìm thấy' });

    // Nếu có parentId, kiểm tra bình luận cha tồn tại
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) return res.status(404).json({ error: 'Bình luận cha không tìm thấy' });
    }

    const comment = new Comment({ news: newsId, author: req.user.id, content, parentId: parentId || null });
    await comment.save();
    await comment.populate('author');
    res.status(201).json(comment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Cập nhật bình luận
exports.updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Bình luận không tìm thấy' });

    // Cho phép tác giả, admin hoặc editor cập nhật
    const isAuthor = comment.author.toString() === req.user.id;
    const isModerator = ['admin', 'editor'].includes(req.user.role);
    if (!isAuthor && !isModerator) return res.status(403).json({ error: 'Không có quyền cập nhật bình luận này' });

    comment.content = req.body.content;
    await comment.save();
    await comment.populate('author');
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa bình luận
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Bình luận không tìm thấy' });

    // Cho phép tác giả, admin hoặc editor xóa
    const isAuthor = comment.author.toString() === req.user.id;
    const isModerator = ['admin', 'editor'].includes(req.user.role);
    if (!isAuthor && !isModerator) return res.status(403).json({ error: 'Không có quyền xóa bình luận này' });

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Xóa bình luận thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Duyệt bình luận (admin hoặc editor)
exports.approveComment = async (req, res) => {
  try {
    // Kiểm tra quyền (admin hoặc editor)
    if (!['admin', 'editor'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Không có quyền duyệt bình luận' });
    }

    const comment = await Comment.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
    if (!comment) return res.status(404).json({ error: 'Bình luận không tìm thấy' });
    await comment.populate('author');
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};