const express = require('express');
const { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { verifyToken, checkRole } = require('../middleware/auth');
const { validateCategoryCreation, validateCategoryUpdate } = require('../middleware/validation');
const upload = require('../middleware/upload');
const uploadMemory = require('../middleware/uploadMemory');
const streamifier = require('streamifier');
const cloudinary = require('../config/cloudinary');
const useCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
// If using Cloudinary, use memory middleware
const effectiveUpload = useCloudinary ? uploadMemory : upload;

const router = express.Router();

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/', verifyToken, checkRole(['editor', 'admin']), validateCategoryCreation, createCategory);
router.put('/:id', verifyToken, checkRole(['editor', 'admin']), validateCategoryUpdate, updateCategory);
router.delete('/:id', verifyToken, checkRole(['admin']), deleteCategory);
router.post('/upload', verifyToken, effectiveUpload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Không có tệp nào được tải lên' });
  if (!useCloudinary) {
    const imageUrl = `http://localhost:3000/images/${req.file.filename}`;
    return res.json({ imageUrl });
  }
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