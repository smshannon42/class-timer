'use client';
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Plus, Minus } from 'lucide-react';
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
  const [forTimeCap, setForTimeCap] = useState(12);

  const [isActive, setIsActive] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [isWorkPhase, setIsWorkPhase] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(20);
  const [elapsedForTime, setElapsedForTime] = useState(0);

  const handleModeChange = (newMode: WorkoutMode) => {
    setMode(newMode);
    setIsActive(false);
    setCurrentRound(1);
    setIsWorkPhase(true);
    setAmrapCompletedRounds(0);
    setElapsedForTime(0);

    if (newMode === 'TABATA') setSecondsRemaining(tabataWork);
    if (newMode === 'AMRAP') setSecondsRemaining(amrapMinutes * 60);
    if (newMode === 'EMOM') setSecondsRemaining(emomInterval);
    if (newMode === 'FOR_TIME') setSecondsRemaining(forTimeCap * 60);
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
        } else if (mode === 'AMRAP') {
          setSecondsRemaining((prev) => {
            if (prev <= 4 && prev > 1) soundEngine.playCountdownTick();
            if (prev > 1) return prev - 1;
            setIsActive(false);
            return 0;
          });
        } else if (mode === 'FOR_TIME') {
          setElapsedForTime((prev) => {
            if (forTimeCap > 0 && prev + 1 >= forTimeCap * 60) {
              setIsActive(false);
            }
            return prev + 1;
          });
        }
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isActive, mode, isWorkPhase, currentRound, tabataWork, tabataRest, tabataRounds, emomInterval, emomRounds, forTimeCap]);

  const resetTimer = () => {
    setIsActive(false);
    setCurrentRound(1);
    setIsWorkPhase(true);
    setAmrapCompletedRounds(0);
    setElapsedForTime(0);
    if (mode === 'TABATA') setSecondsRemaining(tabataWork);
    if (mode === 'AMRAP') setSecondsRemaining(amrapMinutes * 60);
    if (mode === 'EMOM') setSecondsRemaining(emomInterval);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
      <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-950 p-2 rounded-2xl mb-8 border border-slate-800">
        {(['TABATA', 'AMRAP', 'EMOM', 'FOR_TIME'] as const).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`px-5 py-2.5 rounded-xl font-black text-sm tracking-wider transition ${
              mode === m ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {m.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="text-center mb-4">
        {mode === 'TABATA' && (
          <span className={`text-base sm:text-lg font-black uppercase tracking-widest px-6 py-1.5 rounded-full border ${
            isWorkPhase ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
          }`}>
            {isWorkPhase ? 'WORK INTERVAL' : 'REST INTERVAL'}
          </span>
        )}
        {mode === 'EMOM' && (
          <span className="text-base sm:text-lg font-black uppercase tracking-widest px-6 py-1.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40">
            ROUND {currentRound} OF {emomRounds}
          </span>
        )}
        {mode === 'AMRAP' && (
          <span className="text-base sm:text-lg font-black uppercase tracking-widest px-6 py-1.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/40">
            AMRAP
          </span>
        )}
        {mode === 'FOR_TIME' && (
          <span className="text-base sm:text-lg font-black uppercase tracking-widest px-6 py-1.5 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
            TIME CAP: {forTimeCap} MIN
          </span>
        )}
      </div>

      <div className={`text-center font-mono font-black text-8xl sm:text-9xl tracking-tight my-4 select-none ${
        mode === 'TABATA' && !isWorkPhase ? 'text-amber-400' : 'text-white'
      }`}>
        {mode === 'FOR_TIME' ? formatTime(elapsedForTime) : formatTime(secondsRemaining)}
      </div>

      {mode === 'TABATA' && (
        <div className="text-center text-xl font-bold text-slate-400 mb-6">
          Round <span className="text-white text-2xl font-black">{currentRound}</span> of {tabataRounds}
        </div>
      )}

      {mode === 'AMRAP' && (
        <div className="flex items-center justify-center gap-4 mb-6">
          <span className="text-slate-400 font-bold text-lg">Completed Rounds:</span>
          <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-2xl border border-slate-700">
            <button onClick={() => setAmrapCompletedRounds((r) => Math.max(0, r - 1))} className="p-1 text-slate-400 hover:text-white"><Minus className="w-5 h-5" /></button>
            <span className="text-2xl font-black text-white px-2">{amrapCompletedRounds}</span>
            <button onClick={() => setAmrapCompletedRounds((r) => r + 1)} className="p-1 text-slate-400 hover:text-white"><Plus className="w-5 h-5" /></button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 mb-8 text-xs sm:text-sm font-semibold text-slate-300">
        {mode === 'TABATA' && (
          <>
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <span>Work: {tabataWork}s</span>
              <button onClick={() => { setTabataWork(w => Math.max(5, w - 5)); if (!isActive && isWorkPhase) setSecondsRemaining(w => Math.max(5, w - 5)); }} className="hover:text-white"><Minus className="w-4 h-4" /></button>
              <button onClick={() => { setTabataWork(w => w + 5); if (!isActive && isWorkPhase) setSecondsRemaining(w => w + 5); }} className="hover:text-white"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <span>Rest: {tabataRest}s</span>
              <button onClick={() => setTabataRest(r => Math.max(5, r - 5))} className="hover:text-white"><Minus className="w-4 h-4" /></button>
              <button onClick={() => setTabataRest(r => r + 5)} className="hover:text-white"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <span>Rounds: {tabataRounds}</span>
              <button onClick={() => setTabataRounds(r => Math.max(1, r - 1))} className="hover:text-white"><Minus className="w-4 h-4" /></button>
              <button onClick={() => setTabataRounds(r => r + 1)} className="hover:text-white"><Plus className="w-4 h-4" /></button>
            </div>
          </>
        )}

        {mode === 'AMRAP' && (
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <span>Cap: {amrapMinutes}m</span>
            <button onClick={() => { setAmrapMinutes(m => Math.max(1, m - 1)); if (!isActive) setSecondsRemaining(m => Math.max(60, (m - 1) * 60)); }} className="hover:text-white"><Minus className="w-4 h-4" /></button>
            <button onClick={() => { setAmrapMinutes(m => m + 1); if (!isActive) setSecondsRemaining(m => (m + 1) * 60); }} className="hover:text-white"><Plus className="w-4 h-4" /></button>
          </div>
        )}

        {mode === 'EMOM' && (
          <>
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <span>Interval: {emomInterval}s</span>
              <button onClick={() => { setEmomInterval(i => Math.max(30, i - 15)); if (!isActive) setSecondsRemaining(i => Math.max(30, i - 15)); }} className="hover:text-white"><Minus className="w-4 h-4" /></button>
              <button onClick={() => { setEmomInterval(i => i + 15); if (!isActive) setSecondsRemaining(i => i + 15); }} className="hover:text-white"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <span>Rounds: {emomRounds}</span>
              <button onClick={() => setEmomRounds(r => Math.max(1, r - 1))} className="hover:text-white"><Minus className="w-4 h-4" /></button>
              <button onClick={() => setEmomRounds(r => r + 1)} className="hover:text-white"><Plus className="w-4 h-4" /></button>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => {
            soundEngine.playWorkGo();
            setIsActive(!isActive);
          }}
          className={`flex items-center gap-2 px-10 py-4 rounded-2xl font-black text-xl tracking-wider transition shadow-2xl ${
            isActive ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {isActive ? <><Pause className="w-6 h-6 fill-current" /> PAUSE</> : <><Play className="w-6 h-6 fill-current" /> START</>}
        </button>
        <button onClick={resetTimer} className="p-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 transition">
          <RotateCcw className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
