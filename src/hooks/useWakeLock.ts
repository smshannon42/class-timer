'use client';
import { useEffect, useState } from 'react';

export function useWakeLock() {
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          setIsLocked(true);
        } catch (err) {
          console.warn('Wake Lock failed:', err);
        }
      }
    };

    requestWakeLock();

    const handleVisibility = () => {
      if (wakeLock !== null && document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (wakeLock) wakeLock.release();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return isLocked;
}
