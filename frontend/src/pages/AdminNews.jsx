import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import AdminSidebar from '../components/AdminSidebar';
import { api } from '../utils/api';
import TinyMCEEditor from '../components/TinyMCEEditor';

// Fix for default markers in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const AdminNews = () => {
  const token = localStorage.getItem('token');
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingNews, setEditingNews] = useState(null);
  const [newNews, setNewNews] = useState({ title: '', summary: '', content: '', category: '', tags: '', location: { lat: '', lng: '', address: '' }, videoUrl: '' });
  const [images, setImages] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [newsData, categoriesData] = await Promise.all([api.get('/admin/news', token), api.get('/categories')]);
        setNews(newsData.news || []);
        setCategories(categoriesData);
      } catch (err) { console.error(err); }
    };
    load();
  }, [token]);

  const togglePublish = async (newsId) => { await api.put(`/admin/news/${newsId}/toggle`, {}, token); setNews(news.map(n => n._id === newsId ? { ...n, published: !n.published } : n)); };

  const editNews = (newsItem) => {
    setEditingNews(newsItem);
    setNewNews({ title: newsItem.title, summary: newsItem.summary, content: newsItem.content, category: newsItem.category._id, tags: newsItem.tags ? newsItem.tags.join(', ') : '', location: newsItem.location || { lat: '', lng: '', address: '' }, videoUrl: newsItem.videoUrl || '' });
    setImages(newsItem.images || []);
    // Scroll to edit form so admin can see and edit immediately
    setTimeout(() => {
      const el = document.getElementById('edit-news-title');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const input = document.getElementById('edit-news-input-title');
      if (input) input.focus();
    }, 100);
  };
  const updateNews = async (e) => {
    e.preventDefault();
    const tagsArray = newNews.tags.split(',').map(t => t.trim()).filter(t => t !== '');
    const lat = parseFloat(newNews.location.lat);
    const lng = parseFloat(newNews.location.lng);
    const location = (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)
      ? { lat, lng, address: newNews.location.address }
      : undefined;
    const newsData = { ...newNews, tags: tagsArray, images, videoUrl: newNews.videoUrl, location };
    await api.put(`/news/${editingNews._id}`, newsData, token);
    setNews(news.map(n => n._id === editingNews._id ? { ...n, ...newsData, category: categories.find(c => c._id === newsData.category) } : n));
    setEditingNews(null);
    setNewNews({ title: '', summary: '', content: '', category: '', tags: '', location: { lat: '', lng: '', address: '' }, videoUrl: '' });
    setImages([]);
    alert('Tin tức đã được cập nhật!');
  };
  // Tạo tin tức mới
  const createNews = async (e) => {
    e.preventDefault();
    try {
      const tagsArray = newNews.tags.split(',').map(t => t.trim()).filter(t => t !== '');
      const lat = parseFloat(newNews.location.lat);
      const lng = parseFloat(newNews.location.lng);
      const location = (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)
        ? { lat, lng, address: newNews.location.address }
        : undefined;
      const newsData = { ...newNews, tags: tagsArray, images, videoUrl: newNews.videoUrl, location };
      if (!images || images.length === 0) {
        const proceed = confirm('Bạn chưa upload ảnh cho tin tức này. Tiếp tục không?');
        if (!proceed) return;
      }
      const created = await api.post('/news', newsData, token);
      // Ensure category object present for UI. Attempt to resolve category id to object if categories list contains it
      const resolvedCategory = categories.find(c => c._id === (created.category || newsData.category));
      // Refresh admin list to ensure we show populated fields consistently
      try {
        const adminResponse = await api.get('/admin/news', token);
        setNews(adminResponse.news || []);
      } catch (err) {
        // Fallback: add created to the list
        const added = { ...created, category: resolvedCategory || created.category };
        setNews([added, ...news]);
      }
      setNewNews({ title: '', summary: '', content: '', category: '', tags: '', location: { lat: '', lng: '', address: '' }, videoUrl: '' });
      setImages([]);
      alert('Tin tức đã được tạo!');
    } catch (err) {
      console.error('Lỗi khi tạo tin tức:', err);
      alert(err.message || 'Lỗi khi tạo tin tức');
    }
  };
  
  const geocodeAddress = async () => {
    if (!newNews.location.address || !newNews.location.address.trim()) {
      alert('Vui lòng nhập địa chỉ');
      return;
    }
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newNews.location.address)}`);
      const data = await response.json();
      if (data.length > 0) {
        setNewNews({ ...newNews, location: { ...newNews.location, lat: data[0].lat, lng: data[0].lon } });
        alert('Đã tìm thấy vị trí!');
      } else {
        alert('Không tìm thấy vị trí cho địa chỉ này');
      }
    } catch (error) {
      alert('Lỗi khi tìm vị trí: ' + error.message);
    }
  };
  const deleteNews = async (id) => { if (confirm('Bạn có chắc muốn xóa tin tức này?')) { await api.delete(`/news/${id}`, token); setNews(news.filter(n => n._id !== id)); alert('Tin tức đã được xóa!'); } };

  const uploadImage = async (file) => { const formData = new FormData(); formData.append('image', file); const res = await fetch('http://localhost:5000/api/news/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData }); const data = await res.json(); return data.imageUrl; };
  const handleImageUpload = async (e) => { const files = Array.from(e.target.files); const urls = []; for (const f of files) { urls.push(await uploadImage(f)); } setImages(urls); };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="ml-64 w-full">
        <div className="container mx-auto p-8 bg-red-50 min-h-screen">
          <h1 className="text-4xl font-bold mb-8 text-red-600">Quản Lý Tin Tức</h1>
          <div className="mb-8">
            <h2 id="edit-news-title" className="text-2xl font-bold mb-4 text-red-600 scroll-mt-24">Tạo / Sửa Tin Tức</h2>
            <form onSubmit={editingNews ? updateNews : createNews} className="bg-white p-4 rounded shadow mb-4">
              <input id="edit-news-input-title" type="text" placeholder="Tiêu đề" value={newNews.title} onChange={(e) => setNewNews({ ...newNews, title: e.target.value })} className="w-full p-2 border mb-4" required />
              <textarea placeholder="Tóm tắt" value={newNews.summary} onChange={(e) => setNewNews({ ...newNews, summary: e.target.value })} className="w-full p-2 border mb-4" rows="2" required />
              <div className="mb-4"><label className="block text-sm font-medium mb-2">Nội dung</label><TinyMCEEditor value={newNews.content} onChange={(content) => setNewNews({ ...newNews, content })} height={400} /></div>
              <select value={newNews.category} onChange={(e) => setNewNews({ ...newNews, category: e.target.value })} className="w-full p-2 border mb-4" required><option value="">Chọn Danh Mục</option>{categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select>
              <input type="text" placeholder="Tags" value={newNews.tags} onChange={(e) => setNewNews({ ...newNews, tags: e.target.value })} className="w-full p-2 border mb-4" />
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Vị Trí (Tùy Chọn)</label>
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
                <button type="button" onClick={geocodeAddress} className="bg-blue-500 text-white px-4 py-2 rounded mb-2">Tìm vị trí từ địa chỉ</button>
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
                <input type="file" multiple onChange={handleImageUpload} className="w-full p-2 border" accept="image/*" />
              </div>
              {images.length > 0 && (<div className="mb-4"><p>Ảnh đã upload:</p>{images.map((url, idx) => <img key={idx} src={url} alt="" className="w-20 h-20 inline-block mr-2" />)}</div>)}
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
              <button type="submit" className="bg-red-600 text-white p-3 rounded text-lg mr-2">{editingNews ? 'Cập Nhật' : 'Tạo'} Tin Tức</button>
              {editingNews && <button type="button" onClick={() => { setEditingNews(null); setNewNews({ title: '', summary: '', content: '', category: '', tags: '', location: { lat: '', lng: '', address: '' }, videoUrl: '' }); setImages([]); }} className="bg-gray-600 text-white p-3 rounded text-lg">Hủy</button>}
            </form>
          </div>

          <h2 className="text-2xl font-bold mb-4 text-red-600">Danh Sách Tin Tức</h2>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="mb-4 p-2 border rounded"><option value="">Tất cả danh mục</option>{(categories || []).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{(news || []).filter(item => !selectedCategory || item.category._id === selectedCategory).map(item => (
            <div key={item._id} className="bg-white p-4 rounded shadow">
              {item.images && item.images.length > 0 && (<div className="mb-2"><img src={item.images[0]} alt={item.title} className="w-32 h-20 object-cover rounded" /></div>)}
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-gray-600">{item.summary}</p>
              <p className="text-sm text-gray-500 mt-1">Đăng bởi: <span className="font-medium">{item.author?.username || 'N/A'}</span> <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs capitalize">{item.author?.role || 'N/A'}</span></p>
              <p className="text-sm text-gray-500 mt-1">Trạng thái: <span className={item.published ? 'text-green-600' : 'text-red-600'}>{item.published ? 'Đã duyệt' : 'Chưa duyệt'}</span></p>
              <div className="flex gap-2 mt-2"><button onClick={() => togglePublish(item._id)} className={`px-3 py-1 rounded text-sm ${item.published ? 'bg-yellow-600 text-white' : 'bg-green-600 text-white'}`}>{item.published ? 'Hủy Duyệt' : 'Duyệt'}</button><button onClick={() => editNews(item)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Sửa</button><button onClick={() => deleteNews(item._id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Xóa</button></div>
            </div>
          ))}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminNews;
