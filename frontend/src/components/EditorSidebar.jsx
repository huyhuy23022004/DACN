import { Home, Newspaper, MessageSquare, LayoutDashboard } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // menu items now navigate to dedicated editor pages
  const menu = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/editor" },
    { name: "Tin tức", icon: <Newspaper size={20} />, path: "/editor/news" },
    { name: "Danh mục", icon: <Home size={20} />, path: "/editor/categories" },
    { name: "Bình luận", icon: <MessageSquare size={20} />, path: "/editor/comments" },
  ];

  const handleClick = (e, item) => {
    e.preventDefault();
    // Navigate to the explicit page for the editor tool
    navigate(item.path);
  };

  return (
    <div className="w-64 bg-white shadow-xl h-screen fixed left-0 top-0 px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-red-600">Editor Panel</h1>

      <nav className="space-y-2">
        {menu.map((item, index) => {
          // Active only when the item's explicit route matches OR when on /editor and the hash matches the targetId
          const active = location.pathname === item.path || (item.path !== '/editor' && location.pathname.startsWith(item.path));

          const anchorClass = `flex items-center gap-3 p-3 rounded-xl transition-all group w-full ${active ? 'bg-red-600 text-white shadow-md' : 'hover:bg-red-100 text-gray-700'}`;
          const iconWrapperClass = active
            ? 'p-2 bg-red-600 rounded-full shadow-sm text-white'
            : 'p-2 bg-white rounded-full shadow-sm text-gray-700';
          const textClass = `${active ? 'text-white' : 'text-gray-700'} font-medium`;

          return (
            <a
              href={item.path}
              key={index}
              onClick={(e) => handleClick(e, item)}
              className={anchorClass}
            >
              <div className={iconWrapperClass}>
                {item.icon}
              </div>
              <span className={textClass}>{item.name}</span>
            </a>
          );
        })}
      </nav>

      {/* Logout button removed as requested */}
    </div>
  );
};

export default Sidebar;