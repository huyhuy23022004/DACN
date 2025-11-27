import { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { api } from '../utils/api';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', images: [] });
  const [categoryImages, setCategoryImages] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const load = async () => { try { const data = await api.get('/categories'); setCategories(data); } catch (err) { console.error(err); } };
    load();
  }, []);

  const handleCategoryImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const urls = [];
    for (const file of files) {
      const formData = new FormData(); formData.append('image', file);
      const res = await fetch('http://localhost:5000/api/categories/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await res.json(); urls.push(data.imageUrl);
    }
    setCategoryImages(urls);
    setNewCategory({ ...newCategory, images: urls });
  };

  const createCategory = async (e) => { e.preventDefault(); await api.post('/categories', newCategory, token); setNewCategory({ name: '', description: '', images: [] }); setCategoryImages([]); alert('Danh mục đã được tạo!'); const data = await api.get('/categories'); setCategories(data); };
  const editCategory = (category) => { setEditingCategory(category); setNewCategory({ name: category.name, description: category.description, images: category.images || [] }); setCategoryImages(category.images || []);
  setTimeout(() => { const el = document.getElementById('edit-category-title'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); const input = document.getElementById('edit-category-input-name'); if (input) input.focus(); }, 100);
  };
  const updateCategory = async (e) => { e.preventDefault(); await api.put(`/categories/${editingCategory._id}`, newCategory, token); setCategories(categories.map(c => c._id === editingCategory._id ? { ...c, ...newCategory } : c)); setEditingCategory(null); setNewCategory({ name: '', description: '', images: [] }); setCategoryImages([]); alert('Danh mục đã được cập nhật!'); };
  const deleteCategory = async (categoryId) => { if (confirm('Bạn có chắc muốn xóa danh mục này?')) { await api.delete(`/categories/${categoryId}`, token); setCategories(categories.filter(c => c._id !== categoryId)); alert('Danh mục đã được xóa!'); } };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="ml-64 w-full">
        <div className="container mx-auto p-8 bg-red-50 min-h-screen">
          <h1 className="text-4xl font-bold mb-8 text-red-600">Quản Lý Danh Mục</h1>
          <div className="mb-8">
            <h2 id="edit-category-title" className="text-2xl font-bold mb-4 text-red-600 scroll-mt-24">{editingCategory ? 'Chỉnh Sửa Danh Mục' : 'Tạo Danh Mục Mới'}</h2>
            <form onSubmit={editingCategory ? updateCategory : createCategory} className="bg-white p-4 rounded shadow mb-4">
              <input id="edit-category-input-name" type="text" placeholder="Tên Danh Mục" value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} className="w-full p-2 border mb-4" required />
              <textarea placeholder="Mô tả danh mục" value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} className="w-full p-2 border mb-4" rows="3" />
              <input type="file" multiple accept="image/*" onChange={handleCategoryImageUpload} className="w-full p-2 border mb-4" />
              {categoryImages.length > 0 && (<div className="mb-4"><h4 className="font-semibold mb-2">Ảnh đã tải lên:</h4><div className="flex flex-wrap gap-2">{categoryImages.map((url, idx) => (<img key={idx} src={url} alt={`Category ${idx}`} className="w-20 h-20 object-cover rounded" />))}</div></div>)}
              <button type="submit" className="bg-red-600 text-white p-3 rounded text-lg mr-2">{editingCategory ? 'Cập Nhật' : 'Tạo'} Danh Mục</button>
              {editingCategory && (<button type="button" onClick={() => { setEditingCategory(null); setNewCategory({ name: '', description: '', images: [] }); setCategoryImages([]); }} className="bg-gray-600 text-white p-3 rounded text-lg">Hủy</button>)}
            </form>
          </div>

          <h2 className="text-2xl font-bold mb-4 scroll-mt-24 text-red-600">Danh Sách Danh Mục</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{categories.map(cat => (<div key={cat._id} className="bg-white p-4 rounded shadow"><div className="flex items-start gap-3">{cat.images && cat.images.length > 0 && (<img src={cat.images[0]} alt={cat.name} className="w-16 h-16 object-cover rounded" />)}<div className="flex-1"><h3 className="font-semibold text-lg">{cat.name}</h3><p className="text-gray-600 mb-2">{cat.description}</p><div className="flex gap-2"><button onClick={() => editCategory(cat)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Sửa</button><button onClick={() => deleteCategory(cat._id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Xóa</button></div></div></div></div>))}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;
