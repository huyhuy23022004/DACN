module.exports = {
  testEnvironment: 'node', // Môi trường test Node.js
  testMatch: ['**/tests/**/*.test.js'], // Pattern tìm file test
  verbose: true, // Hiển thị chi tiết kết quả
  forceExit: true, // Thoát sau khi test xong
  clearMocks: true, // Xóa mocks sau mỗi test
  setupFilesAfterEnv: [], // File setup nếu cần
  testTimeout: 15000, // Timeout 15s cho mỗi test
};