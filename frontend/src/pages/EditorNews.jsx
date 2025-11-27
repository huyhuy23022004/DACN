import { useEffect, useState } from 'react';
import EditorSidebar from '../components/EditorSidebar';
import { Link } from 'react-router-dom';
import TinyMCEEditor from '../components/TinyMCEEditor';
import { api } from '../utils/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers in Leaflet with React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const EditorNews = () => {
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingNews, setEditingNews] = useState(null);
  const [newNews, setNewNews] = useState({ title: '', summary: '', content: '', category: '', tags: '', location: { lat: '', lng: '', address: '' }, videoUrl: '' });
  const [images, setImages] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const load = async () => {
      try {
        const [newsData, categoriesData] = await Promise.all([api.get('/editor/news', token), api.get('/categories')]);
        setNews(newsData);
        setCategories(categoriesData || []);
      } catch (err) { console.error(err); }
    };
    load();
    window.scrollTo(0, 0);
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

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const urls = [];
    for (const f of files) { urls.push(await uploadImage(f)); }
    setImages(urls);
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

  const createNews = async (e) => {
    e.preventDefault();
  const tagsArray = newNews.tags ? newNews.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const lat = parseFloat(newNews.location.lat);
  const lng = parseFloat(newNews.location.lng);
  const location = (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) ? { lat, lng, address: newNews.location.address } : undefined;
  const newsData = { ...newNews, tags: tagsArray, images, location };
    await api.post('/news', newsData, token);
    setNewNews({ title: '', summary: '', content: '', category: '', tags: '', location: { lat: '', lng: '', address: '' }, videoUrl: '' });
    setImages([]);
    const n = await api.get('/editor/news', token);
    setNews(n);
    alert('Tin tức đã được tạo!');
  };

  const editNews = (item) => {
    setEditingNews(item);
    setNewNews({ title: item.title, summary: item.summary, content: item.content, category: item.category._id, tags: item.tags ? item.tags.join(', ') : '', location: item.location || { lat: '', lng: '', address: '' }, videoUrl: item.videoUrl || '' });
    setImages(item.images || []);
    setTimeout(() => { const el = document.getElementById('edit-news-title'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
  };

  const updateNews = async (e) => {
    e.preventDefault();
  const tagsArray = newNews.tags ? newNews.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
  const lat = parseFloat(newNews.location.lat);
  const lng = parseFloat(newNews.location.lng);
  const location = (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) ? { lat, lng, address: newNews.location.address } : undefined;
  const payload = { ...newNews, tags: tagsArray, images, location };
    await api.put(`/news/${editingNews._id}`, payload, token);
    setEditingNews(null);
    setNewNews({ title: '', summary: '', content: '', category: '', tags: '', location: { lat: '', lng: '', address: '' }, videoUrl: '' });
    setImages([]);
    const n = await api.get('/editor/news', token);
    setNews(n);
    alert('Tin tức đã được cập nhật!');
  };

  const deleteNews = async (id) => { if (confirm('Bạn có chắc muốn xóa tin tức này?')) { await api.delete(`/news/${id}`, token); setNews(news.filter(n => n._id !== id)); alert('Đã xóa tin tức'); } };

  return (
    <div className="flex">
      <EditorSidebar />
      <div className="ml-64 w-full">
        <div className="container mx-auto p-8 bg-red-50 min-h-screen">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold text-red-600">Quản Lý Tin Tức (Editor)</h1>
            <Link to="/editor" className="text-sm text-blue-600 underline">Quay lại bảng điều khiển</Link>
          </div>
          <div className="mb-8">
            <h2 id="edit-news-title" className="text-2xl font-bold mb-4 text-red-600">{editingNews ? 'Chỉnh Sửa Tin Tức' : 'Tạo Tin Tức Mới'}</h2>
            <form onSubmit={editingNews ? updateNews : createNews} className="bg-white p-4 rounded shadow mb-4">
              <input id="edit-news-input-title" type="text" placeholder="Tiêu đề" value={newNews.title} onChange={(e) => setNewNews({ ...newNews, title: e.target.value })} className="w-full p-2 border mb-4" required />
              <textarea placeholder="Tóm tắt" value={newNews.summary} onChange={(e) => setNewNews({ ...newNews, summary: e.target.value })} className="w-full p-2 border mb-4" rows="2" required />
              <div className="mb-4"><label className="block text-sm font-medium mb-2">Nội dung</label><TinyMCEEditor value={newNews.content} onChange={(content) => setNewNews({ ...newNews, content })} height={400} /></div>
              <select value={newNews.category} onChange={(e) => setNewNews({ ...newNews, category: e.target.value })} className="w-full p-2 border mb-4" required>
                <option value="">Chọn Danh Mục</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
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
                <input type="url" placeholder="Nhập link YouTube" value={newNews.videoUrl} onChange={(e) => setNewNews({ ...newNews, videoUrl: e.target.value })} className="w-full p-2 border" />
              </div>
              <button type="submit" className="bg-red-600 text-white p-3 rounded text-lg mr-2">{editingNews ? 'Cập Nhật' : 'Tạo'}</button>
              {editingNews && <button type="button" onClick={() => { setEditingNews(null); setNewNews({ title: '', summary: '', content: '', category: '', tags: '', location: { lat: '', lng: '', address: '' }, videoUrl: '' }); setImages([]); }} className="bg-gray-600 text-white p-3 rounded text-lg">Hủy</button>}
            </form>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-red-600">Danh Sách Tin Tức</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {news.map(item => (
              <div key={item._id} className="bg-white p-4 rounded shadow">
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-gray-600">{item.summary}</p>
                <p className="text-sm text-gray-500 mt-1">Đăng bởi: <span className="font-medium">{item.author?.username || 'N/A'}</span></p>
                <div className="flex gap-2 mt-2"><button onClick={() => editNews(item)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Sửa</button><button onClick={() => deleteNews(item._id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Xóa</button></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorNews;
