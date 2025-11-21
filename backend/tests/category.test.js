const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app.test');
const User = require('../models/User');
const Category = require('../models/Category');

describe('Category APIs', () => {
  let token;
  let adminToken;
  let categoryId;

  beforeAll(async () => {
    const testUri = process.env.MONGO_URI_TEST || process.env.MONGO_URI + '_test';
    await mongoose.connect(testUri);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Category.deleteMany({});

    // Tạo user editor
    const user = await User.create({
      username: 'testuser',
      email: 'user@example.com',
      password: 'password123',
      role: 'editor',
      isVerified: true
    });

    // Tạo admin
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      isVerified: true
    });

    // Login để lấy tokens
    const userLogin = await request(app)
      .post('/api/users/login')
      .send({ email: 'user@example.com', password: 'password123' });
    token = userLogin.body.token;

    const adminLogin = await request(app)
      .post('/api/users/login')
      .send({ email: 'admin@example.com', password: 'password123' });
    adminToken = adminLogin.body.token;
  });

  describe('GET /api/categories', () => {
    it('nên trả danh sách categories', async () => {
      await Category.create({ name: 'Du lịch', description: 'Tin du lịch', slug: 'du-lich' });
      await Category.create({ name: 'Ẩm thực', description: 'Tin ẩm thực', slug: 'am-thuc' });

      const res = await request(app).get('/api/categories');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty('name');
    });
  });

  describe('GET /api/categories/:id', () => {
    it('nên trả chi tiết category', async () => {
      const category = await Category.create({ name: 'Du lịch', description: 'Tin du lịch' });

      const res = await request(app).get(`/api/categories/${category._id}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toEqual('Du lịch');
    });

    it('nên lỗi nếu ID không tồn tại', async () => {
      const res = await request(app).get('/api/categories/60d5ecb74b24c72b8c8b4567');
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('POST /api/categories', () => {
    it('nên tạo category thành công nếu có quyền', async () => {
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Du lịch', description: 'Tin du lịch' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.name).toEqual('Du lịch');
      expect(res.body.slug).toEqual('du-lich');
      categoryId = res.body._id;
    });

    it('nên lỗi nếu không có token', async () => {
      const res = await request(app)
        .post('/api/categories')
        .send({ name: 'Du lịch', description: 'Tin du lịch' });

      expect(res.statusCode).toEqual(401);
    });

    it('nên lỗi nếu không có quyền', async () => {
      // Tạo user thường
      const normalUser = await User.create({
        username: 'normal',
        email: 'normal@example.com',
        password: 'password123',
        role: 'user',
        isVerified: true
      });

      const normalLogin = await request(app)
        .post('/api/users/login')
        .send({ email: 'normal@example.com', password: 'password123' });
      const normalToken = normalLogin.body.token;

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${normalToken}`)
        .send({ name: 'Du lịch', description: 'Tin du lịch' });

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('nên cập nhật category nếu có quyền', async () => {
      const category = await Category.create({ name: 'Du lịch', description: 'Tin du lịch' });

      const res = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Du lịch Việt Nam', description: 'Tin du lịch trong nước' });

      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toEqual('Du lịch Việt Nam');
      expect(res.body.slug).toEqual('du-lich-viet-nam');
    });

    it('nên lỗi nếu không có quyền', async () => {
      const category = await Category.create({ name: 'Du lịch', description: 'Tin du lịch' });

      const normalUser = await User.create({
        username: 'normal',
        email: 'normal@example.com',
        password: 'password123',
        role: 'user',
        isVerified: true
      });

      const normalLogin = await request(app)
        .post('/api/users/login')
        .send({ email: 'normal@example.com', password: 'password123' });
      const normalToken = normalLogin.body.token;

      const res = await request(app)
        .put(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${normalToken}`)
        .send({ name: 'Du lịch Việt Nam' });

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('nên xóa category nếu là admin', async () => {
      const category = await Category.create({ name: 'Du lịch', description: 'Tin du lịch' });

      const res = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Xóa danh mục thành công');
    });

    it('nên lỗi nếu không phải admin', async () => {
      const category = await Category.create({ name: 'Du lịch', description: 'Tin du lịch' });

      const res = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toEqual(403);
    });

    it('nên lỗi nếu category đang được sử dụng', async () => {
      const category = await Category.create({ name: 'Du lịch', description: 'Tin du lịch' });

      // Tạo news sử dụng category này
      const News = require('../models/News');
      await News.create({
        title: 'Test News',
        content: 'Test content',
        author: (await User.findOne({ role: 'editor' }))._id,
        category: category._id,
        published: true
      });

      const res = await request(app)
        .delete(`/api/categories/${category._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toContain('đang được sử dụng');
    });
  });
});