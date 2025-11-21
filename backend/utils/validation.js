const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
};

const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  return password.length >= 6 && password.length <= 100;
};

const validateUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  const trimmed = username.trim();
  return trimmed.length >= 3 && trimmed.length <= 50 && /^[a-zA-Z0-9_\s\u00C0-\u017F-]+$/.test(trimmed);
};

const validateTitle = (title) => {
  if (!title || typeof title !== 'string') return false;
  const trimmed = title.trim();
  return trimmed.length >= 5 && trimmed.length <= 200;
};

const validateContent = (content) => {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trim();
  // Strip HTML tags to get plain text length
  const plainText = trimmed.replace(/<[^>]*>/g, '').trim();
  return plainText.length >= 10 && trimmed.length <= 10000;
};

const validateSummary = (summary) => {
  if (!summary) return true; // Optional field
  if (typeof summary !== 'string') return false;
  const trimmed = summary.trim();
  return trimmed.length <= 500;
};

const validateLocation = (location) => {
  if (!location) return true; // Optional field
  if (typeof location !== 'object') return false;

  const { lat, lng, address } = location;

  // Validate latitude (-90 to 90)
  if (lat !== undefined && (typeof lat !== 'number' || lat < -90 || lat > 90)) {
    return false;
  }

  // Validate longitude (-180 to 180)
  if (lng !== undefined && (typeof lng !== 'number' || lng < -180 || lng > 180)) {
    return false;
  }

  // Validate address
  if (address !== undefined) {
    if (typeof address !== 'string') return false;
    const trimmed = address.trim();
    if (trimmed.length < 3 || trimmed.length > 200) return false;
  }

  return true;
};

const validateCategoryName = (name) => {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
};

const validateCommentContent = (content) => {
  if (!content || typeof content !== 'string') return false;
  const trimmed = content.trim();
  return trimmed.length >= 1 && trimmed.length <= 1000;
};

const validateTags = (tags) => {
  if (!tags) return true; // Optional field
  if (!Array.isArray(tags)) return false;
  if (tags.length > 10) return false; // Max 10 tags

  return tags.every(tag => {
    if (typeof tag !== 'string') return false;
    const trimmed = tag.trim();
    return trimmed.length >= 2 && trimmed.length <= 50;
  });
};

const validateVideoUrl = (url) => {
  if (!url) return true; // Optional field
  if (typeof url !== 'string') return false;
  const youtubeRegex = /^https:\/\/(www\.)?youtube\.com\/watch\?v=[a-zA-Z0-9_-]{11}$/;
  return youtubeRegex.test(url.trim());
};

const validatePagination = (page, limit) => {
  const pageNum = page ? parseInt(page) : undefined;
  const limitNum = limit ? parseInt(limit) : undefined;

  if (page && (isNaN(pageNum) || pageNum < 1)) return false;
  if (limit && (isNaN(limitNum) || limitNum < 1 || limitNum > 100)) return false;

  return true;
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, ''); // Basic XSS prevention
};

module.exports = {
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
};