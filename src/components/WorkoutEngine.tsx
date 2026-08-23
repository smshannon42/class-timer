'use client';
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Edit3, Check, X, FastForward } from 'lucide-react';
import { soundEngine } from '@/utils/audio';
import { RemoteSyncState } from '@/hooks/useRemoteSync';

interface WorkoutEngineProps {
  onBroadcast?: (state: Omit<RemoteSyncState, 'timestamp'>) => void;
  incomingState?: RemoteSyncState | null;
  isProjectorView?: boolean;
}

type WorkoutMode = 'WARMUP' | 'TABATA' | 'AMRAP' | 'EMOM' | 'FOR_TIME';

export default function WorkoutEngine({ onBroadcast, incomingState, isProjectorView = false }: WorkoutEngineProps) {
  const [mode, setMode] = useState<WorkoutMode>('WARMUP');
  const [enginePhase, setEnginePhase] = useState<'IDLE' | 'PREP_15' | 'RUNNING' | 'POST_REST_90' | 'FINISHED'>('IDLE');

  // Warmup settings
  const [warmupRunSeconds, setWarmupRunSeconds] = useState(180);
  const [warmupPhase, setWarmupPhase] = useState<'RUN' | 'POST_RUN_REST' | 'WAITING_FOR_STRETCH' | 'STRETCH'>('RUN');
  const [stretchRound, setStretchRound] = useState(1);
  const totalStretchRounds = 6;
  const stretchIntervalSeconds = 20;
  const postRunRestSeconds = 90;

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
  const [secondsRemaining, setSecondsRemaining] = useState(180);

  const emit = (override: Partial<Omit<RemoteSyncState, 'timestamp'>> = {}) => {
    if (onBroadcast) {
      onBroadcast({
        mode,
        isActive,
        secondsRemaining,
        currentRound,
        isWorkPhase,
        warmupPhase: warmupPhase === 'POST_RUN_REST' || warmupPhase === 'WAITING_FOR_STRETCH' ? 'REST' : warmupPhase,
        stretchRound,
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
      setWarmupPhase((incomingState.warmupPhase as any) || 'RUN');
      setStretchRound(incomingState.stretchRound);
    }
  }, [incomingState, isProjectorView]);

  const applyModeDefaults = (newMode: WorkoutMode) => {
    setMode(newMode);
    setIsActive(false);
    setEnginePhase('IDLE');
    setCurrentRound(1);
    setIsWorkPhase(true);
    setWarmupPhase('RUN');
    setStretchRound(1);
    setIsEditingCustom(false);
    setIsEditingPostRest(false);

    let sec = 180;
    if (newMode === 'WARMUP') sec = warmupRunSeconds;
    if (newMode === 'TABATA') sec = tabataWork;
    if (newMode === 'AMRAP') sec = amrapTotalSeconds;
    if (newMode === 'EMOM') sec = emomInterval;
    if (newMode === 'FOR_TIME') sec = forTimeTotalSeconds;

    setSecondsRemaining(sec);
    emit({
      mode: newMode,
      isActive: false,
      secondsRemaining: sec,
      currentRound: 1,
      isWorkPhase: true,
      warmupPhase: 'RUN',
      stretchRound: 1,
    });
  };

  const handleModeChange = (newMode: WorkoutMode) => {
    applyModeDefaults(newMode);
  };

  const skipPrepCountdown = () => {
    soundEngine.playWorkGo();
    setEnginePhase('RUNNING');
    let startSec = 180;
    if (mode === 'WARMUP') startSec = warmupRunSeconds;
    if (mode === 'TABATA') startSec = tabataWork;
    if (mode === 'AMRAP') startSec = amrapTotalSeconds;
    if (mode === 'EMOM') startSec = emomInterval;
    if (mode === 'FOR_TIME') startSec = forTimeTotalSeconds;

    setSecondsRemaining(startSec);
    emit({ secondsRemaining: startSec, isActive: true, currentRound: 1, isWorkPhase: true });
  };

  const startStretchesExplicitly = () => {
    soundEngine.playWorkGo();
    setWarmupPhase('STRETCH');
    setStretchRound(1);
    setSecondsRemaining(stretchIntervalSeconds);
    setIsActive(true);
    setEnginePhase('RUNNING');
    emit({ warmupPhase: 'STRETCH', stretchRound: 1, secondsRemaining: stretchIntervalSeconds, isActive: true });
  };

  useEffect(() => {
    if (isProjectorView) return;

    let timer: NodeJS.Timeout;

    if (isActive) {
      timer = setInterval(() => {
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
            let startSec = 180;
            if (mode === 'WARMUP') startSec = warmupRunSeconds;
            if (mode === 'TABATA') startSec = tabataWork;
            if (mode === 'AMRAP') startSec = amrapTotalSeconds;
            if (mode === 'EMOM') startSec = emomInterval;
            if (mode === 'FOR_TIME') startSec = forTimeTotalSeconds;

            emit({ secondsRemaining: startSec, isActive: true, currentRound: 1, isWorkPhase: true });
            return startSec;
          });
          return;
        }

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

        // WARMUP: Run -> 1:30 Cooldown -> Pause for Explanation -> Stretches
        if (mode === 'WARMUP') {
          setSecondsRemaining((prev) => {
            if (prev <= 4 && prev > 1) soundEngine.playCountdownTick();
            if (prev > 1) {
              const next = prev - 1;
              emit({ secondsRemaining: next, isActive: true });
              return next;
            }

            if (warmupPhase === 'RUN') {
              soundEngine.playRest();
              setWarmupPhase('POST_RUN_REST');
              emit({ warmupPhase: 'REST', secondsRemaining: postRunRestSeconds, isActive: true });
              return postRunRestSeconds;
            } else if (warmupPhase === 'POST_RUN_REST') {
              soundEngine.playRest();
              setWarmupPhase('WAITING_FOR_STRETCH');
              setIsActive(false); // Pause timer so coach can explain
              emit({ warmupPhase: 'REST', secondsRemaining: stretchIntervalSeconds, isActive: false });
              return stretchIntervalSeconds;
            } else if (warmupPhase === 'STRETCH') {
              if (stretchRound < totalStretchRounds) {
                soundEngine.playWorkGo();
                const nextR = stretchRound + 1;
                setStretchRound(nextR);
                emit({ stretchRound: nextR, secondsRemaining: stretchIntervalSeconds, isActive: true });
                return stretchIntervalSeconds;
              } else {
                soundEngine.playCleanupChime();
                setEnginePhase('FINISHED');
                setIsActive(false);
                emit({ secondsRemaining: 0, isActive: false });
                return 0;
              }
            }
            return 0;
          });
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
                soundEngine.playRest();
                setEnginePhase('POST_REST_90');
                emit({ secondsRemaining: postRestSeconds, isActive: true });
                return postRestSeconds;
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
              soundEngine.playRest();
              setEnginePhase('POST_REST_90');
              emit({ secondsRemaining: postRestSeconds, isActive: true });
              return postRestSeconds;
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
            soundEngine.playRest();
            setEnginePhase('POST_REST_90');
            emit({ secondsRemaining: postRestSeconds, isActive: true });
            return postRestSeconds;
          });
        }
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isActive, enginePhase, mode, warmupPhase, stretchRound, isWorkPhase, currentRound, tabataWork, tabataRest, tabataRounds, emomInterval, emomRounds, amrapTotalSeconds, forTimeTotalSeconds, postRestSeconds, isProjectorView]);

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
    setIsWorkPhase(true);
    setWarmupPhase('RUN');
    setStretchRound(1);

    let sec = 180;
    if (mode === 'WARMUP') sec = warmupRunSeconds;
    if (mode === 'TABATA') sec = tabataWork;
    if (mode === 'AMRAP') sec = amrapTotalSeconds;
    if (mode === 'EMOM') sec = emomInterval;
    if (mode === 'FOR_TIME') sec = forTimeTotalSeconds;

    setSecondsRemaining(sec);
    emit({
      isActive: false,
      secondsRemaining: sec,
      currentRound: 1,
      isWorkPhase: true,
      warmupPhase: 'RUN',
      stretchRound: 1,
    });
  };

  const adjustWarmupRunSeconds = (delta: number) => {
    if (isActive) return;
    setWarmupRunSeconds((prev) => {
      const next = Math.max(30, prev + delta);
      if (warmupPhase === 'RUN') {
        setSecondsRemaining(next);
        emit({ secondsRemaining: next });
      }
      return next;
    });
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
    if (enginePhase === 'POST_REST_90' || warmupPhase === 'POST_RUN_REST') return 'text-[#E32636]';
    if (warmupPhase === 'WAITING_FOR_STRETCH') return 'text-amber-400';
    if (mode === 'TABATA' && !isWorkPhase) return 'text-[#E32636]';
    return 'text-white';
  };

  return (
    <div className={`bg-[#001f5c]/95 border-2 border-[#0047BA] rounded-3xl p-5 sm:p-8 shadow-2xl text-white backdrop-blur-md ${
      isProjectorView ? 'p-8 sm:p-12' : ''
    }`}>
      {/* Mode Bar */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-3 bg-[#020b1c] p-2 rounded-2xl mb-6 border border-[#0047BA]">
        {(['WARMUP', 'TABATA', 'AMRAP', 'EMOM', 'FOR_TIME'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => handleModeChange(m)}
            className={`py-3 rounded-xl font-black text-xs sm:text-base tracking-wider transition truncate text-center cursor-pointer ${
              mode === m
                ? 'bg-[#0047BA] text-white shadow-lg shadow-[#0047BA]/60 border border-white/30'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            {m === 'WARMUP' ? '🔥 WARM' : m.replace('_', ' ')}
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
        ) : mode === 'WARMUP' ? (
          <span className={`text-sm sm:text-base font-black uppercase tracking-widest px-5 py-1.5 rounded-full border-2 ${
            warmupPhase === 'POST_RUN_REST'
          g-[#E32636]/20 text-[#E32636] border-[#E32636]/50 animate-pulse'
              : warmupPhase === 'WAITING_FOR_STRETCH'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
          }`}>
            {warmupPhase === 'RUN' && `RUN PHASE (${formatTime(warmupRunSeconds)})`}
            {warmupPhase === 'POST_RUN_REST' && 'REST / COOLDOWN (1:30)'}
            {warmupPhase === 'WAITING_FOR_STRETCH' && 'READY FOR DYNAMIC STRETCHES'}
            {warmupPhase === 'STRETCH' && `DYNAMIC STRETCH ${stretchRound} OF 6 (20s)`}
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
          <span className="text-sm sm:text-base font-black uppercase tracking-widest px-5 py-1.5 rounded-full bg-[#0047BA]/40 text-white border-2 border-[#0047BA]">
            FOR TIME: {formatTime(forTimeTotalSeconds)}
          </span>
        )}
      </div>

      {/* Main Clock */}
      <div className={`text-center font-mono font-black tracking-tight my-3 select-none ${
        isProjectorView ? 'text-[16vw] leading-none' : 'text-8xl sm:text-9xl'
      } ${getTimerTextColor()}`}>
        {formatTime(secondsRemaining)}
      </div>

      {/* Subtitles & Skip Button */}
      <div className="text-center text-base sm:text-lg font-bold text-blue-200 mb-6">
        {enginePhase === 'PREP_15' ? (
          <div className="flex items-center justify-center gap-3">
            <span className="text-amber-300 font-black text-xl">Get In Position</span>
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
        ) : mode === 'WARMUP' ? (
          <span>
            {warmupPhase === 'RUN' && 'Continuous Warm-up Run'}
            {warmupPhase === 'POST_RUN_REST' && <span className="text-[#E32636] font-black">Post-Run Rest / Transition</span>}
            {warmupPhase === 'WAITING_FOR_STRETCH' && <span className="text-amber-300 font-black">Paused: Explain Stretches to Class</span>}
            {warmupPhase === 'STRETCH' && `Dynamic Stretch: Step ${stretchRound} of 6 (No Rest)`}
          </span>
        ) : mode === 'TABATA' ? (
          <span>Round <span className="text-white text-2xl font-black">{currentRound}</span> of {tabataRounds}</span>
        ) : mode === 'EMOM' ? (
          <span>Round <span className="text-white text-2xl font-black">{currentRound}</span> of {emomRounds}</span>
        ) : null}
      </div>

      {/* Explicit Continue / Start Stretch Banner */}
      {!isProjectorView && mode === 'WARMUP' && (warmupPhase === 'WAITING_FOR_STRETCH' || warmupPhase === 'POST_RUN_REST' || (!isActive && warmupPhase === 'RUN')) && (
        <div className="max-w-lg mx-auto mb-6">
          <button
            type="button"
            onClick={startStretchesExplicitly}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white py-4 rounded-2xl text-base font-black uppercase tracking-wider transition shadow-2xl active:scale-95 border-2 border-emerald-400 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current" /> START DYNAMIC STRETCHES (6 × 20s)
          </button>
        </div>
      )}

      {/* WARMUP RUN CONTROLS */}
      {!isProjectorView && !isActive && mode === 'WARMUP' && warmupPhase === 'RUN' && (
        <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto mb-6">
          <button
            type="button"
            onClick={() => adjustWarmupRunSeconds(-30)}
            className="flex items-center justify-center gap-2 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-3.5 rounded-3xl text-sm font-mono font-black shadow-xl transition cursor-pointer"
          >
            <Minus className="w-5 h-5 stroke-[3]" />
            <span>30s Run</span>
          </button>
          <button
            type="button"
            onClick={() => adjustWarmupRunSeconds(30)}
            className="flex items-center justify-center gap-2 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-3.5 rounded-3xl text-sm font-mono font-black shadow-xl transition cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>30s Run</span>
          </button>
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
                <button type="button" onClick={() > adjustTabataRest(-10)} className="p-3 bg-[#001f5c] hover:bg-[#0047BA] rounded-2xl text-white transition active:scale-95">
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
