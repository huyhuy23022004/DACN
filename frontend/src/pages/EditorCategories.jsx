import { useEffect, useState } from 'react';
import EditorSidebar from '../components/EditorSidebar';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

const EditorCategories = () => {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', images: [] });
  const [categoryImages, setCategoryImages] = useState([]);
  const [categoryError, setCategoryError] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => {
    const load = async () => { try { const data = await api.get('/categories', token); setCategories(data); } catch (err) { console.error(err); } };
    load();
    window.scrollTo(0, 0);
  }, [token]);

  const uploadCategoryImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('http://localhost:5000/api/categories/upload', {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData
    });
    const data = await res.json();
    return data.imageUrl;
  };

  const handleCategoryImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const urls = [];
    for (const file of files) { urls.push(await uploadCategoryImage(file)); }
    setCategoryImages(urls);
    setNewCategory({ ...newCategory, images: urls });
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
    setNewCategory({ name: category.name, description: category.description, images: category.images || [] });
    setCategoryImages(category.images || []);
    setTimeout(() => { const el = document.getElementById('edit-category-title'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold text-red-600">Quản Lý Danh Mục (Editor)</h1>
            <Link to="/editor" className="text-sm text-blue-600 underline">Quay lại bảng điều khiển</Link>
          </div>
          <div className="mb-8">
            <h2 id="edit-category-title" className="text-2xl font-bold mb-4 text-red-600">{editingCategory ? 'Chỉnh Sửa Danh Mục' : 'Tạo Danh Mục Mới'}</h2>
            <form onSubmit={editingCategory ? updateCategory : createCategory} className="bg-white p-4 rounded shadow mb-4">
              <input type="text" placeholder="Tên Danh Mục" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} className="w-full p-2 border mb-4" required />
              <textarea placeholder="Mô tả danh mục" value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} className="w-full p-2 border mb-4" rows="3" />
              <input type="file" multiple accept="image/*" onChange={handleCategoryImageUpload} className="w-full p-2 border mb-4" />
              {categoryImages.length > 0 && (<div className="mb-4"><h4 className="font-semibold mb-2">Ảnh đã tải lên:</h4><div className="flex flex-wrap gap-2">{categoryImages.map((url, index) => <img key={index} src={url} alt={`Category ${index}`} className="w-20 h-20 object-cover rounded" />)}</div></div>)}
              <button type="submit" className="bg-red-600 text-white p-3 rounded text-lg mr-2">{editingCategory ? 'Cập Nhật' : 'Tạo'}</button>
              {editingCategory && (<button type="button" onClick={() => { setEditingCategory(null); setNewCategory({ name: '', description: '', images: [] }); setCategoryImages([]); }} className="bg-gray-600 text-white p-3 rounded text-lg">Hủy</button>)}
              {categoryError && (<p className="text-red-600 mt-3" role="alert">{categoryError}</p>)}
            </form>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-red-600">Danh Sách Danh Mục</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map(category => (
              <div key={category._id} className="bg-white p-4 rounded shadow">
                <div className="flex items-start gap-3">
                  {category.images && category.images.length > 0 && (<img src={category.images[0]} alt={category.name} className="w-16 h-16 object-cover rounded" />)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    <p className="text-gray-600 mb-2">{category.description}</p>
                    <div className="flex gap-2"><button onClick={() => editCategory(category)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Sửa</button></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorCategories;
