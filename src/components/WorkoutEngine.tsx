'use client';
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Edit3, Check, X } from 'lucide-react';
import { soundEngine } from '@/utils/audio';
import { RemoteCommand } from '@/hooks/useRemoteSync';

interface WorkoutEngineProps {
  onCommand?: (cmd: Omit<RemoteCommand, 'timestamp'>) => void;
  incomingCommand?: RemoteCommand | null;
  isProjectorView?: boolean;
}

type WorkoutMode = 'WARMUP' | 'TABATA' | 'AMRAP' | 'EMOM' | 'FOR_TIME';

export default function WorkoutEngine({ onCommand, incomingCommand, isProjectorView = false }: WorkoutEngineProps) {
  const [mode, setMode] = useState<WorkoutMode>('WARMUP');
  
  const [warmupRunSeconds, setWarmupRunSeconds] = useState(180);
  const [warmupPhase, setWarmupPhase] = useState<'RUN' | 'STRETCH'>('RUN');
  const [stretchRound, setStretchRound] = useState(1);
  const totalStretchRounds = 6;

  const [tabataWork, setTabataWork] = useState(20);
  const [tabataRest, setTabataRest] = useState(10);
  const [tabataRounds, setTabataRounds] = useState(8);

  const [amrapMinutes, setAmrapMinutes] = useState(5);
  const [amrapCompletedRounds, setAmrapCompletedRounds] = useState(0);
  const [isEditingAmrap, setIsEditingAmrap] = useState(false);
  const [editAmrapInput, setEditAmrapInput] = useState('5');

  const [emomInterval, setEmomInterval] = useState(60);
  const [emomRounds, setEmomRounds] = useState(10);

  const [forTimeTotalSeconds, setForTimeTotalSeconds] = useState(300);
  const [isEditingForTime, setIsEditingForTime] = useState(false);
  const [editMinutes, setEditMinutes] = useState('5');
  const [editSeconds, setEditSeconds] = useState('00');

  const [isActive, setIsActive] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [isWorkPhase, setIsWorkPhase] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(180);

  const applyModeChange = (newMode: WorkoutMode) => {
    setMode(newMode);
    setIsActive(false);
    setCurrentRound(1);
    setIsWorkPhase(true);
    setAmrapCompletedRounds(0);
    setIsEditingForTime(false);
    setIsEditingAmrap(false);
    setWarmupPhase('RUN');
    setStretchRound(1);

    let nextSec = 180;
    if (newMode === 'WARMUP') nextSec = warmupRunSeconds;
    if (newMode === 'TABATA') nextSec = tabataWork;
    if (newMode === 'AMRAP') nextSec = amrapMinutes * 60;
    if (newMode === 'EMOM') nextSec = emomInterval;
    if (newMode === 'FOR_TIME') nextSec = forTimeTotalSeconds;

    setSecondsRemaining(nextSec);
  };

  const handleModeChange = (newMode: WorkoutMode) => {
    applyModeChange(newMode);
    if (onCommand) {
      onCommand({ action: 'SET_MODE', mode: newMode });
    }
  };

  useEffect(() => {
    if (!incomingCommand) return;

    if (incomingCommand.action === 'START') {
      soundEngine.playWorkGo();
      setIsActive(true);
    } else if (incomingCommand.action === 'PAUSE') {
      setIsActive(false);
    } else if (incomingCommand.action === 'RESET') {
      setIsActive(false);
      setCurrentRound(1);
      setIsWorkPhase(true);
      setWarmupPhase('RUN');
      setStretchRound(1);
      setSecondsRemaining(180);
    } else if (incomingCommand.action === 'SET_MODE' && incomingCommand.mode) {
      applyModeChange(incomingCommand.mode);
    } else if (incomingCommand.action === 'ADJUST_SECONDS' && incomingCommand.seconds !== undefined) {
      setSecondsRemaining(incomingCommand.seconds);
    } else if (incomingCommand.action === 'SET_CUSTOM_TIME' && incomingCommand.seconds !== undefined) {
      setForTimeTotalSeconds(incomingCommand.seconds);
      setSecondsRemaining(incomingCommand.seconds);
    }
  }, [incomingCommand]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isActive) {
      timer = setInterval(() => {
        if (mode === 'WARMUP') {
          setSecondsRemaining((prev) => {
            if (prev <= 4 && prev > 1) soundEngine.playCountdownTick();
            if (prev > 1) return prev - 1;

            if (warmupPhase === 'RUN') {
              soundEngine.playWorkGo();
              setWarmupPhase('STRETCH');
              setStretchRound(1);
              return 20;
            } else {
              if (stretchRound < totalStretchRounds) {
                soundEngine.playWorkGo();
                setStretchRound((r) => r + 1);
                return 20;
              } else {
                soundEngine.playCleanupChime();
                setIsActive(false);
                return 0;
              }
            }
          });
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
                setIsActive(false);
                return 0;
              }
            }
          });
        } else if (mode === 'EMOM') {
          setSecondsRemaining((prev) => {
            if (prev <= 4 && prev > 1) soundEngine.playCountdownTick();
            if (prev > 1) return prev - 1;
            if (currentRound < emomRounds) {
              soundEngine.playWorkGo();
              setCurrentRound((r) => r + 1);
              return emomInterval;
            } else {
              setIsActive(false);
              return 0;
            }
          });
        } else if (mode === 'AMRAP' || mode === 'FOR_TIME') {
          setSecondsRemaining((prev) => {
            if (prev <= 4 && prev > 1) soundEngine.playCountdownTick();
            if (prev > 1) return prev - 1;
            soundEngine.playRest();
            setIsActive(false);
            return 0;
          });
        }
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isActive, mode, warmupPhase, stretchRound, isWorkPhase, currentRound, tabataWork, tabataRest, tabataRounds, emomInterval, emomRounds]);

  const resetTimer = () => {
    setIsActive(false);
    setCurrentRound(1);
    setIsWorkPhase(true);
    setAmrapCompletedRounds(0);
    setIsEditingForTime(false);
    setIsEditingAmrap(false);
    setWarmupPhase('RUN');
    setStretchRound(1);

    let sec = 180;
    if (mode === 'WARMUP') sec = warmupRunSeconds;
    if (mode === 'TABATA') sec = tabataWork;
    if (mode === 'AMRAP') sec = amrapMinutes * 60;
    if (mode === 'EMOM') sec = emomInterval;
    if (mode === 'FOR_TIME') sec = forTimeTotalSeconds;

    setSecondsRemaining(sec);
    if (onCommand) {
      onCommand({ action: 'RESET' });
    }
  };

  const handleToggleActive = () => {
    const nextActive = !isActive;
    if (nextActive) {
      soundEngine.playWorkGo();
    }
    setIsActive(nextActive);
    if (onCommand) {
      onCommand({ action: nextActive ? 'START' : 'PAUSE' });
    }
  };

  const handleAdjustWarmupRunSeconds = (delta: number) => {
    setWarmupRunSeconds((prev) => {
      const nextVal = Math.max(30, prev + delta);
      if (!isActive && warmupPhase === 'RUN') {
        setSecondsRemaining(nextVal);
        if (onCommand) onCommand({ action: 'ADJUST_SECONDS', seconds: nextVal });
      }
      return nextVal;
    });
  };

  const handleAdjustForTimeSeconds = (delta: number) => {
    setForTimeTotalSeconds((prev) => {
      const nextVal = Math.max(10, prev + delta);
      if (!isActive) {
        setSecondsRemaining(nextVal);
        if (onCommand) onCommand({ action: 'ADJUST_SECONDS', seconds: nextVal });
      }
      return nextVal;
    });
  };

  const handleSaveCustomTime = () => {
    const mins = Math.max(0, parseInt(editMinutes) || 0);
    const secs = Math.max(0, Math.min(59, parseInt(editSeconds) || 0));
    const total = mins * 60 + secs;
    if (total > 0) {
      setForTimeTotalSeconds(total);
      if (!isActive) {
        setSecondsRemaining(total);
        if (onCommand) onCommand({ action: 'SET_CUSTOM_TIME', seconds: total });
      }
    }
    setIsEditingForTime(false);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-[#001f5c]/95 border-2 border-[#0047BA] rounded-3xl p-4 sm:p-7 shadow-2xl text-white backdrop-blur-md ${
      isProjectorView ? 'p-8 sm:p-12' : ''
    }`}>
      {/* Mode Selectors */}
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

      {/* Mode Status Pill */}
      <div className="text-center mb-2">
        {mode === 'WARMUP' && (
          <span className={`text-xs sm:text-sm font-black uppercase tracking-widest px-4 py-1 rounded-full border ${
            warmupPhase === 'RUN'
              ? 'bg-[#E32636]/20 text-[#E32636] border-[#E32636]/50'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
          }`}>
            {warmupPhase === 'RUN' ? `RUN PHASE (${formatTime(warmupRunSeconds)})` : `DYNAMIC STRETCH ${stretchRound} OF 6`}
          </span>
        )}
        {mode === 'TABATA' && (
          <span className={`text-xs sm:text-sm font-black uppercase tracking-widest px-4 py-1 rounded-full border ${
            isWorkPhase ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-[#E32636]/20 text-[#E32636] border-[#E32636]/50'
          }`}>
            {isWorkPhase ? 'WORK INTERVAL' : 'REST INTERVAL'}
          </span>
        )}
        {mode === 'EMOM' && (
          <span className="text-xs sm:text-sm font-black uppercase tracking-widest px-4 py-1 rounded-full bg-[#0047BA]/40 text-white border border-[#0047BA]">
            ROUND {currentRound} OF {emomRounds}
          </span>
        )}
        {mode === 'AMRAP' && (
          <span className="text-xs sm:text-sm font-black uppercase tracng-widest px-4 py-1 rounded-full bg-[#E32636]/20 text-[#E32636] border border-[#E32636]/50">
            AMRAP: {amrapMinutes} MIN
          </span>
        )}
        {mode === 'FOR_TIME' && (
          <span className="text-xs sm:text-sm font-black uppercase tracking-widest px-4 py-1 rounded-full bg-[#0047BA]/40 text-white border border-[#0047BA]">
            FOR TIME COUNTDOWN
          </span>
        )}
      </div>

      {/* Editing Modes Overlay */}
      {isEditingForTime && mode === 'FOR_TIME' ? (
        <div className="flex flex-col items-center justify-center gap-3 my-5 bg-[#020b1c] p-5 rounded-3xl border-2 border-[#0047BA] shadow-xl max-w-sm mx-auto">
          <span className="text-xs uppercase font-black tracking-widest text-[#E32636]">Set Custom Countdown</span>
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
              onClick={handleSaveCustomTime}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold transition text-xs"
            >
              <Check className="w-4 h-4" /> Save
            </button>
            <button
              type="button"
              onClick={() => setIsEditingForTime(false)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-bold transition text-xs"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={`text-center font-mono font-black tracking-tight my-2 select-none ${
          isProjectorView ? 'text-[15vw] leading-none' : 'text-8xl sm:text-9xl'
        } ${
          (mode === 'TABATA' && !isWorkPhase) || (mode === 'WARMUP' && warmupPhase === 'RUN') ? 'text-[#E32636]' : 'text-white'
        }`}>
          {formatTime(secondsRemaining)}
        </div>
      )}

      {/* Sub-Info */}
      {mode === 'WARMUP' && (
        <div className="text-center text-sm sm:text-base font-bold text-blue-200 mb-4">
          {warmupPhase === 'RUN' ? (
            <span>Continuous Jog & Warm-Up Run</span>
          ) : (
            <span>Stretch <span className="text-white font-black text-lg">{stretchRound}</span> of 6 (20s Switch)</span>
          )}
        </div>
      )}

      {mode === 'TABATA' && (
        <div className="text-center text-base sm:text-lg font-bold text-blue-200 mb-4">
          Round <span className="text-white text-xl font-black">{currentRound}</span> of {tabataRounds}
        </div>
      )}

      {/* Controls Bar */}
      {!isProjectorView && (
        <div className="my-4">
          {mode === 'WARMUP' && (
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => handleAdjustWarmupRunSeconds(-30)}
                className="flex items-center justify-center gap-1.5 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-3 rounded-2xl text-base font-mono font-black shadow-lg transition cursor-pointer"
              >
                <Minus className="w-4 h-4 stroke-[3]" />
                <span>30s Run</span>
              </button>

              <button
                type="button"
                onClick={() => handleAdjustWarmupRunSeconds(30)}
                className="flex items-center justify-center gap-1.5 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-3 rounded-2xl text-base font-mono font-black shadow-lg transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>30s Run</span>
              </button>
            </div>
          )}

          {mode === 'FOR_TIME' && !isEditingForTime && (
            <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => handleAdjustForTimeSeconds(-30)}
                className="flex items-center justify-center gap-1 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-3 rounded-2xl text-base font-mono font-black shadow-lg transition cursor-pointer"
              >
                <Minus className="w-4 h-4 stroke-[3]" />
                <span>30s</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditMinutes(Math.floor(forTimeTotalSeconds / 60).toString());
                  setEditSeconds((forTimeTotalSeconds % 60).toString().padStart(2, '0'));
                  setIsEditingForTime(true);
                }}
                className="flex items-center justify-center gap-1 bg-[#0047BA]/40 hover:bg-[#0047BA]/70 active:scale-95 text-white border-2 border-white/40 py-3 rounded-2xl text-xs font-black shadow-lg transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>EDIT</span>
              </button>

              <button
                type="button"
                onClick={() => handleAdjustForTimeSeconds(30)}
                className="flex items-center justify-center gap-1 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-3 rounded-2xl text-base font-mono font-black shadow-lg transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>30s</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {!isProjectorView && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleToggleActive}
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
