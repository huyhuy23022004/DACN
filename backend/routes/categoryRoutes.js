const express = require('express');
const { getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory } = require('../controllers/categoryController');
const { verifyToken, checkRole } = require('../middleware/auth');
const { validateCategoryCreation, validateCategoryUpdate } = require('../middleware/validation');
const upload = require('../middleware/upload');

const router = express.Router();

router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/', verifyToken, checkRole(['editor', 'admin']), validateCategoryCreation, createCategory);
router.put('/:id', verifyToken, checkRole(['editor', 'admin']), validateCategoryUpdate, updateCategory);
router.delete('/:id', verifyToken, checkRole(['admin']), deleteCategory);
router.post('/upload', verifyToken, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Không có tệp nào được tải lên' });
  const imageUrl = `http://localhost:3000/images/${req.file.filename}`;
  res.json({ imageUrl });
});

module.exports = router;