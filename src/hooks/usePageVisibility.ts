
import { useEffect, useState } from 'react';

export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [hasReturned, setHasReturned] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);
      
      if (visible && !isVisible) {
        // Page became visible again - user returned to tab
        setHasReturned(true);
        
        // Force reflow to fix potential CSS/layout issues
        setTimeout(() => {
          document.body.style.display = 'none';
          document.body.offsetHeight; // Force reflow
          document.body.style.display = '';
          setHasReturned(false);
        }, 10);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [isVisible]);

  return { isVisible, hasReturned };
};
