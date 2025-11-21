import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setMessage('Token không hợp lệ');
      setLoading(false);
      return;
    }

    api.post('/users/verify-email', { token })
      .then(data => {
        setMessage(data.message);
        setTimeout(() => navigate('/login'), 3000);
      })
      .catch(error => {
        setMessage(error.message);
      })
      .finally(() => setLoading(false));
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold text-center mb-4">Xác thực Email</h2>
        {loading ? (
          <p className="text-center">Đang xác thực...</p>
        ) : (
          <p className="text-center">{message}</p>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;