'use client';
import { useState, useEffect } from 'react';
import { BELL_SCHEDULE, ClassPeriod } from '@/data/schedule';

export function useAutoPeriodCountdown(overridePeriodId: string = 'AUTO') {
  const [currentPeriod, setCurrentPeriod] = useState<ClassPeriod | null>(null);
  const [cleanupSecLeft, setCleanupSecLeft] = useState<number | null>(null);
  const [bellSecLeft, setBellSecLeft] = useState<number>(0);
  const [isPassingPeriod, setIsPassingPeriod] = useState<boolean>(false);

  useEffect(() => {
    const updateTimes = () => {
      const now = new Date();
      const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

      const toDaySeconds = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 3600 + m * 60;
      };

      let active: ClassPeriod | undefined;

      if (overridePeriodId !== 'AUTO') {
        active = BELL_SCHEDULE.find((p) => p.id === overridePeriodId);
      } else {
        active = BELL_SCHEDULE.find((p) => {
          const start = toDaySeconds(p.startTime);
          const end = toDaySeconds(p.endTime);
          return currentSeconds >= start && currentSeconds < end;
        });
      }

      if (active) {
        setIsPassingPeriod(false);
        setCurrentPeriod(active);
        const endSec = toDaySeconds(active.endTime);
        setBellSecLeft(Math.max(0, endSec - currentSeconds));

        if (active.cleanupTime) {
          const cleanupSec = toDaySeconds(active.cleanupTime);
          const diff = cleanupSec - currentSeconds;
          setCleanupSecLeft(diff > 0 ? diff : 0);
        } else {
          setCleanupSecLeft(null);
        }
      } else {
        const upcoming = BELL_SCHEDULE.find((p) => toDaySeconds(p.startTime) > currentSeconds);
        if (upcoming) {
          setIsPassingPeriod(true);
          setCurrentPeriod(upcoming);
          setBellSecLeft(toDaySeconds(upcoming.startTime) - currentSeconds);
          setCleanupSecLeft(null);
        } else {
          setIsPassingPeriod(false);
          setCurrentPeriod(null);
        }
      }
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);
    return () => clearInterval(interval);
  }, [overridePeriodId]);

  const formatMinSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return {
    currentPeriod,
    isPassingPeriod,
    bellTimeFormatted: formatMinSec(bellSecLeft),
    cleanupTimeFormatted: cleanupSecLeft !== null ? formatMinSec(cleanupSecLeft) : null,
    cleanupSecLeft,
    bellSecLeft,
  };
}
