const News = require('../models/News');
const multer = require('multer');
const path = require('path');
const { getMapUrl } = require('../utils/mapHelper');

// Escape user input for safe regex usage
function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Cấu hình multer cho upload ảnh
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../frontend/public/images'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Lấy gợi ý tìm kiếm
exports.getSuggestions = async (req, res) => {
  try {
    const query = req.query.q || '';
    console.log('Truy vấn:', query);
    if (!query) return res.json({ suggestions: [] });

    const escaped = escapeRegex(query);
    const regex = { $regex: escaped, $options: 'i' };

    const suggestions = await News.find({
      published: true,
      $or: [{ title: regex }, { content: regex }]
    })
      .select('title')
      .limit(10)
      .sort({ createdAt: -1 });

    console.log('Tìm thấy gợi ý:', suggestions.length);
    res.json({ suggestions: suggestions.map(s => s.title) });
  } catch (error) {
    console.error('Lỗi trong getSuggestions:', error);
    res.status(500).json({ error: error.message });
  }
};

// Lấy tất cả tin tức
exports.getAllNews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const author = req.query.author || '';
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const tags = req.query.tags ? req.query.tags.split(',').map(tag => tag.trim()) : [];

    let query = { published: true };
    if (search) {
      // Use escaped regex to avoid injection and search in title OR content
      const escaped = escapeRegex(search);
      const regex = { $regex: escaped, $options: 'i' };
      query.$or = [{ title: regex }, { content: regex }];
    }
    if (category) {
      query.category = category;
    }
    if (author) {
      query.author = author;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }
    if (tags.length > 0) {
      query.tags = { $in: tags };
    }

    const news = await News.find(query)
      .populate('author category')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await News.countDocuments(query);

    // Thêm mapUrl cho tin tức có vị trí
    const newsWithMapUrl = news.map(item => {
      const newsObj = item.toObject();
      if (newsObj.location && newsObj.location.lat && newsObj.location.lng) {
        newsObj.mapUrl = getMapUrl(newsObj.location.lat, newsObj.location.lng);
      }
      return newsObj;
    });

    res.json({
      news: newsWithMapUrl,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy tin tức theo ID
exports.getNewsById = async (req, res) => {
  try {
    const news = await News.findById(req.params.id).populate('author category').populate('likes');
    if (!news) return res.status(404).json({ error: 'Tin tức không tìm thấy' });
    news.views += 1;
    await news.save();

    // Thêm mapUrl nếu có vị trí
    const newsObj = news.toObject();
    if (newsObj.location && newsObj.location.lat && newsObj.location.lng) {
      newsObj.mapUrl = getMapUrl(newsObj.location.lat, newsObj.location.lng);
    }

    res.json(newsObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Tạo tin tức mới
exports.createNews = async (req, res) => {
  try {
    // Kiểm tra quyền (editor hoặc admin)
    if (!['editor', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Không có quyền tạo tin tức' });
    }

    const news = new News({ ...req.body, author: req.user.id });
    await news.save();

    // Thêm mapUrl nếu có vị trí
    const newsObj = news.toObject();
    if (newsObj.location && newsObj.location.lat && newsObj.location.lng) {
      newsObj.mapUrl = getMapUrl(newsObj.location.lat, newsObj.location.lng);
    }

    res.status(201).json(newsObj);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Cập nhật tin tức
exports.updateNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ error: 'Tin tức không tìm thấy' });

    // Kiểm tra quyền (tác giả hoặc admin)
    const isAuthor = news.author.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'Không có quyền cập nhật tin tức này' });
    }

    const updatedNews = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // Thêm mapUrl nếu có vị trí
    const newsObj = updatedNews.toObject();
    if (newsObj.location && newsObj.location.lat && newsObj.location.lng) {
      newsObj.mapUrl = getMapUrl(newsObj.location.lat, newsObj.location.lng);
    }

    res.json(newsObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa tin tức
const cloudinary = require('../config/cloudinary');

function parseCloudinaryPublicId(url) {
  try {
    const parts = url.split('/upload/');
    if (!parts[1]) return null;
    let rest = parts[1];
    // remove version prefix v12345/
    rest = rest.replace(/^v\d+\//, '');
    const dotIndex = rest.lastIndexOf('.');
    if (dotIndex === -1) return rest;
    return rest.substring(0, dotIndex);
  } catch (e) {
    return null;
  }
}

exports.deleteNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ error: 'Tin tức không tìm thấy' });

    // Kiểm tra quyền (tác giả hoặc admin)
    const isAuthor = news.author.toString() === req.user.id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'Không có quyền xóa tin tức này' });
    }

    // attempt to delete linked cloudinary images
    if (news.images && news.images.length > 0 && cloudinary.config().api_key) {
      for (const img of news.images) {
        try {
          // img may be a URL string; extract publicId
          const publicId = parseCloudinaryPublicId(img);
          if (publicId) await cloudinary.uploader.destroy(publicId);
        } catch (e) {
          console.warn('Error deleting Cloudinary image:', e.message || e);
        }
      }
    }
    await News.findByIdAndDelete(req.params.id);
    res.json({ message: 'Xóa tin tức thành công' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Thích/Bỏ thích tin tức
exports.likeNews = async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ error: 'Tin tức không tìm thấy' });

    const userId = req.user.id;
    const isLiked = news.likes.includes(userId);

    if (isLiked) {
      // Bỏ thích
      news.likes = news.likes.filter(id => id.toString() !== userId);
    } else {
      // Thích
      news.likes.push(userId);
    }

    await news.save();
    res.json({ liked: !isLiked, likesCount: news.likes.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

