const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const path = require('path');

// Tải biến môi trường
dotenv.config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const newsRoutes = require('./routes/newsRoutes');
const commentRoutes = require('./routes/commentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const editorRoutes = require('./routes/editorRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');

const app = express();

// Middleware
app.use(cors());
// Increase body size limits to avoid PayloadTooLargeError when clients send large JSON payloads
// Typical causes: large base64 images or very large request bodies. Adjust as needed.
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Cài đặt view engine (nếu sử dụng EJS cho server-side rendering)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../frontend/views'));

// Phục vụ static files từ frontend
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Phục vụ assets từ backend
app.use('/assets', express.static(path.join(__dirname, 'assets')));


// Routes
app.use('/api/users', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/editor', editorRoutes);
app.use('/api/feedback', feedbackRoutes);

// Route mặc định
app.get('/', (req, res) => {
  res.render('home');
});

// Error handler for payload too large and other errors
app.use((err, req, res, next) => {
  if (!err) return next();
  console.error('Lỗi chưa xử lý:', err);
  if (err.type === 'entity.too.large' || err.status === 413 || err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Payload quá lớn. Vui lòng giảm kích thước tệp hoặc payload.' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Lỗi máy chủ' });
});

// Import cron jobs
const { startCronJob } = require('./utils/cronJobs');

// Kết nối đến MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('MongoDB đã kết nối');
  // Khởi động cron job sau khi kết nối DB
  startCronJob();
})
.catch(err => console.log('Lỗi kết nối MongoDB:', err));

// Khởi động máy chủ
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Máy chủ đang chạy trên cổng ${PORT}`);
});

module.exports = app;