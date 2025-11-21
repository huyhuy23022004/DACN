import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../utils/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import TinyMCEEditor from '../components/TinyMCEEditor';

import AdminSidebar from "../components/AdminSidebar";
// Fix for default markers in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [comments, setComments] = useState([]);
  const [banModal, setBanModal] = useState({ show: false, user: null });
  const [banData, setBanData] = useState({ reason: '', duration: '1d' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingNews, setEditingNews] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', images: [] });
  const [newNews, setNewNews] = useState({ title: '', summary: '', content: '', category: '', tags: '', location: { lat: '', lng: '', address: '' }, videoUrl: '' });
  const [images, setImages] = useState([]);
  const [categoryImages, setCategoryImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [notificationForm, setNotificationForm] = useState({ title: '', message: '', type: 'info', recipientId: '' });
  const [showNotificationForm, setShowNotificationForm] = useState(false);
  // Use plain text input for content (no rich text editor)
  const token = localStorage.getItem('token');

  // Helper function to strip HTML tags and get plain text length
  const getPlainTextLength = (html) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, usersData, newsData, categoriesData, commentsData] = await Promise.all([
          api.get('/admin/stats', token),
          api.get('/admin/users', token),
          api.get('/admin/news', token),
          api.get('/categories'),
          api.get('/admin/comments', token)
        ]);
        setStats(statsData);
        setUsers(usersData);
        setNews(newsData.news || []);
        setCategories(categoriesData);
        setComments(commentsData);

        // Load notifications
        try {
          const notificationsData = await api.getAllNotifications(token);
          setNotifications(notificationsData?.notifications || []);
        } catch (notificationError) {
          console.error('Error loading notifications:', notificationError);
          setNotifications([]);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    loadData();
    window.scrollTo(0, 0); // Scroll to top when component mounts
  }, [token]);

  // If there's a hash in the URL (e.g. /admin#comments-section), scroll to it
  const location = useLocation();
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
    }
  }, [location.hash]);

  const togglePublish = async (newsId) => {
    await api.put(`/admin/news/${newsId}/toggle`, {}, token);
    setNews(news.map(n => n._id === newsId ? { ...n, published: !n.published } : n));
  };

  const updateUserRole = async (userId, newRole) => {
    await api.put(`/admin/users/${userId}/role`, { role: newRole }, token);
    setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
  };
 

  const openBanModal = (user) => {
    setBanModal({ show: true, user });
    setBanData({ reason: '', duration: '1d' });
  };

  const closeBanModal = () => {
    setBanModal({ show: false, user: null });
    setBanData({ reason: '', duration: '1d' });
  };

  const banUser = async () => {
    if (!banData.reason.trim()) {
      alert('Vui lòng nhập lý do ban!');
      return;
    }
    
    try {
      await api.put(`/admin/users/${banModal.user._id}/ban`, banData, token);
      setUsers(users.map(u => u._id === banModal.user._id ? { 
        ...u, 
        isBanned: true, 
        banReason: banData.reason,
        banExpiresAt: banData.duration === 'permanent' ? null : calculateBanExpiry(banData.duration),
        banDate: new Date()
      } : u));
      closeBanModal();
      alert('Đã ban user thành công!');
    } catch (error) {
      alert('Lỗi khi ban user: ' + error.message);
    }
  };

  const unbanUser = async (userId) => {
    if (confirm('Bạn có chắc muốn unban user này?')) {
      try {
        await api.put(`/admin/users/${userId}/unban`, {}, token);
        setUsers(users.map(u => u._id === userId ? { 
          ...u, 
          isBanned: false, 
          banReason: null,
          banExpiresAt: null,
          banDate: null
        } : u));
        alert('Đã unban user thành công!');
      } catch (error) {
        alert('Lỗi khi unban user: ' + error.message);
      }
    }
  };

  const calculateBanExpiry = (duration) => {
    const now = new Date();
    switch (duration) {
      case '1d': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '1w': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case '1m': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      default: return null;
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

  const deleteCategory = async (categoryId) => {
    if (confirm('Bạn có chắc muốn xóa danh mục này?')) {
      try {
        await api.delete(`/categories/${categoryId}`, token);
        setCategories(categories.filter(cat => cat._id !== categoryId));
        alert('Danh mục đã được xóa!');
      } catch (error) {
        alert('Lỗi khi xóa danh mục: ' + (error.message || 'Không thể xóa danh mục này'));
      }
    }
  };

  const editNews = (newsItem) => {
    setEditingNews(newsItem);
    setNewNews({
      title: newsItem.title,
      summary: newsItem.summary,
      content: newsItem.content,
      category: newsItem.category._id,
      tags: newsItem.tags ? newsItem.tags.join(', ') : '',
      location: newsItem.location || { lat: '', lng: '', address: '' },
      videoUrl: newsItem.videoUrl || ''
    });
    setImages(newsItem.images || []);
  // keep content as-is (plain text); no rich text editor
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
    setNews(news.map(n => n._id === editingNews._id ? { ...n, ...newsData, category: categories.find(c => c._id === newsData.category) } : n));
    setEditingNews(null);
    setNewNews({ title: '', summary: '', content: '', category: '', tags: '', location: { lat: '', lng: '', address: '' }, videoUrl: '' });
    setImages([]);
    alert('Tin tức đã được cập nhật!');
  };

  const deleteNews = async (newsId) => {
    if (confirm('Bạn có chắc muốn xóa tin tức này?')) {
      await api.delete(`/news/${newsId}`, token);
      setNews(news.filter(n => n._id !== newsId));
      alert('Tin tức đã được xóa!');
    }
  };

  const deleteComment = async (commentId) => {
    if (confirm('Bạn có chắc muốn xóa bình luận này?')) {
      await api.delete(`/admin/comments/${commentId}`, token);
      setComments(comments.filter(c => c._id !== commentId));
      alert('Bình luận đã được xóa!');
    }
  };

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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const urls = [];
    for (const file of files) {
      const url = await uploadImage(file);
      urls.push(url);
    }
    setImages(urls);
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

  const createCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/categories', newCategory, token);
      setNewCategory({ name: '', description: '', images: [] });
      setCategoryImages([]);
      alert('Danh mục đã được tạo!');
      const data = await api.get('/categories');
      setCategories(data);
    } catch (err) {
      alert('Lỗi tạo danh mục: ' + err.message);
    }
  };

  const createNews = async (e) => {
    e.preventDefault();
    if (!categories || categories.length === 0) {
      alert('Không có danh mục nào. Vui lòng tạo danh mục trước.');
      return;
    }
    const plainTextLength = getPlainTextLength(newNews.content).trim().length;
    if (plainTextLength < 10) {
      alert('Nội dung phải ít nhất 10 ký tự (không tính HTML tags).');
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
    try {
      await api.post('/news', newsData, token);
      setNewNews({ title: '', summary: '', content: '', category: '', tags: '', location: { lat: '', lng: '', address: '' }, videoUrl: '' });
      setImages([]);
      alert('Tin tức đã được tạo!');
      const data = await api.get('/admin/news', token);
      setNews(data.news || []);
    } catch (err) {
      alert('Lỗi tạo tin tức: ' + err.message);
    }
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

  // Notification functions
  const sendNotification = async (e) => {
    e.preventDefault();
    try {
      if (notificationForm.recipientId) {
        // Send to specific user
        await api.sendNotification({
          title: notificationForm.title,
          message: notificationForm.message,
          type: notificationForm.type,
          recipientId: notificationForm.recipientId
        }, token);
        alert('Thông báo đã được gửi đến người dùng!');
      } else {
        // Send to all users
        await api.sendNotificationToAll({
          title: notificationForm.title,
          message: notificationForm.message,
          type: notificationForm.type
        }, token);
        alert('Thông báo đã được gửi đến tất cả người dùng!');
      }
      setNotificationForm({ title: '', message: '', type: 'info', recipientId: '' });
      setShowNotificationForm(false);
      // Reload notifications
      const notificationsData = await api.getAllNotifications(token);
      setNotifications(notificationsData.notifications || []);
    } catch (error) {
      alert('Lỗi gửi thông báo: ' + error.message);
    }
  };

  const deleteNotification = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa thông báo này?')) return;
    try {
      await api.deleteNotification(id, token);
      setNotifications(notifications.filter(n => n._id !== id));
      alert('Thông báo đã được xóa!');
    } catch (error) {
      alert('Lỗi xóa thông báo: ' + error.message);
    }
  };

  return (
    <div className="flex">
  <AdminSidebar />

      <div className="ml-64 w-full">
        <div className="container mx-auto p-8 bg-red-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-red-600">Bảng Điều Khiển Admin</h1>

      {/* Stats grid - match admin layout */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-red-100 p-4 rounded">Tổng Người Dùng: {stats.users}</div>
        <div className="bg-red-100 p-4 rounded">Tổng Tin Tức: {stats.news}</div>
        <div className="bg-red-100 p-4 rounded">Tổng Bình Luận: {stats.comments}</div>
        <div className="bg-red-100 p-4 rounded">Tổng Danh Mục: {stats.categories}</div>
        <div className="bg-red-100 p-4 rounded">Tổng Lượt Xem: {stats.views}</div>
      </div>

  {/* Categories section first to match admin layout */}
  <div className="mb-8 scroll-mt-28" id="categories-section" data-old-id="edit-category-form">
  <h2 id="edit-category-title" className="text-2xl font-bold mb-4 text-red-600">{editingCategory ? 'Chỉnh Sửa Danh Mục' : 'Tạo Danh Mục Mới'}</h2>
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
        </form>
      </div>

      <div className="mb-8">
  <h2 id="categories-section-list" className="text-2xl font-bold mb-4 scroll-mt-24 text-red-600">Quản Lý Danh Mục</h2>
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
                    <button onClick={() => deleteCategory(category._id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Xóa</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* News editor form */}
      <div className="mb-8" id="edit-form">
  <h2 id="edit-news-title" className="text-2xl font-bold mb-4 text-red-600">{editingNews ? 'Chỉnh Sửa Tin Tức' : 'Tạo Tin Tức Mới'}</h2>
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

          <h2 id="users-section" className="text-2xl font-bold mb-4 scroll-mt-24 text-red-600">Quản Lý Người Dùng</h2>
          <div className="mb-8">
            <div className="grid grid-cols-1 gap-4">
              {(users || []).map(user => (
                <div key={user._id} className="bg-white p-4 rounded shadow">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{user.username}</h3>
                      <p className="text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500">Role: <span className="capitalize">{user.role}</span></p>
                      {user.isBanned && (
                        <p className="text-sm text-red-600">Banned: {user.banReason} {user.banExpiresAt ? `(until ${new Date(user.banExpiresAt).toLocaleDateString()})` : '(permanent)'}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user._id, e.target.value)}
                        className="p-1 border rounded text-sm"
                      >
                        <option value="user">User</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                      {user.isBanned ? (
                        <button onClick={() => unbanUser(user._id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Unban</button>
                      ) : (
                        <button onClick={() => openBanModal(user)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Ban</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

  <h2 id="news-section" className="text-2xl font-bold mb-4 scroll-mt-24 text-red-600">Quản Lý Tin Tức</h2>
      <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="mb-4 p-2 border rounded">
        <option value="">Tất cả danh mục</option>
        {(categories || []).map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
      </select>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(news || []).filter(item => !selectedCategory || item.category._id === selectedCategory).map(item => (
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
                  <button onClick={() => togglePublish(item._id)} className={`px-3 py-1 rounded text-sm ${item.published ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'}`}>
                    {item.published ? 'Hủy Duyệt' : 'Duyệt'}
                  </button>
                  <button onClick={() => editNews(item)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Sửa</button>
                  <button onClick={() => deleteNews(item._id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Xóa</button>
                </div>
              </div>
            ))}
          </div>

  <h2 id="comments-section" className="text-2xl font-bold mb-4 mt-8 scroll-mt-24 text-red-600">Quản Lý Bình Luận</h2>
      <div className="grid grid-cols-1 gap-4">
        {(comments || []).map(item => (
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

      {/* Notifications section */}
      <div className="mb-8" id="notifications-section">
  <h2 className="text-2xl font-bold mb-4 mt-8 scroll-mt-24 text-red-600">Quản Lý Thông Báo</h2>
        
        <button
          onClick={() => setShowNotificationForm(!showNotificationForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded mb-4 hover:bg-blue-700"
        >
          {showNotificationForm ? 'Ẩn Form' : 'Gửi Thông Báo Mới'}
        </button>

        {showNotificationForm && (
          <form onSubmit={sendNotification} className="bg-white p-4 rounded shadow mb-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Tiêu đề thông báo"
                value={notificationForm.title}
                onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                className="w-full p-2 border mb-2"
                required
              />
              <textarea
                placeholder="Nội dung thông báo"
                value={notificationForm.message}
                onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                className="w-full p-2 border mb-2"
                rows="3"
                required
              />
              <select
                value={notificationForm.type}
                onChange={(e) => setNotificationForm({ ...notificationForm, type: e.target.value })}
                className="w-full p-2 border mb-2"
              >
                <option value="info">Thông tin</option>
                <option value="warning">Cảnh báo</option>
                <option value="success">Thành công</option>
                <option value="error">Lỗi</option>
              </select>
              <select
                value={notificationForm.recipientId}
                onChange={(e) => setNotificationForm({ ...notificationForm, recipientId: e.target.value })}
                className="w-full p-2 border mb-2"
              >
                <option value="">Gửi đến tất cả người dùng</option>
                {(users || []).map(user => (
                  <option key={user._id} value={user._id}>
                    {user.username} ({user.email}) - {user.role}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Gửi Thông Báo
            </button>
          </form>
        )}

        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-4">Danh Sách Thông Báo</h3>
          {notifications.length === 0 ? (
            <p className="text-gray-500">Chưa có thông báo nào</p>
          ) : (
            (notifications || []).map(notification => (
              <div key={notification._id} className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold">{notification.title}</h4>
                    <p className="text-gray-600 mt-1">{notification.message}</p>
                    <div className="text-sm text-gray-500 mt-2">
                      <span>Người nhận: {notification.recipient?.username || 'Tất cả'}</span>
                      <span className="ml-4">Loại: {notification.type}</span>
                      <span className="ml-4">Ngày: {new Date(notification.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteNotification(notification._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 ml-4"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Ban User Modal */}
      {banModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">Ban User: {banModal.user?.username}</h3>
            <textarea
              placeholder="Lý do ban"
              value={banData.reason}
              onChange={(e) => setBanData({ ...banData, reason: e.target.value })}
              className="w-full p-2 border mb-4"
              rows="3"
              required
            />
            <select
              value={banData.duration}
              onChange={(e) => setBanData({ ...banData, duration: e.target.value })}
              className="w-full p-2 border mb-4"
            >
              <option value="1d">1 ngày</option>
              <option value="1w">1 tuần</option>
              <option value="1m">1 tháng</option>
              <option value="permanent">Vĩnh viễn</option>
            </select>
            <div className="flex gap-2">
              <button onClick={banUser} className="bg-red-600 text-white px-4 py-2 rounded">Ban</button>
              <button onClick={closeBanModal} className="bg-gray-600 text-white px-4 py-2 rounded">Hủy</button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;