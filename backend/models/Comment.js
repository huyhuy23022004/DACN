const mongoose = require('mongoose');

// Schema cho Comment model
const commentSchema = new mongoose.Schema({
  content: { type: String, required: true }, // Nội dung bình luận, bắt buộc
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Tác giả bình luận, reference đến User, bắt buộc
  news: { type: mongoose.Schema.Types.ObjectId, ref: 'News', required: true }, // Bài viết được bình luận, reference đến News, bắt buộc
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // Bình luận cha (cho nested comments), mặc định null
  approved: { type: Boolean, default: false }, // Đã được duyệt chưa, mặc định false
}, { timestamps: true }); // Tự động thêm createdAt và updatedAt

module.exports = mongoose.model('Comment', commentSchema);