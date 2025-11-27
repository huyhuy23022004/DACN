import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = ({ behavior = 'auto' }) => {
  const { pathname } = useLocation();
  useEffect(() => {
    // Use window scroll to reset the viewport on route change
    window.scrollTo({ top: 0, left: 0, behavior });
  }, [pathname, behavior]);
  return null;
};

export default ScrollToTop;
