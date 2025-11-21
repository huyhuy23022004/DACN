const mongoose = require('mongoose');

// Schema cho News model
const newsSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Tiêu đề bài viết, bắt buộc
  content: { type: String, required: true }, // Nội dung bài viết, bắt buộc
  summary: { type: String }, // Tóm tắt bài viết
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Tác giả, reference đến User, bắt buộc
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, // Danh mục, reference đến Category
  tags: [{ type: String }], // Tags của bài viết
  images: [{ type: String }], // Danh sách URL ảnh
  videoUrl: { type: String }, // Link YouTube video (tùy chọn)
  location: { // Thông tin vị trí
    lat: { type: Number }, // Vĩ độ
    lng: { type: Number }, // Kinh độ
    address: { type: String } // Địa chỉ
  },
  views: { type: Number, default: 0 }, // Số lượt xem, mặc định 0
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Danh sách user đã thích
  published: { type: Boolean, default: false }, // Đã xuất bản chưa, mặc định false
}, { timestamps: true }); // Tự động thêm createdAt và updatedAt

module.exports = mongoose.model('News', newsSchema);