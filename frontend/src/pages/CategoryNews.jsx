import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api';
import NewsCard from '../components/NewsCard';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { CircleArrowLeft, CircleArrowRight } from 'lucide-react';

// Custom arrow components
const NextArrow = (props) => {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white text-black w-12 h-12 rounded-full flex items-center justify-center hover:bg-green-600 hover:text-white transition duration-300 z-5"
      style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}
    >
      <CircleArrowRight size={24} />
    </button>
  );
};

const PrevArrow = (props) => {
  const { onClick } = props;
  return (
    <button
      onClick={onClick}
      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white text-black w-12 h-12 rounded-full flex items-center justify-center hover:bg-green-600 hover:text-white transition duration-300 z-5"
      style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}
    >
      <CircleArrowLeft size={24} />
    </button>
  );
};

const CategoryNews = () => {
  const { id } = useParams();
  const [news, setNews] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const categoryData = await api.get(`/categories/${id}`);
        const newsData = await api.get(`/news?category=${id}`);
        setCategory(categoryData);
        setNews(newsData.news || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

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
      <h1 className="text-4xl font-bold mb-8">Tin Tức Trong {category?.name}</h1>
      
      {/* Carousel Section */}
      {news.length > 0 && (
        <div className="mb-12 carousel-container">
          <h2 className="text-2xl font-semibold mb-4">Tin Nổi Bật</h2>
          <Slider {...sliderSettings}>
            {news.slice(0, 5).map(item => (
              <div key={item._id} className="px-2">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <img src={item.images && item.images[0] ? item.images[0] : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5L1MgSW1hZ2U8L3RleHQ+PC9zdmc+'} alt={item.title} className="w-full h-64 object-cover" />
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
      
      {/* Featured News - Large */}
      {news.length > 0 && (
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="md:flex">
              <div className="md:w-1/2">
                <img 
                  src={news[0].images && news[0].images[0] ? news[0].images[0] : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5L1MgSW1hZ2U8L3RleHQ+PC9zdmc+'} 
                  alt={news[0].title} 
                  className="w-full h-64 md:h-80 object-cover" 
                />
              </div>
              <div className="md:w-1/2 p-6 flex flex-col justify-center">
                <h3 className="text-2xl font-bold mb-3 text-gray-800">{news[0].title}</h3>
                <p className="text-gray-600 mb-4 text-lg leading-relaxed">{news[0].summary}</p>
                <a 
                  href={`/news/${news[0]._id}`} 
                  className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-semibold text-lg"
                >
                  Đọc thêm
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {news.length === 0 ? (
        <p>Không có tin tức trong danh mục này.</p>
      ) : news.length === 1 ? null : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.slice(1).map(item => <NewsCard key={item._id} news={item} />)}
        </div>
      )}
    </div>
  );
};

export default CategoryNews;