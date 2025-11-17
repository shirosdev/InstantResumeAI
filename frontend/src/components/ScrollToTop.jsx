import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Instant scroll to top left
    window.scrollTo(0, 0);
  }, [pathname]); // Trigger this effect every time the path changes

  return null; // This component renders nothing visually
};

export default ScrollToTop;