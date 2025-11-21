const mongoose = require('mongoose'); // Kết nối MongoDB
const request = require('supertest'); // Gửi request test API
const app = require('../app.test'); // Import app test (không start server)
const User = require('../models/User'); // Model User
const News = require('../models/News'); // Model News
const Comment = require('../models/Comment'); // Model Comment
const Category = require('../models/Category'); // Model Category
const Notification = require('../models/Notification'); // Model Notification

describe('Admin APIs', () => { // Mô tả nhóm test cho Admin APIs
  let adminToken; // Token admin
  let userToken; // Token user thường
  let userId; // ID user test
  let newsId; // ID news test
  let commentId; // ID comment test

  beforeAll(async () => { // Kết nối DB test riêng
    const testUri = process.env.MONGO_URI_TEST || process.env.MONGO_URI + '_test'; // Dùng DB test
    await mongoose.connect(testUri);
  });

  afterAll(async () => { // Đóng DB
    await mongoose.connection.close();
  });

  beforeEach(async () => { // Xóa data test
    await User.deleteMany({});
    await News.deleteMany({});
    await Comment.deleteMany({});
    await Category.deleteMany({});
    await Notification.deleteMany({});

    // Tạo category
    const category = await Category.create({ name: 'Test', description: 'Test category' });

    // Tạo admin
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      isVerified: true
    });

    // Tạo user thường
    const user = await User.create({
      username: 'user',
      email: 'user@example.com',
      password: 'password123',
      role: 'user',
      isVerified: true
    });
    userId = user._id;

    // Tạo news
    const news = await News.create({
      title: 'Test News',
      content: 'Test content',
      category: category._id,
      author: user._id,
      published: false // Chưa publish
    });
    newsId = news._id;

    // Tạo comment
    const comment = await Comment.create({
      news: news._id,
      author: user._id,
      content: 'Test comment'
    });
    commentId = comment._id;

    // Login lấy tokens
    const adminLogin = await request(app)
      .post('/api/users/login')
      .send({ email: 'admin@example.com', password: 'password123' });
    adminToken = adminLogin.body.token;

    const userLogin = await request(app)
      .post('/api/users/login')
      .send({ email: 'user@example.com', password: 'password123' });
    userToken = userLogin.body.token;
  });

  // Test lấy stats dashboard
  describe('GET /api/admin/stats', () => {
    it('nên trả stats dashboard nếu là admin', async () => { // Test stats
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(res.body).toHaveProperty('news');
      expect(res.body).toHaveProperty('comments');
      expect(res.body).toHaveProperty('views');
    });

    it('nên lỗi nếu không phải admin', async () => { // Test không phải admin
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  // Test lấy danh sách users
  describe('GET /api/admin/users', () => {
    it('nên trả danh sách users nếu là admin', async () => { // Test get users
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('isOnline'); // Có trạng thái online
    });

    it('nên lỗi nếu không phải admin', async () => { // Test không admin
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  // Test cập nhật role user
  describe('PUT /api/admin/users/:id/role', () => {
    it('nên cập nhật role user nếu là admin', async () => { // Test update role
      const res = await request(app)
        .put(`/api/admin/users/${userId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'editor' });

      expect(res.status).toBe(200);
      expect(res.body.role).toBe('editor');
    });

    it('nên lỗi nếu user không tồn tại', async () => { // Test ID sai
      const res = await request(app)
        .put('/api/admin/users/507f1f77bcf86cd799439011/role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'editor' });

      expect(res.status).toBe(404);
    });
  });

  // Test lấy danh sách news
  describe('GET /api/admin/news', () => {
    it('nên trả danh sách news nếu là admin', async () => { // Test get news
      const res = await request(app)
        .get('/api/admin/news')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('news');
      expect(Array.isArray(res.body.news)).toBe(true);
      expect(res.body.news.length).toBeGreaterThan(0);
    });
  });

  // Test toggle publish news
  describe('PUT /api/admin/news/:id/toggle', () => {
    it('nên toggle publish status nếu là admin', async () => { // Test toggle publish
      const res = await request(app)
        .put(`/api/admin/news/${newsId}/toggle`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.published).toBe(true); // Từ false thành true
    });

    it('nên lỗi nếu news không tồn tại', async () => { // Test ID sai
      const res = await request(app)
        .put('/api/admin/news/507f1f77bcf86cd799439011/toggle')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  // Test lấy danh sách comments
  describe('GET /api/admin/comments', () => {
    it('nên trả danh sách comments nếu là admin', async () => { // Test get comments
      const res = await request(app)
        .get('/api/admin/comments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  // Test gửi thông báo
  describe('POST /api/admin/notifications', () => {
    it('nên gửi thông báo thành công nếu là admin', async () => {
      const res = await request(app)
        .post('/api/admin/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Notification',
          message: 'This is a test notification',
          type: 'info',
          recipientId: userId
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('title', 'Test Notification');
      expect(res.body).toHaveProperty('message', 'This is a test notification');
      expect(res.body).toHaveProperty('recipient');
      expect(res.body).toHaveProperty('createdBy');
    });

    it('nên lỗi nếu recipient không tồn tại', async () => {
      const res = await request(app)
        .post('/api/admin/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Notification',
          message: 'This is a test notification',
          type: 'info',
          recipientId: '507f1f77bcf86cd799439011' // Invalid ID
        });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Người nhận không tìm thấy');
    });

    it('nên lỗi nếu không phải admin', async () => {
      const res = await request(app)
        .post('/api/admin/notifications')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Test Notification',
          message: 'This is a test notification',
          type: 'info',
          recipientId: userId
        });

      expect(res.status).toBe(403);
    });
  });

  // Test gửi thông báo broadcast
  describe('POST /api/admin/notifications/broadcast', () => {
    it('nên gửi thông báo cho tất cả user thành công nếu là admin', async () => {
      const res = await request(app)
        .post('/api/admin/notifications/broadcast')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Broadcast Notification',
          message: 'This is a broadcast notification',
          type: 'warning'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('count', 2); // 2 users (admin and regular user both receive)
    });

    it('nên lỗi nếu không phải admin', async () => {
      const res = await request(app)
        .post('/api/admin/notifications/broadcast')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Broadcast Notification',
          message: 'This is a broadcast notification',
          type: 'warning'
        });

      expect(res.status).toBe(403);
    });
  });

  // Test lấy tất cả thông báo
  describe('GET /api/admin/notifications', () => {
    it('nên trả danh sách notifications nếu là admin', async () => {
      // Tạo notification trước
      await Notification.create({
        title: 'Test Notification',
        message: 'Test message',
        recipient: userId,
        createdBy: '507f1f77bcf86cd799439011' // admin ID giả
      });

      const res = await request(app)
        .get('/api/admin/notifications')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('notifications');
      expect(Array.isArray(res.body.notifications)).toBe(true);
    });

    it('nên lỗi nếu không phải admin', async () => {
      const res = await request(app)
        .get('/api/admin/notifications')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});