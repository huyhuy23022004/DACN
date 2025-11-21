import { Home, Users, Newspaper, MessageSquare, Bell, LayoutDashboard } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();

  const navigate = useNavigate();

  // menu items include an optional in-page targetId for the admin dashboard
  const menu = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, path: "/admin", targetId: "top" },
    { name: "Người dùng", icon: <Users size={20} />, path: "/admin", targetId: "users-section" },
    { name: "Tin tức", icon: <Newspaper size={20} />, path: "/admin", targetId: "news-section" },
    { name: "Danh mục", icon: <Home size={20} />, path: "/admin", targetId: "categories-section" },
    { name: "Bình luận", icon: <MessageSquare size={20} />, path: "/admin", targetId: "comments-section" },
    { name: "Thông báo", icon: <Bell size={20} />, path: "/admin", targetId: "notifications-section" },
  ];

  const handleClick = (e, item) => {
    e.preventDefault();
    const targetId = item.targetId;

    if (location.pathname !== '/admin') {
      // navigate to /admin with hash so the router loads the dashboard first
      navigate(`/admin#${targetId}`);
      return;
    }

    if (!targetId || targetId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // fallback: navigate to /admin with hash
      navigate(`/admin#${targetId}`);
    }
  };

  return (
    <div className="w-64 bg-white shadow-xl h-screen fixed left-0 top-0 px-4 py-6">
      <h1 className="text-2xl font-bold mb-6 text-red-600">Admin Panel</h1>

      <nav className="space-y-2">
        {menu.map((item, index) => {
          // Active only when the item's explicit route matches OR when on /admin and the hash matches the targetId
          const active = item.targetId
            ? (location.pathname === '/admin' && location.hash === `#${item.targetId}`)
            : (location.pathname === item.path);

          const anchorClass = `flex items-center gap-3 p-3 rounded-xl transition-all group w-full ${active ? 'bg-red-600 text-white shadow-md' : 'hover:bg-red-100 text-gray-700'}`;
          const iconWrapperClass = active
            ? 'p-2 bg-red-600 rounded-full shadow-sm text-white'
            : 'p-2 bg-white rounded-full shadow-sm text-gray-700';
          const textClass = `${active ? 'text-white' : 'text-gray-700'} font-medium`;

          return (
            <a
              href={item.targetId ? `#${item.targetId}` : item.path}
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
