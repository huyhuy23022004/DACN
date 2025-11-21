const User = require('../models/User');

// Hàm kiểm tra và set offline những user không hoạt động
const checkOfflineUsers = async () => {
  try {
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
  setInterval(checkOfflineUsers, 5 * 60 * 1000); // 5 phút
  console.log('Cron job kiểm tra user offline đã bắt đầu (chạy mỗi 5 phút)');
};

module.exports = { startCronJob };