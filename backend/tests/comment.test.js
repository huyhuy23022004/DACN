const mongoose = require('mongoose'); // Kết nối MongoDB
const request = require('supertest'); // Gửi request test API
const app = require('../app.test'); // Import app test (không start server)
const User = require('../models/User'); // Model User
const News = require('../models/News'); // Model News
const Comment = require('../models/Comment'); // Model Comment
const Category = require('../models/Category'); // Model Category

describe('Comment APIs', () => { // Mô tả nhóm test cho Comment APIs
  let token; // Token user
  let editorToken; // Token editor
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

    // Tạo category
    const category = await Category.create({ name: 'Test', description: 'Test category' });

    // Tạo user
    const user = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      isVerified: true
    });

    // Tạo editor
    const editor = await User.create({
      username: 'editor',
      email: 'editor@example.com',
      password: 'password123',
      role: 'editor',
      isVerified: true
    });

    // Tạo news
    const news = await News.create({
      title: 'Test News',
      content: 'Test content',
      category: category._id,
      author: user._id
    });
    newsId = news._id;

    // Login lấy tokens
    const loginRes = await request(app)
      .post('/api/users/login')
      .send({ email: 'test@example.com', password: 'password123' });
    token = loginRes.body.token;

    const editorLogin = await request(app)
      .post('/api/users/login')
      .send({ email: 'editor@example.com', password: 'password123' });
    editorToken = editorLogin.body.token;
  });

  // Test tạo comment
  describe('POST /api/comments', () => {
    it('nên tạo comment thành công', async () => { // Test tạo comment
      const commentData = {
        newsId: newsId,
        content: 'Đây là comment test'
      };

      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${token}`)
        .send(commentData);

      expect(res.status).toBe(201);
      expect(res.body.content).toBe('Đây là comment test');
      commentId = res.body._id; // Lưu ID
    });

    it('nên lỗi nếu không có token', async () => { // Test không auth
      const res = await request(app)
        .post('/api/comments')
        .send({ newsId: newsId, content: 'Test' });

      expect(res.status).toBe(401);
    });

    it('nên lỗi nếu news không tồn tại', async () => { // Test news không tồn tại
      const res = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          newsId: '507f1f77bcf86cd799439011', // ID giả
          content: 'Test'
        });

      expect(res.status).toBe(404);
    });
  });

  // Test lấy comments của news
  describe('GET /api/comments/:newsId', () => {
    beforeEach(async () => { // Tạo comment test
      const comment = await Comment.create({
        news: newsId,
        author: (await User.findOne({ email: 'test@example.com' }))._id,
        content: 'Test comment'
      });
      commentId = comment._id;
    });

    it('nên trả danh sách comments của news', async () => { // Test lấy comments
      const res = await request(app)
        .get(`/api/comments/${newsId}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].content).toBe('Test comment');
    });

    it('nên trả empty array nếu news không có comment', async () => { // Test news không có comment
      // Xóa comment
      await Comment.deleteMany({});

      const res = await request(app)
        .get(`/api/comments/${newsId}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // Test cập nhật comment
  describe('PUT /api/comments/:id', () => {
    beforeEach(async () => {
      const comment = await Comment.create({
        news: newsId,
        author: (await User.findOne({ email: 'test@example.com' }))._id,
        content: 'Old content'
      });
      commentId = comment._id;
    });

    it('nên cập nhật comment nếu là author', async () => { // Test update
      const res = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'Updated content' });

      expect(res.status).toBe(200);
      expect(res.body.content).toBe('Updated content');
    });

    it('nên lỗi nếu không phải author, admin hoặc editor', async () => { // Test không có quyền
      // Tạo user khác
      await User.create({
        username: 'other',
        email: 'other@example.com',
        password: 'password123',
        isVerified: true
      });
      const otherLogin = await request(app)
        .post('/api/users/login')
        .send({ email: 'other@example.com', password: 'password123' });
      const otherToken = otherLogin.body.token;

      const res = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ content: 'Hacked' });

      expect(res.status).toBe(403);
    });

    it('nên cho phép editor cập nhật comment của người khác', async () => { // Test editor có quyền
      const res = await request(app)
        .put(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ content: 'Edited by editor' });

      expect(res.status).toBe(200);
      expect(res.body.content).toBe('Edited by editor');
    });
  });

  // Test xóa comment
  describe('DELETE /api/comments/:id', () => {
    beforeEach(async () => {
      const comment = await Comment.create({
        news: newsId,
        author: (await User.findOne({ email: 'test@example.com' }))._id,
        content: 'Comment to delete'
      });
      commentId = comment._id;
    });

    it('nên xóa comment nếu là author', async () => { // Test delete
      const res = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Xóa bình luận thành công');
    });

    it('nên cho phép editor xóa comment của người khác', async () => { // Test editor có quyền xóa
      // Tạo comment mới để test
      const newComment = await Comment.create({
        news: newsId,
        author: (await User.findOne({ email: 'test@example.com' }))._id,
        content: 'Comment to delete by editor'
      });

      const res = await request(app)
        .delete(`/api/comments/${newComment._id}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Xóa bình luận thành công');
    });

    it('nên lỗi nếu comment không tồn tại', async () => { // Test ID sai
      const res = await request(app)
        .delete('/api/comments/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});