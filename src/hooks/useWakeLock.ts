'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

export function useWakeLock() {
  const [isDimmed, setIsDimmed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const wakeLockRef = useRef<any>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile vs computer/cast
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      setIsMobile(mobileRegex.test(userAgent.toLowerCase()));
    };
    checkMobile();
  }, []);

  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator && !wakeLockRef.current) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null;
        });
      } catch (err) {
        console.warn('Wake Lock request failed:', err);
      }
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch (err) {
        console.warn('Wake Lock release failed:', err);
      }
    }
  }, []);

  const resetInactivity = useCallback(() => {
    // Wake up interface on user interaction
    setIsDimmed(false);
    requestWakeLock();

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    // 3 Minutes (180,000 ms) Inactivity Countdown
    inactivityTimerRef.current = setTimeout(() => {
      setIsDimmed(true);
      if (isMobile) {
        // On phones: release the wake lock so the mobile OS turns off the display
        releaseWakeLock();
      }
    }, 180000);
  }, [isMobile, requestWakeLock, releaseWakeLock]);

  useEffect(() => {
    requestWakeLock();
    resetInactivity();

    // User activity listeners
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    const handleActivity = () => resetInactivity();

    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetInactivity();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      releaseWakeLock();
    };
  }, [resetInactivity, requestWakeLock, releaseWakeLock]);

  return { isDimmed, isMobile };
}
