'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, FastForward, Timer, Plus, Minus, Maximize, Minimize, Volume2, Mic } from 'lucide-react';
import { soundEngine } from '@/utils/audio';

interface WorkoutEngineProps {
  onBroadcast?: (state: any) => void;
  incomingState?: any;
  isProjectorView?: boolean;
}

export default function WorkoutEngine({ onBroadcast, incomingState, isProjectorView = false }: WorkoutEngineProps) {
  const [mode, setMode] = useState<'WARM_UP' | 'TABATA' | 'AMRAP' | 'EMOM' | 'FOR_TIME'>('WARM_UP');
  const [enablePrep, setEnablePrep] = useState<boolean>(false);

  // Sound and voice states
  const [soundMode, setSoundMode] = useState<'WHISTLE' | 'SYNTH'>('WHISTLE');
  const [voiceCues, setVoiceCues] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Warm-Up
  const [warmupSeconds, setWarmupSeconds] = useState(180);

  // Tabata
  const [tabataWork, setTabataWork] = useState(20);
  const [tabataRest, setTabataRest] = useState(10);
  const [tabataRounds, setTabataRounds] = useState(8);
  const [currentRound, setCurrentRound] = useState(1);
  const [isWorkPhase, setIsWorkPhase] = useState(true);

  // EMOM
  const [emomInterval, setEmomInterval] = useState(60);
  const [emomRounds, setEmomRounds] = useState(8);

  // AMRAP
  const [amrapDuration, setAmrapDuration] = useState(300);
  const [amrapRounds, setAmrapRounds] = useState(8);

  // FOR TIME
  const [forTimeCap, setForTimeCap] = useState(600);
  const [forTimeRounds, setForTimeRounds] = useState(8);

  const [secondsRemaining, setSecondsRemaining] = useState(180);
  const [isActive, setIsActive] = useState(false);
  const [enginePhase, setEnginePhase] = useState<'IDLE' | 'PREP_7' | 'RUNNING' | 'FINISHED'>('IDLE');

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
      secondsRemaining,
      isActive,
      enginePhase,
      currentRound,
      isWorkPhase,
      warmupSeconds,
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

  // Fullscreen Handler
  const toggleFullScreen = () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Flash state handler confined inside circle
  useEffect(() => {
    const prev = prevPhaseRef.current;
    
    if (enginePhase === 'FINISHED' && prev.phase !== 'FINISHED') {
      setFlashType('FINISH');
      soundEngine.speak('Workout Complete');
      const timer = setTimeout(() => setFlashType(null), 650);
      prevPhaseRef.current = { phase: enginePhase, isWork: isWorkPhase };
      return () => clearTimeout(timer);
    }

    const isNowRest = mode === 'TABATA' && enginePhase === 'RUNNING' && !isWorkPhase;
    const wasRest = prev.phase === 'RUNNING' && !prev.isWork;

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
      setSecondsRemaining(incomingState.secondsRemaining);
      setIsActive(incomingState.isActive);
      setEnginePhase(incomingState.enginePhase);
      setCurrentRound(incomingState.currentRound);
      setIsWorkPhase(incomingState.isWorkPhase);
      setWarmupSeconds(incomingState.warmupSeconds ?? 180);
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
            if (mode === 'WARM_UP') return warmupSeconds;
            if (mode === 'TABATA') return tabataWork;
            if (mode === 'EMOM') return emomInterval;
            if (mode === 'AMRAP') return amrapDuration;
            if (mode === 'FOR_TIME') return 0;
            return 0;
          });
          return;
        }

        if (mode === 'WARM_UP') {
          setSecondsRemaining((prev) => {
            if (prev > 1) return prev - 1;
            soundEngine.playRest();
            setEnginePhase('FINISHED');
            setIsActive(false);
            return 0;
          });
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
    warmupSeconds,
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
    secondsRemaining,
    isActive,
    enginePhase,
    currentRound,
    isWorkPhase,
    enablePrep,
    warmupSeconds,
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
        if (mode === 'WARM_UP') setSecondsRemaining(warmupSeconds);
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

  const toggleStartPause = () => {
    if (isProjectorView) return;
    if (isActive) {
      handlePause();
    } else {
      handleStart();
    }
  };

  const handleReset = () => {
    setIsActive(false);
    setEnginePhase('IDLE');
    setCurrentRound(1);
    setIsWorkPhase(true);

    if (mode === 'WARM_UP') {
      setSecondsRemaining(warmupSeconds);
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
    if (mode === 'WARM_UP') {
      soundEngine.playRest();
      setEnginePhase('FINISHED');
      setIsActive(false);
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

  // 1-Tap Preset Loaders
  const loadPreset = (preset: 'TABATA_STD' | 'SPRINT_INTERVALS' | 'EMOM_8' | 'AMRAP_5' | 'WARMUP_3') => {
    handleReset();
    if (preset === 'TABATA_STD') {
      setMode('TABATA');
      setTabataWork(20);
      setTabataRest(10);
      setTabataRounds(8);
      setSecondsRemaining(20);
    } else if (preset === 'SPRINT_INTERVALS') {
      setMode('TABATA');
      setTabataWork(30);
      setTabataRest(30);
      setTabataRounds(6);
      setSecondsRemaining(30);
    } else if (preset === 'EMOM_8') {
      setMode('EMOM');
      setEmomInterval(60);
      setEmomRounds(8);
      setSecondsRemaining(60);
    } else if (preset === 'AMRAP_5') {
      setMode('AMRAP');
      setAmrapDuration(300);
      setAmrapRounds(8);
      setSecondsRemaining(300);
    } else if (preset === 'WARMUP_3') {
      setMode('WARM_UP');
      setWarmupSeconds(180);
      setSecondsRemaining(180);
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
        toggleStartPause();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      } else if (e.key === 's' || e.key === 'S' || e.code === 'ArrowRight') {
        e.preventDefault();
        handleSkip();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullScreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, enginePhase, mode, currentRound, isWorkPhase, isProjectorView]);

  const adjustWarmup = (delta: number) => {
    const nextVal = Math.min(900, Math.max(30, warmupSeconds + delta));
    setWarmupSeconds(nextVal);
    if (mode === 'WARM_UP' && enginePhase === 'IDLE') setSecondsRemaining(nextVal);
  };

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
    if (mode === 'WARM_UP') {
      return { active: 1, total: 1, remaining: 0, hasRounds: false };
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

  // Next Up Sub-Badge Prediction
  const getNextUpLabel = (): string => {
    if (enginePhase === 'PREP_7') {
      return mode === 'WARM_UP' ? 'NEXT: WARM-UP' : mode === 'TABATA' ? `NEXT: WORK (${tabataWork}s)` : 'NEXT: WORK';
    }
    if (enginePhase === 'FINISHED') return 'WORKOUT COMPLETE';

    if (mode === 'WARM_UP') return 'NEXT: WORKOUT FINISH';
    if (mode === 'TABATA') {
      if (isWorkPhase) {
        return tabataRest > 0 ? `NEXT: REST (${tabataRest}s)` : currentRound < tabataRounds ? `NEXT: ROUND ${currentRound + 1}` : 'NEXT: COMPLETE';
      } else {
        return currentRound < tabataRounds ? `NEXT: WORK - ROUND ${currentRound + 1}` : 'NEXT: COMPLETE';
      }
    }
    if (mode === 'EMOM') {
      return currentRound < emomRounds ? `NEXT: ROUND ${currentRound + 1}` : 'NEXT: COMPLETE';
    }
    if (mode === 'AMRAP') return 'NEXT: TIME CAP';
    if (mode === 'FOR_TIME') return 'NEXT: TIME CAP';
    return '';
  };

  const isRestPhaseActive = (): boolean => {
    if (mode === 'TABATA' && enginePhase === 'RUNNING' && !isWorkPhase) return true;
    return false;
  };

  const isWorkTenSecondsLeft = (): boolean => {
    if (enginePhase !== 'RUNNING') return false;

    if (mode === 'WARM_UP') {
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

    if (mode === 'WARM_UP') {
      return warmupSeconds > 0 ? (secondsRemaining / warmupSeconds) * 100 : 0;
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
  // Way bigger circle radius: 455 on 1000x1000 canvas gives 910px diameter with ample numeral breathing room
  const radius = 455;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

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
    if (isResting) return 'text-amber-400 drop-shadow-[0_0_35px_rgba(251,191,36,0.6)]';
    if (showRedCountdown) return 'text-rose-500 drop-shadow-[0_0_35px_rgba(244,63,94,0.6)]';
    return 'text-white drop-shadow-2xl';
  };

  return (
    <div className={`relative flex flex-col items-center justify-center w-full rounded-3xl p-3 sm:p-5 border border-neutral-900 bg-neutral-950/90 transition-colors ${
      isProjectorView ? 'min-h-screen justify-between py-6' : 'min-h-[75vh]'
    }`}>
      {/* Top Utility Header Bar */}
      {!isProjectorView && (
        <div className="flex items-center justify-between w-full max-w-4xl px-2 mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const next = soundMode === 'WHISTLE' ? 'SYNTH' : 'WHISTLE';
                soundEngine.soundType = next;
                setSoundMode(next);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white"
              title="Toggle Whistle / Tone Chime"
            >
              <Volume2 size={13} className="text-cyan-400" />
              <span>{soundMode}</span>
            </button>

            <button
              onClick={() => {
                const next = !voiceCues;
                soundEngine.speechEnabled = next;
                setVoiceCues(next);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                voiceCues ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-neutral-900 border-neutral-800 text-neutral-500'
              }`}
              title="Toggle Voice Announcements"
            >
              <Mic size={13} />
              <span>VOICE: {voiceCues ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          <button
            onClick={toggleFullScreen}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white active:scale-95"
            title="Toggle True Fullscreen (F)"
          >
            {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
            <span>FULLSCREEN (F)</span>
          </button>
        </div>
      )}

      {/* Preset Quick-Load Drill Pills */}
      {!isProjectorView && !isActive && (
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3 max-w-2xl">
          <span className="text-[11px] font-black uppercase text-neutral-500 mr-1">Presets:</span>
          <button onClick={() => loadPreset('TABATA_STD')} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300">Tabata 20/10</button>
          <button onClick={() => loadPreset('SPRINT_INTERVALS')} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300">Sprint 30/30</button>
          <button onClick={() => loadPreset('EMOM_8')} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300">EMOM 8 Rds</button>
          <button onClick={() => loadPreset('AMRAP_5')} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300">AMRAP 5m</button>
          <button onClick={() => loadPreset('WARMUP_3')} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300">Warm-Up 3m</button>
        </div>
      )}

      {/* Mode Controls when stopped */}
      {!isProjectorView && !isActive && (
        <div className="flex flex-col items-center gap-3 mb-3 w-full animate-in fade-in duration-300">
          <div className="flex flex-wrap gap-2 bg-neutral-900/90 p-2 rounded-2xl border border-neutral-800 justify-center">
            {(['WARM_UP', 'TABATA', 'EMOM', 'AMRAP', 'FOR_TIME'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setIsActive(false);
                  setEnginePhase('IDLE');
                  setCurrentRound(1);
                  if (m === 'WARM_UP') setSecondsRemaining(warmupSeconds);
                  else if (m === 'TABATA') setSecondsRemaining(tabataWork);
                  else if (m === 'EMOM') setSecondsRemaining(emomInterval);
                  else if (m === 'AMRAP') setSecondsRemaining(amrapDuration);
                  else if (m === 'FOR_TIME') setSecondsRemaining(0);
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

          {/* Steppers */}
          {mode === 'WARM_UP' && (
            <div className="flex flex-col gap-2 w-full max-w-sm mt-1">
              <div className="bg-neutral-900/90 border border-cyan-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Duration (±30s)</span>
                  <span className="text-base font-black text-white font-mono">{formatIntervalLabel(warmupSeconds)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => adjustWarmup(-30)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 active:scale-95"><Minus size={14} /></button>
                  <input type="range" min="30" max="900" step="30" value={warmupSeconds} onChange={(e) => { const v = Number(e.target.value); setWarmupSeconds(v); if (enginePhase === 'IDLE') setSecondsRemaining(v); }} className="w-full accent-cyan-400 h-2 bg-neutral-950 rounded-lg cursor-pointer" />
                  <button type="button" onClick={() => adjustWarmup(30)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 active:scale-95"><Plus size={14} /></button>
                </div>
              </div>
            </div>
          )}

          {mode === 'TABATA' && (
            <div className="flex flex-col gap-2 w-full max-w-md mt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-neutral-900/90 border border-emerald-500/30 rounded-2xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Work</span>
                    <span className="text-base font-black text-white font-mono">{formatIntervalLabel(tabataWork)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => adjustTabataWork(-5)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-neutral-700 active:scale-95"><Minus size={14} /></button>
                    <input type="range" min="5" max="180" step="5" value={tabataWork} onChange={(e) => { const v = Number(e.target.value); setTabataWork(v); if (enginePhase === 'IDLE') setSecondsRemaining(v); }} className="w-full accent-emerald-400 h-2 bg-neutral-950 rounded-lg cursor-pointer" />
                    <button type="button" onClick={() => adjustTabataWork(5)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-neutral-700 active:scale-95"><Plus size={14} /></button>
                  </div>
                </div>

                <div className="bg-neutral-900/90 border border-amber-500/30 rounded-2xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Rest</span>
                    <span className="text-base font-black text-white font-mono">{formatIntervalLabel(tabataRest)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => adjustTabataRest(-5)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 active:scale-95"><Minus size={14} /></button>
                    <input type="range" min="0" max="60" step="5" value={tabataRest} onChange={(e) => setTabataRest(Number(e.target.value))} className="w-full accent-amber-400 h-2 bg-neutral-950 rounded-lg cursor-pointer" />
                    <button type="button" onClick={() => adjustTabataRest(5)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 active:scale-95"><Plus size={14} /></button>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-900/90 border border-cyan-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Rounds</span>
                  <span className="text-base font-black text-white font-mono">{tabataRounds}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => adjustTabataRounds(-1)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 active:scale-95"><Minus size={14} /></button>
                  <input type="range" min="1" max="12" step="1" value={tabataRounds} onChange={(e) => setTabataRounds(Number(e.target.value))} className="w-full accent-cyan-400 h-2 bg-neutral-950 rounded-lg cursor-pointer" />
                  <button type="button" onClick={() => adjustTabataRounds(1)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 active:scale-95"><Plus size={14} /></button>
                </div>
              </div>
            </div>
          )}

          {mode === 'EMOM' && (
            <div className="flex flex-col gap-2 w-full max-w-sm mt-1">
              <div className="bg-neutral-900/90 border border-cyan-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Interval</span>
                  <span className="text-base font-black text-white font-mono">{formatIntervalLabel(emomInterval)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => adjustEmom(-5)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 active:scale-95"><Minus size={14} /></button>
                  <input type="range" min="15" max="180" step="5" value={emomInterval} onChange={(e) => { const v = Number(e.target.value); setEmomInterval(v); if (enginePhase === 'IDLE') setSecondsRemaining(v); }} className="w-full accent-cyan-400 h-2 bg-neutral-950 rounded-lg cursor-pointer" />
                  <button type="button" onClick={() => adjustEmom(5)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 active:scale-95"><Plus size={14} /></button>
                </div>
              </div>

              <div className="bg-neutral-900/90 border border-cyan-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Rounds</span>
                  <span className="text-base font-black text-white font-mono">{emomRounds}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => adjustEmomRounds(-1)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 active:scale-95"><Minus size={14} /></button>
                  <input type="range" min="1" max="12" step="1" value={emomRounds} onChange={(e) => setEmomRounds(Number(e.target.value))} className="w-full accent-cyan-400 h-2 bg-neutral-950 rounded-lg cursor-pointer" />
                  <button type="button" onClick={() => adjustEmomRounds(1)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 active:scale-95"><Plus size={14} /></button>
                </div>
              </div>
            </div>
          )}

          {mode === 'AMRAP' && (
            <div className="flex flex-col gap-2 w-full max-w-sm mt-1">
              <div className="bg-neutral-900/90 border border-fuchsia-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-fuchsia-400 uppercase tracking-wider">Duration</span>
                  <span className="text-base font-black text-white font-mono">{formatIntervalLabel(amrapDuration)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => adjustAmrap(-30)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-fuchsia-400 border border-neutral-700 active:scale-95"><Minus size={14} /></button>
                  <input type="range" min="60" max="1800" step="30" value={amrapDuration} onChange={(e) => { const v = Number(e.target.value); setAmrapDuration(v); if (enginePhase === 'IDLE') setSecondsRemaining(v); }} className="w-full accent-fuchsia-400 h-2 bg-neutral-950 rounded-lg cursor-pointer" />
                  <button type="button" onClick={() => adjustAmrap(30)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-fuchsia-400 border border-neutral-700 active:scale-95"><Plus size={14} /></button>
                </div>
              </div>

              <div className="bg-neutral-900/90 border border-fuchsia-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-fuchsia-400 uppercase tracking-wider">Target Rounds</span>
                  <span className="text-base font-black text-white font-mono">{amrapRounds}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => adjustAmrapRounds(-1)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-fuchsia-400 border border-neutral-700 active:scale-95"><Minus size={14} /></button>
                  <input type="range" min="1" max="12" step="1" value={amrapRounds} onChange={(e) => setEmomRounds(Number(e.target.value))} className="w-full accent-fuchsia-400 h-2 bg-neutral-950 rounded-lg cursor-pointer" />
                  <button type="button" onClick={() => adjustAmrapRounds(1)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-fuchsia-400 border border-neutral-700 active:scale-95"><Plus size={14} /></button>
                </div>
              </div>
            </div>
          )}

          {mode === 'FOR_TIME' && (
            <div className="flex flex-col gap-2 w-full max-w-sm mt-1">
              <div className="bg-neutral-900/90 border border-indigo-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Time Cap</span>
                  <span className="text-base font-black text-white font-mono">{formatIntervalLabel(forTimeCap)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => adjustForTime(-30)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-indigo-400 border border-neutral-700 active:scale-95"><Minus size={14} /></button>
                  <input type="range" min="60" max="3600" step="30" value={forTimeCap} onChange={(e) => setForTimeCap(Number(e.target.value))} className="w-full accent-indigo-400 h-2 bg-neutral-950 rounded-lg cursor-pointer" />
                  <button type="button" onClick={() => adjustForTime(30)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-indigo-400 border border-neutral-700 active:scale-95"><Plus size={14} /></button>
                </div>
              </div>

              <div className="bg-neutral-900/90 border border-indigo-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Target Rounds</span>
                  <span className="text-base font-black text-white font-mono">{forTimeRounds}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => adjustForTimeRounds(-1)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-indigo-400 border border-neutral-700 active:scale-95"><Minus size={14} /></button>
                  <input type="range" min="1" max="12" step="1" value={forTimeRounds} onChange={(e) => setForTimeRounds(Number(e.target.value))} className="w-full accent-indigo-400 h-2 bg-neutral-950 rounded-lg cursor-pointer" />
                  <button type="button" onClick={() => adjustForTimeRounds(1)} className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-indigo-400 border border-neutral-700 active:scale-95"><Plus size={14} /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Indicators: Phase Badge + Horizontal Round Counter */}
      <div className="flex flex-col items-center gap-2 w-full">
        <div className="flex items-center gap-3">
          {mode === 'WARM_UP' && (
            <span className="px-5 py-2 rounded-full text-xs md:text-sm font-black tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {enginePhase === 'PREP_7' ? 'PREP (7s)' : 'WARM-UP'}
            </span>
          )}
          {mode === 'TABATA' && (
            <span className={`px-5 py-2 rounded-full text-xs md:text-sm font-black tracking-widest uppercase ${
              isWorkPhase ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {enginePhase === 'PREP_7' ? 'PREP (7s)' : isWorkPhase ? `WORK - ROUND ${currentRound}` : `REST - ROUND ${currentRound}`}
            </span>
          )}
          {mode === 'EMOM' && (
            <span className="px-5 py-2 rounded-full text-xs md:text-sm font-black tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {enginePhase === 'PREP_7' ? 'PREP (7s)' : `ROUND ${currentRound}`}
            </span>
          )}
          {mode === 'AMRAP' && (
            <span className="px-5 py-2 rounded-full text-xs md:text-sm font-black tracking-widest uppercase bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
              {enginePhase === 'PREP_7' ? 'PREP (7s)' : `AMRAP (${formatIntervalLabel(amrapDuration)})`}
            </span>
          )}
          {mode === 'FOR_TIME' && (
            <span className="px-5 py-2 rounded-full text-xs md:text-sm font-black tracking-widest uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {enginePhase === 'PREP_7' ? 'PREP (7s)' : `FOR TIME (CAP: ${formatIntervalLabel(forTimeCap)})`}
            </span>
          )}
        </div>

        {/* Round Counter Bar */}
        {roundInfo.hasRounds && (
          <div
            onClick={(e) => {
              if (mode === 'AMRAP' && !isProjectorView) {
                e.stopPropagation();
                setCurrentRound((r) => r + 1);
              }
            }}
            className={`flex items-center justify-center gap-3.5 px-6 py-2 bg-neutral-900/90 border border-neutral-800/80 rounded-2xl shadow-lg backdrop-blur-md transition-all ${
              mode === 'AMRAP' ? 'cursor-pointer hover:border-fuchsia-500/50 active:scale-95' : ''
            }`}
            title={mode === 'AMRAP' ? 'Click to log +1 completed round' : undefined}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xs md:text-sm font-black uppercase tracking-wider text-neutral-400">Round</span>
              <div className="flex items-baseline font-mono">
                <span className="text-xl md:text-2xl font-black text-cyan-400">{roundInfo.active}</span>
                <span className="text-sm md:text-base font-bold text-neutral-500">/{roundInfo.total}</span>
              </div>
            </div>

            <span className="text-neutral-800">|</span>

            <span className="text-xs md:text-sm font-black uppercase tracking-wider text-amber-400 font-mono">
              {mode === 'AMRAP' ? '+1 LOG SCORE' : roundInfo.remaining === 0 ? 'FINAL ROUND' : `${roundInfo.remaining} LEFT`}
            </span>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: Math.min(12, roundInfo.total) }).map((_, idx) => {
                const roundNum = idx + 1;
                const isDone = roundNum < roundInfo.active;
                const isCurrent = roundNum === roundInfo.active;

                return (
                  <div
                    key={roundNum}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      isCurrent
                        ? 'w-6 bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)]'
                        : isDone
                        ? 'w-2.5 bg-emerald-500/80'
                        : 'w-2.5 bg-neutral-800'
                    }`}
                    title={`Round ${roundNum}`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Massive Non-Overlapping Circle Arena */}
      <div
        onClick={toggleStartPause}
        role="button"
        tabIndex={0}
        aria-label={isActive ? 'Pause timer' : 'Start timer'}
        className={`relative flex items-center justify-center my-auto cursor-pointer select-none active:scale-[0.985] transition-transform duration-150 ${
          isProjectorView 
            ? 'w-[82vw] max-w-[880px] h-[82vw] max-h-[880px]' 
            : 'w-[320px] h-[320px] sm:w-[420px] sm:h-[420px] md:w-[500px] md:h-[500px]'
        }`}
      >
        {/* Flash confined inside the circle */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none z-0">
          {flashType === 'REST' && <div className="w-full h-full bg-amber-400/40 animate-out fade-out duration-500" />}
          {flashType === 'FINISH' && <div className="w-full h-full bg-rose-600/50 animate-out fade-out duration-700" />}
        </div>

        {/* 1000x1000 SVG Canvas with 455 Radius Halo for complete numeral clearance */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none drop-shadow-md z-10" viewBox="0 0 1000 1000">
          <circle
            cx="500"
            cy="500"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="20"
            className="text-neutral-900/90"
          />
          <circle
            cx="500"
            cy="500"
            r={radius}
            fill="transparent"
            strokeWidth="24"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-linear ${getRingColorClass()}`}
          />
        </svg>

        {/* Scaled Digits Centered Inside Ring */}
        <div className={`relative z-20 font-black tracking-tight select-none font-mono transition-colors duration-300 pointer-events-none ${
          isProjectorView 
            ? 'text-[18vw] max-text-[15rem] leading-none' 
            : 'text-7xl sm:text-8xl md:text-9xl'
        } ${getTimerTextColorClass()}`}>
          {formatDisplayTime(secondsRemaining)}
        </div>
      </div>

      {/* Feature 1: NEXT UP Preview Sub-Badge */}
      {isActive && getNextUpLabel() && (
        <div className="z-20 mt-1 mb-2 px-5 py-2 rounded-full bg-neutral-900/90 border border-neutral-800 flex items-center justify-center animate-in fade-in duration-300">
          <span className="text-xs md:text-sm font-black tracking-widest text-neutral-400 uppercase font-mono">
            {getNextUpLabel()}
          </span>
        </div>
      )}

      {/* Controller Buttons */}
      {!isProjectorView && (
        <div className="flex items-center gap-4 mt-1 z-20">
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
