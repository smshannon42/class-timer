'use client';
import { useState, useEffect } from 'react';
import { BELL_SCHEDULE, PeriodSchedule } from '@/data/schedule';

export function useAutoPeriodCountdown(manualPeriodId: string = 'AUTO') {
  const [currentPeriod, setCurrentPeriod] = useState<PeriodSchedule | null>(null);
  const [isPassingPeriod, setIsPassingPeriod] = useState<boolean>(false);
  const [bellTimeFormatted, setBellTimeFormatted] = useState<string>('--:--');
  const [cleanupTimeFormatted, setCleanupTimeFormatted] = useState<string | null>(null);
  const [cleanupSecLeft, setCleanupSecLeft] = useState<number | null>(null);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const currentSeconds = now.getSeconds();
      const currentTotalSeconds = currentMinutes * 60 + currentSeconds;

      if (manualPeriodId !== 'AUTO') {
        const selected = BELL_SCHEDULE.find((p) => p.id === manualPeriodId);
        if (selected) {
          setCurrentPeriod(selected);
          setIsPassingPeriod(false);

          const endTotalSec = (selected.endHour * 60 + selected.endMinute) * 60;
          const diffSec = Math.max(0, endTotalSec - currentTotalSeconds);
          const m = Math.floor(diffSec / 60);
          const s = diffSec % 60;
          setBellTimeFormatted(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
          setCleanupTimeFormatted(null);
          setCleanupSecLeft(null);
          return;
        }
      }

      let active: PeriodSchedule | null = null;
      let upcoming: PeriodSchedule | null = null;

      for (const p of BELL_SCHEDULE) {
        const startSec = (p.startHour * 60 + p.startMinute) * 60;
        const endSec = (p.endHour * 60 + p.endMinute) * 60;

        if (currentTotalSeconds >= startSec && currentTotalSeconds < endSec) {
          active = p;
          break;
        }

        if (currentTotalSeconds < startSec && !upcoming) {
          upcoming = p;
        }
      }

      if (active) {
        setCurrentPeriod(active);
        setIsPassingPeriod(false);
        const endSec = (active.endHour * 60 + active.endMinute) * 60;
        const diffSec = Math.max(0, endSec - currentTotalSeconds);
        const m = Math.floor(diffSec / 60);
        const s = diffSec % 60;
        setBellTimeFormatted(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      } else if (upcoming) {
        setCurrentPeriod(upcoming);
        setIsPassingPeriod(true);
        const startSec = (upcoming.startHour * 60 + upcoming.startMinute) * 60;
        const diffSec = Math.max(0, startSec - currentTotalSeconds);
        const m = Math.floor(diffSec / 60);
        const s = diffSec % 60;
        setBellTimeFormatted(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      } else {
        setCurrentPeriod(null);
        setIsPassingPeriod(false);
        setBellTimeFormatted('--:--');
      }

      setCleanupTimeFormatted(null);
      setCleanupSecLeft(null);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [manualPeriodId]);

  return {
    currentPeriod,
    isPassingPeriod,
    bellTimeFormatted,
    cleanupTimeFormatted,
    cleanupSecLeft,
  };
}
