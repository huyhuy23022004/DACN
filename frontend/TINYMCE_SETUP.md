# TinyMCE Setup Guide

## ✅ ĐÃ SETUP XONG!

API key đã được lưu vào `.env` file và được bảo mật.

### 🔧 Cấu hình hiện tại:

- ✅ **API Key**: Đã lưu trong `.env` (VITE_TINYMCE_API_KEY)
- ✅ **Environment**: Sử dụng `import.meta.env.VITE_TINYMCE_API_KEY`
- ✅ **Security**: `.env` đã được thêm vào `.gitignore`
- ✅ **Plugins**: Đã remove deprecated plugins
- ✅ **Language**: Đã remove unsupported `vi_VN`

### 🚀 Cách sử dụng:

1. **Frontend đang chạy** trên `http://localhost:3001/`
2. **Login** vào Editor/Admin Dashboard
3. **Tạo tin tức mới** - TinyMCE editor sẽ hoạt động
4. **Upload ảnh** qua API backend

### � Files đã cập nhật:

- `frontend/.env` - Thêm VITE_TINYMCE_API_KEY
- `frontend/.gitignore` - Bảo mật .env file
- `frontend/src/components/TinyMCEEditor.jsx` - Sử dụng biến môi trường

### 🎯 Tính năng TinyMCE:

- ✅ Rich text editing (bold, italic, lists, etc.)
- ✅ Upload ảnh trực tiếp
- ✅ Tables, links, media
- ✅ Code blocks, emoticons
- ✅ Fullscreen mode

**TinyMCE đã sẵn sàng sử dụng!** 🎉