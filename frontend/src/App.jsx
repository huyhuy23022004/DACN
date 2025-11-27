import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const Categories = lazy(() => import('./pages/Categories'));
const CategoryNews = lazy(() => import('./pages/CategoryNews'));
const NewsDetail = lazy(() => import('./pages/NewsDetail'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboardFixed'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminNews = lazy(() => import('./pages/AdminNews'));
const AdminCategories = lazy(() => import('./pages/AdminCategories'));
const AdminComments = lazy(() => import('./pages/AdminComments'));
const AdminNotifications = lazy(() => import('./pages/AdminNotifications'));
const EditorDashboard = lazy(() => import('./pages/EditorDashboard'));
const EditorNews = lazy(() => import('./pages/EditorNews'));
const EditorCategories = lazy(() => import('./pages/EditorCategories'));
const EditorComments = lazy(() => import('./pages/EditorComments'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

function AppContent() {
  const location = useLocation();
  const isAdminOrEditor = location.pathname.startsWith('/admin') || location.pathname.startsWith('/editor');

  return (
    <div className="bg-white min-h-screen" style={{ backgroundColor: 'white', minHeight: '100vh' }}>
      <Header />
      <ScrollToTop />
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/category/:id" element={<CategoryNews />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/news" element={<ProtectedRoute allowedRoles={['admin']}><AdminNews /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['admin']}><AdminCategories /></ProtectedRoute>} />
          <Route path="/admin/comments" element={<ProtectedRoute allowedRoles={['admin']}><AdminComments /></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={['admin']}><AdminNotifications /></ProtectedRoute>} />
          <Route path="/editor" element={<ProtectedRoute allowedRoles={['editor']}><EditorDashboard /></ProtectedRoute>} />
          <Route path="/editor/news" element={<ProtectedRoute allowedRoles={['editor']}><EditorNews /></ProtectedRoute>} />
          <Route path="/editor/categories" element={<ProtectedRoute allowedRoles={['editor']}><EditorCategories /></ProtectedRoute>} />
          <Route path="/editor/comments" element={<ProtectedRoute allowedRoles={['editor']}><EditorComments /></ProtectedRoute>} />
        </Routes>
      </Suspense>
      {!isAdminOrEditor && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;