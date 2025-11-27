import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/forgot-password', { email });
      setMessage('Email reset mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.');
      setError('');
    } catch (error) {
      setError(error.data?.error || 'Có lỗi xảy ra');
      setMessage('');
    }
  };

  return (
    <div className="bg-slate-950 min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur">
        <div className="p-10">
          <h2 className="text-white text-2xl font-semibold mb-6 text-center">Quên mật khẩu</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="text-red-500">{error}</p>}
            {message && <p className="text-green-500">{message}</p>}
            <div>
              <label className="block text-sm font-medium text-slate-200">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                required
              />
            </div>
            <button type="submit" className="w-full mt-2 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold shadow-lg shadow-sky-500/30 transition-all">
              Gửi email reset
            </button>
          </form>
          <p className="mt-4 text-center text-slate-200">
            <Link to="/login" className="text-sky-400 hover:underline">Quay lại đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;