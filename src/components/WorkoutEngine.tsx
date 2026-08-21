'use client';
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Edit3, Check, X } from 'lucide-react';
import { soundEngine } from '@/utils/audio';

type WorkoutMode = 'WARMUP' | 'TABATA' | 'AMRAP' | 'EMOM' | 'FOR_TIME';

export default function WorkoutEngine() {
  const [mode, setMode] = useState<WorkoutMode>('WARMUP');
  
  // Warmup state
  const [warmupRunSeconds, setWarmupRunSeconds] = useState(180);
  const [warmupPhase, setWarmupPhase] = useState<'RUN' | 'STRETCH'>('RUN');
  const [stretchRound, setStretchRound] = useState(1);
  const totalStretchRounds = 6;

  // Tabata defaults
  const [tabataWork, setTabataWork] = useState(20);
  const [tabataRest, setTabataRest] = useState(10);
  const [tabataRounds, setTabataRounds] = useState(8);

  // AMRAP defaults to 5 minutes
  const [amrapMinutes, setAmrapMinutes] = useState(5);
  const [amrapCompletedRounds, setAmrapCompletedRounds] = useState(0);
  const [isEditingAmrap, setIsEditingAmrap] = useState(false);
  const [editAmrapInput, setEditAmrapInput] = useState('5');

  // EMOM defaults
  const [emomInterval, setEmomInterval] = useState(60);
  const [emomRounds, setEmomRounds] = useState(10);

  // For Time state (defaults 5:00)
  const [forTimeTotalSeconds, setForTimeTotalSeconds] = useState(300);
  const [isEditingForTime, setIsEditingForTime] = useState(false);
  const [editMinutes, setEditMinutes] = useState('5');
  const [editSeconds, setEditSeconds] = useState('00');

  // Clock runtime state
  const [isActive, setIsActive] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [isWorkPhase, setIsWorkPhase] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(180);

  const handleModeChange = (newMode: WorkoutMode) => {
    setMode(newMode);
    setIsActive(false);
    setCurrentRound(1);
    setIsWorkPhase(true);
    setAmrapCompletedRounds(0);
    setIsEditingForTime(false);
    setIsEditingAmrap(false);
    setWarmupPhase('RUN');
    setStretchRound(1);

    if (newMode === 'WARMUP') setSecondsRemaining(warmupRunSeconds);
    if (newMode === 'TABATA') setSecondsRemaining(tabataWork);
    if (newMode === 'AMRAP') setSecondsRemaining(amrapMinutes * 60);
    if (newMode === 'EMOM') setSecondsRemaining(emomInterval);
    if (newMode === 'FOR_TIME') setSecondsRemaining(forTimeTotalSeconds);
  };

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
            if (prev <= 4 && prev > 1) soundEngine.playCountdownTick();
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

    if (mode === 'WARMUP') setSecondsRemaining(warmupRunSeconds);
    if (mode === 'TABATA') setSecondsRemaining(tabataWork);
    if (mode === 'AMRAP') setSecondsRemaining(amrapMinutes * 60);
    if (mode === 'EMOM') setSecondsRemaining(emomInterval);
    if (mode === 'FOR_TIME') setSecondsRemaining(forTimeTotalSeconds);
  };

  const handleAdjustWarmupRunSeconds = (delta: number) => {
    setWarmupRunSeconds((prev) => {
      const nextVal = Math.max(30, prev + delta);
      if (!isActive && warmupPhase === 'RUN') {
        setSecondsRemaining(nextVal);
      }
      return nextVal;
    });
  };

  const handleAdjustForTimeSeconds = (delta: number) => {
    setForTimeTotalSeconds((prev) => {
      const nextVal = Math.max(10, prev + delta);
      if (!isActive) setSecondsRemaining(nextVal);
      return nextVal;
    });
  };

  const handleSaveCustomTime = () => {
    const mins = Math.max(0, parseInt(editMinutes) || 0);
    const secs = Math.max(0, Math.min(59, parseInt(editSeconds) || 0));
    const total = mins * 60 + secs;
    if (total > 0) {
      setForTimeTotalSeconds(total);
      if (!isActive) setSecondsRemaining(total);
    }
    setIsEditingForTime(false);
  };

  const handleAdjustAmrapMinutes = (delta: number) => {
    setAmrapMinutes((prev) => {
      const nextVal = Math.max(1, prev + delta);
      if (!isActive) setSecondsRemaining(nextVal * 60);
      return nextVal;
    });
  };

  const handleSaveAmrapCustom = () => {
    const mins = Math.max(1, parseInt(editAmrapInput) || 5);
    setAmrapMinutes(mins);
    if (!isActive) setSecondsRemaining(mins * 60);
    setIsEditingAmrap(false);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#001f5c]/95 border-2 border-[#0047BA] rounded-3xl p-5 sm:p-7 shadow-2xl text-white backdrop-blur-md">
      {/* Mode Selectors */}
      <div className="flex flex-wrap items-center justify-center gap-2 bg-[#020b1c] p-2 rounded-2xl mb-6 border border-[#0047BA]">
        {(['WARMUP', 'TABATA', 'AMRAP', 'EMOM', 'FOR_TIME'] as const).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm tracking-wider transition ${
              mode === m
                ? 'bg-[#0047BA] text-white shadow-lg shadow-[#0047BA]/60 border border-white/30'
                : 'text-blue-200 hover:text-white'
            }`}
          >
            {m === 'WARMUP' ? '🔥 WARM-UP' : m.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Mode Status Pill */}
      <div className="text-center mb-3">
        {mode === 'WARMUP' && (
          <span className={`text-sm sm:text-base font-black uppercase tracking-widest px-5 py-1 rounded-full border ${
            warmupPhase === 'RUN'
              ? 'bg-[#E32636]/20 text-[#E32636] border-[#E32636]/50'
              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
          }`}>
            {warmupPhase === 'RUN' ? `RUN PHASE (${formatTime(warmupRunSeconds)})` : `DYNAMIC STRETCH ${stretchRound} OF 6`}
          </span>
        )}
        {mode === 'TABATA' && (
          <span className={`text-sm sm:text-base font-black uppercase tracking-widest px-5 py-1 rounded-full border ${
            isWorkPhase ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-[#E32636]/20 text-[#E32636] border-[#E32636]/50'
          }`}>
            {isWorkPhase ? 'WORK INTERVAL' : 'REST INTERVAL'}
          </span>
        )}
        {mode === 'EMOM' && (
          <span className="text-sm sm:text-base font-black uppercase tracking-widest px-5 py-1 rounded-full bg-[#0047BA]/40 text-white border border-[#0047BA]">
            ROUND {currentRound} OF {emomRounds}
          </span>
        )}
        {mode === 'AMRAP' && (
          <span className="text-sm sm:text-base font-black uppercase tracking-widest px-5 py-1 rounded-full bg-[#E32636]/20 text-[#E32636] border border-[#E32636]/50">
            AMRAP: {amrapMinutes} MIN
          </span>
        )}
        {mode === 'FOR_TIME' && (
          <span className="text-sm sm:text-base font-black uppercase tracking-widest px-5 py-1 rounded-full bg-[#0047BA]/40 text-white border border-[#0047BA]">
            FOR TIME COUNTDOWN
          </span>
        )}
      </div>

      {/* Editing Modes Overlay */}
      {isEditingForTime && mode === 'FOR_TIME' ? (
        <div className="flex flex-col items-center justify-center gap-4 my-6 bg-[#020b1c] p-6 rounded-3xl border-2 border-[#0047BA] shadow-xl max-w-lg mx-auto">
          <span className="text-sm uppercase font-black tracking-widest text-[#E32636]">Set Custom Countdown</span>
          <div className="flex items-center justify-center gap-3">
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase font-bold text-blue-300 mb-1">Minutes</span>
              <input
                type="number"
                min="0"
                max="99"
                value={editMinutes}
                onChange={(e) => setEditMinutes(e.target.value)}
                className="w-24 sm:w-28 text-center bg-[#001f5c] border-2 border-[#0047BA] text-white font-mono font-black text-5xl sm:text-6xl rounded-2xl p-2 sm:p-3 focus:outline-none focus:border-[#E32636]"
              />
            </div>
            <span className="text-5xl sm:text-6xl font-mono font-black text-[#0047BA] mt-6">:</span>
            <div className="flex flex-col items-center">
              <span className="text-xs uppercase font-bold text-blue-300 mb-1">Seconds</span>
              <input
                type="number"
                min="0"
                max="59"
                value={editSeconds}
                onChange={(e) => setEditSeconds(e.target.value)}
                className="w-24 sm:w-28 text-center bg-[#001f5c] border-2 border-[#0047BA] text-white font-mono font-black text-5xl sm:text-6xl rounded-2xl p-2 sm:p-3 focus:outline-none focus:border-[#E32636]"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 w-full max-w-xs justify-center">
            <button
              onClick={handleSaveCustomTime}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 roundexl text-white font-bold transition"
            >
              <Check className="w-5 h-5" /> Save
            </button>
            <button
              onClick={() => setIsEditingForTime(false)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-bold transition"
            >
              <X className="w-5 h-5" /> Cancel
            </button>
          </div>
        </div>
      ) : isEditingAmrap && mode === 'AMRAP' ? (
        <div className="flex flex-col items-center justify-center gap-4 my-6 bg-[#020b1c] p-6 rounded-3xl border-2 border-[#0047BA] shadow-xl max-w-sm mx-auto">
          <span className="text-sm uppercase font-black tracking-widest text-[#E32636]">Set AMRAP Minutes</span>
          <input
            type="number"
            min="1"
            max="60"
            value={editAmrapInput}
            onChange={(e) => setEditAmrapInput(e.target.value)}
            className="w-32 text-center bg-[#001f5c] border-2 border-[#0047BA] text-white font-mono font-black text-6xl rounded-2xl p-3 focus:outline-none focus:border-[#E32636]"
          />
          <div className="flex items-center gap-3 w-full justify-center">
            <button
              onClick={handleSaveAmrapCustom}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold transition"
            >
              <Check className="w-5 h-5" /> Save
            </button>
            <button
              onClick={() => setIsEditingAmrap(false)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-bold transition"
            >
              <X className="w-5 h-5" /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={`text-center font-mono font-black text-8xl sm:text-9xl tracking-tight my-3 select-none ${
          (mode === 'TABATA' && !isWorkPhase) || (mode === 'WARMUP' && warmupPhase === 'RUN') ? 'text-[#E32636]' : 'text-white'
        }`}>
          {formatTime(secondsRemaining)}
        </div>
      )}

      {/* Sub-Info */}
      {mode === 'WARMUP' && (
        <div className="text-center text-base sm:text-lg font-bold text-blue-200 mb-5">
          {warmupPhase === 'RUN' ? (
            <span>Continuous Jog & Warm-Up Run</span>
          ) : (
            <span>Stretch <span className="text-white font-black text-xl">{stretchRound}</span> of 6 (20s Switch)</span>
          )}
        </div>
      )}

      {mode === 'TABATA' && (
        <div className="text-center text-lg font-bold text-blue-200 mb-5">
          Round <span className="text-white text-2xl font-black">{currentRound}</span> of {tabataRounds}
        </div>
      )}

      {mode === 'AMRAP' && (
        <div className="flex items-center justify-center gap-3 mb-5">
          <span className="text-blue-200 font-bold text-base">Completed Rounds:</span>
          <div className="flex items-center gap-3 bg-[#020b1c] px-4 py-1.5 rounded-2xl border border-[#0047BA]">
            <button onClick={() => setAmrapCompletedRounds((r) => Math.max(0, r - 1))} className="p-1 text-blue-300 hover:text-white"><Minus className="w-5 h-5" /></button>
            <span className="text-2xl font-black text-white px-2">{amrapCompletedRounds}</span>
            <button onClick={() => setAmrapCompletedRounds((r) => r + 1)} className="p-1 text-blue-300 hover:text-white"><Plus className="w-5 h-5" /></button>
          </div>
        </div>
      )}

      {/* Adjusters & Buttons */}
      <div className="my-5">
        {/* BIG TABATA ADJUSTERS */}
        {mode === 'TABATA' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            <div className="bg-[#020b1c] border-2 border-[#0047BA] rounded-2xl p-3 flex flex-col items-center justify-between">
              <span className="text-xs uppercase font-black text-blue-300 tracking-wider">Work: {tabataWork}s</span>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => { setTabataWork(w => Math.max(5, w - 5)); if (!isActive && isWorkPhase) setSecondsRemaining(w => Math.max(5, w - 5)); }}
                  className="p-3 bg-[#001f5c] hover:bg-[#0047BA] active:scale-95 text-white rounded-xl border border-white/20"
                >
                  <Minus className="w-5 h-5 stroke-[3]" />
                </button>
                <button
                  onClick={() => { setTabataWork(w => w + 5); if (!isActive && isWorkPhase) setSecondsRemaining(w => w + 5); }}
                  className="p-3 bg-[#001f5c] hover:bg-[#0047BA] active:scale-95 text-white rounded-xl border border-white/20"
                >
                  <Plus className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            </div>

            <div className="bg-[#020b1c] border-2 border-[#0047BA] rounded-2xl p-3 flex flex-col items-center justify-between">
              <span className="text-xs uppercase font-black text-[#E32636] tracking-wider">Rest: {tabataRest}s</span>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => setTabataRest(r => Math.max(5, r - 5))}
                  className="p-3 bg-[#001f5c] hover:bg-[#0047BA] active:scale-95 text-white rounded-xl border border-white/20"
                >
                  <Minus className="w-5 h-5 stroke-[3]" />
                </button>
                <button
                  onClick={() => setTabataRest(r => r + 5)}
                  className="p-3 bg-[#001f5c] hover:bg-[#0047BA] active:scale-95 text-white rounded-xl border border-white/20"
                >
                  <Plus className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            </div>

            <div className="bg-[#020b1c] border-2 border-[#0047BA] rounded-2xl p-3 flex flex-col items-center justify-between">
              <span className="text-xs uppercase font-black text-blue-300 tracking-wider">Rounds: {tabataRounds}</span>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => setTabataRounds(r => Math.max(1, r - 1))}
                  className="p-3 bg-[#001f5c] hover:bg-[#0047BA] active:scale-95 text-white rounded-xl border border-white/20"
                >
                  <Minus className="w-5 h-5 stroke-[3]" />
                </button>
                <button
                  onClick={() => setTabataRounds(r => r + 1)}
                  className="p-3 bg-[#001f5c] hover:bg-[#0047BA] active:scale-95 text-white rounded-xl border border-white/20"
                >
                  <Plus className="w-5 h-5 stroke-[3]" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AMRAP ADJUSTERS & EDIT BUTTON */}
        {mode === 'AMRAP' && !isEditingAmrap && (
          <div className="flex flex-wrap items-center justify-center gap-3 max-w-lg mx-auto">
            <button
              onClick={() => handleAdjustAmrapMinutes(-1)}
              className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-3.5 px-4 rounded-2xl text-xl font-mono font-black shadow-lg transition"
            >
              <Minus className="w-5 h-5 stroke-[3]" />
              <span>1m</span>
            </button>

            <button
              onClick={() => {
                setEditAmrapInput(amrapMinutes.toString());
                setIsEditingAmrap(true);
              }}
              className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 bg-[#0047BA]/40 hover:bg-[#0047BA]/70 active:scale-95 text-white border-2 border-white/40 py-3.5 px-4 rounded-2xl text-sm font-black shadow-lg transition"
            >
              <Edit3 className="w-4 h-4" />
              <span>EDIT TIME</span>
            </button>

            <button
              onClick={() => handleAdjustAmrapMinutes(1)}
              className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-3.5 px-4 rounded-2xl text-xl font-mono font-black shadow-lg transition"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>1m</span>
            </button>
          </div>
        )}

        {/* FOR TIME ADJUSTERS */}
        {mode === 'FOR_TIME' && !isEditingForTime && (
          <div className="flex flex-wrap items-center justify-center gap-3 max-w-lg mx-auto">
            <button
              onClick={() => handleAdjustForTimeSeconds(-30)}
              className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-3.5 px-4 rounded-2xl text-xl font-mono font-black shadow-lg transition"
            >
              <Minus className="w-5 h-5 stroke-[3]" />
              <span>30s</span>
            </button>

            <button
              onClick={() => {
                setEditMinutes(Math.floor(forTimeTotalSeconds / 60).toString());
                setEditSeconds((forTimeTotalSeconds % 60).toString().padStart(2, '0'));
                setIsEditingForTime(true);
              }}
              className="flex-1 min-w-[130px] flex items-center justify-center gap-1.5 bg-[#0047BA]/40 hover:bg-[#0047BA]/70 active:scale-95 text-white border-2 border-white/40 py-3.5 px-4 rounded-2xl text-sm font-black shadow-lg transition"
            >
              <Edit3 className="w-4 h-4" />
              <span>EDIT TIME</span>
            </button>

            <button
              onClick={() => handleAdjustForTimeSeconds(30)}
              className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-3.5 px-4 rounded-2xl text-xl font-mono font-black shadow-lg transition"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
              <span>30s</span>
            </button>
          </div>
        )}

        {/* WARM-UP ADJUSTERS */}
        {mode === 'WARMUP' && (
          <div className="flex flex-col items-center justify-center gap-2 max-w-lg mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-3 w-full">
              <button
                onClick={() => handleAdjustWarmupRunSeconds(-30)}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-3.5 px-4 rounded-2xl text-xl font-mono font-black shadow-lg transition"
              >
                <Minus className="w-5 h-5 stroke-[3]" />
                <span>30s Run</span>
              </button>

              <button
                onClick={() => handleAdjustWarmupRunSeconds(30)}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 bg-[#020b1c] hover:bg-[#0047BA]/40 active:scale-95 text-blue-200 hover:text-white border-2 border-[#0047BA] py-3.5 px-4 rounded-2xl text-xl font-mono font-black shadow-lg transition"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
                <span>30s Run</span>
              </button>
            </div>
          </div>
        )}

        {/* EMOM ADJUSTERS */}
        {mode === 'EMOM' && (
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm font-semibold text-blue-200">
            <div className="flex items-center gap-2 bg-[#020b1c] px-3 py-1.5 rounded-xl border border-[#0047BA]">
              <span>Interval: {emomInterval}s</span>
              <button onClick={() => { setEmomInterval(i => Math.max(30, i - 15)); if (!isActive) setSecondsRemaining(i => Math.max(30, i - 15)); }} className="hover:text-white"><Minus className="w-4 h-4" /></button>
              <button onClick={() => { setEmomInterval(i => i + 15); if (!isActive) setSecondsRemaining(i => i + 15); }} className="hover:text-white"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2 bg-[#020b1c] px-3 py-1.5 rounded-xl border border-[#0047BA]">
              <span>Rounds: {emomRounds}</span>
              <button onClick={() => setEmomRounds(r => Math.max(1, r - 1))} className="hover:text-white"><Minus className="w-4 h-4" /></button>
              <button onClick={() => setEmomRounds(r => r + 1)} className="hover:text-white"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => {
            soundEngine.playWorkGo();
            setIsActive(!isActive);
          }}
          className={`flex items-center gap-2 px-10 py-4 rounded-2xl font-black text-xl tracking-wider transition shadow-2xl ${
            isActive
              ? 'bg-[#E32636] hover:bg-[#c91e2c] text-white shadow-lg shadow-[#E32636]/40'
              : 'bg-[#0047BA] hover:bg-[#003da5] text-white shadow-lg shadow-[#0047BA]/50 border border-white/20'
          }`}
        >
          {isActive ? <><Pause className="w-6 h-6 fill-current" /> PAUSE</> : <><Play className="w-6 h-6 fill-current" /> START</>}
        </button>
        <button onClick={resetTimer} className="p-4 bg-[#020b1c] hover:bg-[#001f5c] text-blue-200 rounded-2xl border border-[#0047BA] transition">
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
