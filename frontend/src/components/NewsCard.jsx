import { Link } from 'react-router-dom';

const NewsCard = ({ news }) => (
  <div className="news-card bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition">
    {news.videoUrl ? (
      <iframe
        src={`https://www.youtube.com/embed/${news.videoUrl.split('v=')[1]}`}
        title={news.title}
        className="w-full h-48 rounded-lg mb-4"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    ) : news.images && news.images.length > 0 ? (
      <img 
        src={news.images[0]} 
        alt={news.title} 
        className="w-full h-48 object-cover rounded-lg mb-4" 
      />
    ) : null}
    <h2 className="text-xl font-semibold mb-2">{news.title}</h2>
    <p className="text-gray-600 mb-4">{news.summary}</p>
    <Link to={`/news/${news._id}`} className="text-green-600 hover:underline font-semibold text-lg">Đọc thêm</Link>
  </div>
);

export default NewsCard;