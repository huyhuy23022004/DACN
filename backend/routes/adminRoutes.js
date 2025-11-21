const express = require('express');
const { getStats, getAllUsers, updateUserRole, getAllNews, togglePublish, getAllComments, deleteComment, banUser, unbanUser, sendNotification, sendNotificationToAll, getAllNotifications, deleteNotification } = require('../controllers/adminController');
const { verifyToken, checkRole } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', verifyToken, checkRole(['admin']), getStats);
router.get('/users', verifyToken, checkRole(['admin']), getAllUsers);
router.put('/users/:id/role', verifyToken, checkRole(['admin']), updateUserRole);
router.put('/users/:id/ban', verifyToken, checkRole(['admin']), banUser);
router.put('/users/:id/unban', verifyToken, checkRole(['admin']), unbanUser);
router.get('/news', verifyToken, checkRole(['admin']), getAllNews);
router.put('/news/:id/toggle', verifyToken, checkRole(['admin']), togglePublish);
router.get('/comments', verifyToken, checkRole(['admin', 'editor']), getAllComments);
router.delete('/comments/:id', verifyToken, checkRole(['admin', 'editor']), deleteComment);
router.post('/notifications', verifyToken, checkRole(['admin']), sendNotification);
router.post('/notifications/broadcast', verifyToken, checkRole(['admin']), sendNotificationToAll);
router.get('/notifications', verifyToken, checkRole(['admin']), getAllNotifications);
router.delete('/notifications/:id', verifyToken, checkRole(['admin']), deleteNotification);

module.exports = router;