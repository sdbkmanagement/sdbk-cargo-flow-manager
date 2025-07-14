
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
        
        // Reset the flag after a short delay
        setTimeout(() => {
          setHasReturned(false);
        }, 500);
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
