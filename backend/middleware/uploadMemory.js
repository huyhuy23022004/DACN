const multer = require('multer');
const path = require('path');

// memory storage for multer - buffer will be available as req.file.buffer
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) return cb(null, true);
  cb(new Error('Chỉ cho phép tải lên hình ảnh'), false);
};

const uploadMemory = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

module.exports = uploadMemory;
