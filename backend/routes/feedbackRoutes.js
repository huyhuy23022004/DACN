const express = require('express');
const { sendFeedback } = require('../controllers/feedbackController');

const router = express.Router();

// Route gửi feedback
router.post('/', sendFeedback);

module.exports = router;