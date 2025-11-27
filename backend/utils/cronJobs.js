const User = require('../models/User');
const mongoose = require('mongoose');

// Hàm kiểm tra và set offline những user không hoạt động
const checkOfflineUsers = async () => {
  try {
    // Nếu mongoose chưa kết nối, bỏ qua kiểm tra để tránh lỗi driver lặp lại
    // readyState: 0 = ngắt kết nối, 1 = đã kết nối, 2 = đang kết nối, 3 = đang ngắt kết nối
    if (mongoose.connection.readyState !== 1) {
      console.warn('Bỏ qua checkOfflineUsers: mongoose chưa kết nối (readyState=' + mongoose.connection.readyState + ')');
      return;
    }
    // Set offline những user không hoạt động trong 30 phút
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const result = await User.updateMany(
      {
        lastActivity: { $lt: thirtyMinutesAgo },
        isOnline: true
      },
      { isOnline: false }
    );

    if (result.modifiedCount > 0) {
      console.log(`Đã set ${result.modifiedCount} người dùng offline (không hoạt động trong 30 phút)`);
    }
  } catch (error) {
    console.error('Lỗi khi kiểm tra người dùng offline:', error);
  }
};

// Chạy cron job mỗi 5 phút
const startCronJob = () => {
  // Cho phép vô hiệu hóa cron jobs trong môi trường mà DB/mạng không khả dụng
  if (process.env.DISABLE_CRON_JOBS === 'true') {
    console.log('Cron job kiểm tra user offline đã bị vô hiệu hóa bằng DISABLE_CRON_JOBS=true');
    return;
  }

  // Chạy một lần ngay lập tức, sau đó mỗi 5 phút
  checkOfflineUsers();
  setInterval(checkOfflineUsers, 5 * 60 * 1000); // 5 phút
  console.log('Cron job kiểm tra user offline đã bắt đầu (chạy mỗi 5 phút)');
};

module.exports = { startCronJob };