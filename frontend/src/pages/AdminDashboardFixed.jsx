import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';
import AdminSidebar from '../components/AdminSidebar';

// Dashboard intentionally kept lightweight; detailed tools are on dedicated pages

const AdminDashboardFixed = () => {
  const [stats, setStats] = useState({});
  const token = localStorage.getItem('token');

  useEffect(() => {
    const loadData = async () => {
      try {
        const statsData = await api.get('/admin/stats', token);
        setStats(statsData);
      } catch (err) {
        console.error('Error loading admin dashboard data', err);
      }
    };
    loadData();
  }, [token]);

  // Only show summary; details are available on dedicated routes (/admin/users, /admin/news, /admin/categories, etc.)

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="ml-64 w-full">
        <div className="container mx-auto p-8 bg-red-50 min-h-screen">
          <h1 className="text-3xl font-bold mb-4 text-red-600">Admin Dashboard</h1>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-red-100 p-4 rounded">Tổng Người Dùng: {stats.users}</div>
            <div className="bg-red-100 p-4 rounded">Tổng Tin Tức: {stats.news}</div>
            <div className="bg-red-100 p-4 rounded">Tổng Bình Luận: {stats.comments}</div>
            <div className="bg-red-100 p-4 rounded">Tổng Danh Mục: {stats.categories}</div>
            <div className="bg-red-100 p-4 rounded">Tổng Lượt Xem: {stats.views}</div>
          </div>

          {/* Quick links to specific admin pages */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Quản lý nhanh</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link to="/admin/users" className="bg-white rounded p-4 shadow hover:shadow-md flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Người dùng</h3>
                  <p className="text-sm text-gray-600">Quản lý người dùng</p>
                </div>
                <div className="text-red-600 font-bold">{stats.users ?? '-'}</div>
              </Link>
              <Link to="/admin/news" className="bg-white rounded p-4 shadow hover:shadow-md flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Tin tức</h3>
                  <p className="text-sm text-gray-600">Quản lý bài viết</p>
                </div>
                <div className="text-red-600 font-bold">{stats.news ?? '-'}</div>
              </Link>
              <Link to="/admin/categories" className="bg-white rounded p-4 shadow hover:shadow-md flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Danh mục</h3>
                  <p className="text-sm text-gray-600">Quản lý danh mục</p>
                </div>
                <div className="text-red-600 font-bold">{stats.categories ?? '-'}</div>
              </Link>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboardFixed;
