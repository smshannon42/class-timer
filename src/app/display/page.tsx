'use client';
import React, { useState, useEffect } from 'react';
import { useAutoPeriodCountdown } from '@/hooks/useAutoPeriodCountdown';
import { useRemoteSync, RemoteState } from '@/hooks/useRemoteSync';
import { MustangWordmark } from '@/components/MustangLogos';
import { soundEngine } from '@/utils/audio';

export default function DisplayPage() {
  const [state, setState] = useState<RemoteState>({
    mode: 'WARMUP',
    isActive: false,
    secondsRemaining: 180,
    currentRound: 1,
    isWorkPhase: true,
    warmupPhase: 'RUN',
    stretchRound: 1,
    manualPeriodId: 'AUTO',
  });

  const { peerId, isConnected, incomingState } = useRemoteSync(true);
  const { currentPeriod, isPassingPeriod, bellTimeFormatted, cleanupTimeFormatted, cleanupSecLeft } = useAutoPeriodCountdown(state.manualPeriodId);

  useEffect(() => {
    if (incomingState) {
      setState((prev) => ({ ...prev, ...incomingState }));
    }
  }, [incomingState]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (state.isActive && state.secondsRemaining > 0) {
      timer = setInterval(() => {
        setState((prev) => {
          if (prev.secondsRemaining <= 4 && prev.secondsRemaining > 1) soundEngine.playCountdownTick();
          if (prev.secondsRemaining > 1) return { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
          soundEngine.playWorkGo();
          return { ...prev, secondsRemaining: 0, isActive: false };
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [state.isActive, state.secondsRemaining]);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <main className="min-h-screen w-full bg-[#020b1c] text-white flex flex-col justify-between p-6 lg:p-10 select-none">
      <div className="flex items-center justify-between bg-[#001f5c]/80 border-2 border-[#0047BA] px-6 py-4 rounded-3xl shadow-2xl">
        <MustangWordmark />

        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2 font-mono font-black text-sm ${
            isConnected ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-[#E32636]/20 text-[#E32636] border-[#E32636]/50 animate-pulse'
          }`}>
            <span className="w-2.5 h-2.5 rounded-full bg-current" />
            {isConnected ? 'REMOTE CONNECTED' : `PIN: ${peerId || 'CONNECTING...'}`}
          </div>
        </div>
      </div>

      <div className="bg-[#001f5c]/95 border-2 border-[#0047BA] rounded-3xl px-8 py-5 flex items-center justify-between shadow-2xl">
        <div>
          <div className="text-sm uppercase font-black tracking-widest text-blue-300">
            {isPassingPeriod ? 'Next Class In' : 'Active Class Period'}
          </div>
          <div className="text-3xl font-black text-white">
            {currentPeriod ? currentPeriod.name : 'Off Schedule'}
          </div>
        </div>

        <div className="flex items-center gap-10">
          {cleanupTimeFormatted !== null && (
            <div className="text-right">
              <div className="text-sm uppercase font-black text-[#E32636]">Cleanup Alert</div>
              <div className={`text-4xl font-mono font-black ${cleanupSecLeft === 0 ? 'text-amber-400 animate-pulse' : 'text-[#E32636]'}`}>
                {cleanupSecLeft === 0 ? 'NOW' : cleanupTimeFormatted}
              </div>
            </div>
          )}

          <div className="text-right">
            <div className="text-sm uppercase font-black text-blue-300">
              {isPassingPeriod ? 'Starts In' : 'Period Bell'}
            </div>
            <div className="text-4xl font-mono font-black text-emerald-400">
              {bellTimeFormatted}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#001f5c]/90 border-2 border-[#0047BA] rounded-3xl p-10 flex flex-col items-center justify-center shadow-2xl text-center">
        <div className="text-2xl font-black tracking-widest uppercase mb-4 text-[#E32636]">
          {state.mode === 'WARMUP' && (state.warmupPhase === 'RUN' ? 'Warm-Up Run' : `Stretch ${state.stretchRound} of 6`)}
          {state.mode === 'TABATA' && (state.isWorkPhase ? `Tabata Work (Round ${state.currentRound})` : `Tabata Rest (Round ${state.currentRound})`)}
          {state.mode === 'AMRAP' && 'AMRAP Workout'}
          {state.mode === 'EMOM' && `EMOM (Round ${state.currentRound})`}
          {state.mode === 'FOR_TIME' && 'For Time Countdown'}
        </div>

        <div className="font-mono font-black text-[14vw] leading-none tracking-tight my-2 text-white">
          {formatTime(state.secondsRemaining)}
        </div>
      </div>

      <div className="text-center text-sm font-black text-blue-400/60 tracking-widest uppercase">
        Ford Middle School Physical Education & Athletics
      </div>
    </main>
  );
}
