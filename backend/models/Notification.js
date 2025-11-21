const mongoose = require('mongoose');

// Schema cho Notification model
const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true }, // Tiêu đề thông báo
  message: { type: String, required: true }, // Nội dung thông báo
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error'],
    default: 'info'
  }, // Loại thông báo
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Người nhận
  isRead: { type: Boolean, default: false }, // Đã đọc chưa
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Người tạo (admin)
}, { timestamps: true }); // Tự động thêm createdAt và updatedAt

module.exports = mongoose.model('Notification', notificationSchema);