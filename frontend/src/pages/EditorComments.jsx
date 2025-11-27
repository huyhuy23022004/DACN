import { useEffect, useState } from 'react';
import EditorSidebar from '../components/EditorSidebar';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

const EditorComments = () => {
  const [comments, setComments] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get('/admin/comments', token);
        setComments(data);
      } catch (err) { console.error(err); }
    };
    load();
    window.scrollTo(0, 0);
  }, [token]);

  const deleteComment = async (id) => { if (confirm('Bạn có chắc muốn xóa bình luận này?')) { await api.delete(`/editor/comments/${id}`, token); setComments(comments.filter(c => c._id !== id)); alert('Đã xóa bình luận'); } };

  return (
    <div className="flex">
      <EditorSidebar />
      <div className="ml-64 w-full">
        <div className="container mx-auto p-8 bg-red-50 min-h-screen">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-4xl font-bold text-red-600">Quản Lý Bình Luận (Editor)</h1>
            <Link to="/editor" className="text-sm text-blue-600 underline">Quay lại bảng điều khiển</Link>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {comments.map(item => (
              <div key={item._id} className="bg-white p-4 rounded shadow">
                <p className="font-semibold">{item.content}</p>
                <p className="text-sm text-gray-600 mt-1">Tin tức: <span className="font-medium">{item.news?.title || 'N/A'}</span></p>
                <p className="text-sm text-gray-500 mt-1">Đăng bởi: <span className="font-medium">{item.author?.username || 'N/A'}</span></p>
                <div className="flex gap-2 mt-2"><button onClick={() => deleteComment(item._id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Xóa</button></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorComments;
