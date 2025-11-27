const express = require('express');
const multer = require('multer');
const path = require('path');
const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');
const uploadMemory = require('../middleware/uploadMemory');
const { getAllNews, getNewsById, createNews, updateNews, deleteNews, getSuggestions, likeNews } = require('../controllers/newsController');
const { verifyToken, checkRole } = require('../middleware/auth');
const { validateNewsCreation, validateNewsUpdate, validatePaginationMiddleware, validateAdvancedSearch } = require('../middleware/validation');

const router = express.Router();

// Keep disk storage if Cloudinary not configured; otherwise use memory storage and upload to Cloudinary
let upload = require('../middleware/upload');
const useCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
if (useCloudinary) {
  upload = uploadMemory;
}

router.get('/', validatePaginationMiddleware, validateAdvancedSearch, getAllNews);
router.get('/suggestions', getSuggestions);
router.get('/:id', getNewsById);
router.post('/', verifyToken, checkRole(['editor', 'admin']), validateNewsCreation, createNews);
router.put('/:id', verifyToken, checkRole(['editor', 'admin']), validateNewsUpdate, updateNews);
router.delete('/:id', verifyToken, deleteNews);
router.post('/:id/like', verifyToken, likeNews);
router.post('/upload', verifyToken, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Không có tệp nào được tải lên' });
  if (!useCloudinary) {
    const imageUrl = `http://localhost:3000/images/${req.file.filename}`;
    return res.json({ imageUrl });
  }
  // upload to Cloudinary using buffer
  try {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream({ folder: process.env.CLOUDINARY_UPLOAD_FOLDER || '' }, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    });
    res.json({ imageUrl: result.secure_url, publicId: result.public_id });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({ error: 'Lỗi khi upload hình ảnh' });
  }
});

module.exports = router;