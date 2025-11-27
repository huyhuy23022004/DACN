import { useEffect, useState } from 'react';
import AdminSidebar from '../components/AdminSidebar';
import { api } from '../utils/api';

const AdminNotifications = () => {
  const token = localStorage.getItem('token');
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'info', recipientId: '' });
  const [editModal, setEditModal] = useState({ show: false, notification: null });
  const [editForm, setEditForm] = useState({ title: '', message: '', type: 'info' });

  useEffect(() => {
    const load = async () => {
      try {
        const [notificationsData, usersData] = await Promise.all([
          api.getAllNotifications(token),
          api.get('/admin/users', token)
        ]);
        setNotifications(notificationsData.notifications || []);
        setUsers(usersData);
      } catch (err) { console.error(err); }
    };
    load();
  }, [token]);

  const sendNotification = async (e) => {
    e.preventDefault();
    try {
      if (form.recipientId) {
        await api.sendNotification({ title: form.title, message: form.message, type: form.type, recipientId: form.recipientId }, token);
        alert('Thông báo đã được gửi đến người dùng!');
      } else {
        await api.sendNotificationToAll({ title: form.title, message: form.message, type: form.type }, token);
        alert('Thông báo đã được gửi đến tất cả người dùng!');
      }
      setForm({ title: '', message: '', type: 'info', recipientId: '' });
      setShowForm(false);
      const data = await api.getAllNotifications(token);
      setNotifications(data.notifications || []);
    } catch (error) { alert('Lỗi gửi thông báo: ' + (error.message || error)); }
  };

  const deleteNotification = async (id) => {
    if (!confirm('Bạn có chắc muốn xóa thông báo này?')) return;
    try {
      await api.deleteNotification(id, token);
      setNotifications(notifications.filter(n => n._id !== id));
      alert('Thông báo đã được xóa!');
    } catch (error) { alert('Lỗi xóa thông báo: ' + (error.message || error)); }
  };

  const openEditNotification = (notification) => { setEditModal({ show: true, notification }); setEditForm({ title: notification.title || '', message: notification.message || '', type: notification.type || 'info' }); };
  const closeEditNotification = () => { setEditModal({ show: false, notification: null }); setEditForm({ title: '', message: '', type: 'info' }); };
  const submitEditNotification = async (e) => {
    e.preventDefault();
    try {
      const updated = await api.updateNotification(editModal.notification._id, editForm, token);
      setNotifications(notifications.map(n => n._id === updated._id ? updated : n));
      alert('Thông báo đã được cập nhật!');
      closeEditNotification();
    } catch (error) { alert('Lỗi khi cập nhật thông báo: ' + (error.message || error)); }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="ml-64 w-full">
        <div className="container mx-auto p-8 bg-red-50 min-h-screen">
          <h1 className="text-4xl font-bold mb-8 text-red-600">Quản Lý Thông Báo</h1>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded mb-4">{showForm ? 'Ẩn Form' : 'Gửi Thông Báo Mới'}</button>
          {showForm && (
            <form onSubmit={sendNotification} className="bg-white p-4 rounded shadow mb-4">
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Tiêu đề thông báo" className="w-full p-2 border mb-2" required />
              <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Nội dung" className="w-full p-2 border mb-2" rows="3" required />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full p-2 border mb-2">
                <option value="info">Thông tin</option>
                <option value="warning">Cảnh báo</option>
                <option value="success">Thành công</option>
                <option value="error">Lỗi</option>
              </select>
              <select value={form.recipientId} onChange={(e) => setForm({ ...form, recipientId: e.target.value })} className="w-full p-2 border mb-2">
                <option value="">Gửi đến tất cả người dùng</option>
                {(users || []).map(u => (<option key={u._id} value={u._id}>{u.username} ({u.email}) - {u.role}</option>))}
              </select>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Gửi Thông Báo</button>
            </form>
          )}

          <div className="bg-white p-4 rounded shadow">
            <h3 className="text-lg font-semibold mb-4">Danh Sách Thông Báo</h3>
            {notifications.length === 0 ? <p className="text-gray-500">Chưa có thông báo nào</p> : (notifications || []).map(notification => (
              <div key={notification._id} className="border-b border-gray-200 pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-semibold">{notification.title}</h4>
                    <p className="text-gray-600 mt-1">{notification.message}</p>
                    <div className="text-sm text-gray-500 mt-2">
                      <span>Người nhận: {notification.recipient?.username || 'Tất cả'}</span>
                      <span className="ml-4">Loại: {notification.type}</span>
                      <span className="ml-4">Ngày: {new Date(notification.createdAt).toLocaleString()}</span>
                      {notification.editedAt && (<span className="ml-4">Sửa bởi: {notification.editedBy?.username || 'N/A'} lúc {new Date(notification.editedAt).toLocaleString()}</span>)}
                    </div>
                  </div>
                  <div className="flex gap-2 items-start">
                    <button onClick={() => openEditNotification(notification)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Sửa</button>
                    <button onClick={() => deleteNotification(notification._id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm ml-4">Xóa</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {editModal.show && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded shadow-lg w-96">
                <h3 className="text-lg font-bold mb-4">Sửa Thông Báo</h3>
                <form onSubmit={submitEditNotification}>
                  <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Tiêu đề" className="w-full p-2 border mb-2" required />
                  <textarea value={editForm.message} onChange={(e) => setEditForm({ ...editForm, message: e.target.value })} placeholder="Nội dung" className="w-full p-2 border mb-2" rows="3" required />
                  <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} className="w-full p-2 border mb-2">
                    <option value="info">Thông tin</option>
                    <option value="warning">Cảnh báo</option>
                    <option value="success">Thành công</option>
                    <option value="error">Lỗi</option>
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Cập Nhật</button>
                    <button type="button" onClick={closeEditNotification} className="bg-gray-600 text-white px-4 py-2 rounded">Hủy</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNotifications;
