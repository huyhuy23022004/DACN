import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import NewsCard from '../components/NewsCard';
import YouTubeEmbed from '../components/YouTubeEmbed';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { CircleArrowLeft, CircleArrowRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

// Custom arrow components (refined visuals + accessibility)
const NextArrow = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      aria-label="Next slide"
  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white w-12 h-12 rounded-full flex items-center justify-center bg-transparent hover:bg-green-600 hover:text-white hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-300 z-50"
    >
      <CircleArrowRight size={20} />
    </button>
  );
};

const PrevArrow = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      aria-label="Previous slide"
  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white w-12 h-12 rounded-full flex items-center justify-center bg-transparent hover:bg-green-600 hover:text-white hover:shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-300 z-50"
    >
      <CircleArrowLeft size={20} />
    </button>
  );
};

const Home = () => {
  const { theme } = useTheme();
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newsByCategory, setNewsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState({ content: '', location: '', email: '' });
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (searchQuery) {
          // For search, just fetch news
          const endpoint = `/news?search=${encodeURIComponent(searchQuery)}`;
          const data = await api.get(endpoint);
          setNews(data.news || []);
          setCategories([]);
          setNewsByCategory({});
        } else {
          // For home page, fetch categories and news by category
          const [categoriesData, newsData] = await Promise.all([
            api.get('/categories'),
            api.get('/news?limit=50') // Get more news for categories
          ]);
          
          setCategories(categoriesData || []);
          setNews(newsData.news || []);
          
          // Group news by category
          const grouped = {};
          (newsData.news || []).forEach(item => {
            const categoryId = item.category?._id;
            if (categoryId) {
              if (!grouped[categoryId]) {
                grouped[categoryId] = {
                  category: item.category,
                  news: []
                };
              }
              grouped[categoryId].news.push(item);
            }
          });
          setNewsByCategory(grouped);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setNews([]);
        setCategories([]);
        setNewsByCategory({});
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [searchQuery]);

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setFeedbackLoading(true);
    try {
      await api.post('/feedback', feedback);
      alert('Phản hồi đã được gửi thành công!');
      setFeedback({ content: '', location: '', email: '' });
      setShowFeedbackModal(false);
    } catch (error) {
      console.error('Lỗi gửi phản hồi:', error);
      alert('Có lỗi xảy ra khi gửi phản hồi. Vui lòng thử lại.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 10000, // 10 seconds
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    adaptiveHeight: true
  };

  if (loading) return <p className="text-center p-4">Đang tải...</p>;

  return (
    <div className="container mx-auto p-8 bg-white min-h-screen">
      <h1 className="text-4xl font-bold mb-8">
        {searchQuery ? `Kết quả tìm kiếm cho "${searchQuery}"` : 'Tin Tức Mới Nhất'}
      </h1>
      
      {/* Carousel Section */}
      {news.length > 0 && (
        <div className="mb-12 carousel-container">
          <h2 className="text-2xl font-semibold mb-4">Tin Nổi Bật</h2>
          <Slider {...sliderSettings}>
            {news.slice(0, 5).map(item => ( // Show first 5 news in carousel
              <div key={item._id} className="px-2">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  {item.videoUrl ? (
                    <YouTubeEmbed videoUrl={item.videoUrl} title={item.title} className="w-full h-64 object-cover" />
                  ) : (
                    <img src={item.images && item.images[0] ? item.images[0] : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5L1MgSW1hZ2U8L3RleHQ+PC9zdmc+'} alt={item.title} className="w-full h-64 object-cover" />
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="text-gray-600 mb-4">{item.summary}</p>
                    <a href={`/news/${item._id}`} className="text-blue-600 hover:underline">Đọc thêm</a>
                  </div>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      )}

      {/* Categories Section */}
      {!searchQuery && Object.keys(newsByCategory).length > 0 ? (
        <div className="space-y-12">
          {categories.map(category => {
            const categoryData = newsByCategory[category._id];
            if (!categoryData || categoryData.news.length === 0) return null;
            
            return (
              <div key={category._id} className="category-section">
                <h2 className="text-3xl font-bold mb-6 text-green-600 border-b-2 border-green-200 pb-2">
                  {category.name}
                </h2>
                
                {/* Category Carousel */}
                <div className="mb-8 carousel-container">
                  <Slider {...sliderSettings}>
                    {categoryData.news.slice(0, 5).map(item => (
                      <div key={item._id} className="px-2">
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                          {item.videoUrl ? (
                            <YouTubeEmbed videoUrl={item.videoUrl} title={item.title} className="w-full h-64 object-cover" />
                          ) : (
                            <img src={item.images && item.images[0] ? item.images[0] : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5L1MgSW1hZ2U8L3RleHQ+PC9zdmc+'} alt={item.title} className="w-full h-64 object-cover" />
                          )}
                          <div className="p-6">
                            <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                            <p className="text-gray-600 mb-4">{item.summary}</p>
                            <a href={`/news/${item._id}`} className="text-blue-600 hover:underline">Đọc thêm</a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </Slider>
                </div>
                
                {/* Featured News - Large */}
                {categoryData.news.length > 0 && (
                  <div className="mb-8">
                    <div className={`bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow border ${theme === 'dark' ? 'border-green-800' : 'border-gray-200'}`}>
                      <div className="md:flex">
                        <div className="md:w-1/2">
                          {categoryData.news[0].videoUrl ? (
                            <YouTubeEmbed videoUrl={categoryData.news[0].videoUrl} title={categoryData.news[0].title} className="w-full h-64 md:h-80 object-cover" />
                          ) : (
                            <img 
                              src={categoryData.news[0].images && categoryData.news[0].images[0] ? categoryData.news[0].images[0] : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5L1MgSW1hZ2U8L3RleHQ+PC9zdmc+'} 
                              alt={categoryData.news[0].title} 
                              className="w-full h-64 md:h-80 object-cover" 
                            />
                          )}
                        </div>
                        <div className="md:w-1/2 p-6 flex flex-col justify-center">
                          <h3 className="text-2xl font-bold mb-3 text-gray-800">{categoryData.news[0].title}</h3>
                          <p className="text-gray-600 mb-4 text-lg leading-relaxed">{categoryData.news[0].summary}</p>
                          <a 
                            href={`/news/${categoryData.news[0]._id}`} 
                            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 hover:shadow-lg hover:scale-105 hover:-translate-y-1 transition-all duration-300 font-semibold text-lg transform"
                          >
                            Đọc thêm
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Other News - Small Grid */}
                {categoryData.news.length > 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryData.news.slice(1).map(item => <NewsCard key={item._id} news={item} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : searchQuery && news.length === 0 ? (
        <p>Không tìm thấy tin tức nào cho &quot;{searchQuery}&quot;.</p>
      ) : searchQuery ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map(item => <NewsCard key={item._id} news={item} />)}
        </div>
      ) : (
        <p>Không có tin tức nào.</p>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 p-3 rounded-full text-white shadow-xl transform transition-transform duration-200 ease-out hover:scale-150 active:scale-100 animate-float z-50"
          style={{ background: 'linear-gradient(90deg,#10B981,#059669)' }}
          aria-label="Scroll to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {/* Feedback Chat Bubble */}
      <button
        onClick={() => setShowFeedbackModal(true)}
        className="fixed bottom-24 right-8 p-3 rounded-full text-white shadow-xl transform transition-transform duration-200 ease-out hover:scale-150 active:scale-100 animate-float z-50"
        style={{ background: 'linear-gradient(90deg,#3B82F6,#1D4ED8)' }}
        aria-label="Gửi phản hồi"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-2xl font-bold mb-4">Gửi Phản Hồi</h2>
            <form onSubmit={handleSubmitFeedback}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Nội dung phản hồi</label>
                <textarea
                  value={feedback.content}
                  onChange={(e) => setFeedback({ ...feedback, content: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Nơi ở</label>
                <input
                  type="text"
                  value={feedback.location}
                  onChange={(e) => setFeedback({ ...feedback, location: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={feedback.email}
                  onChange={(e) => setFeedback({ ...feedback, email: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={feedbackLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {feedbackLoading ? 'Đang gửi...' : 'Gửi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;