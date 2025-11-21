import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [banInfo, setBanInfo] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/users/login', form);
      if (res.token) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('role', res.user.role);
        // Dispatch custom event to update Header
        window.dispatchEvent(new Event('authChange'));
        if (res.user.role === 'admin') {
          navigate('/admin');
        } else if (res.user.role === 'editor') {
          navigate('/editor');
        } else {
          navigate('/');
        }
      } else {
        setError(res.error || 'Đăng nhập thất bại');
      }
    } catch (error) {
      // Reset previous ban info
      setBanInfo(null);
      // If the API attached parsed error data, show more helpful messages
      if (error && error.data) {
        const data = error.data;
        // If requires verification
        if (data.requiresVerification) {
          setError(data.error || 'Email chưa được xác thực. Vui lòng kiểm tra email và xác nhận tài khoản.');
          return;
        }
        // If user is banned and server provided reason/expiry
        if (data.reason || data.banExpiresAt || data.expiresAt) {
          const reason = data.reason || '';
          const rawExpiry = data.banExpiresAt || data.expiresAt || null;
          const expires = rawExpiry ? new Date(rawExpiry).toLocaleString() : 'vĩnh viễn';
          setBanInfo({ reason, expires });
          setError('');
          return;
        }
        // fallback to server message
        setError(data.error || 'Thông tin đăng nhập không hợp lệ');
      } else {
        setError('Thông tin đăng nhập không hợp lệ');
      }
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-5xl bg-slate-900/60 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row backdrop-blur">

        {/* Left Panel */}
        <div className="md:w-1/2 p-10 bg-linear-to-br from-sky-500/20 via-emerald-400/10 to-indigo-500/30 flex flex-col justify-between">
          <div>
            <p className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-black/30 text-sky-300 border border-sky-500/30">
              ✈️ Travel News Portal
            </p>
            <h1 className="mt-6 text-3xl md:text-4xl font-bold text-white">Khám phá tin tức du lịch</h1>
            <p className="mt-3 text-sm text-slate-100/80">
              Cập nhật điểm đến mới, kinh nghiệm du lịch và ưu đãi hấp dẫn.
            </p>
          </div>
          <div className="mt-8 text-xs text-slate-200/70 space-y-2">
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Lưu bài viết yêu thích</div>
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span> Gợi ý địa điểm theo bản đồ</div>
            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Nhận email tin mới</div>
          </div>
        </div>

        {/* Right Panel (Login Form) */}
        <div className="md:w-1/2 p-10 bg-slate-950">
          <h2 className="text-white text-2xl font-semibold mb-6">Đăng nhập</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {banInfo ? (
              <div className="bg-red-900 text-red-100 p-4 rounded-md mb-4 border border-red-700">
                <h3 className="font-semibold">Tài khoản đã bị cấm</h3>
                {banInfo.reason && <p className="mt-2">Lý do: {banInfo.reason}</p>}
                <p className="mt-1 text-sm">Hết hạn: {banInfo.expires}</p>
              </div>
            ) : (
              error && <p className="text-red-500 mb-4">{error}</p>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-200">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 pr-10 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="w-full mt-2 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold shadow-lg shadow-sky-500/30 transition-all">
              Đăng nhập
            </button>
          </form>
          <p className="mt-4 text-center text-slate-200">
            Chưa có tài khoản? <Link to="/register" className="text-sky-400 hover:underline">Đăng ký ngay</Link>
          </p>
          <p className="mt-2 text-center text-slate-200">
            <Link to="/forgot-password" className="text-sky-400 hover:underline">Quên mật khẩu?</Link>
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;