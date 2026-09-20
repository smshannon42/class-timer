'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, FastForward, Timer } from 'lucide-react';
import { soundEngine } from '@/utils/audio';

interface WorkoutEngineProps {
  onBroadcast?: (state: any) => void;
  incomingState?: any;
  isProjectorView?: boolean;
}

export default function WorkoutEngine({ onBroadcast, incomingState, isProjectorView = false }: WorkoutEngineProps) {
  const [mode, setMode] = useState<'DYNAMIC' | 'TABATA' | 'AMRAP' | 'EMOM' | 'FOR_TIME'>('DYNAMIC');
  const [dynamicSubMode, setDynamicSubMode] = useState<'RUN' | 'STRETCH'>('RUN');

  // Prep Countdown Toggle (Default false: instant start)
  const [enablePrep, setEnablePrep] = useState<boolean>(false);

  const [warmupRunSeconds, setWarmupRunSeconds] = useState(180);
  const [stretchSeconds, setStretchSeconds] = useState(20);
  const [stretchRounds, setStretchRounds] = useState(6);
  const [currentStretchRound, setCurrentStretchRound] = useState(1);
  const [postRestSeconds, setPostRestSeconds] = useState(60);

  const [tabataWork, setTabataWork] = useState(20);
  const [tabataRest, setTabataRest] = useState(10);
  const [tabataRounds, setTabataRounds] = useState(8);
  const [currentRound, setCurrentRound] = useState(1);
  const [isWorkPhase, setIsWorkPhase] = useState(true);

  const [emomInterval, setEmomInterval] = useState(60);
  const [emomRounds, setEmomRounds] = useState(10);

  const [amrapDuration, setAmrapDuration] = useState(600);
  const [forTimeCap, setForTimeCap] = useState(600);

  const [secondsRemaining, setSecondsRemaining] = useState(180);
  const [isActive, setIsActive] = useState(false);
  const [enginePhase, setEnginePhase] = useState<'IDLE' | 'PREP_5' | 'RUNNING' | 'POST_REST_60' | 'FINISHED'>('IDLE');

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
      forTimeCap,
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
      setEnablePrep(incomingState.enablePrep ?? false);
      return;
    }

    if (isProjectorView) return;

    let timer: NodeJS.Timeout;

    if (isActive) {
      timer = setInterval(() => {
        if (enginePhase === 'PREP_5') {
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
              soundEngine.playRest();
              setIsWorkPhase(false);
              return tabataRest;
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
  }, [mode, dynamicSubMode, secondsRemaining, isActive, enginePhase, currentRound, isWorkPhase, currentStretchRound, enablePrep]);

  const handleStart = () => {
    if (enginePhase === 'IDLE' || enginePhase === 'FINISHED') {
      if (enablePrep) {
        setEnginePhase('PREP_5');
        setSecondsRemaining(5);
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
      if (enginePhase === 'PREP_5') {
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
    }
  };

  const formatDisplayTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-col items-center justify-center w-full ${isProjectorView ? 'min-h-[85vh]' : ''}`}>
      {!isProjectorView && (
        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="flex flex-wrap gap-2 bg-neutral-900/80 p-2 rounded-2xl border border-neutral-800">
            {(['DYNAMIC', 'TABATA', 'EMOM', 'AMRAP', 'FOR_TIME'] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setIsActive(false);
                  setEnginePhase('IDLE');
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

          {/* Prep Toggle Button */}
          <button
            onClick={() => setEnablePrep(!enablePrep)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              enablePrep 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm' 
                : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-neutral-300'
            }`}
          >
            <Timer size={14} />
            <span>Prep Countdown (5s): <strong className="uppercase">{enablePrep ? 'ON' : 'OFF'}</strong></span>
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        {mode === 'DYNAMIC' && (
          <span className="px-4 py-1.5 rounded-full text-xs font-black tracking-widest uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            {enginePhase === 'PREP_5'
              ? 'PREP (5s)'
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
            {enginePhase === 'PREP_5' ? 'PREP (5s)' : isWorkPhase ? `WORK - ROUND ${currentRound}/${tabataRounds}` : `REST - ROUND ${currentRound}/${tabataRounds}`}
          </span>
        )}
      </div>

      <div className="relative flex items-center justify-center my-6">
        <div className={`font-black tracking-tighter select-none font-mono ${
          isProjectorView ? 'text-[14rem] md:text-[20rem]' : 'text-8xl md:text-[11rem]'
        } ${enginePhase === 'PREP_5' ? 'text-amber-400 animate-pulse' : 'text-white drop-shadow-2xl'}`}>
          {formatDisplayTime(secondsRemaining)}
        </div>
      </div>

      {!isProjectorView && (
        <div className="flex items-center gap-4 mt-8">
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
