const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Schema cho User model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Tên đăng nhập, bắt buộc, duy nhất
  email: { type: String, required: true, unique: true }, // Email, bắt buộc, duy nhất
  password: { type: String, required: true }, // Mật khẩu, bắt buộc
  role: { type: String, enum: ['user', 'editor', 'admin'], default: 'user' }, // Vai trò: user/editor/admin, mặc định user
  avatar: { type: String }, // Ảnh đại diện
  isVerified: { type: Boolean, default: false }, // Đã xác thực email chưa
  isOnline: { type: Boolean, default: false }, // Đang online không
  lastActivity: { type: Date, default: Date.now }, // Thời gian hoạt động cuối cùng
  resetToken: { type: String }, // Token reset mật khẩu
  resetTokenExpiry: { type: Date }, // Thời hạn token reset
  emailVerificationToken: { type: String }, // Token xác thực email
  emailVerificationExpiry: { type: Date }, // Thời hạn token xác thực
  // Ban fields
  isBanned: { type: Boolean, default: false }, // Đã bị ban chưa
  banReason: { type: String }, // Lý do ban
  banExpiresAt: { type: Date }, // Thời gian hết ban (null = vĩnh viễn)
  bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin ban
  banDate: { type: Date }, // Thời gian ban
}, { timestamps: true }); // Tự động thêm createdAt và updatedAt

// Hash mật khẩu trước khi lưu
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// So sánh mật khẩu
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);