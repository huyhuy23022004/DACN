import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../utils/api';

const Categories = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/categories').then(data => setCategories(data || []));
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-8">Danh Mục</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map(category => (
          <div key={category._id} className="bg-white p-4 rounded shadow category-card">
            {category.images && category.images.length > 0 && (
              <img src={category.images[0]} alt={category.name} className="w-full h-32 object-cover rounded mb-4" />
            )}
            <h3 className="text-xl font-semibold">{category.name}</h3>
            <p className="text-gray-600">{category.description}</p>
            <Link to={`/category/${category._id}`} className="text-blue-600 hover:underline">Xem Tin Tức</Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Categories;