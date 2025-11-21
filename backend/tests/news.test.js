const mongoose = require('mongoose'); // Kết nối MongoDB
const request = require('supertest'); // Gửi request test API
const app = require('../app.test'); // Import app test (không start server)
const User = require('../models/User'); // Model User
const News = require('../models/News'); // Model News
const Category = require('../models/Category'); // Model Category

describe('News APIs', () => { // Mô tả nhóm test cho News APIs
  let token; // Token user thường
  let adminToken; // Token admin
  let categoryId; // ID category test
  let newsId; // ID news test

  beforeAll(async () => { // Kết nối DB test riêng
    const testUri = process.env.MONGO_URI_TEST || process.env.MONGO_URI + '_test'; // Dùng DB test
    await mongoose.connect(testUri);
  });

  afterAll(async () => { // Đóng DB
    await mongoose.connection.close();
  });

  beforeEach(async () => { // Xóa data test trước mỗi test
    await User.deleteMany({});
    await News.deleteMany({});
    await Category.deleteMany({});

    // Tạo category test
    const category = await Category.create({ name: 'Du lịch', description: 'Tin du lịch' });
    categoryId = category._id;

    // Tạo user thường
    const user = await User.create({
      username: 'testuser',
      email: 'user@example.com',
      password: 'password123',
      role: 'editor', // Thay user thành editor để có quyền tạo news
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

  // Test tạo news
  describe('POST /api/news', () => {
    it('nên tạo news thành công nếu có quyền', async () => { // Test tạo news
      const newsData = {
        title: 'Tin du lịch mới',
        content: 'Nội dung tin tức',
        category: categoryId,
        location: {
          lat: 22.3364,
          lng: 103.8438,
          address: 'Sa Pa, Lào Cai'
        }
      };

      const res = await request(app)
        .post('/api/news')
        .set('Authorization', `Bearer ${token}`)
        .send(newsData);

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Tin du lịch mới');
      expect(res.body.mapUrl).toContain('https://www.google.com/maps/embed/v1/view');
      newsId = res.body._id; // Lưu ID cho tests sau
    });

    it('nên lỗi nếu title quá ngắn', async () => { // Test validation: Title too short
      const newsData = {
        title: 'Hi', // Too short
        content: 'Nội dung tin tức hợp lệ với độ dài đủ',
        category: categoryId
      };

      const res = await request(app)
        .post('/api/news')
        .set('Authorization', `Bearer ${token}`)
        .send(newsData);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Dữ liệu không hợp lệ');
      expect(res.body.details).toContain('Tiêu đề phải từ 5-200 ký tự');
    });

    it('nên lỗi nếu content quá ngắn', async () => { // Test validation: Content too short
      const newsData = {
        title: 'Tiêu đề hợp lệ',
        content: 'Short', // Too short
        category: categoryId
      };

      const res = await request(app)
        .post('/api/news')
        .set('Authorization', `Bearer ${token}`)
        .send(newsData);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Dữ liệu không hợp lệ');
      expect(res.body.details).toContain('Nội dung phải từ 10-10000 ký tự');
    });

    it('nên lỗi nếu location không hợp lệ', async () => { // Test validation: Invalid location
      const newsData = {
        title: 'Tiêu đề hợp lệ',
        content: 'Nội dung tin tức hợp lệ với độ dài đủ',
        category: categoryId,
        location: {
          lat: 100, // Invalid latitude (>90)
          lng: 200, // Invalid longitude (>180)
          address: 'Valid address'
        }
      };

      const res = await request(app)
        .post('/api/news')
        .set('Authorization', `Bearer ${token}`)
        .send(newsData);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Dữ liệu không hợp lệ');
      expect(res.body.details).toEqual(
        expect.arrayContaining(['Thông tin vị trí không hợp lệ (latitude: -90 đến 90, longitude: -180 đến 180)'])
      );
    });

    it('nên lỗi nếu không có token', async () => { // Test không auth
      const res = await request(app)
        .post('/api/news')
        .send({ title: 'Test' });

      expect(res.status).toBe(401);
    });

    it('nên tạo news với nội dung HTML phức tạp thành công', async () => { // Test tạo news với HTML
      const newsData = {
        title: 'Tin tức với định dạng HTML',
        content: `<p>Đây là đoạn văn bản đầu tiên.</p>
<p><strong>Đây là văn bản in đậm</strong> và <em>đây là văn bản in nghiêng</em>.</p>
<p>Sau đó xuống dòng mới.</p>
<p>&nbsp;&nbsp;&nbsp;&nbsp;Đây là đoạn có tab (indent).</p>
<p>Giữa văn bản có ảnh:</p>
<img src="https://example.com/image.jpg" alt="Ảnh mẫu" style="max-width: 100%; height: auto;">
<p>Và tiếp tục văn bản sau ảnh.</p>`,
        category: categoryId,
        location: {
          lat: 21.0278,
          lng: 105.8342,
          address: 'Hà Nội, Việt Nam'
        }
      };

      const res = await request(app)
        .post('/api/news')
        .set('Authorization', `Bearer ${token}`)
        .send(newsData);

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Tin tức với định dạng HTML');
      expect(res.body.content).toContain('<strong>');
      expect(res.body.content).toContain('<em>');
      expect(res.body.content).toContain('<img');
      expect(res.body.mapUrl).toContain('https://www.google.com/maps/embed/v1/view');
    });
  });

  // Test lấy danh sách news
  describe('GET /api/news', () => {
    beforeEach(async () => { // Tạo news test
      const news = await News.create({
        title: 'News 1',
        content: 'Content 1',
        category: categoryId,
        author: (await User.findOne({ email: 'user@example.com' }))._id,
        published: true, // Thêm published: true
        location: {
          lat: 21.0278,
          lng: 105.8342,
          address: 'Hà Nội, Việt Nam'
        }
      });
      newsId = news._id;
    });

    it('nên trả danh sách news', async () => { // Test lấy news
      const res = await request(app)
        .get('/api/news');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.news)).toBe(true);
      expect(res.body.news.length).toBeGreaterThan(0);
      expect(res.body.news[0].mapUrl).toContain('https://www.google.com/maps/embed/v1/view');
    });

    it('nên hỗ trợ search', async () => { // Test search
      const res = await request(app)
        .get('/api/news?search=News');

      expect(res.status).toBe(200);
      expect(res.body.news[0].title).toContain('News');
    });

    it('nên hỗ trợ pagination', async () => { // Test pagination
      const res = await request(app)
        .get('/api/news?page=1&limit=10');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('page');
      expect(res.body).toHaveProperty('pages');
      expect(res.body).toHaveProperty('total');
    });
  });

  // Test lấy news theo ID
  describe('GET /api/news/:id', () => {
    beforeEach(async () => {
      const news = await News.create({
        title: 'News Detail',
        content: 'Content Detail',
        category: categoryId,
        author: (await User.findOne({ email: 'user@example.com' }))._id,
        location: {
          lat: 21.0278,
          lng: 105.8342,
          address: 'Hà Nội, Việt Nam'
        }
      });
      newsId = news._id;
    });

    it('nên trả chi tiết news', async () => { // Test lấy news detail
      const res = await request(app)
        .get(`/api/news/${newsId}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('News Detail');
      expect(res.body.views).toBe(1); // Views tăng
      expect(res.body.mapUrl).toContain('https://www.google.com/maps/embed/v1/view');
      expect(res.body.mapUrl).toContain('AIzaSyBwZr7OlrDtHdLTk5M8h2Lle9WdYj5_2TU');
    });

    it('nên lỗi nếu ID không tồn tại', async () => { // Test ID sai
      const res = await request(app)
        .get('/api/news/507f1f77bcf86cd799439011'); // ID giả

      expect(res.status).toBe(404);
    });
  });

  // Test cập nhật news
  describe('PUT /api/news/:id', () => {
    beforeEach(async () => {
      const news = await News.create({
        title: 'Old Title',
        content: 'Old Content',
        category: categoryId,
        author: (await User.findOne({ email: 'user@example.com' }))._id
      });
      newsId = news._id;
    });

    it('nên cập nhật news nếu là author', async () => { // Test update
      const res = await request(app)
        .put(`/api/news/${newsId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'New Title' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('New Title');
    });

    it('nên lỗi nếu không phải author', async () => { // Test không phải author
      // Tạo user khác
      await User.create({
        username: 'otheruser',
        email: 'other@example.com',
        password: 'password123',
        isVerified: true
      });
      const otherLogin = await request(app)
        .post('/api/users/login')
        .send({ email: 'other@example.com', password: 'password123' });
      const otherToken = otherLogin.body.token;

      const res = await request(app)
        .put(`/api/news/${newsId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Hacked Title' });

      expect(res.status).toBe(403);
    });
  });

  // Test xóa news
  describe('DELETE /api/news/:id', () => {
    beforeEach(async () => {
      const news = await News.create({
        title: 'News to Delete',
        content: 'Content',
        category: categoryId,
        author: (await User.findOne({ email: 'user@example.com' }))._id
      });
      newsId = news._id;
    });

    it('nên xóa news nếu là author', async () => { // Test delete
      const res = await request(app)
        .delete(`/api/news/${newsId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Xóa tin tức thành công');
    });

    it('nên cho phép admin xóa bất kỳ news', async () => { // Test admin delete
      const res = await request(app)
        .delete(`/api/news/${newsId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });
  });
});