const express = require('express');
const { getComments, createComment, updateComment, approveComment, deleteComment } = require('../controllers/commentController');
const { verifyToken, checkRole } = require('../middleware/auth');
const { validateCommentCreation, validateCommentUpdate } = require('../middleware/validation');

const router = express.Router();

router.get('/:newsId', getComments);
router.post('/', verifyToken, validateCommentCreation, createComment);
router.put('/:id', verifyToken, validateCommentUpdate, updateComment);
router.put('/:id/approve', verifyToken, checkRole(['admin']), approveComment);
router.delete('/:id', verifyToken, deleteComment);

module.exports = router;