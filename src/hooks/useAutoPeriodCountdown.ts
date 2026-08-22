'use client';
import { useState, useEffect } from 'react';
import { BELL_SCHEDULE, Period } from '@/data/schedule';

export function useAutoPeriodCountdown(manualPeriodId: string = 'AUTO') {
  const [currentPeriod, setCurrentPeriod] = useState<Period | null>(null);
  const [isPassingPeriod, setIsPassingPeriod] = useState(false);
  const [bellSecLeft, setBellSecLeft] = useState<number>(0);
  const [cleanupSecLeft, setCleanupSecLeft] = useState<number | null>(null);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

      if (manualPeriodId !== 'AUTO') {
        const manualP = BELL_SCHEDULE.find((p) => p.id === manualPeriodId);
        if (manualP) {
          const pEndSec = manualP.endHour * 3600 + manualP.endMinute * 60;
          const pCleanSec = manualP.cleanupHour * 3600 + manualP.cleanupMinute * 60;
          
          setCurrentPeriod(manualP);
          setIsPassingPeriod(false);
          setBellSecLeft(Math.max(0, pEndSec - currentSeconds));
          setCleanupSecLeft(currentSeconds < pCleanSec ? pCleanSec - currentSeconds : 0);
          return;
        }
      }

      let foundActive: Period | null = null;
      let nextPeriod: Period | null = null;

      for (let i = 0; i < BELL_SCHEDULE.length; i++) {
        const p = BELL_SCHEDULE[i];
        const pStartSec = p.startHour * 3600 + p.startMinute * 60;
        const pEndSec = p.endHour * 3600 + p.endMinute * 60;

        if (currentSeconds >= pStartSec && currentSeconds < pEndSec) {
          foundActive = p;
          break;
        }

        if (currentSeconds < pStartSec && !nextPeriod) {
          nextPeriod = p;
        }
      }

      if (foundActive) {
        const pEndSec = foundActive.endHour * 3600 + foundActive.endMinute * 60;
        const pCleanSec = foundActive.cleanupHour * 3600 + foundActive.cleanupMinute * 60;

        setCurrentPeriod(foundActive);
        setIsPassingPeriod(false);
        setBellSecLeft(Math.max(0, pEndSec - currentSeconds));
        setCleanupSecLeft(currentSeconds < pCleanSec ? pCleanSec - currentSeconds : 0);
      } else if (nextPeriod) {
        const nextStartSec = nextPeriod.startHour * 3600 + nextPeriod.startMinute * 60;
        setCurrentPeriod(nextPeriod);
        setIsPassingPeriod(true);
        setBellSecLeft(Math.max(0, nextStartSec - currentSeconds));
        setCleanupSecLeft(null);
      } else {
        setCurrentPeriod(null);
        setIsPassingPeriod(false);
        setBellSecLeft(0);
        setCleanupSecLeft(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [manualPeriodId]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return {
    currentPeriod,
    isPassingPeriod,
    bellTimeFormatted: formatSeconds(bellSecLeft),
    cleanupTimeFormatted: cleanupSecLeft !== null ? formatSeconds(cleanupSecLeft) : null,
    cleanupSecLeft,
    bellSecLeft,
  };
}
