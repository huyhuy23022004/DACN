import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const Categories = lazy(() => import('./pages/Categories'));
const CategoryNews = lazy(() => import('./pages/CategoryNews'));
const NewsDetail = lazy(() => import('./pages/NewsDetail'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const EditorDashboard = lazy(() => import('./pages/EditorDashboard'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

function AppContent() {
  const location = useLocation();
  const isAdminOrEditor = location.pathname.startsWith('/admin') || location.pathname.startsWith('/editor');

  return (
    <div className="bg-white min-h-screen" style={{ backgroundColor: 'white', minHeight: '100vh' }}>
      <Header />
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
          <Route path="/editor" element={<ProtectedRoute allowedRoles={['editor']}><EditorDashboard /></ProtectedRoute>} />
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