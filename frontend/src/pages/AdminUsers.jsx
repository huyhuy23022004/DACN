import { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { api } from '../utils/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [banModal, setBanModal] = useState({ show: false, user: null });
  const [banData, setBanData] = useState({ reason: '', duration: '1d' });
  const token = localStorage.getItem('token');

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await api.get('/admin/users', token);
        setUsers(data);
      } catch (err) {
        console.error('Error loading users', err);
      }
    };
    loadUsers();
  }, [token]);

  const updateUserRole = async (userId, newRole) => {
    await api.put(`/admin/users/${userId}/role`, { role: newRole }, token);
    setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
  };

  const openBanModal = (user) => {
    setBanModal({ show: true, user });
    setBanData({ reason: '', duration: '1d' });
  };
  const closeBanModal = () => setBanModal({ show: false, user: null });
  const calculateBanExpiry = (duration) => {
    const now = new Date();
    switch (duration) {
      case '1d': return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case '1w': return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case '1m': return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      default: return null;
    }
  };

  const formatRemainingTime = (expiry) => {
    if (!expiry) return 'Vĩnh viễn';
    const diffMs = new Date(expiry) - new Date();
    if (diffMs <= 0) return 'Đã hết hạn';
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
    let parts = [];
    if (days > 0) parts.push(`${days} ngày`);
    if (hours > 0) parts.push(`${hours} giờ`);
    if (minutes > 0) parts.push(`${minutes} phút`);
    return `${parts.join(' ')} còn lại`;
  };

  const banUser = async () => {
    if (!banData.reason.trim()) {
      alert('Vui lòng nhập lý do ban!');
      return;
    }
    try {
      await api.put(`/admin/users/${banModal.user._id}/ban`, banData, token);
      setUsers(users.map(u => u._id === banModal.user._id ? ({
        ...u,
        isBanned: true,
        banReason: banData.reason,
        banExpiresAt: banData.duration === 'permanent' ? null : calculateBanExpiry(banData.duration),
        banDate: new Date()
      }) : u));
      closeBanModal();
      alert('Đã ban user thành công!');
    } catch (error) { alert('Lỗi khi ban user: ' + error.message); }
  };

  const unbanUser = async (userId) => {
    if (confirm('Bạn có chắc muốn unban user này?')) {
      try {
        await api.put(`/admin/users/${userId}/unban`, {}, token);
        setUsers(users.map(u => u._id === userId ? ({ ...u, isBanned: false, banReason: null, banExpiresAt: null, banDate: null }) : u));
        alert('Đã unban user thành công!');
      } catch (error) { alert('Lỗi khi unban user: ' + error.message); }
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Bạn có chắc muốn xóa người dùng này? Hành động này không thể hoàn tác.')) return;
    try {
      await api.delete(`/admin/users/${userId}`, token);
      setUsers(users.filter(u => u._id !== userId));
      alert('Người dùng đã được xóa');
    } catch (err) { alert('Lỗi khi xóa người dùng: ' + (err.data?.error || err.message)); }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="ml-64 w-full">
        <div className="container mx-auto p-8 bg-red-50 min-h-screen">
          <h1 className="text-4xl font-bold mb-8 text-red-600">Quản Lý Người Dùng</h1>
          <div className="grid grid-cols-1 gap-4">
            {users.map(user => (
              <div key={user._id} className="bg-white p-4 rounded shadow">
                <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold">{user.username}</h3>
                      <p className="text-gray-600">{user.email}</p>
                      <p className="text-sm text-gray-500">Role: <span className="capitalize">{user.role}</span></p>
                      {user.isBanned && (
                        <div>
                          <p className="text-sm text-red-600 mb-1">Bị ban: {user.banReason || 'Không có lý do'}</p>
                          <p className="text-sm text-red-500">
                            {user.banDate ? `Bắt đầu: ${new Date(user.banDate).toLocaleString()}` : ''}
                            {user.banDate && user.banExpiresAt ? ' • ' : ''}
                            {user.banExpiresAt ? `Hết hạn: ${new Date(user.banExpiresAt).toLocaleString()} (${formatRemainingTime(user.banExpiresAt)})` : 'Vĩnh viễn'}
                          </p>
                        </div>
                      )}
                    </div>
                  <div className="flex gap-2">
                    <select value={user.role} onChange={(e) => updateUserRole(user._id, e.target.value)} className="p-1 border rounded text-sm">
                      <option value="user">User</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                    {user.isBanned ? (
                      <button onClick={() => unbanUser(user._id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Unban</button>
                    ) : (
                      <button onClick={() => openBanModal(user)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Ban</button>
                    )}
                    {/* Delete button - show only for non-admin users and not for current user */}
                    {user.role !== 'admin' && (
                      <button onClick={() => deleteUser(user._id)} className="bg-red-800 text-white px-3 py-1 rounded text-sm">Xóa</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {banModal.show && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg w-96">
                <h3 className="text-lg font-bold mb-4">Ban User: {banModal.user?.username}</h3>
                <textarea placeholder="Lý do ban" value={banData.reason} onChange={(e) => setBanData({ ...banData, reason: e.target.value })} className="w-full p-2 border mb-4" rows="3" required />
                <select value={banData.duration} onChange={(e) => setBanData({ ...banData, duration: e.target.value })} className="w-full p-2 border mb-4">
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

export default AdminUsers;
