'use client';
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Edit3, Check, X } from 'lucide-react';
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

  const [warmupRunSeconds, setWarmupRunSeconds] = useState(180);
  const [warmupPhase, setWarmupPhase] = useState<'RUN' | 'STRETCH'>('RUN');
  const [stretchRound, setStretchRound] = useState(1);
  const totalStretchRounds = 6;

  const [tabataWork, setTabataWork] = useState(20);
  const [tabataRest, setTabataRest] = useState(10);
  const [tabataRounds, setTabataRounds] = useState(8);
  const [amrapTotalSeconds, setAmrapTotalSeconds] = useState(300);
  const [emomInterval, setEmomInterval] = useState(60);
  const [emomRounds, setEmomRounds] = useState(10);
  const [forTimeTotalSeconds, setForTimeTotalSeconds] = useState(300);

  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [editMinutes, setEditMinutes] = useState('5');
  const [editSeconds, setEditSeconds] = useState('00');

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
        warmupPhase,
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
      setWarmupPhase(incomingState.warmupPhase);
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

        if (mode === 'WARMUP') {
          setSecondsRemaining((prev) => {
            if (prev <= 4 && prev > 1) soundEngine.playCountdownTick();
            if (prev > 1) {
              const next = prev - 1;
              emit({ secondsRemaining: next, isActive: true });
              return next;
            }

            if (warmupPhase === 'RUN') {
              soundEngine.playWorkGo();
              setWarmupPhase('STRETCH');
              setStretchRound(1);
              emit({ warmupPhase: 'STRETCH', stretchRound: 1, secondsRemaining: 20, isActive: true });
              return 20;
            } else {
              if (stretchRound < totalStretchRounds) {
                soundEngine.playWorkGo();
                const nextR = stretchRound + 1;
                setStretchRound(nextR);
                emit({ stretchRound: nextR, secondsRemaining: 20, isActive: true });
                return 20;
              } else {
                soundEngine.playRest();
                setEnginePhase('POST_REST_90');
                emit({ secondsRemaining: 90, isActive: true });
                return 90;
              }
            }
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
                emit({ secondsRemaining: 90, isActive: true });
                return 90;
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
              emit({ secondsRemaining: 90, isActive: true });
              return 90;
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
            emit({ secondsRemaining: 90, isActive: true });
            return 90;
          });
        }
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isActive, enginePhase, mode, warmupPhase, stretchRound, isWorkPhase, currentRound, tabataWork, tabataRest, tabataRounds, emomInterval, emomRounds, amrapTotalSeconds, forTimeTotalSeconds, isProjectorView]);

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

  const adjustSeconds = (delta: number) => {
    if (isActive) return;

    if (mode === 'WARMUP') {
      setWarmupRunSeconds((prev) => {
        const next = Math.max(15, prev + delta);
        if (warmupPhase === 'RUN') {
          setSecondsRemaining(next);
          emit({ secondsRemaining: next });
        }
        return next;
      });
    } else if (mode === 'TABATA') {
      setTabataWork((prev) => {
        const next = Math.max(10, prev + delta);
        setSecondsRemaining(next);
        emit({ secondsRemaining: next });
        return next;
      });
    } else if (mode === 'AMRAP') {
      setAmrapTotalSeconds((prev) => {
        const next = Math.max(15, prev + delta);
        setSecondsRemaining(next);
        emit({ secondsRemaining: next });
        return next;
      });
    } else if (mode === 'EMOM') {
      setEmomInterval((prev) => {
        const next = Math.max(15, prev + delta);
        setSecondsRemaining(next);
        emit({ secondsRemaining: next });
        return next;
      });
    } else if (mode === 'FOR_TIME') {
      setForTimeTotalSeconds((prev) => {
        const next = Math.max(15, prev + delta);
        setSecondsRemaining(next);
        emit({ secondsRemaining: next });
        return next;
      });
    }
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

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerTextColor = () => {
    if (enginePhase === 'PREP_15') return 'text-amber-400';
    if (enginePhase === 'POST_REST_90') return 'text-[#E32636]';
    if (mode === 'TABATA' && !isWorkPhase) return 'text-[#E32636]';
    return 'text-white';
  };

  return (
    <div className={`bg-[#001f5c]/95 border-2 border-[#0047BA] rounded-3xl p-4 sm:p-7 shadow-2xl text-white backdrop-blur-md ${
      isProjectorView ? 'p-8 sm:p-12' : ''
    }`}>
      {/* Mode Bar */}
      <div className="grid grid-cols-5 gap-1 sm:gap-2 bg-[#020b1c] p-1.5 sm:p-2 rounded-2xl mb-5 border border-[#0047BA]">
        {(['WARMUP', 'TABATA', 'AMRAP', 'EMOM', 'FOR_TIME'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => handleModeChange(m)}
            className={`py-2 rounded-xl font-black text-[10px] sm:text-xs md:text-sm tracking-wider transition truncate text-center ${
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
      <div className="text-center mb-2">
        {enginePhase === 'PREP_15' ? (
          <span className="text-xs sm:text-sm font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50 animate-pulse">
            ⚠️ PRE-COUNTDOWN: 15s PREP
          </span>
        ) :ePhase === 'POST_REST_90' ? (
          <span className="text-xs sm:text-sm font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-[#E32636]/20 text-[#E32636] border border-[#E32636]/50 animate-pulse">
            🛑 90s POST-WORKOUT REST
          </span>
        ) : mode === 'WARMUP' ? (
          <span className="text-xs sm:text-sm font-black uppercase tracking-widest px-4 py-1 rounded-full border bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
            {warmupPhase === 'RUN' ? `RUN PHASE (${formatTime(warmupRunSeconds)})` : `DYNAMIC STRETCH ${stretchRound} OF 6`}
          </span>
        ) : mode === 'TABATA' ? (
          <span className={`text-xs sm:text-sm font-black uppercase tracking-widest px-4 py-1 rounded-full border ${
            isWorkPhase ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-[#E32636]/20 text-[#E32636] border-[#E32636]/50'
          }`}>
            {isWorkPhase ? `WORK (${tabataWork}s)` : `REST (${tabataRest}s)`}
          </span>
        ) : mode === 'EMOM' ? (
          <span className="text-xs sm:text-sm font-black uppercase tracking-widest px-4 py-1 rounded-full bg-[#0047BA]/40 text-white border border-[#0047BA]">
            ROUND {currentRound} OF {emomRounds} ({emomInterval}s)
          </span>
        ) : mode === 'AMRAP' ? (
          <span className="text-xs sm:text-sm font-black uppercase tracking-widest px-4 py-1 rounded-full bg-[#E32636]/20 text-[#E32636] border border-[#E32636]/50">
            AMRAP: {formatTime(amrapTotalSeconds)}
          </span>
        ) : (
          <span className="text-xs sm:text-sm font-black uppercase tracking-widest px-4 py-1 rounded-full bg-[#0047BA]/40 text-white border border-[#0047BA]">
            FOR TIME: {formatTime(forTimeTotalSeconds)}
          </span>
        )}
      </div>

      {/* Editing Custom Time Overlay */}
      {isEditingCustom ? (
        <div className="flex flex-col items-center justify-center gap-3 my-5 bg-[#020b1c] p-5 rounded-3xl border-2 border-[#0047BA] shadow-xl max-w-sm mx-auto">
          <span className="text-xs uppercase font-black tracking-widest text-[#E32636]">Set Custom Duration</span>
          <div className="flex items-center justify-center gap-2">
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-blue-300 mb-1">Mins</span>
              <input
                type="number"
                min="0"
                max="99"
                value={editMinutes}
                onChange={(e) => setEditMinutes(e.target.value)}
                className="w-20 text-center bg-[#001f5c] border-2 border-[#0047BA] text-white font-mono font-black text-4xl rounded-2xl p-2 focus:outline-none focus:border-[#E32636]"
              />
            </div>
            <span className="text-4xl font-mono font-black text-[#0047BA] mt-4">:</span>
            <div className="flex flex-col items-center">
              <span className="text-[10px] uppercase font-bold text-blue-300 mb-1">Secs</span>
              <input
                type="number"
                min="0"
                max="59"
                value={editSeconds}
                onChange={(e) => setEditSeconds(e.target.value)}
                className="w-20 text-center bg-[#001f5c] border-2 border-[#0047BA] text-white font-mono font-black text-4xl rounded-2xl p-2 focus:outline-none focus:border-[#E32636]"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 w-full justify-center">
          <button
              type="button"
              onClick={handleSaveCustom}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold transition text-xs"
            >
              <Check className="w-4 h-4" /> Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditingCustom(false)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-bold transition text-xs"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={`text-center font-mono font-black tracking-tight my-2 select-none ${
          isProjectorView ? 'text-[15vw] leading-none' : 'text-8xl sm:text-9xl'
        } ${getTimerTextColor()}`}>
          {formatTime(secondsRemaining)}
        </div>
      )}

      {/* Subtitles */}
      <div className="text-center text-sm sm:text-base font-bold text-blue-200 mb-4">
        {enginePhase === 'PREP_15' ? (
          <span className="text-amber-300 font-bold">Get In Position</span>
        ) : enginePhase === 'POST_REST_90' ? (
          <span className="text-[#E32636] font-bold">Heart Rate Recovery</span>
        ) : mode === 'TABATA' ? (
          <span>Round <span className="text-white text-lg font-black">{currentRound}</span> of {tabataRounds}</span>
        ) : mode === 'WARMUP' && warmupPhase === 'STRETCH' ? (
          <span>Stretch <span className="text-white text-lg font-black">{stretchRound}</span> of 6 (20s)</span>
        ) : null}
      </div>

      {/* 15s Adjustments Bar */}
      {!isProjectorView && !isEditingCustom && !isActive && (
        <div className="grid grid-cols-3 gap-2 max-w-md mx-auto mb-4">
          <button
            type="button"
            onClick={() => adjustSeconds(-15)}
            className="flex items-center justify-center gap-1 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-3 rounded-2xl text-sm font-mono font-black shadow-lg transition cursor-pointer"
          >
            <Minus className="w-4 h-4 stroke-[3]" />
            <span>15s</span>
          </button>

          {(mode === 'AMRAP' || mode === 'FOR_TIME') ? (
            <button
              type="button"
              onClick={() => {
                const targetSec = mode === 'AMRAP' ? amrapTotalSeconds : forTimeTotalSeconds;
                setEditMinutes(Math.floor(targetSec / 60).toString());
                setEditSeconds((targetSec % 60).toString().padStart(2, '0'));
                setIsEditingCustom(true);
              }}
              className="flex items-center justify-center gap-1 bg-[#0047BA]/40 hover:bg-[#0047BA]/70 active:scale-95 text-white border-2 border-white/40 py-3 rounded-2xl text-xs font-black shadow-lg transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>EDIT</span>
            </button>
          ) : (
            <div className="flex items-center justify-center text-xs font-black uppercase text-blue-300/70 border border-[#0047BA]/40 rounded-2xl bg-[#020b1c]/50">
              ± 15s Step
            </div>
          )}

          <button
            type="button"
            onClick={() => adjustSeconds(15)}
            className="flex items-center justify-center gap-1 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hove:text-white border-2 border-[#0047BA] py-3 rounded-2xl text-sm font-mono font-black shadow-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>15s</span>
          </button>
        </div>
      )}

      {/* Action Buttons */}
      {!isProjectorView && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleToggleStartPause}
            className={`flex items-center justify-center gap-2 flex-1 max-w-xs py-3.5 rounded-2xl font-black text-lg tracking-wider transition shadow-2xl cursor-pointer ${
              isActive
                ? 'bg-[#E32636] hover:bg-[#c91e2c] text-white shadow-lg shadow-[#E32636]/40'
                : 'bg-[#0047BA] hover:bg-[#003da5] text-white shadow-lg shadow-[#0047BA]/50 border border-white/20'
            }`}
          >
            {isActive ? <><Pause className="w-5 h-5 fill-current" /> PAUSE</> : <><Play className="w-5 h-5 fill-current" /> START</>}
          </button>
          <button type="button" onClick={resetTimer} className="p-3.5 bg-[#020b1c] hover:bg-[#001f5c] text-blue-200 rounded-2xl border border-[#0047BA] transition cursor-pointer">
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
