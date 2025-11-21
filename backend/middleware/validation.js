const {
  validateEmail,
  validatePassword,
  validateUsername,
  validateTitle,
  validateContent,
  validateSummary,
  validateLocation,
  validateCategoryName,
  validateCommentContent,
  validateTags,
  validateVideoUrl,
  validatePagination,
  sanitizeInput
} = require('../utils/validation');
const mongoose = require('mongoose');

// Validation middleware functions
const validateUserRegistration = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = [];

  if (!validateUsername(username)) {
    errors.push('Username phải từ 3-50 ký tự, chỉ chứa chữ cái, số, dấu cách, dấu gạch dưới và dấu gạch ngang');
  }

  if (!validateEmail(email)) {
    errors.push('Email không hợp lệ');
  }

  if (!validatePassword(password)) {
    errors.push('Mật khẩu phải từ 6-100 ký tự');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ', details: errors });
  }

  // Sanitize inputs
  req.body.username = sanitizeInput(username);
  req.body.email = sanitizeInput(email);

  next();
};

const validateUserLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!validateEmail(email)) {
    errors.push('Email không hợp lệ');
  }

  if (!password || typeof password !== 'string' || password.length < 1) {
    errors.push('Mật khẩu không được để trống');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ', details: errors });
  }

  req.body.email = sanitizeInput(email);
  next();
};

const validateVerifyEmail = (req, res, next) => {
  const { token } = req.body;

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return res.status(400).json({ error: 'Token xác thực không hợp lệ' });
  }

  next();
};

const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;

  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Email không hợp lệ' });
  }

  req.body.email = sanitizeInput(email);
  next();
};

const validateResetPassword = (req, res, next) => {
  const { newPassword } = req.body;

  if (!validatePassword(newPassword)) {
    return res.status(400).json({ error: 'Mật khẩu mới phải từ 6-100 ký tự' });
  }

  next();
};

const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const errors = [];

  if (!currentPassword || currentPassword.trim().length === 0) {
    errors.push('Mật khẩu hiện tại là bắt buộc');
  }

  if (!validatePassword(newPassword)) {
    errors.push('Mật khẩu mới phải từ 6-100 ký tự');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ', details: errors });
  }

  next();
};

const validateUpdateProfile = (req, res, next) => {
  const { username, email } = req.body;
  const errors = [];

  if (username && !validateUsername(username)) {
    errors.push('Username phải từ 3-50 ký tự, chỉ chứa chữ cái, số, dấu cách, dấu gạch dưới và dấu gạch ngang');
  }

  if (email && !validateEmail(email)) {
    errors.push('Email không hợp lệ');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ', details: errors });
  }

  // Sanitize inputs
  if (username) req.body.username = sanitizeInput(username);
  if (email) req.body.email = sanitizeInput(email);

  next();
};

const validateNewsCreation = (req, res, next) => {
  const { title, content, summary, location, tags, videoUrl } = req.body;
  const errors = [];

  if (!validateTitle(title)) {
    errors.push('Tiêu đề phải từ 5-200 ký tự');
  }

  if (!validateContent(content)) {
    errors.push('Nội dung phải từ 10-10000 ký tự');
  }

  if (summary && !validateSummary(summary)) {
    errors.push('Tóm tắt không được vượt quá 500 ký tự');
  }

  if (!validateLocation(location)) {
    errors.push('Thông tin vị trí không hợp lệ (latitude: -90 đến 90, longitude: -180 đến 180)');
  }

  if (!validateTags(tags)) {
    errors.push('Tags phải là mảng, tối đa 10 tags, mỗi tag 2-50 ký tự');
  }

  if (!validateVideoUrl(videoUrl)) {
    errors.push('Link YouTube không hợp lệ');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ', details: errors });
  }

  // Sanitize inputs
  req.body.title = sanitizeInput(title);
  // IMPORTANT: content contains HTML from rich editors (TinyMCE).
  // Do NOT strip angle brackets here or the HTML will be destroyed.
  // We assume the frontend/editor will upload images and provide safe HTML.
  req.body.content = content;
  if (summary) req.body.summary = sanitizeInput(summary);
  if (location && location.address) {
    req.body.location.address = sanitizeInput(location.address);
  }
  if (videoUrl) req.body.videoUrl = sanitizeInput(videoUrl);

  next();
};

const validateNewsUpdate = (req, res, next) => {
  const { title, content, summary, location, tags, videoUrl } = req.body;
  const errors = [];

  if (title && !validateTitle(title)) {
    errors.push('Tiêu đề phải từ 5-200 ký tự');
  }

  if (content && !validateContent(content)) {
    errors.push('Nội dung phải từ 10-10000 ký tự');
  }

  if (summary && !validateSummary(summary)) {
    errors.push('Tóm tắt không được vượt quá 500 ký tự');
  }

  if (location && !validateLocation(location)) {
    errors.push('Thông tin vị trí không hợp lệ (latitude: -90 đến 90, longitude: -180 đến 180)');
  }

  if (tags && !validateTags(tags)) {
    errors.push('Tags phải là mảng, tối đa 10 tags, mỗi tag 2-50 ký tự');
  }

  if (videoUrl !== undefined && !validateVideoUrl(videoUrl)) {
    errors.push('Link YouTube không hợp lệ');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ', details: errors });
  }

  // Sanitize inputs
  if (title) req.body.title = sanitizeInput(title);
  // Keep HTML content intact for rich text editors. Do not remove <> here.
  if (content) req.body.content = content;
  if (summary) req.body.summary = sanitizeInput(summary);
  if (location && location.address) {
    req.body.location.address = sanitizeInput(location.address);
  }
  if (videoUrl !== undefined) req.body.videoUrl = sanitizeInput(videoUrl);

  next();
};

const validateCategoryCreation = (req, res, next) => {
  const { name, description } = req.body;
  const errors = [];

  if (!validateCategoryName(name)) {
    errors.push('Tên danh mục phải từ 2-100 ký tự');
  }

  if (description && (typeof description !== 'string' || description.length > 500)) {
    errors.push('Mô tả danh mục không được vượt quá 500 ký tự');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ', details: errors });
  }

  // Sanitize inputs
  req.body.name = sanitizeInput(name);
  if (description) req.body.description = sanitizeInput(description);

  next();
};

const validateCategoryUpdate = (req, res, next) => {
  const { name, description } = req.body;
  const errors = [];

  if (name && !validateCategoryName(name)) {
    errors.push('Tên danh mục phải từ 2-100 ký tự');
  }

  if (description && (typeof description !== 'string' || description.length > 500)) {
    errors.push('Mô tả danh mục không được vượt quá 500 ký tự');
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Dữ liệu không hợp lệ', details: errors });
  }

  // Sanitize inputs
  if (name) req.body.name = sanitizeInput(name);
  if (description) req.body.description = sanitizeInput(description);

  next();
};

const validateCommentCreation = (req, res, next) => {
  const { content, parentId } = req.body;

  if (!validateCommentContent(content)) {
    return res.status(400).json({ error: 'Nội dung bình luận phải từ 1-1000 ký tự' });
  }

  // Validate parentId nếu có
  if (parentId && !mongoose.Types.ObjectId.isValid(parentId)) {
    return res.status(400).json({ error: 'parentId không hợp lệ' });
  }

  req.body.content = sanitizeInput(content);
  next();
};

const validateCommentUpdate = (req, res, next) => {
  const { content } = req.body;

  if (!validateCommentContent(content)) {
    return res.status(400).json({ error: 'Nội dung bình luận phải từ 1-1000 ký tự' });
  }

  req.body.content = sanitizeInput(content);
  next();
};

const validatePaginationMiddleware = (req, res, next) => {
  const { page, limit } = req.query || {};

  if (!validatePagination(page, limit)) {
    return res.status(400).json({ error: 'Tham số phân trang không hợp lệ' });
  }

  next();
};

const validateAdvancedSearch = (req, res, next) => {
  const { author, startDate, endDate, tags } = req.query;
  const errors = [];

  if (author && !mongoose.Types.ObjectId.isValid(author)) {
    errors.push('Author ID không hợp lệ');
  }

  if (startDate && isNaN(Date.parse(startDate))) {
    errors.push('startDate không hợp lệ (định dạng ISO 8601)');
  }

  if (endDate && isNaN(Date.parse(endDate))) {
    errors.push('endDate không hợp lệ (định dạng ISO 8601)');
  }

  if (tags) {
    const tagsArray = tags.split(',').map(tag => tag.trim());
    if (!validateTags(tagsArray)) {
      errors.push('Tags không hợp lệ (tối đa 10 tags, mỗi tag 2-50 ký tự)');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: 'Tham số tìm kiếm nâng cao không hợp lệ', details: errors });
  }

  next();
};

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateVerifyEmail,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
  validateUpdateProfile,
  validateNewsCreation,
  validateNewsUpdate,
  validateCategoryCreation,
  validateCategoryUpdate,
  validateCommentCreation,
  validateCommentUpdate,
  validatePaginationMiddleware,
  validateAdvancedSearch
};