const Category = require('../models/Category');

// Lấy tất cả danh mục
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Lấy danh mục theo ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Danh mục không tìm thấy' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Tạo danh mục mới
exports.createCategory = async (req, res) => {
  try {
    // Kiểm tra quyền (editor hoặc admin)
    if (!['editor', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Không có quyền tạo danh mục' });
    }

    const { name, description, images } = req.body;
    // Tạo slug tốt hơn: chuẩn hóa unicode, bỏ dấu, thay khoảng trắng bằng dấu gạch ngang
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu
      .replace(/[^a-z0-9\s-]/g, '') // Bỏ ký tự đặc biệt trừ khoảng trắng và dấu gạch ngang
      .trim()
      .replace(/\s+/g, '-') // Thay khoảng trắng bằng dấu gạch ngang
      .replace(/-+/g, '-'); // Thay nhiều dấu gạch ngang bằng một
    // Kiểm tra tồn tại trước khi tạo (theo name hoặc slug)
    const existing = await Category.findOne({ $or: [{ name }, { slug }] });
    if (existing) {
      return res.status(400).json({ error: 'Danh mục đã tồn tại' });
    }

    const category = new Category({ name, description, slug, images: images || [] });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    // Nếu có race condition dẫn tới duplicate key, trả message thân thiện
    if (error && error.code === 11000) {
      return res.status(400).json({ error: 'Danh mục đã tồn tại' });
    }
    res.status(400).json({ error: error.message });
  }
};

// Cập nhật danh mục
exports.updateCategory = async (req, res) => {
  try {
    // Kiểm tra quyền (editor hoặc admin)
    if (!['editor', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Không có quyền cập nhật danh mục' });
    }

    const { name, description, images } = req.body;
    // Tạo slug tốt hơn nếu có tên mới
    const slug = name ? name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu
      .replace(/[^a-z0-9\s-]/g, '') // Bỏ ký tự đặc biệt trừ khoảng trắng và dấu gạch ngang
      .trim()
      .replace(/\s+/g, '-') // Thay khoảng trắng bằng dấu gạch ngang
      .replace(/-+/g, '-') : undefined; // Thay nhiều dấu gạch ngang bằng một

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (images !== undefined) updateData.images = images;
    if (slug) updateData.slug = slug;

    const category = await Category.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!category) return res.status(404).json({ error: 'Danh mục không tìm thấy' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Xóa danh mục
exports.deleteCategory = async (req, res) => {
  try {
    // Kiểm tra quyền (chỉ admin mới được xóa)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền xóa danh mục' });
    }

    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Danh mục không tìm thấy' });

    // Kiểm tra xem danh mục có đang được sử dụng bởi tin tức nào không
    const News = require('../models/News');
    const newsCount = await News.countDocuments({ category: req.params.id });
      const cloudinary = require('../config/cloudinary');
      // attempt to delete linked cloudinary images
      if (category.images && category.images.length > 0 && cloudinary.config().api_key) {
        for (const img of category.images) {
          try {
            const parts = img.split('/upload/');
            if (!parts[1]) continue;
            let rest = parts[1];
            rest = rest.replace(/^v\d+\//, '');
            const dotIndex = rest.lastIndexOf('.');
            const publicId = dotIndex === -1 ? rest : rest.substring(0, dotIndex);
            if (publicId) await cloudinary.uploader.destroy(publicId);
          } catch (e) {
            console.warn('Error deleting Cloudinary image:', e.message || e);
          }
        }
      }
    if (newsCount > 0) {
      return res.status(400).json({ error: 'Không thể xóa danh mục đang được sử dụng bởi tin tức' });
    }

    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Xóa danh mục thành công' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: error.message });
  }
};