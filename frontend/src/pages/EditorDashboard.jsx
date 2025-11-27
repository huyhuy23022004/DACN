import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import TinyMCEEditor from '../components/TinyMCEEditor';
import EditorSidebar from '../components/EditorSidebar';

// Fix for default markers in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const EditorDashboard = () => {
  const [stats, setStats] = useState({});
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [comments, setComments] = useState([]);
  const [newNews, setNewNews] = useState({ title: '', summary: '', content: '', category: '', tags: '', location: { lat: '', lng: '' }, videoUrl: '' });
  const [images, setImages] = useState([]);
  const [editingNews, setEditingNews] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [categoryImages, setCategoryImages] = useState([]);
  const [categoryError, setCategoryError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  // Use plain text input for content (no rich text editor)
  const token = localStorage.getItem('token');

  // Helper function to strip HTML tags and get plain text length
  const getPlainTextLength = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  // content is plain text; no rich editor auto-detection

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, newsData, categoriesData, commentsData] = await Promise.all([
          api.get('/editor/stats', token),
          api.get('/editor/news', token),
          api.get('/categories', token),
          api.get('/admin/comments', token)
        ]);
        setStats(statsData);
        setNews(newsData);
        setCategories(categoriesData);
        setComments(commentsData);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    loadData();
    window.scrollTo(0, 0); // Scroll to top when component mounts
  }, [token]);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('http://localhost:5000/api/news/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    return data.imageUrl;
  };

  const uploadCategoryImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('http://localhost:5000/api/categories/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    return data.imageUrl;
  };

  const handleCategoryImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const urls = [];
    for (const file of files) {
      const url = await uploadCategoryImage(file);
      urls.push(url);
    }
    setCategoryImages(urls);
    setNewCategory({ ...newCategory, images: urls });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const urls = [];
    for (const file of files) {
      const url = await uploadImage(file);
      urls.push(url);
    }
    setImages(urls);
  };

  const editNews = (item) => {
    setEditingNews(item);
    setNewNews({
      title: item.title,
      summary: item.summary,
      content: item.content,
      category: item.category._id,
      tags: item.tags ? item.tags.join(', ') : '',
      location: item.location || { lat: '', lng: '', address: '' },
      videoUrl: item.videoUrl || ''
    });
    setImages(item.images || []);
    setTimeout(() => {
      const element = document.getElementById('edit-news-title');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const updateNews = async (e) => {
    e.preventDefault();
    const plainTextLength = getPlainTextLength(newNews.content).trim().length;
    if (plainTextLength < 10) {
      alert('Nội dung phải từ 10 ký tự trở lên (không tính HTML tags)');
      return;
    }
    const lat = parseFloat(newNews.location.lat);
    const lng = parseFloat(newNews.location.lng);
    const location = (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) ? { lat, lng, address: newNews.location.address } : undefined;
    const newsData = {
      ...newNews,
      tags: newNews.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      images,
      videoUrl: newNews.videoUrl,
      location
    };
    await api.put(`/news/${editingNews._id}`, newsData, token);
    setEditingNews(null);
    setNewNews({ title: '', summary: '', content: '', category: '', tags: '', location: { lat: '', lng: '', address: '' }, videoUrl: '' });
    setImages([]);
    alert('Tin tức đã được cập nhật!');
    api.get('/editor/news', token).then(setNews);
  };

  const createNews = async (e) => {
    e.preventDefault();
    const plainTextLength = getPlainTextLength(newNews.content).trim().length;
    if (plainTextLength < 10) {
      alert('Nội dung phải từ 10 ký tự trở lên (không tính HTML tags)');
      return;
    }
    const lat = parseFloat(newNews.location.lat);
    const lng = parseFloat(newNews.location.lng);
    const location = (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) ? { lat, lng, address: newNews.location.address } : undefined;
    const newsData = {
      ...newNews,
      tags: newNews.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      images,
      videoUrl: newNews.videoUrl,
      location
    };
    await api.post('/news', newsData, token);
    setNewNews({ title: '', summary: '', content: '', category: '', tags: '', location: { lat: '', lng: '', address: '' }, videoUrl: '' });
    setImages([]);
    alert('Tin tức đã được tạo!');
    api.get('/editor/news', token).then(setNews);
  };

  const geocodeAddress = async () => {
    if (!newNews.location.address.trim()) {
      alert('Vui lòng nhập địa chỉ');
      return;
    }
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newNews.location.address)}`);
      const data = await response.json();
      if (data.length > 0) {
        setNewNews({
          ...newNews,
          location: {
            ...newNews.location,
            lat: data[0].lat,
            lng: data[0].lon
          }
        });
        alert('Đã tìm thấy vị trí!');
      } else {
        alert('Không tìm thấy vị trí cho địa chỉ này');
      }
    } catch (error) {
      alert('Lỗi khi tìm vị trí: ' + error.message);
    }
  };

  const deleteNews = async (id) => {
    if (confirm('Bạn có chắc muốn xóa tin tức này?')) {
      await api.delete(`/news/${id}`, token);
      alert('Tin tức đã được xóa!');
      api.get('/editor/news', token).then(setNews);
    }
  };

  const deleteComment = async (commentId) => {
    if (confirm('Bạn có chắc muốn xóa bình luận này?')) {
      await api.delete(`/editor/comments/${commentId}`, token);
      setComments(comments.filter(c => c._id !== commentId));
      alert('Bình luận đã được xóa!');
    }
  };

  const createCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories', newCategory, token);
      setNewCategory({ name: '', description: '', images: [] });
      setCategoryImages([]);
      setCategoryError('');
      alert('Danh mục đã được tạo!');
      const data = await api.get('/categories', token);
      setCategories(data);
    } catch (err) {
      const message = (err && err.data && err.data.error) ? err.data.error : err.message || 'Lỗi tạo danh mục';
      setCategoryError(message);
    }
  };

  const editCategory = (category) => {
    setEditingCategory(category);
    setNewCategory({ 
      name: category.name, 
      description: category.description,
      images: category.images || []
    });
    setCategoryImages(category.images || []);
    setTimeout(() => {
      const element = document.getElementById('edit-category-title');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const updateCategory = async (e) => {
    e.preventDefault();
    await api.put(`/categories/${editingCategory._id}`, newCategory, token);
    setCategories(categories.map(cat => cat._id === editingCategory._id ? { ...cat, ...newCategory } : cat));
    setEditingCategory(null);
    setNewCategory({ name: '', description: '', images: [] });
    setCategoryImages([]);
    alert('Danh mục đã được cập nhật!');
  };

  return (
    <div className="flex">
      <EditorSidebar />
      <div className="ml-64 w-full">
        <div className="container mx-auto p-8 bg-red-50 min-h-screen">
          <h1 className="text-4xl font-bold mb-8 text-red-600">Bảng Điều Khiển Editor</h1>

          {/* Stats grid - match admin layout */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-red-100 p-4 rounded">Tổng Tin Tức: {news.length}</div>
            <div className="bg-red-100 p-4 rounded">Tổng Bình Luận: {comments.length}</div>
            <div className="bg-red-100 p-4 rounded">Tổng Danh Mục: {categories.length}</div>
            <div className="bg-red-100 p-4 rounded">Tin Tức Của Tôi: {stats.myNews}</div>
          </div>

          {/* Categories section first to match admin layout */}
          <div className="mb-8 scroll-mt-28" id="categories-section">
            <h2 id="edit-category-title" className="text-2xl font-bold mb-4 text-red-600 scroll-mt-24">{editingCategory ? 'Chỉnh Sửa Danh Mục' : 'Tạo Danh Mục Mới'}</h2>
            <form onSubmit={editingCategory ? updateCategory : createCategory} className="bg-white p-4 rounded shadow mb-4">
              <input
                type="text"
                placeholder="Tên Danh Mục"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                className="w-full p-2 border mb-4"
                required
              />
              <textarea
                placeholder="Mô tả danh mục"
                value={newCategory.description}
                onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                className="w-full p-2 border mb-4"
                rows="3"
              />
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleCategoryImageUpload}
                className="w-full p-2 border mb-4"
              />
              {categoryImages.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold mb-2">Ảnh đã tải lên:</h4>
                  <div className="flex flex-wrap gap-2">
                    {categoryImages.map((url, index) => (
                      <img key={index} src={url} alt={`Category ${index}`} className="w-20 h-20 object-cover rounded" />
                    ))}
                  </div>
                </div>
              )}
              <button type="submit" className="bg-red-600 text-white p-3 rounded text-lg mr-2">{editingCategory ? 'Cập Nhật' : 'Tạo'} Danh Mục</button>
              {editingCategory && (
                <button type="button" onClick={() => { setEditingCategory(null); setNewCategory({ name: '', description: '', images: [] }); setCategoryImages([]); }} className="bg-gray-600 text-white p-3 rounded text-lg">
                  Hủy
                </button>
              )}
              {categoryError && (
                <p className="text-red-600 mt-3" role="alert">{categoryError}</p>
              )}
            </form>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Quản Lý Danh Mục</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(category => (
                <div key={category._id} className="bg-white p-4 rounded shadow">
                  <div className="flex items-start gap-3">
                    {category.images && category.images.length > 0 && (
                      <img src={category.images[0]} alt={category.name} className="w-16 h-16 object-cover rounded" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      <p className="text-gray-600 mb-2">{category.description}</p>
                      <div className="flex gap-2">
                        <button onClick={() => editCategory(category)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Sửa</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

      {/* News editor form */}
      <div className="mb-8 scroll-mt-28" id="edit-form">
        <h2 id="edit-news-title" className="text-2xl font-bold mb-4 text-red-600 scroll-mt-24">{editingNews ? 'Chỉnh Sửa Tin Tức' : 'Tạo Tin Tức Mới'}</h2>
        <form onSubmit={editingNews ? updateNews : createNews} className="bg-white p-4 rounded shadow">
          <input
            type="text"
            placeholder="Tiêu Đề"
            value={newNews.title}
            onChange={(e) => setNewNews({ ...newNews, title: e.target.value })}
            className="w-full p-2 border mb-4"
            required
          />
          <textarea
            placeholder="Tóm Tắt"
            value={newNews.summary}
            onChange={(e) => setNewNews({ ...newNews, summary: e.target.value })}
            className="w-full p-2 border mb-4"
            rows="2"
            required
          />
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Nội dung</label>
            <TinyMCEEditor
              value={newNews.content}
              onChange={(content) => setNewNews({ ...newNews, content })}
              height={400}
            />
          </div>
          <select
            value={newNews.category}
            onChange={(e) => setNewNews({ ...newNews, category: e.target.value })}
            className="w-full p-2 border mb-4"
            required
          >
            <option value="">Chọn Danh Mục</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Tags (phân cách bằng dấu phẩy)"
            value={newNews.tags}
            onChange={(e) => setNewNews({ ...newNews, tags: e.target.value })}
            className="w-full p-2 border mb-4"
          />
          <div className="mb-4">
            <label>Vị Trí (Tùy Chọn)</label>
            <input
              type="number"
              placeholder="Latitude"
              value={newNews.location.lat}
              onChange={(e) => setNewNews({ ...newNews, location: { ...newNews.location, lat: e.target.value } })}
              className="w-full p-2 border mb-2"
              step="any"
            />
            <input
              type="number"
              placeholder="Longitude"
              value={newNews.location.lng}
              onChange={(e) => setNewNews({ ...newNews, location: { ...newNews.location, lng: e.target.value } })}
              className="w-full p-2 border mb-2"
              step="any"
            />
            <input
              type="text"
              placeholder="Địa chỉ (ví dụ: Hà Nội, Việt Nam)"
              value={newNews.location.address}
              onChange={(e) => setNewNews({ ...newNews, location: { ...newNews.location, address: e.target.value } })}
              className="w-full p-2 border mb-2"
            />
            <button
              type="button"
              onClick={geocodeAddress}
              className="bg-blue-500 text-white px-4 py-2 rounded mb-2"
            >
              Tìm vị trí từ địa chỉ
            </button>
            {newNews.location.lat && newNews.location.lng && !isNaN(newNews.location.lat) && !isNaN(newNews.location.lng) && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Xem trước vị trí:</p>
                <MapContainer center={[parseFloat(newNews.location.lat), parseFloat(newNews.location.lng)]} zoom={15} style={{ height: '200px', width: '100%' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={[parseFloat(newNews.location.lat), parseFloat(newNews.location.lng)]}>
                    <Popup>{newNews.location.address || 'Vị trí đã chọn'}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Ảnh (Tùy chọn - Chọn nhiều file)</label>
            <input
              type="file"
              multiple
              onChange={handleImageUpload}
              className="w-full p-2 border"
              accept="image/*"
            />
          </div>
          {images.length > 0 && (
            <div className="mb-4">
              <p>Ảnh đã upload:</p>
              {images.map((url, idx) => <img key={idx} src={url} alt="" className="w-20 h-20 inline-block mr-2" />)}
            </div>
          )}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Link Video YouTube (Tùy chọn)</label>
            <input
              type="url"
              placeholder="Nhập link YouTube (ví dụ: https://www.youtube.com/watch?v=...)"
              value={newNews.videoUrl}
              onChange={(e) => setNewNews({ ...newNews, videoUrl: e.target.value })}
              className="w-full p-2 border"
            />
          </div>
          <button type="submit" className="bg-red-600 text-white p-3 rounded text-lg mr-2">
            {editingNews ? 'Cập Nhật' : 'Tạo'} Tin Tức
          </button>
          {editingNews && (
            <button type="button" onClick={() => { setEditingNews(null); setNewNews({ title: '', summary: '', content: '', category: '', tags: '', location: { lat: '', lng: '', address: '' }, videoUrl: '' }); setImages([]); }} className="bg-gray-600 text-white p-3 rounded text-lg">
              Hủy
            </button>
          )}
        </form>
      </div>

      <h2 className="text-2xl font-bold mb-4 text-red-600">Quản Lý Tin Tức</h2>
      <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="mb-4 p-2 border rounded">
        <option value="">Tất cả danh mục</option>
        {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
      </select>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="news-section">
        {news.filter(item => !selectedCategory || item.category._id === selectedCategory).map(item => (
              <div key={item._id} className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-gray-600">{item.summary}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Đăng bởi: <span className="font-medium">{item.author?.username || 'N/A'}</span> 
                  <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs capitalize">{item.author?.role || 'N/A'}</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Trạng thái: <span className={item.published ? 'text-green-600' : 'text-red-600'}>{item.published ? 'Đã duyệt' : 'Chưa duyệt'}</span>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Danh mục: <span className="font-medium">{item.category?.name || 'N/A'}</span>
                </p>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => editNews(item)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Sửa</button>
                  <button onClick={() => deleteNews(item._id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Xóa</button>
                </div>
              </div>
            ))}
          </div>

      <div className="mb-8 scroll-mt-28" id="comments-section">
        <h2 className="text-2xl font-bold mb-4 text-red-600 scroll-mt-24">Quản Lý Bình Luận</h2>
        <div className="grid grid-cols-1 gap-4">
        {comments.map(item => (
          <div key={item._id} className="bg-white p-4 rounded shadow">
            <p className="font-semibold">{item.content}</p>
            <p className="text-sm text-gray-600 mt-1">
              Tin tức: <span className="font-medium">{item.news?.title || 'N/A'}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Đăng bởi: <span className="font-medium">{item.author?.username || 'N/A'}</span>
            </p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => deleteComment(item._id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Xóa</button>
            </div>
          </div>
        ))}
        </div>
      </div>
        </div>
      </div>
    </div>
  );
};

export default EditorDashboard;