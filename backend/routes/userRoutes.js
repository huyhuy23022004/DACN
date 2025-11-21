const express = require('express');
const { register, login, forgotPassword, resetPassword, verifyEmail, getProfile, updateProfile, getUserComments, getUserLikedNews, changePassword, logout, getUserNotifications, markNotificationAsRead, markAllNotificationsAsRead } = require('../controllers/userController');
const { verifyToken, checkBanStatus } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  validateVerifyEmail,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
  validateUpdateProfile
} = require('../middleware/validation');

const router = express.Router();

router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);
router.post('/verify-email', validateVerifyEmail, verifyEmail);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.get('/profile', verifyToken, checkBanStatus, getProfile);
router.put('/profile', verifyToken, checkBanStatus, validateUpdateProfile, updateProfile);
router.put('/change-password', verifyToken, checkBanStatus, validateChangePassword, changePassword);
router.get('/comments', verifyToken, checkBanStatus, getUserComments);
router.get('/liked-news', verifyToken, checkBanStatus, getUserLikedNews);
router.get('/notifications', verifyToken, checkBanStatus, getUserNotifications);
router.put('/notifications/:id/read', verifyToken, checkBanStatus, markNotificationAsRead);
router.put('/notifications/mark-all-read', verifyToken, checkBanStatus, markAllNotificationsAsRead);
router.post('/logout', verifyToken, checkBanStatus, logout);

module.exports = router;