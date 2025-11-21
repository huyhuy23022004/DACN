const express = require('express');
const { getEditorStats, getMyNews, deleteComment } = require('../controllers/editorController');
const { verifyToken, checkRole } = require('../middleware/auth');

const router = express.Router();

// Lấy stats cá nhân cho editor (số news đã tạo, comments đã approve)
router.get('/stats', verifyToken, checkRole(['editor']), getEditorStats);

// Lấy danh sách news của editor
router.get('/news', verifyToken, checkRole(['editor']), getMyNews);

// Xóa bình luận (editor có quyền)
router.delete('/comments/:id', verifyToken, checkRole(['editor']), deleteComment);

module.exports = router;