const express = require('express');
const multer = require('multer');
const path = require('path');
const { getAllNews, getNewsById, createNews, updateNews, deleteNews, getSuggestions, likeNews } = require('../controllers/newsController');
const { verifyToken, checkRole } = require('../middleware/auth');
const { validateNewsCreation, validateNewsUpdate, validatePaginationMiddleware, validateAdvancedSearch } = require('../middleware/validation');

const router = express.Router();

// Cấu hình multer cho upload ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../frontend/public/images'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
// Limit uploads to 5MB per file to avoid excessively large uploads
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', validatePaginationMiddleware, validateAdvancedSearch, getAllNews);
router.get('/suggestions', getSuggestions);
router.get('/:id', getNewsById);
router.post('/', verifyToken, checkRole(['editor', 'admin']), validateNewsCreation, createNews);
router.put('/:id', verifyToken, checkRole(['editor', 'admin']), validateNewsUpdate, updateNews);
router.delete('/:id', verifyToken, deleteNews);
router.post('/:id/like', verifyToken, likeNews);
router.post('/upload', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Không có tệp nào được tải lên' });
  const imageUrl = `http://localhost:3000/images/${req.file.filename}`;
  res.json({ imageUrl });
});

module.exports = router;