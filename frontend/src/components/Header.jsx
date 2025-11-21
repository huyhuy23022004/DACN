import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../utils/api';

const Header = () => {
  // small internal toggle button component
  const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    return (
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme"
        title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
        className="px-2 py-1 rounded-md text-white/90 hover:text-white transition flex items-center"
      >
        {theme === 'dark' ? (
          // sun icon for light mode
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m8.66-10h-2M5.34 12H3.34m13.02 6.02l-1.42-1.42M7.1 7.1 5.68 5.68M18.36 5.64l-1.42 1.42M7.1 16.9l-1.42 1.42M12 7a5 5 0 100 10 5 5 0 000-10z" />
          </svg>
        ) : (
          // moon icon for dark mode
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        )}
      </button>
    );
  };
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [blurTimeout, setBlurTimeout] = useState(null);
  const [selectedFromSuggestion, setSelectedFromSuggestion] = useState(false);
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [categories, setCategories] = useState([]);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);
  const [categoriesDropdownTimeout, setCategoriesDropdownTimeout] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const navigate = useNavigate();

  const loadNotifications = useCallback(async () => {
    if (!token) return;
    try {
      let data;
      // All users see only their notifications
      data = await api.getUserNotifications(token);
      console.log('Header: loaded notifications data ->', data);
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, [token]); // Only token in dependency

  useEffect(() => {
    const handleAuthChange = () => {
      setToken(localStorage.getItem('token'));
      setRole(localStorage.getItem('role'));
    };

    const handleProfileUpdate = () => {
      if (token) {
        api.get('/users/profile', token).then(setUser).catch(() => setUser(null));
      }
    };

    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('profileUpdate', handleProfileUpdate);
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('profileUpdate', handleProfileUpdate);
    };
  }, [token]);

  useEffect(() => {
    if (token) {
      api.get('/users/profile', token).then(setUser).catch(() => setUser(null));
      // Load notifications
      loadNotifications();
      // poll for new notifications every 15s
      const poll = setInterval(() => {
        loadNotifications();
      }, 15000);
      return () => clearInterval(poll);
    } else {
      setUser(null);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [token, loadNotifications]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length > 1 && !selectedFromSuggestion) {
        try {
          const data = await api.get(`/news/suggestions?q=${encodeURIComponent(searchQuery)}`);
          setSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        } catch (err) {
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedFromSuggestion]);

  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false);
    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  useEffect(() => {
    // Fetch categories for dropdown
    api.get('/categories').then(data => setCategories(data || [])).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    return () => {
      if (categoriesDropdownTimeout) {
        clearTimeout(categoriesDropdownTimeout);
      }
    };
  }, [categoriesDropdownTimeout]);

  const handleCategoriesMouseEnter = () => {
    if (categoriesDropdownTimeout) {
      clearTimeout(categoriesDropdownTimeout);
      setCategoriesDropdownTimeout(null);
    }
    setShowCategoriesDropdown(true);
  };

  const handleCategoriesMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowCategoriesDropdown(false);
    }, 200); // Delay 200ms
    setCategoriesDropdownTimeout(timeout);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setRole(null);
    window.dispatchEvent(new Event('authChange'));
    window.location.reload();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/');
    }
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion) => {
    if (blurTimeout) clearTimeout(blurTimeout);
    setSearchQuery(suggestion);
    setSelectedFromSuggestion(true);
    setShowSuggestions(false);
    navigate(`/?search=${encodeURIComponent(suggestion)}`);
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await api.markNotificationAsRead(notificationId, token);
      setNotifications(notifications.map(n => 
        n._id === notificationId ? { ...n, isRead: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead(token);
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const openNotificationDetail = (notification) => {
    setSelectedNotification(notification);
    setShowNotificationModal(true);
    setShowNotifications(false);
    // Mark as read when opening detail
    if (!notification.isRead) {
      markNotificationAsRead(notification._id);
    }
  };

  const closeNotificationModal = () => {
    setShowNotificationModal(false);
    setSelectedNotification(null);
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  return (
    <header className="w-full bg-green-600 shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
        {/* Logo + Title */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/assets/HUNRE_Logo.png"
            alt="HCMUNRE"
            className="w-10 h-10 rounded-full bg-white"
          />
          <span className="text-white font-bold text-xl tracking-wide">
            HCMUNRE
          </span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-4 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm tin tức..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedFromSuggestion(false);
              }}
              onFocus={() => {
                if (blurTimeout) clearTimeout(blurTimeout);
                setShowSuggestions(suggestions.length > 0);
              }}
              onBlur={() => {
                const timeout = setTimeout(() => setShowSuggestions(false), 200);
                setBlurTimeout(timeout);
              }}
              className="w-full px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:text-green-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg shadow-lg mt-1 z-20 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </form>

        {/* Menu desktop */}
        <nav className="hidden md:flex items-center gap-3 text-sm font-medium">
          {/* Theme toggle */}
          <ThemeToggle />
          <Link
            to="/"
            className="px-4 py-1.5 rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white hover:text-green-600 transition"
          >
            Trang Chủ
          </Link>
          <div 
            className="relative"
            onMouseEnter={handleCategoriesMouseEnter}
            onMouseLeave={handleCategoriesMouseLeave}
          >
            <Link
              to="/categories"
              className="px-4 py-1.5 rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white hover:text-green-600 transition block"
            >
              Danh Mục
            </Link>
            {showCategoriesDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                <div className="py-1">
                  {categories.map(category => (
                    <Link
                      key={category._id}
                      to={`/category/${category._id}`}
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-100 hover:text-green-600 transition"
                      onClick={() => setShowCategoriesDropdown(false)}
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
          {token && (
            <>
              <Link
                to="/profile"
                className="px-4 py-1.5 rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white hover:text-green-600 transition"
              >
                Hồ Sơ
              </Link>
              {role === 'admin' && (
                <Link
                  to="/admin"
                  className="px-4 py-1.5 rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white hover:text-green-600 transition"
                >
                  Quản Trị
                </Link>
              )}
              {role === 'editor' && (
                <Link
                  to="/editor"
                  className="px-4 py-1.5 rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white hover:text-green-600 transition"
                >
                  Biên Tập
                </Link>
              )}
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white hover:text-green-600 transition-all duration-200 hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 7v5h5l-5 5v-5zM4 12h8m0 0v8m0-8V4" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-lg">
                      <h3 className="font-semibold text-gray-900 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 7v5h5l-5 5v-5zM4 12h8m0 0v8m0-8V4" />
                        </svg>
                        Thông Báo
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllNotificationsAsRead}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Đánh dấu tất cả đã đọc
                        </button>
                      )}
                      <button
                        onClick={loadNotifications}
                        className="ml-3 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Làm mới
                      </button>
                    </div>
                    <div className="py-2 px-2 max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM15 7v5h5l-5 5v-5zM4 12h8m0 0v8m0-8V4" />
                          </svg>
                          <p>Không có thông báo nào</p>
                        </div>
                      ) : (
                        notifications.slice(0, 4).map(notification => (
                          <div
                            key={notification._id}
                            className={`px-3 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                            onClick={() => openNotificationDetail(notification)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-3 h-3 rounded-full mt-1 ${notification.type === 'error' ? 'bg-red-500' : notification.type === 'warning' ? 'bg-yellow-500' : notification.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className={`text-sm font-medium truncate ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>{notification.title}</h4>
                                  <p className="text-xs text-gray-400 ml-2">{new Date(notification.createdAt).toLocaleString('vi-VN')}</p>
                                </div>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                                <p className="text-xs text-blue-600 font-medium mt-2">{notification.createdBy?.role === 'admin' ? 'Admin' : notification.createdBy?.username || 'User'}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 4 && (
                      <div className="px-4 py-2 border-t border-gray-200 text-center">
                        <Link
                          to="/profile"
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          onClick={() => setShowNotifications(false)}
                        >
                          Xem tất cả thông báo
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {user && (
                <div className="relative">
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white hover:text-green-600 transition"
                  >
                    <img
                      src={user.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDMTMuMSAyIDE0IDIuOSAxNCA0QzE0IDUuMSAxMy4xIDYgMTIgNkMxMC45IDYgMTAgNS4xIDEwIDRDMTAgMi45IDEwLjkgMiAxMiAyWk0yMSAxOVYyMEgzVjE5QzMgMTYuMzMgOCAzLjY3IDEyIDMuNjdDMTYgMy42NyAyMSAxNi4zMyAyMSAxOVoiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+'}
                      alt="Avatar"
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <span className="max-w-24 truncate text-sm">
                      {user.username}
                    </span>
                    <svg className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.username}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400 capitalize">{user.role}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        Hồ Sơ
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Đăng Xuất
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {!token && (
            <>
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white hover:text-green-600 transition"
              >
                Đăng Nhập
              </Link>
            </>
          )}
        </nav>

        {/* Mobile menu icon (chưa xử lý click) */}
        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <ThemeToggle />
          </div>
          <button className="md:hidden text-white text-2xl" type="button">
            ☰
          </button>
        </div>
      </div>

      {/* Notification Detail Modal */}
      {showNotificationModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="mr-3">
                    {selectedNotification.type === 'error' && (
                      <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    )}
                    {selectedNotification.type === 'warning' && (
                      <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    )}
                    {selectedNotification.type === 'success' && (
                      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {selectedNotification.type === 'info' && (
                      <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Chi Tiết Thông Báo
                  </h3>
                </div>
                <button
                  onClick={closeNotificationModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">{selectedNotification.title}</h4>
                  <div className="flex items-center">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedNotification.type === 'error' ? 'bg-red-100 text-red-800' :
                      selectedNotification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      selectedNotification.type === 'success' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      <div className="mr-2">
                        {selectedNotification.type === 'error' && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        )}
                        {selectedNotification.type === 'warning' && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                        )}
                        {selectedNotification.type === 'success' && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                        {selectedNotification.type === 'info' && (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        )}
                      </div>
                      {selectedNotification.type === 'error' ? 'Lỗi' :
                       selectedNotification.type === 'warning' ? 'Cảnh báo' :
                       selectedNotification.type === 'success' ? 'Thành công' :
                       'Thông tin'}
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-gray-700 leading-relaxed">{selectedNotification.message}</p>
                </div>

                <div className="text-sm text-gray-500 border-t pt-4">
                  <p><strong>Người gửi:</strong> {selectedNotification.createdBy?.role === 'admin' ? 'Admin' : selectedNotification.createdBy?.username || 'User'}</p>
                  <p><strong>Thời gian:</strong> {new Date(selectedNotification.createdAt).toLocaleString('vi-VN')}</p>
                  <p><strong>Trạng thái:</strong> {selectedNotification.isRead ? 'Đã đọc' : 'Chưa đọc'}</p>
                </div>
              </div>

              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {!selectedNotification.isRead && (
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Chưa đọc
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  {!selectedNotification.isRead && (
                    <button
                      onClick={() => {
                        markNotificationAsRead(selectedNotification._id);
                        closeNotificationModal();
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                  <button
                    onClick={closeNotificationModal}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;