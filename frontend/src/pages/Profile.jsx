import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [likedNews, setLikedNews] = useState([]);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ username: '', email: '' });
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      api.get('/users/profile', token).then(data => {
        setUser(data);
        setProfileForm({ username: data.username, email: data.email });
      });
      api.get('/users/comments', token).then(setComments);
      api.getUserLikedNews(token).then(setLikedNews).catch(error => {
        console.error('Error fetching liked news:', error);
        setLikedNews([]); // Set empty array on error
      });
    }
  }, [token]);

  const handleEdit = (comment) => {
    setEditingComment(comment._id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/comments/${editingComment}`, { content: editContent }, token);
      setComments(comments.map(c => c._id === editingComment ? { ...c, content: editContent } : c));
      setEditingComment(null);
      setEditContent('');
    } catch (error) {
      alert('Lỗi khi cập nhật bình luận');
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const confirmDelete = async () => {
    if (!commentToDelete) return;
    try {
      await api.delete(`/comments/${commentToDelete}`, token);
      setComments(comments.filter(c => c._id !== commentToDelete));
      setShowDeleteConfirm(false);
      setCommentToDelete(null);
    } catch (error) {
      alert('Lỗi khi xóa bình luận');
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setCommentToDelete(null);
  };

  const handleDelete = (commentId) => {
    setCommentToDelete(commentId);
    setShowDeleteConfirm(true);
  };

  const handleEditProfile = () => {
    setEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      let avatarUrl = user.avatar;

      if (selectedAvatar) {
        // Upload avatar
        const formData = new FormData();
        formData.append('image', selectedAvatar);

        console.log('Uploading avatar...');
        const uploadRes = await fetch(`${API_BASE}/news/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });

        if (uploadRes.status === 400 || uploadRes.status === 401 || uploadRes.status === 403) {
          // Token invalid
          localStorage.removeItem('token');
          localStorage.removeItem('role');
          window.dispatchEvent(new Event('authChange'));
          window.location.href = '/login';
          return;
        }

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          avatarUrl = uploadData.imageUrl;
          console.log('Upload success:', avatarUrl);
        } else {
          console.error('Upload failed:', uploadRes.status);
          throw new Error('Upload avatar thất bại');
        }
      }

      const updateData = { ...profileForm };
      if (selectedAvatar) {
        updateData.avatar = avatarUrl;
      }

      console.log('Updating profile:', updateData);
      const updatedUser = await api.put('/users/profile', updateData, token);
      console.log('Profile updated:', updatedUser);
      setUser(updatedUser);
      // Update localStorage with new username
      localStorage.setItem('username', updatedUser.username);
      // Trigger profile update event for Header
      window.dispatchEvent(new Event('profileUpdate'));
      setSelectedAvatar(null);
      setAvatarPreview('');
      setEditingProfile(false);
    } catch (error) {
      console.error('Error:', error);
      alert('Lỗi khi cập nhật hồ sơ');
    }
  };

  const handleCancelProfile = () => {
    setProfileForm({ username: user.username, email: user.email });
    setSelectedAvatar(null);
    setAvatarPreview('');
    setEditingProfile(false);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedAvatar(file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      await api.put('/users/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, token);
      alert('Đổi mật khẩu thành công');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangingPassword(false);
    } catch (error) {
      alert('Lỗi khi đổi mật khẩu: ' + (error.message || 'Có lỗi xảy ra'));
    }
  };

  const handleCancelPasswordChange = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setChangingPassword(false);
  };

  if (!token) return <p>Vui lòng đăng nhập để xem hồ sơ.</p>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Hồ Sơ</h1>
      {user && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Thông Tin Người Dùng</h2>
          {editingProfile ? (
            <div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Ảnh Đại Diện</label>
                <div className="flex items-center gap-4">
                  <img
                    src={avatarPreview || user.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBBdmF0YXI8L3RleHQ+PC9zdmc+'}
                    alt="Avatar preview"
                    className="w-20 h-20 rounded-full object-cover border"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="border rounded p-2"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Tên Người Dùng</label>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <button onClick={handleSaveProfile} className="bg-blue-500 text-white px-3 py-1 rounded mr-2">Lưu</button>
                <button onClick={handleCancelProfile} className="bg-gray-500 text-white px-3 py-1 rounded">Hủy</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={user.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBBdmF0YXI8L3RleHQ+PC9zdmc+'}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border"
                />
                <div>
                  <p className="font-semibold">{user.username}</p>
                  <p className="text-gray-600">{user.email}</p>
                  <p className="text-gray-600">Vai Trò: {user.role}</p>
                </div>
              </div>
              <button onClick={handleEditProfile} className="bg-green-500 text-white px-3 py-1 rounded">Chỉnh Sửa Hồ Sơ</button>
            </div>
          )}
        </div>
      )}
      {user && (
        <div className="bg-white p-4 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Đổi Mật Khẩu</h2>
          {changingPassword ? (
            <div>
              <div className="mb-4">
                <label className="block text-gray-700">Mật Khẩu Hiện Tại</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Mật Khẩu Mới</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Xác Nhận Mật Khẩu Mới</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <button onClick={handleChangePassword} className="bg-blue-500 text-white px-3 py-1 rounded mr-2">Đổi Mật Khẩu</button>
                <button onClick={handleCancelPasswordChange} className="bg-gray-500 text-white px-3 py-1 rounded">Hủy</button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 mb-4">Đổi mật khẩu để bảo mật tài khoản của bạn.</p>
              <button onClick={() => setChangingPassword(true)} className="bg-orange-500 text-white px-3 py-1 rounded">Đổi Mật Khẩu</button>
            </div>
          )}
        </div>
      )}
      <h2 className="text-2xl font-bold mb-4">Bình Luận Của Tôi</h2>
      {comments.map(comment => (
        <div key={comment._id} className="bg-gray-100 p-4 rounded mb-2">
          {editingComment === comment._id ? (
            <div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border rounded mb-2"
                rows="3"
              />
              <button onClick={handleSaveEdit} className="bg-blue-500 text-white px-3 py-1 rounded mr-2">Lưu</button>
              <button onClick={handleCancelEdit} className="bg-gray-500 text-white px-3 py-1 rounded">Hủy</button>
            </div>
          ) : (
            <div>
              <p>{comment.content}</p>
              <small className="text-gray-500">Trên tin tức: {comment.news.title}</small>
              <div className="mt-2">
                <button onClick={() => handleEdit(comment)} className="bg-yellow-500 text-white px-3 py-1 rounded mr-2">Sửa</button>
                <button onClick={() => handleDelete(comment._id)} className="bg-red-500 text-white px-3 py-1 rounded">Xóa</button>
              </div>
            </div>
          )}
        </div>
      ))}
      
      <h2 className="text-2xl font-bold mb-4 mt-8">Tin Tức Yêu Thích</h2>
      {likedNews.length === 0 ? (
        <p className="text-gray-600">Bạn chưa thích tin tức nào.</p>
      ) : (
        likedNews.map(news => (
          <div key={news._id} className="bg-white p-4 rounded shadow mb-4 border">
            <h3 className="text-lg font-semibold mb-2">
              <Link to={`/news/${news._id}`} className="text-blue-600 hover:underline">
                {news.title}
              </Link>
            </h3>
            {news.summary && (
              <p className="text-gray-600 mb-2">{news.summary}</p>
            )}
            <div className="text-sm text-gray-500">
              <span>Tác giả: {news.author?.username || 'N/A'}</span>
              {news.category && <span> | Danh mục: {news.category.name}</span>}
              <span> | {new Date(news.createdAt).toLocaleDateString()}</span>
              <span> | {news.likes?.length || 0} thích</span>
            </div>
          </div>
        ))
      )}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">Bạn có chắc muốn xóa bình luận này? Hành động này không thể hoàn tác.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
              >
                Hủy
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;