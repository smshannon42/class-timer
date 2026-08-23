'use client';
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Edit3, Check, X, FastForward, Activity, Flame } from 'lucide-react';
import { soundEngine } from '@/utils/audio';
import { RemoteSyncState } from '@/hooks/useRemoteSync';

interface WorkoutEngineProps {
  onBroadcast?: (state: Omit<RemoteSyncState, 'timestamp'>) => void;
  incomingState?: RemoteSyncState | null;
  isProjectorView?: boolean;
}

type WorkoutMode = 'DYNAMIC' | 'COOLDOWN' | 'TABATA' | 'AMRAP' | 'EMOM' | 'FOR_TIME' | 'WARMUP';
type DynamicSubMode = 'STRETCH' | 'RUN';

export default function WorkoutEngine({ onBroadcast, incomingState, isProjectorView = false }: WorkoutEngineProps) {
  const [mode, setMode] = useState<WorkoutMode>('DYNAMIC');
  const [dynamicSubMode, setDynamicSubMode] = useState<DynamicSubMode>('RUN');
  const [enginePhase, setEnginePhase] = useState<'IDLE' | 'PREP_15' | 'RUNNING' | 'CARD_FLASH' | 'POST_REST_90' | 'FINISHED'>('IDLE');

  // Dynamic Stretch Settings (6 rounds x 20s = 2:00)
  const [stretchSeconds, setStretchSeconds] = useState(180);
  const [stretchRounds, setStretchRounds] = useState(6);
  const [currentStretchRound, setCurrentStretchRound] = useState(1);

  // Warmup Run Settings (Default 3 min = 180s)
  const [warmupRunSeconds, setWarmupRunSeconds] = useState(180);

  // Tabata Settings
  const [tabataWork, setTabataWork] = useState(20);
  const [tabataRest, setTabataRest] = useState(10);
  const [tabataRounds, setTabataRounds] = useState(8);

  // AMRAP Settings
  const [amrapTotalSeconds, setAmrapTotalSeconds] = useState(180);

  // EMOM Settings
  const [emomInterval, setEmomInterval] = useState(60);
  const [emomRounds, setEmomRounds] = useState(10);

  // For Time Settings
  const [forTimeTotalSeconds, setForTimeTotalSeconds] = useState(300);

  // Post-Workout Rest Setting
  const [postRestSeconds, setPostRestSeconds] = useState(90);
  const [isEditingPostRest, setIsEditingPostRest] = useState(false);
  const [editPostRestInput, setEditPostRestInput] = useState('90');

  // Custom edit modal
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [editMinutes, setEditMinutes] = useState('3');
  const [editSeconds, setEditSeconds] = useState('00');

  // Runtime ticker
  const [isActive, setIsActive] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [isWorkPhase, setIsWorkPhase] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(20);

  const emit = (override: Partial<Omit<RemoteSyncState, 'timestamp'>> = {}) => {
    if (onBroadcast) {
      onBroadcast({
        mode,
        isActive,
        secondsRemaining,
        currentRound: mode === 'DYNAMIC' && dynamicSubMode === 'STRETCH' ? currentStretchRound : currentRound,
        isWorkPhase,
        dynamicSubMode,
        stretchRound: currentStretchRound,
        ...override,
      });
    }
  };

  useEffect(() => {
    if (isProjectorView && incomingState) {
      setMode(incomingState.mode);
      setIsActive(incomingState.isActive);
      setSecondsRemaining(incomingState.secondsRemaining);
      setCurrentRound(incomingState.currentRound);
      setIsWorkPhase(incomingState.isWorkPhase);
      if (incomingState.enginePhase) setEnginePhase(incomingState.enginePhase);
      if (incomingState.dynamicSubMode) setDynamicSubMode(incomingState.dynamicSubMode);
      setCurrentStretchRound(incomingState.stretchRound || 1);
    }
  }, [incomingState, isProjectorView]);

  const applyModeDefaults = (newMode: WorkoutMode, subMode: DynamicSubMode = 'RUN') => {
    const resolvedMode = newMode === 'WARMUP' ? 'DYNAMIC' : newMode;
    setMode(resolvedMode);
    setDynamicSubMode(subMode);
    setIsActive(false);
    setEnginePhase('IDLE');
    setCurrentRound(1);
    setCurrentStretchRound(1);
    setIsWorkPhase(true);
    setIsEditingCustom(false);
    setIsEditingPostRest(false);

    let sec = 20;
    if (resolvedMode === 'DYNAMIC') {
      sec = subMode === 'STRETCH' ? stretchSeconds : warmupRunSeconds;
    } else if (resolvedMode === 'TABATA') {
      sec = tabataWork;
    } else if (resolvedMode === 'AMRAP') {
      sec = amrapTotalSeconds;
    } else if (resolvedMode === 'EMOM') {
      sec = emomInterval;
    } else if (resolvedMode === 'FOR_TIME') {
      sec = forTimeTotalSeconds;
    }

    setSecondsRemaining(sec);
    emit({
      mode: resolvedMode,
      isActive: false,
      secondsRemaining: sec,
      currentRound: 1,
      isWorkPhase: true,
      dynamicSubMode: subMode,
      stretchRound: 1,
    });
  };

  const handleModeChange = (newMode: WorkoutMode) => {
    applyModeDefaults(newMode, dynamicSubMode);
  };

  const handleDynamicSubModeChange = (subMode: DynamicSubMode) => {
    if (isActive) return;
    setDynamicSubMode(subMode);
    applyModeDefaults('DYNAMIC', subMode);
  };

  const skipPrepCountdown = () => {
    soundEngine.playWorkGo();
    setEnginePhase('RUNNING');
    let startSec = 20;
    if (mode === 'DYNAMIC' || mode === 'WARMUP') {
      startSec = dynamicSubMode === 'STRETCH' ? stretchSeconds : warmupRunSeconds;
    } else if (mode === 'TABATA') {
      startSec = tabataWork;
    } else if (mode === 'AMRAP') {
      startSec = amrapTotalSeconds;
    } else if (mode === 'EMOM') {
      startSec = emomInterval;
    } else if (mode === 'FOR_TIME') {
      startSec = forTimeTotalSeconds;
    }

    setSecondsRemaining(startSec);
    emit({ secondsRemaining: startSec, isActive: true, currentRound: 1, isWorkPhase: true });
  };

  useEffect(() => {
    if (isProjectorView) return;

    let timer: NodeJS.Timeout;

    if (isActive) {
      timer = setInterval(() => {
        if ((enginePhase as string) === 'CARD_FLASH') {
          setSecondsRemaining((prev) => {
            if (prev > 1) {
              const next = prev - 1;
              emit({ secondsRemaining: next, isActive: true, enginePhase: 'CARD_FLASH' as any });
              return next;
            }
            soundEngine.playRest();
            setEnginePhase('POST_REST_90');
            emit({ secondsRemaining: postRestSeconds, isActive: true, enginePhase: 'POST_REST_90' });
            return postRestSeconds;
          });
          return;
        }
        if (enginePhase === 'PREP_15') {
          setSecondsRemaining((prev) => {
            if (prev <= 4 && prev > 1) soundEngine.playCountdownTick();
            if (prev > 1) {
              const next = prev - 1;
              emit({ secondsRemaining: next, isActive: true });
              return next;
            }

            soundEngine.playWorkGo();
            setEnginePhase('RUNNING');
            let startSec = 20;
            if (mode === 'DYNAMIC' || mode === 'WARMUP') {
              startSec = dynamicSubMode === 'STRETCH' ? stretchSeconds : warmupRunSeconds;
            } else if (mode === 'TABATA') {
              startSec = tabataWork;
            } else if (mode === 'AMRAP') {
              startSec = amrapTotalSeconds;
            } else if (mode === 'EMOM') {
              startSec = emomInterval;
            } else if (mode === 'FOR_TIME') {
              startSec = forTimeTotalSeconds;
            }

            emit({ secondsRemaining: startSec, isActive: true, currentRound: 1, isWorkPhase: true });
            return startSec;
          });
          return;
        }

        if ((enginePhase as string) === 'CARD_FLASH') return 'text-amber-400 animate-pulse drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]';
    if (enginePhase === 'POST_REST_90') {
          setSecondsRemaining((prev) => {
            if (prev <= 4 && prev > 1) soundEngine.playCountdownTick();
            if (prev > 1) {
              const next = prev - 1;
              emit({ secondsRemaining: next, isActive: true });
              return next;
            }
            soundEngine.playCleanupChime();
            setEnginePhase('FINISHED');
            setIsActive(false);
            emit({ secondsRemaining: 0, isActive: false });
            return 0;
          });
          return;
        }

        if (mode === 'DYNAMIC' || mode === 'WARMUP') {
          if (dynamicSubMode === 'STRETCH') {
            setSecondsRemaining((prev) => {
              if (prev <= 4 && prev > 1) soundEngine.playCountdownTick();
              if (prev > 1) {
                const next = prev - 1;
                emit({ secondsRemaining: next, isActive: true, stretchRound: currentStretchRound });
                return next;
              }

              if (currentStretchRound < stretchRounds) {
                soundEngine.playWorkGo();
                const nextR = currentStretchRound + 1;
                setCurrentStretchRound(nextR);
                emit({ stretchRound: nextR, secondsRemaining: stretchSeconds, isActive: true });
                return stretchSeconds;
              } else {
                soundEngine.playCleanupChime();
                setEnginePhase('FINISHED');
                setIsActive(false);
                emit({ secondsRemaining: 0, isActive: false });
                return 0;
              }
            });
          } else {
            // WARM-UP RUN
            setSecondsRemaining((prev) => {
              if (prev <= 4 && prev > 1) soundEngine.playCountdownTick();
              if (prev > 1) {
                const next = prev - 1;
                emit({ secondsRemaining: next, isActive: true });
                return next;
              }
              soundEngine.playCleanupChime();
              setEnginePhase('CARD_FLASH');
              emit({ secondsRemaining: 5, isActive: true, enginePhase: 'CARD_FLASH' as any });
              return 5;
            });
          }
        } else if (mode === 'TABATA') {
          setSecondsRemaining((prev) => {
            if (prev > 1) {
              const next = prev - 1;
              emit({ secondsRemaining: next, isActive: true });
              return next;
            }

            if (isWorkPhase) {
              soundEngine.playRest();
              setIsWorkPhase(false);
              emit({ isWorkPhase: false, secondsRemaining: tabataRest, isActive: true });
              return tabataRest;
            } else {
              if (currentRound < tabataRounds) {
                soundEngine.playWorkGo();
                const nextR = currentRound + 1;
                setCurrentRound(nextR);
                setIsWorkPhase(true);
                emit({ isWorkPhase: true, currentRound: nextR, secondsRemaining: tabataWork, isActive: true });
                return tabataWork;
              } else {
                soundEngine.playCleanupChime();
              setEnginePhase('CARD_FLASH');
              emit({ secondsRemaining: 5, isActive: true, enginePhase: 'CARD_FLASH' as any });
              return 5;
              }
            }
          });
        } else if (mode === 'EMOM') {
          setSecondsRemaining((prev) => {
            if (prev <= 4 && prev > 1) soundEngine.playCountdownTick();
            if (prev > 1) {
              const next = prev - 1;
              emit({ secondsRemaining: next, isActive: true });
              return next;
            }
            if (currentRound < emomRounds) {
              soundEngine.playWorkGo();
              const nextR = currentRound + 1;
              setCurrentRound(nextR);
              emit({ currentRound: nextR, secondsRemaining: emomInterval, isActive: true });
              return emomInterval;
            } else {
              soundEngine.playCleanupChime();
              setEnginePhase('CARD_FLASH');
              emit({ secondsRemaining: 5, isActive: true, enginePhase: 'CARD_FLASH' as any });
              return 5;
            }
          });
        } else if (mode === 'AMRAP' || mode === 'FOR_TIME') {
          setSecondsRemaining((prev) => {
            if (prev <= 4 && prev > 1) soundEngine.playCountdownTick();
            if (prev > 1) {
              const next = prev - 1;
              emit({ secondsRemaining: next, isActive: true });
              return next;
            }
            soundEngine.playCleanupChime();
              setEnginePhase('CARD_FLASH');
              emit({ secondsRemaining: 5, isActive: true, enginePhase: 'CARD_FLASH' as any });
              return 5;
          });
        }
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isActive, enginePhase, mode, dynamicSubMode, currentStretchRound, stretchRounds, stretchSeconds, warmupRunSeconds, isWorkPhase, currentRound, tabataWork, tabataRest, tabataRounds, emomInterval, emomRounds, amrapTotalSeconds, forTimeTotalSeconds, postRestSeconds, isProjectorView]);

  const handleToggleStartPause = () => {
    if (!isActive) {
      if (enginePhase === 'IDLE' || enginePhase === 'FINISHED') {
        setEnginePhase('PREP_15');
        setSecondsRemaining(15);
        soundEngine.playCountdownTick();
        emit({ secondsRemaining: 15, isActive: true });
      }
      setIsActive(true);
      emit({ isActive: true });
    } else {
      setIsActive(false);
      emit({ isActive: false });
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setEnginePhase('IDLE');
    setCurrentRound(1);
    setCurrentStretchRound(1);
    setIsWorkPhase(true);

    let sec = 20;
    if (mode === 'DYNAMIC' || mode === 'WARMUP') {
      sec = dynamicSubMode === 'STRETCH' ? stretchSeconds : warmupRunSeconds;
    } else if (mode === 'TABATA') {
      sec = tabataWork;
    } else if (mode === 'AMRAP') {
      sec = amrapTotalSeconds;
    } else if (mode === 'EMOM') {
      sec = emomInterval;
    } else if (mode === 'FOR_TIME') {
      sec = forTimeTotalSeconds;
    }

    setSecondsRemaining(sec);
    emit({
      isActive: false,
      secondsRemaining: sec,
      currentRound: 1,
      isWorkPhase: true,
      dynamicSubMode,
      stretchRound: 1,
    });
  };

  const adjustWarmupRunSeconds = (delta: number) => {
    if (isActive) return;
    setWarmupRunSeconds((prev) => {
      const next = Math.max(30, prev + delta);
      if ((mode === 'DYNAMIC' || mode === 'WARMUP') && dynamicSubMode === 'RUN') {
        setSecondsRemaining(next);
        emit({ secondsRemaining: next });
      }
      return next;
    });
  };

  const adjustStretchSeconds = (delta: number) => {
    if (isActive) return;
    setStretchSeconds((prev) => {
      const next = Math.max(5, prev + delta);
      if ((mode === 'DYNAMIC' || mode === 'WARMUP') && dynamicSubMode === 'STRETCH') {
        setSecondsRemaining(next);
        emit({ secondsRemaining: next });
      }
      return next;
    });
  };

  const adjustStretchRounds = (delta: number) => {
    if (isActive) return;
    setStretchRounds((prev) => Math.max(1, Math.min(20, prev + delta)));
  };

  const adjustTabataWork = (delta: number) => {
    if (isActive) return;
    setTabataWork((prev) => {
      const next = Math.max(10, prev + delta);
      if (isWorkPhase) {
        setSecondsRemaining(next);
        emit({ secondsRemaining: next });
      }
      return next;
    });
  };

  const adjustTabataRest = (delta: number) => {
    if (isActive) return;
    setTabataRest((prev) => Math.max(5, prev + delta));
  };

  const adjustTabataRounds = (delta: number) => {
    if (isActive) return;
    setTabataRounds((prev) => Math.max(1, Math.min(30, prev + delta)));
  };

  const adjustAmrapSeconds = (delta: number) => {
    if (isActive) return;
    setAmrapTotalSeconds((prev) => {
      const next = Math.max(30, prev + delta);
      setSecondsRemaining(next);
      emit({ secondsRemaining: next });
      return next;
    });
  };

  const adjustEmomInterval = (delta: number) => {
    if (isActive) return;
    setEmomInterval((prev) => {
      const next = Math.max(30, prev + delta);
      setSecondsRemaining(next);
      emit({ secondsRemaining: next });
      return next;
    });
  };

  const adjustEmomRounds = (delta: number) => {
    if (isActive) return;
    setEmomRounds((prev) => Math.max(1, Math.min(60, prev + delta)));
  };

  const adjustForTimeSeconds = (delta: number) => {
    if (isActive) return;
    setForTimeTotalSeconds((prev) => {
      const next = Math.max(30, prev + delta);
      setSecondsRemaining(next);
      emit({ secondsRemaining: next });
      return next;
    });
  };

  const handleSaveCustom = () => {
    const mins = Math.max(0, parseInt(editMinutes) || 0);
    const secs = Math.max(0, Math.min(59, parseInt(editSeconds) || 0));
    const total = mins * 60 + secs;
    if (total > 0) {
      if (mode === 'AMRAP') setAmrapTotalSeconds(total);
      if (mode === 'FOR_TIME') setForTimeTotalSeconds(total);
      if (!isActive) {
        setSecondsRemaining(total);
        emit({ secondsRemaining: total });
      }
    }
    setIsEditingCustom(false);
  };

  const handleSavePostRest = () => {
    const val = parseInt(editPostRestInput) || 90;
    setPostRestSeconds(val);
    if ((enginePhase as string) === 'CARD_FLASH') return 'text-amber-400 animate-pulse drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]';
    if (enginePhase === 'POST_REST_90') {
      setSecondsRemaining(val);
      emit({ secondsRemaining: val });
    }
    setIsEditingPostRest(false);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerTextColor = () => {
    if (enginePhase === 'PREP_15') return 'text-amber-400';
    if ((enginePhase as string) === 'CARD_FLASH') return 'text-amber-400 animate-pulse drop-shadow-[0_0_20px_rgba(251,191,36,0.8)]';
    if (enginePhase === 'POST_REST_90') return 'text-[#E32636]';
    if (mode === 'TABATA' && !isWorkPhase) return 'text-[#E32636]';
    return 'text-white';
  };

  return (
    <div className={`bg-[#001f5c]/95 border-2 border-[#0047BA] rounded-3xl p-5 sm:p-8 shadow-2xl text-white backdrop-blur-md ${
      isProjectorView ? 'p-8 sm:p-12' : ''
    }`}>
      {/* Top Main Mode Bar */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-3 bg-[#020b1c] p-2 rounded-2xl mb-6 border border-[#0047BA]">
        {(['DYNAMIC', 'TABATA', 'AMRAP', 'EMOM', 'FOR_TIME'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => handleModeChange(m)}
            className={`py-3 rounded-xl font-black text-xs sm:text-base tracking-wider transition truncate text-center cursor-pointer ${
              mode === m || (m === 'DYNAMIC' && mode === 'WARMUP')
                ? 'bg-[#0047BA] text-white shadow-lg shadow-[#0047BA]/60 border border-white/30'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            {m === 'DYNAMIC' ? 'DYNAMIC' : m.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Dynamic Status Indicator */}
      <div className="text-center mb-3">
        {enginePhase === 'PREP_15' ? (
          <span className="text-sm sm:text-lg font-black uppercase tracking-widest px-6 py-2 rounded-full bg-amber-500/20 text-amber-300 border-2 border-amber-500/50 animate-pulse">
            ⚠️ PRE-COUNTDOWN: 15s PREP
          </span>
        ) : enginePhase === 'POST_REST_90' ? (
          <span className="text-sm sm:text-lg font-black uppercase tracking-widest px-6 py-2 rounded-full bg-[#E32636]/20 text-[#E32636] border-2 border-[#E32636]/50 animate-pulse">
            🛑 {postRestSeconds}s POST-WORKOUT REST
          </span>
        ) : mode === 'DYNAMIC' || mode === 'WARMUP' ? (
          <span className="text-sm sm:text-base font-black uppercase tracking-widest px-5 py-1.5 rounded-full border-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
            {dynamicSubMode === 'STRETCH'
              ? `DYNAMIC STRETCH ${currentStretchRound} OF ${stretchRounds} (${stretchSeconds}s)`
              : `WARM-UP RUN (${formatTime(warmupRunSeconds)})`}
          </span>
        ) : mode === 'TABATA' ? (
          <span className={`text-sm sm:text-base font-black uppercase tracking-widest px-5 py-1.5 rounded-full border-2 ${
            isWorkPhase ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-[#E32636]/20 text-[#E32636] border-[#E32636]/50'
          }`}>
            {isWorkPhase ? `WORK (${tabataWork}s)` : `REST (${tabataRest}s)`}
          </span>
        ) : mode === 'EMOM' ? (
          <span className="text-sm sm:text-base font-black uppercase tracking-widest px-5 py-1.5 rounded-full bg-[#0047BA]/40 text-white border-2 border-[#0047BA]">
            ROUND {currentRound} OF {emomRounds} ({emomInterval}s)
          </span>
        ) : mode === 'AMRAP' ? (
          <span className="text-sm sm:text-base font-black uppercase tracking-widest px-5 py-1.5 rounded-full bg-[#E32636]/20 text-[#E32636] border-2 border-[#E32636]/50">
            AMRAP: {formatTime(amrapTotalSeconds)}
          </span>
        ) : (
          <span className="text-sm sm:text-base font-black uppercase tracking-widest px-5 py-1.5 rounded-full bg-[#00 text-white border-2 border-[#0047BA]">
            FOR TIME: {formatTime(forTimeTotalSeconds)}
          </span>
        )}
      </div>

      {/* Editing Custom Time Modal */}
      {isEditingCustom ? (
        <div className="flex flex-col items-center justify-center gap-4 my-6 bg-[#020b1c] p-6 rounded-3xl border-2 border-[#0047BA] shadow-2xl max-w-md mx-auto">
          <span className="text-sm uppercase font-black tracking-widest text-[#E32636]">Set Custom Duration</span>
          <div className="flex items-center justify-center gap-3">
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase font-bold text-blue-300 mb-1">Mins</span>
              <input
                type="number"
                min="0"
                max="99"
                value={editMinutes}
                onChange={(e) => setEditMinutes(e.target.value)}
                className="w-24 text-center bg-[#001f5c] border-2 border-[#0047BA] text-white font-mono font-black text-5xl rounded-2xl p-2.5 focus:outline-none focus:border-[#E32636]"
              />
            </div>
            <span className="text-5xl font-mono font-black text-[#0047BA] mt-4">:</span>
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase font-bold text-blue-300 mb-1">Secs</span>
              <input
                type="number"
                min="0"
                max="59"
                value={editSeconds}
                onChange={(e) => setEditSeconds(e.target.value)}
                className="w-24 text-center bg-[#001f5c] border-2 border-[#0047BA] text-white font-mono font-black text-5xl rounded-2xl p-2.5 focus:outline-none focus:border-[#E32636]"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 w-full justify-center">
            <button
              type="button"
              onClick={handleSaveCustom}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-white font-black transition text-sm cursor-pointer shadow-lg"
            >
              <Check className="w-5 h-5 stroke-[3]" /> Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditingCustom(false)}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-slate-800 hover:bg-slate-700 rounded-2xl text-slate-300 font-black transition text-sm cursor-pointer shadow-lg"
            >
              <X className="w-5 h-5 stroke-[3]" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={`text-center font-mono font-black tracking-tight my-3 select-none ${
          isProjectorView ? 'text-[16vw] leading-none' : 'text-8xl sm:text-9xl landscape:text-[25vh]'
        } ${getTimerTextColor()}`}>
          {(enginePhase as string) === 'CARD_FLASH' ? '00:00' : formatTime(secondsRemaining)}
        </div>
      )}

      {/* Subtitles & Skip Button */}
      <div className="text-center text-base sm:text-lg font-bold text-blue-200 mb-6">
        {enginePhase === 'PREP_15' ? (
          <div className="flex items-center justify-center gap-3">
            <span className={`text-amber-300 font-black ${isProjectorView ? "text-5xl sm:text-7xl md:text-[6vw]" : "text-xl"}`}>Get In Position</span>
            {!isProjectorView && (
              <button
                type="button"
                onClick={skipPrepCountdown}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-sm rounded-2xl shadow-xl transition active:scale-95 cursor-pointer"
              >
                <FastForward className="w-5 h-5 fill-current" /> SKIP PREP
              </button>
            )}
          </div>
        ) : enginePhase === 'POST_REST_90' ? (
          <div className="flex items-center justify-center gap-3">
            <span className={`text-[#E32636] font-black ${isProjectorView ? "text-5xl sm:text-7xl md:text-[6vw]" : "text-xl"}`}>Heart Rate Recovery</span>
            {!isProjectorView && (
              <button
                type="button"
                onClick={() => {
                  setEditPostRestInput(postRestSeconds.toString());
                  setIsEditingPostRest(true);
                }}
                className="text-sm bg-[#020b1c] px-3.5 py-1.5 rounded-xl border-2 border-[#E32636]/60 text-white font-black flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Edit3 className="w-4 h-4" /> Edit Rest
              </button>
            )}
          </div>
        ) : mode === 'DYNAMIC' || mode === 'WARMUP' ? (
          <span>
            {dynamicSubMode === 'STRETCH' ? (
              <>Stretch <span className="text-white text-2xl font-black">{currentStretchRound}</span> of {stretchRounds} (Continuous 20s)</>
            ) : (
              'Continuous Warm-up Run'
            )}
          </span>
        ) : mode === 'TABATA' ? (
          <span>Round <span className="text-white text-2xl font-black">{currentRound}</span> of {tabataRounds}</span>
        ) : mode === 'EMOM' ? (
          <span>Round <span className="text-white text-2xl font-black">{currentRound}</span> of {emomRounds}</span>
        ) : null}
      </div>

      {/* Post Rest Edit Modal */}
      {isEditingPostRest && (
        <div className="flex items-center justify-center gap-3 bg-[#020b1c] p-4 rounded-3xl border-2 border-[#0047BA] max-w-sm mx-auto mb-6 shadow-2xl">
          <input
            type="number"
            value={editPostRestInput}
            onChange={(e) => setEditPostRestInput(e.target.value)}
            className="w-24 text-center bg-[#001f5c] border-2 border-[#0047BA] text-white font-mono font-black text-3xl rounded-2xl p-2"
          />
          <span className="text-sm text-blue-300 font-bold">Seconds</span>
          <button type="button" onClick={handleSavePostRest} className="p-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white">
            <Check className="w-6 h-6 stroke-[3]" />
          </button>
          <button type="button" onClick={() => setIsEditingPostRest(false)} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300">
            <X className="w-6 h-6 stroke-[3]" />
          </button>
        </div>
      )}

      {/* DYNAMIC CARD: BIG BUTTONS TO CHOOSE BETWEEN STRETCHES OR RUN */}
      {!isProjectorView && (mode === 'DYNAMIC' || mode === 'WARMUP') && (
        <div className="space-y-4 max-w-lg mx-auto mb-6">
          {!isActive && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDynamicSubModeChange('STRETCH')}
                className={`flex flex-col items-center justify-center gap-1 py-4 px-2 rounded-2xl border-2 font-black transition cursor-pointer active:scale-95 shadow-lg ${
                  dynamicSubMode === 'STRETCH'
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow-emerald-600/30'
                    : 'bg-[#020b1c] border-[#0047BA] text-blue-300 hover:text-white'
                }`}
              >
                <Activity className="w-6 h-6" />
                <span className="text-sm uppercase tracking-wider">Dynamic Stretches</span>
                <span className="text-[10px] opacity-80">6 × 20s (2 Min Total)</span>
              </button>

              <button
                type="button"
                onClick={() => handleDynamicSubModeChange('RUN')}
                className={`flex flex-col items-center justify-center gap-1 py-4 px-2 rounded-2xl border-2 font-black transition cursor-pointer active:scale-95 shadow-lg ${
                  dynamicSubMode === 'RUN'
                    ? 'bg-[#E32636] border-[#ff5a68] text-white shadow-[#E32636]/30'
                    : 'bg-[#020b1c] border-[#0047BA] text-blue-300 hover:text-white'
                }`}
              >
                <Flame className="w-6 h-6" />
                <span className="text-sm uppercase tracking-wider">Warm-up Run</span>
                <span className="text-[10px] opacity-80">{formatTime(warmupRunSeconds)} Run</span>
              </button>
            </div>
          )}

          {/* Steppers based on chosen Dynamic Sub-Mode */}
          {!isActive && dynamicSubMode === 'STRETCH' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-[#020b1c] border-2 border-[#0047BA] p-3 rounded-2xl shadow-lg">
                <span className="text-sm font-black uppercase text-blue-300 ml-1">Stretch Time: {stretchSeconds}s</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => adjustStretchSeconds(-5)} className="p-2.5 bg-[#001f5c] hover:bg-[#0047BA] rounded-xl text-white transition active:scale-95">
                    <Minus className="w-4 h-4 stroke-[3]" />
                  </button>
                  <button type="button" onClick={() => adjustStretchSeconds(5)} className="p-2.5 bg-[#001f5c] hover:bg-[#0047BA] rounded-xl text-white transition active:scale-95">
                    <Plus className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-[#020b1c] border-2 border-[#0047BA] px-4 py-3 rounded-2xl shadow-lg">
                <span className="text-sm font-black uppercase text-white">Rounds: {stretchRounds}</span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => adjustStretchRounds(-1)} className="px-3 py-1.5 bg-[#001f5c] hover:bg-[#0047BA] rounded-xl text-xs font-black text-white transition active:scale-95">
                    -1 Rd
                  </button>
                  <button type="button" onClick={() => adjustStretchRounds(1)} className="px-3 py-1.5 bg-[#001f5c] hover:bg-[#0047BA] rounded-xl text-xs font-black text-white transition active:scale-95">
                    +1 Rd
                  </button>
                </div>
              </div>
            </div>
          )}

          {!isActive && dynamicSubMode === 'RUN' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => adjustWarmupRunSeconds(-30)}
                className="flex items-center justify-center gap-2 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-3.5 rounded-2xl text-sm font-mono font-black shadow-xl transition cursor-pointer"
              >
                <Minus className="w-5 h-5 stroke-[3]" />
                <span>30s Run</span>
              </button>
              <button
               type="button"
                onClick={() => adjustWarmupRunSeconds(30)}
                className="flex items-center justify-center gap-2 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-3.5 rounded-2xl text-sm font-mono font-black shadow-xl transition cursor-pointer"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>30s Run</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* DOUBLE-SIZED TABATA CONTROLS */}
      {!isProjectorView && !isActive && mode === 'TABATA' && (
        <div className="space-y-3 max-w-lg mx-auto mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between bg-[#020b1c] border-2 border-[#0047BA] p-3.5 rounded-3xl shadow-lg">
              <span className="text-sm font-black uppercase text-blue-300 ml-1">Work: {tabataWork}s</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => adjustTabataWork(-10)} className="p-3 bg-[#001f5c] hover:bg-[#0047BA] rounded-2xl text-white transition active:scale-95">
                  <Minus className="w-5 h-5 stroke-[3]" />
                </button>
                <button type="button" onClick={() => adjustTabataWork(10)} className="p-3 bg-[#001f5c] hover:bg-[#0047BA] rounded-2xl text-white transition active:scale-95">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between bg-[#020b1c] border-2 border-[#0047BA] p-3.5 rounded-3xl shadow-lg">
              <span className="text-sm font-black uppercase text-[#E32636] ml-1">Rest: {tabataRest}s</span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => adjustTabataRest(-10)} className="p-3 bg-[#001f5c] hover:bg-[#0047BA] rounded-2xl text-white transition active:scale-95">
                  <Minus className="w-5 h-5 stroke-[3]" />
                </button>
                <button type="button" onClick={() => adjustTabataRest(10)} className="p-3 bg-[#001f5c] hover:bg-[#0047BA] rounded-2xl text-white transition active:scale-95">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#020b1c] border-2 border-[#0047BA] px-5 py-3.5 rounded-3xl shadow-lg">
            <span className="text-base font-black uppercase text-white">Rounds: {tabataRounds}</span>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => adjustTabataRounds(-1)} className="px-4 py-2.5 bg-[#001f5c] hover:bg-[#0047BA] rounded-2xl text-sm font-black text-white transition active:scale-95">
                -1 Round
              </button>
              <button type="button" onClick={() => adjustTabataRounds(1)} className="px-4 py-2.5 bg-[#001f5c] hover:bg-[#0047BA] rounded-2xl text-sm font-black text-white transition active:scale-95">
                +1 Round
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOUBLE-SIZED AMRAP CONTROLS */}
      {!isProjectorView && !isActive && !isEditingCustom && mode === 'AMRAP' && (
        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mb-6">
          <button
            type="button"
            onClick={() => adjustAmrapSeconds(-30)}
            className="flex items-center justify-center gap-2 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-4 rounded-3xl text-lg font-mono font-black shadow-xl transition cursor-pointer"
          >
            <Minus className="w-6 h-6 stroke-[3]" />
            <span>30s</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditMinutes(Math.floor(amrapTotalSeconds / 60).toString());
              setEditSeconds((amrapTotalSeconds % 60).toString().padStart(2, '0'));
              setIsEditingCustom(true);
            }}
            className="flex items-center justify-center gap-2 bg-[#0047BA]/40 hover:bg-[#0047BA]/70 active:scale-95 text-white border-2 border-white/40 py-4 rounded-3xl text-sm font-black shadow-xl transition cursor-pointer"
          >
            <Edit3 className="w-5 h-5 stroke-[2.5]" />
            <span>EDIT</span>
          </button>
          <button
            type="button"
            onClick={() => adjustAmrapSeconds(30)}
            className="flex items-center justify-center gap-2 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-4 rounded-3xl text-lg font-mono font-black shadow-xl transition cursor-pointer"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
            <span>30s</span>
          </button>
        </div>
      )}

      {/* DOUBLE-SIZED EMOM CONTROLS */}
      {!isProjectorView && !isActive && mode === 'EMOM' && (
        <div className="space-y-3 max-w-lg mx-auto mb-6">
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => adjustEmomInterval(-30)}
              className="flex items-center justify-center gap-2 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-3.5 rounded-3xl text-sm font-mono font-black shadow-lg transition cursor-pointer"
            >
              <Minus className="w-5 h-5 stroke-[3]" />
              <span>30s</span>
            </button>
            <div className="flex items-center justify-center text-sm font-black uppercase text-blue-300 border-2 border-[#0047BA]/50 rounded-3xl bg-[#020b1c]/50">
              {emomInterval}s / Rd
            </div>
            <button
              type="button"
              onClick={() => adjustEmomInterval(30)}
              className="flex items-center justify-center gap-2 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-3.5 rounded-3xl text-sm font-mono font-black shadow-lg transition cursor-pointer"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>30s</span>
            </button>
          </div>

          <div className="flex items-center justify-between bg-[#020b1c] border-2 border-[#0047BA] px-5 py-3.5 rounded-3xl shadow-lg">
            <span className="text-base font-black uppercase text-white">Rounds: {emomRounds}</span>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => adjustEmomRounds(-1)} className="px-4 py-2.5 bg-[#001f5c] hover:bg-[#0047BA] rounded-2xl text-sm font-black text-white transition active:scale-95">
                -1 Round
              </button>
              <button type="button" onClick={() => adjustEmomRounds(1)} className="px-4 py-2.5 bg-[#001f5c] hover:bg-[#0047BA] rounded-2xl text-sm font-black text-white transition active:scale-95">
                +1 Round
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DOUBLE-SIZED FOR TIME CONTROLS */}
      {!isProjectorView && !isActive && !isEditingCustom && mode === 'FOR_TIME' && (
        <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mb-6">
          <button
            type="button"
            onClick={() => adjustForTimeSeconds(-30)}
            className="flex items-center justify-center gap-2 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-4 rounded-3xl text-lg font-mono font-black shadow-xl transition cursor-pointer"
          >
            <Minus className="w-6 h-6 stroke-[3]" />
            <span>30s</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setEditMinutes(Math.floor(forTimeTotalSeconds / 60).toString());
              setEditSeconds((forTimeTotalSeconds % 60).toString().padStart(2, '0'));
              setIsEditingCustom(true);
            }}
            className="flex items-center justify-center gap-2 bg-[#0047BA]/40 hover:bg-[#0047BA]/70 active:scale-95 text-white border-2 border-white/40 py-4 rounded-3xl text-sm font-black shadow-xl transition cursor-pointer"
          >
            <Edit3 className="w-5 h-5 stroke-[2.5]" />
            <span>EDIT</span>
          </button>
          <button
            type="button"
            onClick={() => adjustForTimeSeconds(30)}
            className="flex items-center justify-center gap-2 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-4 rounded-3xl text-lg font-mono font-black shadow-xl transition cursor-pointer"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
            <span>30s</span>
          </button>
        </div>
      )}

      {/* DOUBLE-SIZED ACTION BUTTONS */}
      {!isProjectorView && (
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={handleToggleStartPause}
            className={`flex items-center justify-center gap-3 flex-1 max-w-md py-4 sm:py-5 rounded-3xl font-black text-xl sm:text-2xl tracking-wider transition shadow-2xl cursor-pointer active:scale-95 ${
              isActive
                ? 'bg-[#E32636] hover:bg-[#c91e2c] text-white shadow-lg shadow-[#E32636]/40'
                : 'bg-[#0047BA] hover:bg-[#003da5] text-white shadow-lg shadow-[#0047BA]/50 border border-white/20'
            }`}
          >
            {isActive ? <><Pause className="w-6 h-6 fill-current" /> PAUSE</> : <><Play className="w-6 h-6 fill-current" /> START</>}
          </button>
          <button type="button" onClick={resetTimer} className="p-4 sm:p-5 bg-[#020b1c] hover:bg-[#001f5c] text-blue-200 rounded-3xl border-2 border-[#0047BA] transition cursor-pointer active:scale-95">
            <RotateCcw className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>
      )}
    </div>
  );
}
