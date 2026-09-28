'use client';

import React, { useState, useEffect } from 'react';
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

  // Stepper adjustments (Rounds range 1 to 12)
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

  // Determine if we are in the last 10 seconds of WORK (never during rest/prep)
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

  const showRedCountdown = isWorkTenSecondsLeft();

  return (
    <div className={`flex flex-col items-center justify-center w-full ${isProjectorView ? 'min-h-[85vh]' : ''}`}>
      {!isProjectorView && (
        <div className="flex flex-col items-center gap-3 mb-4 w-full">
          {/* Mode Switcher */}
          <div className="flex flex-wrap gap-2 bg-neutral-900/80 p-2 rounded-2xl border border-neutral-800 justify-center">
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
            <span>Prep Countdown (7s): <strong className="uppercase">{enablePrep ? 'ON' : 'OFF'}</strong></span>
          </button>

          {/* TABATA Scroll Controls */}
          {mode === 'TABATA' && (
            <div className="flex flex-col gap-2 w-full max-w-md mt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Work Stepper */}
                <div className="bg-neutral-900/90 border border-emerald-500/30 rounded-2xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Work (5s - 3m)</span>
                    <span className="text-base font-black text-white font-mono">{formatIntervalLabel(tabataWork)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustTabataWork(-5)}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-neutral-700 active:scale-95"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="range"
                      min="5"
                      max="180"
                      step="5"
                      value={tabataWork}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTabataWork(val);
                        if (enginePhase === 'IDLE') setSecondsRemaining(val);
                      }}
                      className="w-full accent-emerald-400 h-2 bg-neutral-950 rounded-lg cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => adjustTabataWork(5)}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-emerald-400 border border-neutral-700 active:scale-95"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Rest Stepper */}
                <div className="bg-neutral-900/90 border border-amber-500/30 rounded-2xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Rest (0 - 60s)</span>
                    <span className="text-base font-black text-white font-mono">{formatIntervalLabel(tabataRest)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustTabataRest(-5)}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 active:scale-95"
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="5"
                      value={tabataRest}
                      onChange={(e) => setTabataRest(Number(e.target.value))}
                      className="w-full accent-amber-400 h-2 bg-neutral-950 rounded-lg cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => adjustTabataRest(5)}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 active:scale-95"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Rounds Stepper (1 to 12, default 8) */}
              <div className="bg-neutral-900/90 border border-cyan-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Rounds (1 - 12)</span>
                  <span className="text-base font-black text-white font-mono">{tabataRounds} Rounds</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustTabataRounds(-1)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 active:scale-95"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="1"
                    value={tabataRounds}
                    onChange={(e) => setTabataRounds(Number(e.target.value))}
                    className="w-full accent-cyan-400 h-2 bg-neutral-950 rounded-lg cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => adjustTabataRounds(1)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 active:scale-95"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* EMOM Scroll Controls */}
          {mode === 'EMOM' && (
            <div className="flex flex-col gap-2 w-full max-w-sm mt-1">
              {/* Interval Stepper */}
              <div className="bg-neutral-900/90 border border-cyan-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Interval (±5s)</span>
                  <span className="text-base font-black text-white font-mono">{formatIntervalLabel(emomInterval)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustEmom(-5)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 active:scale-95"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="range"
                    min="15"
                    max="180"
                    step="5"
                    value={emomInterval}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setEmomInterval(val);
                      if (enginePhase === 'IDLE') setSecondsRemaining(val);
                    }}
                    className="w-full accent-cyan-400 h-2 bg-neutral-950 rounded-lg cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => adjustEmom(5)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 active:scale-95"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Rounds Stepper (1 to 12, default 8) */}
              <div className="bg-neutral-900/90 border border-cyan-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">Rounds (1 - 12)</span>
                  <span className="text-base font-black text-white font-mono">{emomRounds} Rounds</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustEmomRounds(-1)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 active:scale-95"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="1"
                    value={emomRounds}
                    onChange={(e) => setEmomRounds(Number(e.target.value))}
                    className="w-full accent-cyan-400 h-2 bg-neutral-950 rounded-lg cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => adjustEmomRounds(1)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700 active:scale-95"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AMRAP Scroll Controls */}
          {mode === 'AMRAP' && (
            <div className="flex flex-col gap-2 w-full max-w-sm mt-1">
              {/* Duration Stepper */}
              <div className="bg-neutral-900/90 border border-fuchsia-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-fuchsia-400 uppercase tracking-wider">Duration (±30s)</span>
                  <span className="text-base font-black text-white font-mono">{formatIntervalLabel(amrapDuration)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustAmrap(-30)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-fuchsia-400 border border-neutral-700 active:scale-95"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="range"
                    min="60"
                    max="1800"
                    step="30"
                    value={amrapDuration}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAmrapDuration(val);
                      if (enginePhase === 'IDLE') setSecondsRemaining(val);
                    }}
                    className="w-full accent-fuchsia-400 h-2 bg-neutral-950 rounded-lg cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => adjustAmrap(30)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-fuchsia-400 border border-neutral-700 active:scale-95"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Target Rounds Stepper (1 to 12, default 8) */}
              <div className="bg-neutral-900/90 border border-fuchsia-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-fuchsia-400 uppercase tracking-wider">Target Rounds (1 - 12)</span>
                  <span className="text-base font-black text-white font-mono">{amrapRounds} Rounds</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustAmrapRounds(-1)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-fuchsia-400 border border-neutral-700 active:scale-95"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="1"
                    value={amrapRounds}
                    onChange={(e) => setAmrapRounds(Number(e.target.value))}
                    className="w-full accent-fuchsia-400 h-2 bg-neutral-950 rounded-lg cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => adjustAmrapRounds(1)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-fuchsia-400 border border-neutral-700 active:scale-95"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FOR TIME Scroll Controls */}
          {mode === 'FOR_TIME' && (
            <div className="flex flex-col gap-2 w-full max-w-sm mt-1">
              {/* Time Cap Stepper */}
              <div className="bg-neutral-900/90 border border-indigo-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Time Cap (±30s)</span>
                  <span className="text-base font-black text-white font-mono">{formatIntervalLabel(forTimeCap)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustForTime(-30)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-indigo-400 border border-neutral-700 active:scale-95"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="range"
                    min="60"
                    max="3600"
                    step="30"
                    value={forTimeCap}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setForTimeCap(val);
                    }}
                    className="w-full accent-indigo-400 h-2 bg-neutral-950 rounded-lg cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => adjustForTime(30)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-indigo-400 border border-neutral-700 active:scale-95"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Target Rounds Stepper (1 to 12, default 8) */}
              <div className="bg-neutral-900/90 border border-indigo-500/30 rounded-2xl p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">Target Rounds (1 - 12)</span>
                  <span className="text-base font-black text-white font-mono">{forTimeRounds} Rounds</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustForTimeRounds(-1)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-indigo-400 border border-neutral-700 active:scale-95"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="12"
                    step="1"
                    value={forTimeRounds}
                    onChange={(e) => setForTimeRounds(Number(e.target.value))}
                    className="w-full accent-indigo-400 h-2 bg-neutral-950 rounded-lg cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => adjustForTimeRounds(1)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-indigo-400 border border-neutral-700 active:scale-95"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Phase Pill */}
      <div className="flex items-center gap-3">
        {mode === 'DYNAMIC' && (
          <span className="px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {enginePhase === 'PREP_7'
              ? 'PREP (7s)'
              : dynamicSubMode === 'RUN' && enginePhase === 'RUNNING'
              ? 'WARM-UP RUN'
              : enginePhase === 'POST_REST_60'
              ? 'COOL-DOWN & EXPLAIN (60s)'
              : `STRETCH ${currentStretchRound}/${stretchRounds}`}
          </span>
        )}
        {mode === 'TABATA' && (
          <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase ${
            isWorkPhase ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
          }`}>
            {enginePhase === 'PREP_7' ? 'PREP (7s)' : isWorkPhase ? `WORK - ROUND ${currentRound}/${tabataRounds}` : `REST - ROUND ${currentRound}/${tabataRounds}`}
          </span>
        )}
        {mode === 'EMOM' && (
          <span className="px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {enginePhase === 'PREP_7' ? 'PREP (7s)' : `ROUND ${currentRound}/${emomRounds}`}
          </span>
        )}
        {mode === 'AMRAP' && (
          <span className="px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
            {enginePhase === 'PREP_7' ? 'PREP (7s)' : `AMRAP - ROUND ${currentRound}/${amrapRounds} (${formatIntervalLabel(amrapDuration)})`}
          </span>
        )}
        {mode === 'FOR_TIME' && (
          <span className="px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {enginePhase === 'PREP_7' ? 'PREP (7s)' : `FOR TIME - ROUND ${currentRound}/${forTimeRounds} (CAP: ${formatIntervalLabel(forTimeCap)})`}
          </span>
        )}
      </div>

      {/* Main Countdown Display */}
      <div className="relative flex items-center justify-center my-4">
        <div className={`font-black tracking-tighter select-none font-mono transition-colors duration-300 ${
          isProjectorView ? 'text-[14rem] md:text-[20rem]' : 'text-8xl md:text-[11rem]'
        } ${
          enginePhase === 'PREP_7'
            ? 'text-amber-400 animate-pulse'
            : showRedCountdown
            ? 'text-rose-500 drop-shadow-[0_0_25px_rgba(244,63,94,0.45)]'
            : 'text-white drop-shadow-2xl'
        }`}>
          {formatDisplayTime(secondsRemaining)}
        </div>
      </div>

      {/* Controller Buttons */}
      {!isProjectorView && (
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={isActive ? handlePause : handleStart}
            className={`p-6 rounded-3xl font-black flex items-center gap-2 transition-all shadow-xl ${
              isActive ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950' : 'bg-cyan-500 hover:bg-cyan-400 text-neutral-950'
            }`}
          >
            {isActive ? <Pause size={32} /> : <Play size={32} />}
          </button>
          <button
            onClick={handleReset}
            className="p-6 rounded-3xl bg-neutral-800 hover:bg-neutral-700 text-white transition-all border border-neutral-700"
          >
            <RotateCcw size={32} />
          </button>
          <button
            onClick={handleSkip}
            className="p-6 rounded-3xl bg-neutral-800 hover:bg-neutral-700 text-white transition-all border border-neutral-700"
          >
            <FastForward size={32} />
          </button>
        </div>
      )}
    </div>
  );
}
