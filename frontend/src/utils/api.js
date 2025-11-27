const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Function to handle logout
const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  window.dispatchEvent(new Event('authChange'));
  window.location.href = '/login';
};

export const api = {
  get: (endpoint, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${API_BASE}${endpoint}`, { headers }).then(async res => {
      if (res.status === 401) {
        // Only force logout when a token was provided - avoid logging out on unauthenticated endpoints like /users/login
        if (token) {
          handleLogout();
        }
        throw new Error('Phiên đăng nhập đã hết hạn');
      }
      if (!res.ok) {
        const text = await res.text();
        console.error('Phản hồi lỗi API:', text, 'Trạng thái:', res.status);
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Lỗi phân tích JSON:', e, 'Nội dung phản hồi:', text);
        throw new Error('Invalid JSON response from server');
      }
    });
  },
  post: (endpoint, data, token) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    }).then(async res => {
      if (res.status === 401) {
        // Only force logout when a token was provided - avoid logging out on unauthenticated endpoints like /users/login
        if (token) {
          handleLogout();
        }
        throw new Error('Phiên đăng nhập đã hết hạn');
      }
      if (!res.ok) {
        const text = await res.text();
        console.error('Phản hồi lỗi API:', text);
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch {
          errorData = { error: text || res.statusText };
        }
        const err = new Error(errorData.error || res.statusText);
        // attach parsed server response so callers can inspect reason/expiry/etc
        err.data = errorData;
        err.status = res.status;
        throw err;
      }
      return res.json();
    });
  },
  put: (endpoint, data, token) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    }).then(res => {
      if (res.status === 401) {
        // Only force logout when a token was provided
        if (token) {
          handleLogout();
        }
        throw new Error('Phiên đăng nhập đã hết hạn');
      }
      if (!res.ok) {
        // try to parse body for better error info
        return res.text().then(text => {
          let errorData;
          try { errorData = JSON.parse(text); } catch { errorData = { error: text || res.statusText }; }
          const err = new Error(errorData.error || res.statusText);
          err.data = errorData;
          err.status = res.status;
          throw err;
        });
      }
      return res.json();
    });
  },
  delete: (endpoint, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    return fetch(`${API_BASE}${endpoint}`, { method: 'DELETE', headers }).then(res => {
      if (res.status === 401) {
        // Only force logout when a token was provided
        if (token) {
          handleLogout();
        }
        throw new Error('Phiên đăng nhập đã hết hạn');
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      return res.json();
    });
  },
  likeNews: (newsId, token) => {
    return api.post(`/news/${newsId}/like`, {}, token);
  },
  getUserLikedNews: (token) => {
    return api.get('/users/liked-news', token);
  },
  // Admin notification functions
  sendNotification: (data, token) => {
    return api.post('/admin/notifications', data, token);
  },
  sendNotificationToAll: (data, token) => {
    return api.post('/admin/notifications/broadcast', data, token);
  },
  getAllNotifications: (token) => {
    return api.get('/admin/notifications', token);
  },
  deleteNotification: (id, token) => {
    return api.delete(`/admin/notifications/${id}`, token);
  },
  updateNotification: (id, data, token) => {
    return api.put(`/admin/notifications/${id}`, data, token);
  },
  // User notification functions
  getUserNotifications: (token) => {
    return api.get('/users/notifications', token);
  },
  markNotificationAsRead: (id, token) => {
    return api.put(`/users/notifications/${id}/read`, {}, token);
  },
  markAllNotificationsAsRead: (token) => {
    return api.put('/users/notifications/mark-all-read', {}, token);
  }
};