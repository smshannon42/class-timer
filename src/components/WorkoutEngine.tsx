'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, FastForward, Timer, Plus, Minus } from 'lucide-react';
import { soundEngine } from '@/utils/audio';

interface WorkoutEngineProps {
  onBroadcast?: (state: any) => void;
  incomingState?: any;
  isProjectorView?: boolean;
}

export default function WorkoutEngine({ onBroadcast, incomingState, isProjectorView = false }: WorkoutEngineProps) {
  const [mode, setMode] = useState<'DYNAMIC' | 'TABATA' | 'AMRAP' | 'EMOM' | 'FOR_TIME'>('DYNAMIC');
  const [dynamicSubMode, setDynamicSubMode] = useState<'RUN' | 'STRETCH'>('RUN');

  const [enablePrep, setEnablePrep] = useState<boolean>(false);

  const [warmupRunSeconds, setWarmupRunSeconds] = useState(180);
  const [stretchSeconds, setStretchSeconds] = useState(20);
  const [stretchRounds, setStretchRounds] = useState(6);
  const [currentStretchRound, setCurrentStretchRound] = useState(1);
  const [postRestSeconds, setPostRestSeconds] = useState(60);

  // Tabata (default 20s work / 10s rest, 8 rounds)
  const [tabataWork, setTabataWork] = useState(20);
  const [tabataRest, setTabataRest] = useState(10);
  const [tabataRounds, setTabataRounds] = useState(8);
  const [currentRound, setCurrentRound] = useState(1);
  const [isWorkPhase, setIsWorkPhase] = useState(true);

  // EMOM (default 60s interval, default 8 rounds)
  const [emomInterval, setEmomInterval] = useState(60);
  const [emomRounds, setEmomRounds] = useState(8);

  // AMRAP (default 5m = 300s, default 8 target rounds)
  const [amrapDuration, setAmrapDuration] = useState(300);
  const [amrapRounds, setAmrapRounds] = useState(8);

  // FOR TIME (default 10m = 600s, default 8 rounds)
  const [forTimeCap, setForTimeCap] = useState(600);
  const [forTimeRounds, setForTimeRounds] = useState(8);

  const [secondsRemaining, setSecondsRemaining] = useState(180);
  const [isActive, setIsActive] = useState(false);
  const [enginePhase, setEnginePhase] = useState<'IDLE' | 'PREP_7' | 'RUNNING' | 'POST_REST_60' | 'FINISHED'>('IDLE');

  const [flashType, setFlashType] = useState<'REST' | 'FINISH' | null>(null);
  const prevPhaseRef = useRef<{ phase: string; isWork: boolean }>({ phase: 'IDLE', isWork: true });
  const wakeLockRef = useRef<any>(null);

  // Screen WakeLock Management
  useEffect(() => {
    const requestWakeLock = async () => {
      if (typeof window !== 'undefined' && 'wakeLock' in navigator && isActive) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        } catch (err) {
          console.warn('WakeLock request error:', err);
        }
      }
    };

    if (isActive) {
      requestWakeLock();
    } else if (wakeLockRef.current) {
      wakeLockRef.current.release().then(() => {
        wakeLockRef.current = null;
      }).catch(() => {});
    }

    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, [isActive]);

  const emit = (overrides = {}) => {
    if (!onBroadcast || isProjectorView) return;
    onBroadcast({
      mode,
      dynamicSubMode,
      secondsRemaining,
      isActive,
      enginePhase,
      currentRound,
      isWorkPhase,
      currentStretchRound,
      stretchRounds,
      stretchSeconds,
      warmupRunSeconds,
      postRestSeconds,
      tabataWork,
      tabataRest,
      tabataRounds,
      emomInterval,
      emomRounds,
      amrapDuration,
      amrapRounds,
      forTimeCap,
      forTimeRounds,
      enablePrep,
      ...overrides
    });
  };

  // Flash state handler
  useEffect(() => {
    const prev = prevPhaseRef.current;
    
    if (enginePhase === 'FINISHED' && prev.phase !== 'FINISHED') {
      setFlashType('FINISH');
      const timer = setTimeout(() => setFlashType(null), 650);
      prevPhaseRef.current = { phase: enginePhase, isWork: isWorkPhase };
      return () => clearTimeout(timer);
    }

    const isNowRest = enginePhase === 'POST_REST_60' || (mode === 'TABATA' && enginePhase === 'RUNNING' && !isWorkPhase);
    const wasRest = prev.phase === 'POST_REST_60' || (prev.phase === 'RUNNING' && !prev.isWork);

    if (isNowRest && !wasRest) {
      setFlashType('REST');
      const timer = setTimeout(() => setFlashType(null), 650);
      prevPhaseRef.current = { phase: enginePhase, isWork: isWorkPhase };
      return () => clearTimeout(timer);
    }

    prevPhaseRef.current = { phase: enginePhase, isWork: isWorkPhase };
  }, [enginePhase, isWorkPhase, mode]);

  // Main Timer Loop
  useEffect(() => {
    if (isProjectorView && incomingState) {
      setMode(incomingState.mode);
      setDynamicSubMode(incomingState.dynamicSubMode);
      setSecondsRemaining(incomingState.secondsRemaining);
      setIsActive(incomingState.isActive);
      setEnginePhase(incomingState.enginePhase);
      setCurrentRound(incomingState.currentRound);
      setIsWorkPhase(incomingState.isWorkPhase);
      setCurrentStretchRound(incomingState.currentStretchRound);
      setStretchRounds(incomingState.stretchRounds);
      setStretchSeconds(incomingState.stretchSeconds);
      setWarmupRunSeconds(incomingState.warmupRunSeconds);
      setPostRestSeconds(incomingState.postRestSeconds);
      setTabataWork(incomingState.tabataWork ?? 20);
      setTabataRest(incomingState.tabataRest ?? 10);
      setTabataRounds(incomingState.tabataRounds ?? 8);
      setEmomInterval(incomingState.emomInterval ?? 60);
      setEmomRounds(incomingState.emomRounds ?? 8);
      setAmrapDuration(incomingState.amrapDuration ?? 300);
      setAmrapRounds(incomingState.amrapRounds ?? 8);
      setForTimeCap(incomingState.forTimeCap ?? 600);
      setForTimeRounds(incomingState.forTimeRounds ?? 8);
      setEnablePrep(incomingState.enablePrep ?? false);
      return;
    }

    if (isProjectorView) return;

    let timer: NodeJS.Timeout;

    if (isActive) {
      timer = setInterval(() => {
        // Pip tone on 2 and 1 seconds remaining
        if (mode !== 'FOR_TIME') {
          if (secondsRemaining === 3 || secondsRemaining === 2) {
            soundEngine.playPipCountdown();
          }
        } else {
          const remainingTime = forTimeCap - secondsRemaining;
          if (remainingTime === 3 || remainingTime === 2) {
            soundEngine.playPipCountdown();
          }
        }

        if (enginePhase === 'PREP_7') {
          setSecondsRemaining((prev) => {
            if (prev > 1) return prev - 1;
            soundEngine.playWorkGo();
            setEnginePhase('RUNNING');
            if (mode === 'DYNAMIC') return dynamicSubMode === 'RUN' ? warmupRunSeconds : stretchSeconds;
            if (mode === 'TABATA') return tabataWork;
            if (mode === 'EMOM') return emomInterval;
            if (mode === 'AMRAP') return amrapDuration;
            if (mode === 'FOR_TIME') return 0;
            return 0;
          });
          return;
        }

        if (enginePhase === 'POST_REST_60') {
          setSecondsRemaining((prev) => {
            if (prev > 1) return prev - 1;
            soundEngine.playWorkGo();
            setEnginePhase('RUNNING');
            setDynamicSubMode('STRETCH');
            setCurrentStretchRound(1);
            return stretchSeconds;
          });
          return;
        }

        if (mode === 'DYNAMIC') {
          if (dynamicSubMode === 'STRETCH') {
            setSecondsRemaining((prev) => {
              if (prev > 1) return prev - 1;
              if (currentStretchRound < stretchRounds) {
                soundEngine.playWorkGo();
                setCurrentStretchRound((r) => r + 1);
                return stretchSeconds;
              } else {
                soundEngine.playRest();
                setEnginePhase('FINISHED');
                setIsActive(false);
                return 0;
              }
            });
          } else {
            setSecondsRemaining((prev) => {
              if (prev > 1) return prev - 1;
              soundEngine.playRest();
              setEnginePhase('POST_REST_60');
              return postRestSeconds;
            });
          }
        } else if (mode === 'TABATA') {
          setSecondsRemaining((prev) => {
            if (prev > 1) return prev - 1;
            if (isWorkPhase) {
              if (tabataRest === 0) {
                if (currentRound < tabataRounds) {
                  soundEngine.playWorkGo();
                  setCurrentRound((r) => r + 1);
                  return tabataWork;
                } else {
                  soundEngine.playRest();
                  setEnginePhase('FINISHED');
                  setIsActive(false);
                  return 0;
                }
              } else {
                soundEngine.playRest();
                setIsWorkPhase(false);
                return tabataRest;
              }
            } else {
              if (currentRound < tabataRounds) {
                soundEngine.playWorkGo();
                setCurrentRound((r) => r + 1);
                setIsWorkPhase(true);
                return tabataWork;
              } else {
                soundEngine.playRest();
                setEnginePhase('FINISHED');
                setIsActive(false);
                return 0;
              }
            }
          });
        } else if (mode === 'EMOM') {
          setSecondsRemaining((prev) => {
            if (prev > 1) return prev - 1;
            if (currentRound < emomRounds) {
              soundEngine.playWorkGo();
              setCurrentRound((r) => r + 1);
              return emomInterval;
            } else {
              soundEngine.playRest();
              setEnginePhase('FINISHED');
              setIsActive(false);
              return 0;
            }
          });
        } else if (mode === 'AMRAP') {
          setSecondsRemaining((prev) => {
            if (prev > 1) return prev - 1;
            soundEngine.playRest();
            setEnginePhase('FINISHED');
            setIsActive(false);
            return 0;
          });
        } else if (mode === 'FOR_TIME') {
          setSecondsRemaining((prev) => {
            if (prev + 1 >= forTimeCap) {
              soundEngine.playRest();
              setEnginePhase('FINISHED');
              setIsActive(false);
              return forTimeCap;
            }
            return prev + 1;
          });
        }
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [
    isActive,
    enginePhase,
    mode,
    dynamicSubMode,
    currentStretchRound,
    stretchRounds,
    stretchSeconds,
    warmupRunSeconds,
    postRestSeconds,
    isWorkPhase,
    currentRound,
    tabataRounds,
    tabataWork,
    tabataRest,
    emomRounds,
    emomInterval,
    amrapDuration,
    forTimeCap,
    enablePrep,
    secondsRemaining,
    isProjectorView,
    incomingState
  ]);

  useEffect(() => {
    emit();
  }, [
    mode,
    dynamicSubMode,
    secondsRemaining,
    isActive,
    enginePhase,
    currentRound,
    isWorkPhase,
    currentStretchRound,
    enablePrep,
    tabataWork,
    tabataRest,
    tabataRounds,
    emomInterval,
    emomRounds,
    amrapDuration,
    amrapRounds,
    forTimeCap,
    forTimeRounds
  ]);

  const handleStart = () => {
    if (enginePhase === 'IDLE' || enginePhase === 'FINISHED') {
      if (enablePrep) {
        setEnginePhase('PREP_7');
        setSecondsRemaining(7);
      } else {
        soundEngine.playWorkGo();
        setEnginePhase('RUNNING');
        if (mode === 'DYNAMIC') setSecondsRemaining(dynamicSubMode === 'RUN' ? warmupRunSeconds : stretchSeconds);
        if (mode === 'TABATA') setSecondsRemaining(tabataWork);
        if (mode === 'EMOM') setSecondsRemaining(emomInterval);
        if (mode === 'AMRAP') setSecondsRemaining(amrapDuration);
        if (mode === 'FOR_TIME') setSecondsRemaining(0);
      }
      setIsActive(true);
    } else {
      setIsActive(true);
    }
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setEnginePhase('IDLE');
    setCurrentRound(1);
    setCurrentStretchRound(1);
    setIsWorkPhase(true);

    if (mode === 'DYNAMIC') {
      setDynamicSubMode('RUN');
      setSecondsRemaining(warmupRunSeconds);
    } else if (mode === 'TABATA') {
      setSecondsRemaining(tabataWork);
    } else if (mode === 'EMOM') {
      setSecondsRemaining(emomInterval);
    } else if (mode === 'AMRAP') {
      setSecondsRemaining(amrapDuration);
    } else if (mode === 'FOR_TIME') {
      setSecondsRemaining(0);
    }
  };

  const handleSkip = () => {
    if (mode === 'DYNAMIC') {
      if (enginePhase === 'PREP_7') {
        soundEngine.playWorkGo();
        setEnginePhase('RUNNING');
        setSecondsRemaining(warmupRunSeconds);
      } else if (dynamicSubMode === 'RUN' && enginePhase === 'RUNNING') {
        soundEngine.playRest();
        setEnginePhase('POST_REST_60');
        setSecondsRemaining(postRestSeconds);
      } else if (enginePhase === 'POST_REST_60') {
        soundEngine.playWorkGo();
        setEnginePhase('RUNNING');
        setDynamicSubMode('STRETCH');
        setCurrentStretchRound(1);
        setSecondsRemaining(stretchSeconds);
      } else if (dynamicSubMode === 'STRETCH') {
        if (currentStretchRound < stretchRounds) {
          soundEngine.playWorkGo();
          setCurrentStretchRound((r) => r + 1);
          setSecondsRemaining(stretchSeconds);
        } else {
          soundEngine.playRest();
          setEnginePhase('FINISHED');
          setIsActive(false);
        }
      }
    } else if (mode === 'TABATA') {
      if (isWorkPhase) {
        soundEngine.playRest();
        setIsWorkPhase(false);
        setSecondsRemaining(tabataRest);
      } else {
        if (currentRound < tabataRounds) {
          soundEngine.playWorkGo();
          setCurrentRound((r) => r + 1);
          setIsWorkPhase(true);
          setSecondsRemaining(tabataWork);
        } else {
          soundEngine.playRest();
          setEnginePhase('FINISHED');
          setIsActive(false);
        }
      }
    } else if (mode === 'EMOM') {
      if (currentRound < emomRounds) {
        soundEngine.playWorkGo();
        setCurrentRound((r) => r + 1);
        setSecondsRemaining(emomInterval);
      } else {
        soundEngine.playRest();
        setEnginePhase('FINISHED');
        setIsActive(false);
      }
    } else if (mode === 'AMRAP') {
      if (currentRound < amrapRounds) {
        setCurrentRound((r) => r + 1);
      }
    } else if (mode === 'FOR_TIME') {
      if (currentRound < forTimeRounds) {
        setCurrentRound((r) => r + 1);
      } else {
        soundEngine.playRest();
        setEnginePhase('FINISHED');
        setIsActive(false);
      }
    }
  };

  // Keyboard Hotkeys
  useEffect(() => {
    if (isProjectorView) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (isActive) handlePause();
        else handleStart();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 's' || e.key === 'S' || e.code === 'ArrowRight') {
        e.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, enginePhase, mode, dynamicSubMode, currentStretchRound, currentRound, isWorkPhase, isProjectorView]);

  const adjustTabataRounds = (delta: number) => {
    setTabataRounds((r) => Math.min(12, Math.max(1, r + delta)));
  };

  const adjustEmomRounds = (delta: number) => {
    setEmomRounds((r) => Math.min(12, Math.max(1, r + delta)));
  };

  const adjustAmrapRounds = (delta: number) => {
    setAmrapRounds((r) => Math.min(12, Math.max(1, r + delta)));
  };

  const adjustForTimeRounds = (delta: number) => {
    setForTimeRounds((r) => Math.min(12, Math.max(1, r + delta)));
  };

  const adjustTabataWork = (delta: number) => {
    const nextVal = Math.min(180, Math.max(5, tabataWork + delta));
    setTabataWork(nextVal);
    if (mode === 'TABATA' && enginePhase === 'IDLE') setSecondsRemaining(nextVal);
  };

  const adjustTabataRest = (delta: number) => {
    const nextVal = Math.min(60, Math.max(0, tabataRest + delta));
    setTabataRest(nextVal);
  };

  const adjustEmom = (delta: number) => {
    const nextVal = Math.min(180, Math.max(15, emomInterval + delta));
    setEmomInterval(nextVal);
    if (mode === 'EMOM' && enginePhase === 'IDLE') setSecondsRemaining(nextVal);
  };

  const adjustAmrap = (delta: number) => {
    const nextVal = Math.min(1800, Math.max(60, amrapDuration + delta));
    setAmrapDuration(nextVal);
    if (mode === 'AMRAP' && enginePhase === 'IDLE') setSecondsRemaining(nextVal);
  };

  const adjustForTime = (delta: number) => {
    const nextVal = Math.min(3600, Math.max(60, forTimeCap + delta));
    setForTimeCap(nextVal);
  };

  const formatDisplayTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatIntervalLabel = (secs: number) => {
    if (secs === 0) return '0s (None)';
    if (secs < 60) return `${secs}s`;
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s === 0 ? `${m}m` : `${m}m ${s}s`;
  };

  const getRoundInfo = () => {
    if (mode === 'DYNAMIC') {
      const active = dynamicSubMode === 'RUN' ? 1 : currentStretchRound;
      const total = stretchRounds;
      return { active, total, remaining: Math.max(0, total - active), hasRounds: dynamicSubMode === 'STRETCH' };
    }
    if (mode === 'TABATA') {
      return { active: currentRound, total: tabataRounds, remaining: Math.max(0, tabataRounds - currentRound), hasRounds: true };
    }
    if (mode === 'EMOM') {
      return { active: currentRound, total: emomRounds, remaining: Math.max(0, emomRounds - currentRound), hasRounds: true };
    }
    if (mode === 'AMRAP') {
      return { active: currentRound, total: amrapRounds, remaining: Math.max(0, amrapRounds - currentRound), hasRounds: true };
    }
    if (mode === 'FOR_TIME') {
      return { active: currentRound, total: forTimeRounds, remaining: Math.max(0, forTimeRounds - currentRound), hasRounds: true };
    }
    return { active: 1, total: 8, remaining: 7, hasRounds: true };
  };

  const roundInfo = getRoundInfo();

  const isRestPhaseActive = (): boolean => {
    if (enginePhase === 'POST_REST_60') return true;
    if (mode === 'TABATA' && enginePhase === 'RUNNING' && !isWorkPhase) return true;
    return false;
  };

  const isWorkTenSecondsLeft = (): boolean => {
    if (enginePhase !== 'RUNNING') return false;

    if (mode === 'DYNAMIC') {
      return secondsRemaining <= 10 && secondsRemaining > 0;
    }
    if (mode === 'TABATA') {
      return isWorkPhase && secondsRemaining <= 10 && secondsRemaining > 0;
    }
    if (mode === 'EMOM') {
      return secondsRemaining <= 10 && secondsRemaining > 0;
    }
    if (mode === 'AMRAP') {
      return secondsRemaining <= 10 && secondsRemaining > 0;
    }
    if (mode === 'FOR_TIME') {
      const remainingTime = forTimeCap - secondsRemaining;
      return remainingTime <= 10 && remainingTime > 0;
    }
    return false;
  };

  const isResting = isRestPhaseActive();
  const showRedCountdown = isWorkTenSecondsLeft();

  const getProgressPercentage = (): number => {
    if (enginePhase === 'IDLE' || enginePhase === 'FINISHED') return 100;
    if (enginePhase === 'PREP_7') return (secondsRemaining / 7) * 100;
    if (enginePhase === 'POST_REST_60') return (secondsRemaining / postRestSeconds) * 100;

    if (mode === 'DYNAMIC') {
      const total = dynamicSubMode === 'RUN' ? warmupRunSeconds : stretchSeconds;
      return total > 0 ? (secondsRemaining / total) * 100 : 0;
    }
    if (mode === 'TABATA') {
      const total = isWorkPhase ? tabataWork : tabataRest;
      return total > 0 ? (secondsRemaining / total) * 100 : 0;
    }
    if (mode === 'EMOM') {
      return emomInterval > 0 ? (secondsRemaining / emomInterval) * 100 : 0;
    }
    if (mode === 'AMRAP') {
      return amrapDuration > 0 ? (secondsRemaining / amrapDuration) * 100 : 0;
    }
    if (mode === 'FOR_TIME') {
      return forTimeCap > 0 ? ((forTimeCap - secondsRemaining) / forTimeCap) * 100 : 0;
    }
    return 100;
  };

  const progress = getProgressPercentage();
  const radius = 230;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const getAmbientGlowClass = (): string => {
    if (enginePhase === 'FINISHED') return 'bg-rose-950/30 border-rose-900/40';
    if (isResting) {
      return 'bg-amber-950/25 border-amber-900/40';
    }
    if (enginePhase === 'RUNNING') {
      return 'bg-emerald-950/20 border-emerald-900/30';
    }
    return 'bg-neutral-950/60 border-neutral-900';
  };

  const getRingColorClass = (): string => {
    if (showRedCountdown) return 'stroke-rose-500 shadow-rose-500';
    if (enginePhase === 'PREP_7' || isResting) {
      return 'stroke-amber-400';
    }
    if (enginePhase === 'RUNNING') return 'stroke-emerald-400';
    return 'stroke-cyan-500';
  };

  const getTimerTextColorClass = (): string => {
    if (enginePhase === 'PREP_7') return 'text-amber-400 animate-pulse';
    if (isResting) return 'text-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]';
    if (showRedCountdown) return 'text-rose-500 drop-shadow-[0_0_30px_rgba(244,63,94,0.5)]';
    return 'text-white drop-shadow-2xl';
  };

  return (
    <div className={`relative flex flex-col items-center justify-center w-full transition-colors duration-700 rounded-3xl p-4 border ${getAmbientGlowClass()} ${isProjectorView ? 'min-h-[85vh]' : ''}`}>
      {/* Rest / Finish Screen Flash Overlay */}
      {flashType === 'REST' && (
        <div className="absolute inset-0 z-50 pointer-events-none rounded-3xl bg-amber-400/40 animate-out fade-out duration-500" />
      )}
      {flashType === 'FINISH' && (
        <div className="absolute inset-0 z-50 pointer-events-none rounded-3xl bg-rose-600/40 animate-out fade-out duration-700" />
      )}

      {/* Controller Mode Switchers & Steppers: Hidden while running */}
      {!isProjectorView && !isActive && (
        <div className="flex flex-col items-center gap-3 mb-4 w-full animate-in fade-in duration-300">
          {/* Mode Switcher */}
          <div className="flex flex-wrap gap-2 bg-neutral-900/90 p-2 rounded-2xl border border-neutral-800 justify-center">
            {(['DYNAMIC', 'TABATA', 'EMOM', 'AMRAP', 'FOR_TIME'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setIsActive(false);
                  setEnginePhase('IDLE');
                  setCurrentRound(1);
                  if (m === 'DYNAMIC') {
                    setDynamicSubMode('RUN');
                    setSecondsRemaining(warmupRunSeconds);
                  } else if (m === 'TABATA') {
                    setSecondsRemaining(tabataWork);
                  } else if (m === 'EMOM') {
                    setSecondsRemaining(emomInterval);
                  } else if (m === 'AMRAP') {
                    setSecondsRemaining(amrapDuration);
                  } else if (m === 'FOR_TIME') {
                    setSecondsRemaining(0);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${
                  mode === m ? 'bg-cyan-500 text-neutral-950 shadow-lg shadow-cyan-500/20' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {m.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={() => setEnablePrep(!enablePrep)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              enablePrep 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm' 
                : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-neutral-300'
            }`}
          >
            <Timer size={14} />
            <span>Prep (7s): <strong className="uppercase">{enablePrep ? 'ON' : 'OFF'}</strong></span>
          </button>

          {/* TABATA Steppers */}
          {mode === 'TABATA' && (
            <div className="flex flex-col gap-2 w-full max-w-md mt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-neutral-900/90 border border-emerald-500/30 rounded-2xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Work</span>
                    <span className="text-base font-black text-white font-mono">{formatIntervalLabel(tabataWork)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => adjustTabataWork(-5)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-neutral-700 active:scale-95">
                      <Minus size={14} />
                    </button>
                    <input type="range" min="5" max="180" step="5" value={tabataWork} onChange={(e) => { const v = Number(e.target.value); setTabataWork(v); if (enginePhase === 'IDLE') setSecondsRemaining(v); }} className="w-full accent-emerald-400 h-2 bg-neutral-950 rounded-lg cursor-pointer" />
                    <button type="button" onClick={() => adjustTabataWork(5)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-neutral-700 active:scale-95">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="bg-neutral-900/90 border border-amber-500/30 rounded-2xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Rest</span>
                    <span className="text-base font-black text-white font-mono">{formatIntervalLabel(tabataRest)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => adjustTabataRest(-5)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 active:scale-95">
                      <Minus size={14} />
                    </button>
                    <input type="range" min="0" max="60" step="5" value={tabataRest} onChange={(e) => setTabataRest(Number(e.target.value))} className="w-full accent-amber-400 h-2 bg-neutral-950 rounded-lg cursor-pointer" />
                    <button type="button" onClick={() => adjustTabataRest(5)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 active:scale-95">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-900/90 border border-cyan-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Rounds</span>
                  <span className="text-base font-black text-white font-mono">{tabataRounds}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => adjustTabataRounds(-1)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 active:scale-95">
                    <Minus size={14} />
                  </button>
                  <input type="range" min="1" max="12" step="1" value={tabataRounds} onChange={(e) => setTabataRounds(Number(e.target.value))} className="w-full accent-cyan-400 h-2 bg-neutral-950 rounded-lg cursor-pointer" />
                  <button type="button" onClick={() => adjustTabataRounds(1)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 active:scale-95">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* EMOM Steppers */}
          {mode === 'EMOM' && (
            <div className="flex flex-col gap-2 w-full max-w-sm mt-1">
              <div className="bg-neutral-900/90 border border-cyan-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Interval</span>
                  <span className="text-base font-black text-white font-mono">{formatIntervalLabel(emomInterval)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => adjustEmom(-5)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 active:scale-95">
                    <Minus size={14} />
                  </button>
                  <input type="range" min="15" max="180" step="5" value={emomInterval} onChange={(e) => { const v = Number(e.target.value); setEmomInterval(v); if (enginePhase === 'IDLE') setSecondsRemaining(v); }} className="w-full accent-cyan-400 h-2 bg-neutral-950 rounded-lg cursor-pointer" />
                  <button type="button" onClick={() => adjustEmom(5)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 active:scale-95">
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="bg-neutral-900/90 border border-cyan-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Rounds</span>
                  <span className="text-base font-black text-white font-mono">{emomRounds}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => adjustEmomRounds(-1)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 active:scale-95">
                    <Minus size={14} />
                  </button>
                  <input type="range" min="1" max="12" step="1" value={emomRounds} onChange={(e) => setEmomRounds(Number(e.target.value))} className="w-full accent-cyan-400 h-2 bg-neutral-950 rounded-lg cursor-pointer" />
                  <button type="button" onClick={() => adjustEmomRounds(1)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 active:scale-95">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AMRAP Steppers */}
          {mode === 'AMRAP' && (
            <div className="flex flex-col gap-2 w-full max-w-sm mt-1">
              <div className="bg-neutral-900/90 border border-fuchsia-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-fuchsia-400 uppercase tracking-wider">Duration</span>
                  <span className="text-base font-black text-white font-mono">{formatIntervalLabel(amrapDuration)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => adjustAmrap(-30)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-fuchsia-400 border border-neutral-700 active:scale-95">
                    <Minus size={14} />
                  </button>
                  <input type="range" min="60" max="1800" step="30" value={amrapDuration} onChange={(e) => { const v = Number(e.target.value); setAmrapDuration(v); if (enginePhase === 'IDLE') setSecondsRemaining(v); }} className="w-full accent-fuchsia-400 h-2 bg-neutral-950 rounded-lg cursor-pointer" />
                  <button type="button" onClick={() => adjustAmrap(30)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-fuchsia-400 border border-neutral-700 active:scale-95">
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="bg-neutral-900/90 border border-fuchsia-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-fuchsia-400 uppercase tracking-wider">Target Rounds</span>
                  <span className="text-base font-black text-white font-mono">{amrapRounds}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => adjustAmrapRounds(-1)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-fuchsia-400 border border-neutral-700 active:scale-95">
                    <Minus size={14} />
                  </button>
                  <input type="range" min="1" max="12" step="1" value={amrapRounds} onChange={(e) => setAmrapRounds(Number(e.target.value))} className="w-full accent-fuchsia-400 h-2 bg-neutral-950 rounded-lg cursor-pointer" />
                  <button type="button" onClick={() => adjustAmrapRounds(1)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-fuchsia-400 border border-neutral-700 active:scale-95">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FOR TIME Steppers */}
          {mode === 'FOR_TIME' && (
            <div className="flex flex-col gap-2 w-full max-w-sm mt-1">
              <div className="bg-neutral-900/90 border border-indigo-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Time Cap</span>
                  <span className="text-base font-black text-white font-mono">{formatIntervalLabel(forTimeCap)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => adjustForTime(-30)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-indigo-400 border border-neutral-700 active:scale-95">
                    <Minus size={14} />
                  </button>
                  <input type="range" min="60" max="3600" step="30" value={forTimeCap} onChange={(e) => setForTimeCap(Number(e.target.value))} className="w-full accent-indigo-400 h-2 bg-neutral-950 rounded-lg cursor-pointer" />
                  <button type="button" onClick={() => adjustForTime(30)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-indigo-400 border border-neutral-700 active:scale-95">
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="bg-neutral-900/90 border border-indigo-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Target Rounds</span>
                  <span className="text-base font-black text-white font-mono">{forTimeRounds}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => adjustForTimeRounds(-1)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-indigo-400 border border-neutral-700 active:scale-95">
                    <Minus size={14} />
                  </button>
                  <input type="range" min="1" max="12" step="1" value={forTimeRounds} onChange={(e) => setForTimeRounds(Number(e.target.value))} className="w-full accent-indigo-400 h-2 bg-neutral-950 rounded-lg cursor-pointer" />
                  <button type="button" onClick={() => adjustForTimeRounds(1)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-indigo-400 border border-neutral-700 active:scale-95">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Phase Pill */}
      <div className="flex items-center gap-3 mb-2">
        {mode === 'DYNAMIC' && (
          <span className="px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {enginePhase === 'PREP_7'
              ? 'PREP (7s)'
              : dynamicSubMode === 'RUN' && enginePhase === 'RUNNING'
              ? 'WARM-UP RUN'
              : enginePhase === 'POST_REST_60'
              ? 'COOL-DOWN (60s)'
              : `STRETCH ${currentStretchRound}/${stretchRounds}`}
          </span>
        )}
        {mode === 'TABATA' && (
          <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase ${
            isWorkPhase ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {enginePhase === 'PREP_7' ? 'PREP (7s)' : isWorkPhase ? `WORK - ROUND ${currentRound}` : `REST - ROUND ${currentRound}`}
          </span>
        )}
        {mode === 'EMOM' && (
          <span className="px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {enginePhase === 'PREP_7' ? 'PREP (7s)' : `ROUND ${currentRound}`}
          </span>
        )}
        {mode === 'AMRAP' && (
          <span className="px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
            {enginePhase === 'PREP_7' ? 'PREP (7s)' : `AMRAP (${formatIntervalLabel(amrapDuration)})`}
          </span>
        )}
        {mode === 'FOR_TIME' && (
          <span className="px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {enginePhase === 'PREP_7' ? 'PREP (7s)' : `FOR TIME (CAP: ${formatIntervalLabel(forTimeCap)})`}
          </span>
        )}
      </div>

      {/* Clean Horizontal Round Counter Bar Positioned Above Clock */}
      {roundInfo.hasRounds && (
        <div
          onClick={() => {
            if (mode === 'AMRAP' && !isProjectorView) {
              setCurrentRound((r) => r + 1);
            }
          }}
          className={`flex items-center justify-center gap-3.5 px-5 py-2.5 my-2 bg-neutral-900/90 border border-neutral-800/80 rounded-2xl shadow-lg backdrop-blur-md transition-all ${
            mode === 'AMRAP' ? 'cursor-pointer hover:border-fuchsia-500/50 active:scale-95' : ''
          }`}
          title={mode === 'AMRAP' ? 'Click to log +1 completed round' : undefined}
        >
          {/* Active Round Fraction */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-neutral-400">Round</span>
            <div className="flex items-baseline font-mono">
              <span className="text-lg font-black text-cyan-400">{roundInfo.active}</span>
              <span className="text-xs font-bold text-neutral-500">/{roundInfo.total}</span>
            </div>
          </div>

          <span className="text-neutral-800">|</span>

          {/* Remaining Badge */}
          <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 font-mono">
            {mode === 'AMRAP' ? '+1 LOG SCORE' : roundInfo.remaining === 0 ? 'FINAL ROUND' : `${roundInfo.remaining} LEFT`}
          </span>

          {/* Horizontal Progress Pips */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.min(12, roundInfo.total) }).map((_, idx) => {
              const roundNum = idx + 1;
              const isDone = roundNum < roundInfo.active;
              const isCurrent = roundNum === roundInfo.active;

              return (
                <div
                  key={roundNum}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isCurrent
                      ? 'w-5 bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)]'
                      : isDone
                      ? 'w-2 bg-emerald-500/80'
                      : 'w-2 bg-neutral-800'
                  }`}
                  title={`Round ${roundNum}`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Dead-Centered Clock Display with Halo Ring */}
      <div className={`relative flex items-center justify-center my-4 ${
        isProjectorView 
          ? 'w-[440px] h-[440px] sm:w-[560px] sm:h-[560px] md:w-[700px] md:h-[700px]' 
          : 'w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] md:w-[480px] md:h-[480px]'
      }`}>
        {/* Glowing Progress Ring Halo */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none drop-shadow-md" viewBox="0 0 500 500">
          <circle
            cx="250"
            cy="250"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="12"
            className="text-neutral-900/80"
          />
          <circle
            cx="250"
            cy="250"
            r={radius}
            fill="transparent"
            strokeWidth="14"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-linear ${getRingColorClass()}`}
          />
        </svg>

        {/* Large Digits */}
        <div className={`relative z-10 font-black tracking-tighter select-none font-mono transition-colors duration-300 ${
          isProjectorView 
            ? 'text-[12rem] sm:text-[16rem] md:text-[22rem]' 
            : 'text-8xl sm:text-9xl md:text-[10.5rem]'
        } ${getTimerTextColorClass()}`}>
          {formatDisplayTime(secondsRemaining)}
        </div>
      </div>

      {/* Controller Buttons */}
      {!isProjectorView && (
        <div className="flex items-center gap-4 mt-2 z-10">
          <button
            onClick={isActive ? handlePause : handleStart}
            className={`p-6 rounded-3xl font-black flex items-center gap-2 transition-all shadow-xl active:scale-95 ${
              isActive ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950' : 'bg-cyan-500 hover:bg-cyan-400 text-neutral-950'
            }`}
          >
            {isActive ? <Pause size={32} /> : <Play size={32} />}
          </button>
          <button
            onClick={handleReset}
            className="p-6 rounded-3xl bg-neutral-800 hover:bg-neutral-700 text-white transition-all border border-neutral-700 active:scale-95"
          >
            <RotateCcw size={32} />
          </button>
          <button
            onClick={handleSkip}
            className="p-6 rounded-3xl bg-neutral-800 hover:bg-neutral-700 text-white transition-all border border-neutral-700 active:scale-95"
          >
            <FastForward size={32} />
          </button>
        </div>
      )}
    </div>
  );
}
