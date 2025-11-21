const mongoose = require('mongoose'); // Kết nối MongoDB
const request = require('supertest'); // Gửi request test API
const app = require('../app.test'); // Import app test (không start server)
const User = require('../models/User'); // Model User
const jwt = require('jsonwebtoken'); // Thêm import jwt

describe('User APIs', () => { // Mô tả nhóm test cho User APIs
  let token; // Biến lưu token cho tests cần auth

  beforeAll(async () => { // Kết nối DB test riêng
    const testUri = process.env.MONGO_URI_TEST || process.env.MONGO_URI + '_test'; // Dùng DB test
    await mongoose.connect(testUri);
  });

  afterAll(async () => { // Chạy sau tất cả tests: Đóng DB
    await mongoose.connection.close();
  });

  beforeEach(async () => { // Chạy trước mỗi test: Xóa data test
    await User.deleteMany({}); // Xóa tất cả users để test sạch
  });

  // Test đăng ký user
  describe('POST /api/users/register', () => {
    it('nên đăng ký user thành công', async () => { // Test case: Đăng ký thành công
      const userData = {
        username: 'testuser',
        email: '1150080137@sv.hcmunre.edu.vn',
        password: 'password123'
      };

      const res = await request(app) // Gửi request POST
        .post('/api/users/register')
        .send(userData);

      expect(res.status).toBe(201); // Kiểm tra status 201
      expect(res.body.message).toBe('Đăng ký người dùng thành công. Vui lòng kiểm tra email để xác nhận tài khoản.'); // Kiểm tra message
      expect(res.body.requiresVerification).toBe(true); // Kiểm tra requiresVerification
    }, 10000); // Timeout 10s

    it('nên lỗi nếu username không hợp lệ', async () => { // Test validation: Username invalid
      const userData = {
        username: 'us', // Too short
        email: 'test@example.com',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Dữ liệu không hợp lệ');
      expect(res.body.details).toEqual(
        expect.arrayContaining(['Username phải từ 3-50 ký tự, chỉ chứa chữ cái, số, dấu cách, dấu gạch dưới và dấu gạch ngang'])
      );
    });

    it('nên lỗi nếu email không hợp lệ', async () => { // Test validation: Email invalid
      const userData = {
        username: 'testuser',
        email: 'invalid-email',
        password: 'password123'
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Dữ liệu không hợp lệ');
      expect(res.body.details).toContain('Email không hợp lệ');
    });

    it('nên lỗi nếu password quá ngắn', async () => { // Test validation: Password too short
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: '123' // Too short
      };

      const res = await request(app)
        .post('/api/users/register')
        .send(userData);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Dữ liệu không hợp lệ');
      expect(res.body.details).toContain('Mật khẩu phải từ 6-100 ký tự');
    });

    it('nên lỗi nếu email đã tồn tại', async () => { // Test case: Email trùng
      // Tạo user trước
      await User.create({
        username: 'existinguser',
        email: '1150080137@sv.hcmunre.edu.vn',
        password: 'password123'
      });

      const res = await request(app)
        .post('/api/users/register')
        .send({
          username: 'newuser',
          email: '1150080137@sv.hcmunre.edu.vn', // Email trùng
          password: 'password123'
        });

      expect(res.status).toBe(400); // Lỗi 400
    });
  });

  // Test xác thực email
  describe('POST /api/users/verify-email', () => {
    let verificationToken;

    beforeEach(async () => { // Tạo user chưa verify
      const user = await User.create({
        username: 'testuser',
        email: '1150080137@sv.hcmunre.edu.vn',
        password: 'password123',
        emailVerificationToken: jwt.sign({ email: '1150080137@sv.hcmunre.edu.vn' }, process.env.JWT_SECRET, { expiresIn: '24h' }),
        emailVerificationExpiry: Date.now() + 24 * 60 * 60 * 1000
      });
      verificationToken = user.emailVerificationToken;
    });

    it('nên xác thực email thành công', async () => {
      const res = await request(app)
        .post('/api/users/verify-email')
        .send({ token: verificationToken });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Email đã được xác thực thành công. Bạn có thể đăng nhập ngay bây giờ.');

      // Kiểm tra user đã được verify
      const user = await User.findOne({ email: '1150080137@sv.hcmunre.edu.vn' });
      expect(user.isVerified).toBe(true);
      expect(user.emailVerificationToken).toBeUndefined();
      expect(user.emailVerificationExpiry).toBeUndefined();
    });

    it('nên lỗi nếu token không hợp lệ', async () => {
      const res = await request(app)
        .post('/api/users/verify-email')
        .send({ token: 'invalid-token' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Token không hợp lệ hoặc đã hết hạn');
    });

    it('nên lỗi nếu token hết hạn', async () => {
      // Cập nhật token hết hạn
      await User.updateOne(
        { email: '1150080137@sv.hcmunre.edu.vn' },
        { emailVerificationExpiry: Date.now() - 1000 }
      );

      const res = await request(app)
        .post('/api/users/verify-email')
        .send({ token: verificationToken });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Token không hợp lệ hoặc đã hết hạn');
    });
  });

  // Test đăng nhập
  describe('POST /api/users/login', () => {
    beforeEach(async () => { // Tạo user trước để test login
      await User.create({
        username: 'testuser',
        email: '1150080137@sv.hcmunre.edu.vn',
        password: 'password123',
        isVerified: true
      });
    });

    it('nên đăng nhập thành công và trả token', async () => { // Test login thành công
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: '1150080137@sv.hcmunre.edu.vn',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token'); // Có token
      expect(res.body.user.isOnline).toBe(true); // Trạng thái online
      token = res.body.token; // Lưu token cho tests sau
    });

    it('nên lỗi nếu thông tin sai', async () => { // Test login sai
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'wrong@example.com',
          password: 'wrongpass'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Thông tin đăng nhập không hợp lệ');
    });

    it('nên lỗi nếu email chưa được xác thực', async () => { // Test login với email chưa verify
      // Tạo user chưa verify
      await User.create({
        username: 'unverifieduser',
        email: 'unverified@example.com',
        password: 'password123',
        isVerified: false
      });

      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: 'unverified@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Email chưa được xác thực. Vui lòng kiểm tra email và xác nhận tài khoản.');
      expect(res.body.requiresVerification).toBe(true);
    });
  });

  // Test lấy profile (cần token)
  describe('GET /api/users/profile', () => {
    beforeEach(async () => { // Tạo user và lấy token
      const user = await User.create({
        username: 'testuser',
        email: '1150080137@sv.hcmunre.edu.vn',
        password: 'password123',
        isVerified: true
      });
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({ email: '1150080137@sv.hcmunre.edu.vn', password: 'password123' });
      token = loginRes.body.token;
    });

    it('nên trả profile user nếu có token', async () => { // Test lấy profile
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`); // Set header Authorization

      expect(res.status).toBe(200);
      expect(res.body.username).toBe('testuser');
      expect(res.body).not.toHaveProperty('password'); // Không có password
    });

    it('nên lỗi nếu không có token', async () => { // Test không có token
      const res = await request(app)
        .get('/api/users/profile');

      expect(res.status).toBe(401);
    });
  });

  // Test cập nhật profile
  describe('PUT /api/users/profile', () => {
    beforeEach(async () => {
      const user = await User.create({
        username: 'testuser',
        email: '1150080137@sv.hcmunre.edu.vn',
        password: 'password123',
        isVerified: true
      });
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({ email: '1150080137@sv.hcmunre.edu.vn', password: 'password123' });
      token = loginRes.body.token;
    });

    it('nên cập nhật profile thành công', async () => { // Test update
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          username: 'updateduser',
          avatar: 'new-avatar-url'
        });

      expect(res.status).toBe(200);
      expect(res.body.username).toBe('updateduser');
      expect(res.body.avatar).toBe('new-avatar-url');
    });
  });

  // Test đăng xuất
  describe('POST /api/users/logout', () => {
    beforeEach(async () => {
      const user = await User.create({
        username: 'testuser',
        email: '1150080137@sv.hcmunre.edu.vn',
        password: 'password123',
        isVerified: true
      });
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({ email: '1150080137@sv.hcmunre.edu.vn', password: 'password123' });
      token = loginRes.body.token;
    });

    it('nên đăng xuất và set offline', async () => { // Test logout
      const res = await request(app)
        .post('/api/users/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Đăng xuất thành công');

      // Kiểm tra user đã offline
      const user = await User.findOne({ email: '1150080137@sv.hcmunre.edu.vn' });
      expect(user.isOnline).toBe(false);
    });
  });

  // Test quên mật khẩu (mock email, không gửi thật)
  describe('POST /api/users/forgot-password', () => {
    beforeEach(async () => {
      await User.create({
        username: 'testuser',
        email: '1150080137@sv.hcmunre.edu.vn',
        password: 'password123',
        isVerified: true
      });
    });

    it('nên gửi email reset nếu user tồn tại', async () => { // Test forgot password
      const res = await request(app)
        .post('/api/users/forgot-password')
        .send({ email: '1150080137@sv.hcmunre.edu.vn' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Liên kết đặt lại mật khẩu đã được gửi đến email');
    }, 10000); // Timeout 10s

    it('nên lỗi nếu email không tồn tại', async () => { // Test email không tồn tại
      const res = await request(app)
        .post('/api/users/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(res.status).toBe(404);
    });
  });

  // Test reset mật khẩu
  describe('POST /api/users/reset-password', () => {
    let resetToken;

    beforeEach(async () => {
      const user = await User.create({
        username: 'testuser',
        email: '1150080137@sv.hcmunre.edu.vn',
        password: 'password123',
        isVerified: true
      });
      // Tạo reset token bằng JWT (giống như forgot-password)
      resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
      user.resetToken = resetToken;
      user.resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 phút
      await user.save();
    });

    it('nên reset mật khẩu thành công', async () => { // Test reset
      const res = await request(app)
        .post('/api/users/reset-password')
        .send({
          token: resetToken,
          newPassword: 'newpassword123'
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Đặt lại mật khẩu thành công');
    });

    it('nên lỗi nếu token sai', async () => { // Test token sai
      const res = await request(app)
        .post('/api/users/reset-password')
        .send({
          token: 'wrong-token',
          newPassword: 'newpassword123'
        });

      expect(res.status).toBe(400);
    });
  });
});