const mongoose = require('mongoose');

// Schema cho Category model
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Tên danh mục, bắt buộc, duy nhất
  description: { type: String }, // Mô tả danh mục
  slug: { type: String, unique: true }, // Slug cho URL thân thiện, duy nhất
  images: [{ type: String }], // Danh sách URL ảnh
}, { timestamps: true }); // Tự động thêm createdAt và updatedAt

module.exports = mongoose.model('Category', categorySchema);