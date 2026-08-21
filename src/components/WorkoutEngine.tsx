'use client';
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus, Edit3, Check, X } from 'lucide-react';
import { soundEngine } from '@/utils/audio';

type WorkoutMode = 'TABATA' | 'AMRAP' | 'EMOM' | 'FOR_TIME';

export default function WorkoutEngine() {
  const [mode, setMode] = useState<WorkoutMode>('TABATA');
  const [tabataWork, setTabataWork] = useState(20);
  const [tabataRest, setTabataRest] = useState(10);
  const [tabataRounds, setTabataRounds] = useState(8);
  const [amrapMinutes, setAmrapMinutes] = useState(10);
  const [amrapCompletedRounds, setAmrapCompletedRounds] = useState(0);
  const [emomInterval, setEmomInterval] = useState(60);
  const [emomRounds, setEmomRounds] = useState(10);

  // For Time (Countdown default 5:00 = 300s)
  const [forTimeTotalSeconds, setForTimeTotalSeconds] = useState(300);
  const [isEditingForTime, setIsEditingForTime] = useState(false);
  const [editMinutes, setEditMinutes] = useState('5');
  const [editSeconds, setEditSeconds] = useState('00');

  const [isActive, setIsActive] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [isWorkPhase, setIsWorkPhase] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(20);

  const handleModeChange = (newMode: WorkoutMode) => {
    setMode(newMode);
    setIsActive(false);
    setCurrentRound(1);
    setIsWorkPhase(true);
    setAmrapCompletedRounds(0);
    setIsEditingForTime(false);

    if (newMode === 'TABATA') setSecondsRemaining(tabataWork);
    if (newMode === 'AMRAP') setSecondsRemaining(amrapMinutes * 60);
    if (newMode === 'EMOM') setSecondsRemaining(emomInterval);
    if (newMode === 'FOR_TIME') setSecondsRemaining(forTimeTotalSeconds);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isActive) {
      timer = setInterval(() => {
        if (mode === 'TABATA') {
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
  }, [isActive, mode, isWorkPhase, currentRound, tabataWork, tabataRest, tabataRounds, emomInterval, emomRounds]);

  const resetTimer = () => {
    setIsActive(false);
    setCurrentRound(1);
    setIsWorkPhase(true);
    setAmrapCompletedRounds(0);
    setIsEditingForTime(false);

    if (mode === 'TABATA') setSecondsRemaining(tabataWork);
    if (mode === 'AMRAP') setSecondsRemaining(amrapMinutes * 60);
    if (mode === 'EMOM') setSecondsRemaining(emomInterval);
    if (mode === 'FOR_TIME') setSecondsRemaining(forTimeTotalSeconds);
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

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#0d2044] border border-blue-800/60 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
      {/* Mode Selectors */}
      <div className="flex flex-wrap items-center justify-center gap-2 bg-[#061024] p-2 rounded-2xl mb-8 border border-blue-900/50">
        {(['TABATA', 'AMRAP', 'EMOM', 'FOR_TIME'] as const).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`px-5 py-2.5 rounded-xl font-black text-sm tracking-wider transition ${
              mode === m ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-blue-300 hover:text-white'
            }`}
          >
            {m.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Mode Status Pill */}
      <div className="text-center mb-4">
        {mode === 'TABATA' && (
          <span className={`text-base sm:text-lg font-black uppercase tracking-widest px-6 py-1.5 rounded-full border ${
            isWorkPhase ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
          }`}>
            {isWorkPhase ? 'WORK INTERVAL' : 'REST INTERVAL'}
          </span>
        )}
        {mode === 'EMOM' && (
          <span className="text-base sm:text-lg font-black uppercase tracking-widest px-6 py-1.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
            ROUND {currentRound} OF {emomRounds}
          </span>
        )}
        {mode === 'AMRAP' && (
          <span className="text-base sm:text-lg font-black uppercase tracking-widest px-6 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
            AMRAP
          </span>
        )}
        {mode === 'FOR_TIME' && (
          <span className="text-base sm:text-lg font-black uppercase tracking-widest px-6 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            FOR TIME COUNTDOWN
          </span>
        )}
      </div>

      {/* Main Countdown Display */}
      {isEditingForTime && mode === 'FOR_TIME' ? (
        <div className="flex items-center justify-center gap-3 my-6">
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase font-bold text-blue-300 mb-1">Minutes</span>
            <input
              type="number"
              min="0"
              max="99"
              value={editMinutes}
              onChange={(e) => setEditMinutes(e.target.value)}
              className="w-24 text-center bg-[#061024] border border-blue-700 text-white font-mono font-black text-5xl sm:text-6xl rounded-2xl p-2 focus:outline-none focus:border-blue-400"
            />
          </div>
          <span className="text-5xl font-mono font-black text-blue-400 mt-6">:</span>
          <div className="flex flex-col items-center">
            <span className="text-xs uppercase font-bold text-blue-300 mb-1">Seconds</span>
            <input
              type="number"
              min="0"
              max="59"
              value={editSeconds}
              onChange={(e) => setEditSeconds(e.target.value)}
              className="w-24 text-center bg-[#061024] border border-blue-700 text-white font-mono font-black text-5xl sm:text-6xl rounded-2xl p-2 focus:outline-none focus:border-blue-400"
            />
          </div>
          <div className="flex flex-col gap-2 mt-6 ml-2">
            <button
              onClick={handleSaveCustomTime}
              className="p-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white shadow-md transition"
              title="Save Time"
            >
              <Check className="w-6 h-6" />
            </button>
            <button
              onClick={() => setIsEditingForTime(false)}
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition"
              title="Cancel"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      ) : (
        <div className={`text-center font-mono font-black text-8xl sm:text-9xl tracking-tight my-4 select-none ${
          mode === 'TABATA' && !isWorkPhase ? 'text-amber-400' : 'text-white'
        }`}>
          {formatTime(secondsRemaining)}
        </div>
      )}

      {/* Sub-counters for AMRAP & Tabata */}
      {mode === 'TABATA' && (
        <div className="text-center text-xl font-bold text-blue-300 mb-6">
          Round <span className="text-white text-2xl font-black">{currentRound}</span> of {tabataRounds}
        </div>
      )}

      {mode === 'AMRAP' && (
        <div className="flex items-center justify-center gap-4 mb-6">
          <span className="text-blue-300 font-bold text-lg">Completed Rounds:</span>
          <div className="flex items-center gap-3 bg-[#061024] px-4 py-2 rounded-2xl border border-blue-900/50">
            <button onClick={() => setAmrapCompletedRounds((r) => Math.max(0, r - 1))} className="p-1 text-blue-300 hover:text-white"><Minus className="w-5 h-5" /></button>
            <span className="text-2xl font-black text-white px-2">{amrapCompletedRounds}</span>
            <button onClick={() => setAmrapCompletedRounds((r) => r + 1)} className="p-1 text-blue-300 hover:text-white"><Plus className="w-5 h-5" /></button>
          </div>
        </div>
      )}

      {/* Quick Adjusters */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8 text-xs sm:text-sm font-semibold text-blue-200">
        {mode === 'FOR_TIME' && (
          <>
            <div className="flex items-center gap-2 bg-[#061024] px-3 py-1.5 rounded-xl border border-blue-900/50">
              <span>Time: {formatTime(forTimeTotalSeconds)}</span>
              <button onClick={() => handleAdjustForTimeSeconds(-30)} className="hover:text-white px-1 font-bold text-xs bg-blue-950/80 rounded py-0.5 border border-blue-800/40">-30s</button>
              <button onClick={() => handleAdjustForTimeSeconds(30)} className="hover:text-white px-1 font-bold text-xs bg-blue-950/80 rounded py-0.5 border border-blue-800/40">+30s</button>
            </div>
            <button
              onClick={() => {
                setEditMinutes(Math.floor(forTimeTotalSeconds / 60).toString());
                setEditSeconds((forTimeTotalSeconds % 60).toString().padStart(2, '0'));
                setIsEditingForTime(true);
              }}
              className="flex items-center gap-1.5 bg-[#061024] hover:bg-blue-900/40 text-blue-300 border border-blue-900/50 px-3 py-1.5 rounded-xl transition"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Custom Time</span>
            </button>
          </>
        )}

        {mode === 'TABATA' && (
          <>
            <div className="flex items-center gap-2 bg-[#061024] px-3 py-1.5 rounded-xl border border-blue-900/50">
              <span>Work: {tabataWork}s</span>
              <button onClick={() => { setTabataWork(w => Math.max(5, w - 5)); if (!isActive && isWorkPhase) setSecondsRemaining(w => Math.max(5, w - 5)); }} className="hover:text-white"><Minus className="w-4 h-4" /></button>
              <button onClick={() => { setTabataWork(w => w + 5); if (!isActive && isWorkPhase) setSecondsRemaining(w => w + 5); }} className="hover:text-white"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2 bg-[#061024] px-3 py-1.5 rounded-xl border border-blue-900/50">
              <span>Rest: {tabataRest}s</span>
              <button onClick={() => setTabataRest(r => Math.max(5, r - 5))} className="hover:text-white"><Minus className="w-4 h-4" /></button>
              <button onClick={() => setTabataRest(r => r + 5)} className="hover:text-white"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2 bg-[#061024] px-3 py-1.5 rounded-xl border border-blue-900/50">
              <span>Rounds: {tabataRounds}</span>
              <button onClick={() => setTabataRounds(r => Math.max(1, r - 1))} className="hover:text-white"><Minus className="w-4 h-4" /></button>
              <button onClick={() => setTabataRounds(r => r + 1)} className="hover:text-white"><Plus className="w-4 h-4" /></button>
            </div>
          </>
        )}

        {mode === 'AMRAP' && (
          <div className="flex items-center gap-2 bg-[#061024] px-3 py-1.5 rounded-xl border border-blue-900/50">
            <span>Cap: {amrapMinutes}m</span>
            <button onClick={() => { setAmrapMinutes(m => Math.max(1, m - 1)); if (!isActive) setSecondsRemaining(m => Math.max(60, (m - 1) * 60)); }} className="hover:text-white"><Minus className="w-4 h-4" /></button>
            <button onClick={() => { setAmrapMinutes(m => m + 1); if (!isActive) setSecondsRemaining(m => (m + 1) * 60); }} className="hover:text-white"><Plus className="w-4 h-4" /></button>
          </div>
        )}

        {mode === 'EMOM' && (
          <>
            <div className="flex items-center gap-2 bg-[#061024] px-3 py-1.5 rounded-xl border border-blue-900/50">
              <span>Interval: {emomInterval}s</span>
              <button onClick={() => { setEmomInterval(i => Math.max(30, i - 15)); if (!isActive) setSecondsRemaining(i => Math.max(30, i - 15)); }} className="hover:text-white"><Minus className="w-4 h-4" /></button>
              <button onClick={() => { setEmomInterval(i => i + 15); if (!isActive) setSecondsRemaining(i => i + 15); }} className="hover:text-white"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2 bg-[#061024] px-3 py-1.5 rounded-xl border border-blue-900/50">
              <span>Rounds: {emomRounds}</span>
              <button onClick={() => setEmomRounds(r => Math.max(1, r - 1))} className="hover:text-white"><Minus className="w-4 h-4" /></button>
              <button onClick={() => setEmomRounds(r => r + 1)} className="hover:text-white"><Plus className="w-4 h-4" /></button>
            </div>
          </>
        )}
      </div>

      {/* Play / Pause / Reset Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => {
            soundEngine.playWorkGo();
            setIsActive(!isActive);
          }}
          className={`flex items-center gap-2 px-10 py-4 rounded-2xl font-black text-xl tracking-wider transition shadow-2xl ${
            isActive ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
          }`}
        >
          {isActive ? <><Pause className="w-6 h-6 fill-current" /> PAUSE</> : <><Play className="w-6 h-6 fill-current" /> START</>}
        </button>
        <button onClick={resetTimer} className="p-4 bg-[#061024] hover:bg-blue-950 text-blue-300 rounded-2xl border border-blue-900/50 transition">
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
