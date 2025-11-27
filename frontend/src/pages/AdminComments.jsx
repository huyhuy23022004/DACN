import { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { api } from '../utils/api';

const AdminComments = () => {
  const [comments, setComments] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => { const load = async () => { try { const data = await api.get('/admin/comments', token); setComments(data); } catch (err) { console.error(err); } }; load(); }, [token]);

  const deleteComment = async (id) => { if (confirm('Bạn có chắc muốn xóa bình luận này?')) { await api.delete(`/admin/comments/${id}`, token); setComments(comments.filter(c => c._id !== id)); alert('Bình luận đã được xóa!'); } };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="ml-64 w-full">
        <div className="container mx-auto p-8 bg-red-50 min-h-screen">
          <h1 className="text-4xl font-bold mb-8 text-red-600">Quản Lý Bình Luận</h1>
          <div className="grid grid-cols-1 gap-4">{(comments || []).map(c => (<div key={c._id} className="bg-white p-4 rounded shadow"><p className="font-semibold">{c.content}</p><p className="text-sm text-gray-600 mt-1">Tin tức: <span className="font-medium">{c.news?.title || 'N/A'}</span></p><p className="text-sm text-gray-500 mt-1">Đăng bởi: <span className="font-medium">{c.author?.username || 'N/A'}</span></p><div className="flex gap-2 mt-2"><button onClick={() => deleteComment(c._id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Xóa</button></div></div>))}</div>
        </div>
      </div>
    </div>
  );
};

export default AdminComments;
