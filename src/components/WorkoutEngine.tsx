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
  const [mode, setMode] = useState<WorkoutMode>('TABATA');
  const [enginePhase, setEnginePhase] = useState<'IDLE' | 'PREP_15' | 'RUNNING' | 'POST_REST_90' | 'FINISHED'>('IDLE');

  // Warmup state
  const [warmupRunSeconds, setWarmupRunSeconds] = useState(180);
  const [warmupPhase, setWarmupPhase] = useState<'RUN' | 'STRETCH'>('RUN');
  const [stretchRound, setStretchRound] = useState(1);
  const totalStretchRounds = 6;

  // Tabata Settings (10s intervals default)
  const [tabataWork, setTabataWork] = useState(20);
  const [tabataRest, setTabataRest] = useState(10);
  const [tabataRounds, setTabataRounds] = useState(8);

  // Post-Workout Rest Setting (Editable)
  const [postRestSeconds, setPostRestSeconds] = useState(90);
  const [isEditingPostRest, setIsEditingPostRest] = useState(false);
  const [editPostRestInput, setEditPostRestInput] = useState('90');

  // Other modes
  const [amrapTotalSeconds, setAmrapTotalSeconds] = useState(300);
  const [emomInterval, setEmomInterval] = useState(60);
  const [emomRounds, setEmomRounds] = useState(10);
  const [forTimeTotalSeconds, setForTimeTotalSeconds] = useState(300);

  // Custom edit dialog
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [editMinutes, setEditMinutes] = useState('5');
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
    setIsEditingPostRest(false);

    let sec = 20;
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
        // 15s Lead-in Preparation Countdown
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
            let startSec = tabataWork;
            if (mode === 'WARMUP') startSec = warmupRunSeconds;
            if (mode === 'AMRAP') startSec = amrapTotalSeconds;
            if (mode === 'EMOM') startSec = emomInterval;
            if (mode === 'FOR_TIME') startSec = forTimeTotalSeconds;

            emit({ secondsRemaining: startSec, isActive: true, currentRound: 1, isWorkPhase: true });
            return startSec;
          });
          return;
        }

        // Post-Workout Rest Period (Red)
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

        // Active Workout Modes
        if (mode === 'TABATA') {
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
                // Final round completed -> Trigger Post-Rest Period in RED
                soundEngine.playRest();
                setEnginePhase('POST_REST_90');
                emit({ secondsRemaining: postRestSeconds, isActive: true });
                return postRestSeconds;
              }
            }
          });
        } else if (mode === 'WARMUP') {
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

    let sec = tabataWork;
    if (mode === 'WARMUP') sec = warmupRunSeconds;
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

  // 10s step adjusters for Tabata
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

  const adjust15s = (delta: number) => {
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
        ) : enginePhase === 'POST_REST_90' ? (
          <span className="text-xs sm:text-sm font-black uppercase tracking-widest px-4 py-1.5 rounded-full bg-[#E32636]/20 text-[#E32636] border border-[#E32636]/50 animate-pulse">
            🛑 {postRestSeconds}s POST-WORKOUT REST
          </span>
        ) : mode === 'TABATA' ? (
          <span className={`text-xs sm:text-sm font-black uppercase tracking-widest px-4 py-1 rounded-full border ${
            isWorkPhase ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-[#E32636]/20 text-[#E32636] border-[#E32636]/50'
          }`}>
            {isWorkPhase ? `WORK (${tabataWork}s)` : `REST (${tabataRest}s)`}
          </span>
        ) : mode === 'WARMUP' ? (
          <span className="text-xs sm:text-sm font-black uppercase tracking-widest px-4 py-1 rounded-full border bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
            {warmupPhase === 'RUN' ? `RUN PHASE (${formatTime(warmupRunSeconds)})` : `DYNAMIC STRETCH ${stretchRound} OF 6`}
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

      {/* Main Countdown Display */}
      <div className={`text-center font-mono font-black tracking-tight my-2 select-none ${
        isProjectorView ? 'text-[15vw] leading-none' : 'text-8xl sm:text-9xl'
      } ${getTimerTextColor()}`}>
        {formatTime(secondsRemaining)}
      </div>

      {/* Subtitles & Recovery Editor */}
      <div className="text-center text-sm sm:text-base font-bold text-blue-200 mb-4">
        {enginePhase === 'PREP_15' ? (
          <span className="text-amber-300 font-bold">Get In Position</span>
        ) : enginePhase === 'POST_REST_90' ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-[#E32636] font-bold">Heart Rate Recovery</span>
            {!isProjectorView && (
              <button
                type="button"
                onClick={() => {
                  setEditPostRestInput(postRestSeconds.toString());
                  setIsEditingPostRest(true);
                }}
                clatext-xs bg-[#020b1c] px-2 py-0.5 rounded border border-[#E32636]/50 text-white flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> Edit Rest
              </button>
            )}
          </div>
        ) : mode === 'TABATA' ? (
          <span>Round <span className="text-white text-lg font-black">{currentRound}</span> of {tabataRounds}</span>
        ) : mode === 'WARMUP' && warmupPhase === 'STRETCH' ? (
          <span>Stretch <span className="text-white text-lg font-black">{stretchRound}</span> of 6 (20s)</span>
        ) : null}
      </div>

      {/* Post Rest Edit Modal */}
      {isEditingPostRest && (
        <div className="flex items-center justify-center gap-2 bg-[#020b1c] p-3 rounded-2xl border border-[#0047BA] max-w-xs mx-auto mb-4">
          <input
            type="number"
            value={editPostRestInput}
            onChange={(e) => setEditPostRestInput(e.target.value)}
            className="w-20 text-center bg-[#001f5c] border border-[#0047BA] text-white font-mono font-black text-xl rounded-xl p-1"
          />
          <span className="text-xs text-blue-300 font-bold">Seconds</span>
          <button type="button" onClick={handleSavePostRest} className="p-1.5 bg-emerald-600 rounded-lg text-white">
            <Check className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => setIsEditingPostRest(false)} className="p-1.5 bg-slate-800 rounded-lg text-slate-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TABATA Specific 10s Adjusters & Round Stepper */}
      {!isProjectorView && !isActive && mode === 'TABATA' && (
        <div className="space-y-2 max-w-md mx-auto mb-4">
          <div className="grid grid-cols-2 gap-2">
            {/* Work 10s Adjusters */}
            <div className="flex items-center justify-between bg-[#020b1c] border-2 border-[#0047BA] p-2 rounded-2xl">
              <span className="text-xs font-black uppercase text-blue-300 ml-1">Work: {tabataWork}s</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => adjustTabataWork(-10)} className="p-1.5 bg-[#001f5c] hover:bg-[#0047BA] rounded-xl text-white">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => adjustTabataWork(10)} className="p-1.5 bg-[#001f5c] hover:bg-[#0047BA] rounded-xl text-white">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Rest 10s Adjusters */}
            <div className="flex items-center justify-between bg-[#020b1c] border-2 border-[#0047BA] p-2 rounded-2xl">
              <span className="text-xs font-black uppercase text-[#E32636] ml-1">Rest: {tabataRest}s</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => adjustTabataRest(-10)} className="p-1.5 bg-[#001f5c] hover:bg-[#0047BA] rounded-xl text-white">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => adjustTabataRest(10)} className="p-1.5 bg-[#001f5c] hover:bg-[#0047BA] rounded-xl text-white">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Rounds Stepper */}
          <div className="flex items-center justify-between bg-[#020b1c] border-2 border-[#0047BA] px-3 py-2 rounded-2xl">
            <span className="text-xs font-black uppercase text-white">Total Rounds: {tabataRounds}</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => adjustTabataRounds(-1)} className="px-3 py-1 bg-[#001f5c] hover:bg-[#0047BA] rounded-xl text-xs font-bold text-white">
                -1 Round
              </button>
              <button type="button" onClick={() => adjustTabataRounds(1)} className="px-3 py-1 bg-[#001f5c] hover:bg-[#0047BA] rounded-xl text-xs font-bold text-white">
                +1 Round
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 15s Adjusters for Non-Tabata Modes */}
      {!isProjectorView && !isActive && mode !== 'TABATA' && (
        <div className="grid grid-cols-3 gap-2 max-w-md mx-auto mb-4">
          <button
            type="button"
            onClick={() => adjust15s(-15)}
            className="flex items-center justify-center gap-1 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-3 rounded-2xl text-sm font-mono font-black shadow-lg transition"
          >
            <Minus className="w-4 h-4 stroke-[3]" />
            <span>15s</span>
          </button>
          <div className="flex items-center justify-center text-xs font-black uppercase text-blue-300/70 border border-[#0047BA]/40 rounded-2xl bg-[#020b1c]/50">
            ± 15s Step
          </div>
          <button
            type="button"
            onClick={() => adjust15s(15)}
            className="flex items-center justify-center gap-1 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-3 rounded-2xl text-sm font-mono font-black shadow-lg transition"
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
