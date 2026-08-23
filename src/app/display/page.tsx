'use client';
import React from 'react';
import { useAutoPeriodCountdown } from '@/hooks/useAutoPeriodCountdown';
import { useRemoteSync } from '@/hooks/useRemoteSync';
import { MustangWordmark } from '@/components/MustangLogos';
import WorkoutEngine from '@/components/WorkoutEngine';

export default function DisplayPage() {
  const { peerId, isConnected, incomingSync } = useRemoteSync(true);
  const { currentPeriod, isPassingPeriod, bellTimeFormatted, cleanupTimeFormatted, cleanupSecLeft } = useAutoPeriodCountdown('AUTO');

  return (
    <main className="min-h-screen w-full bg-[#020b1c] text-white flex flex-col justify-between p-6 lg:p-10 select-none">
      <div className="absolute top-6 left-8 z-50 flex items-center gap-4 scale-75 sm:scale-100 origin-top-left drop-shadow-xl">
        {/* Hexagon Icon Container */}
        <div className="w-16 h-16 rounded-2xl !border-transparent border-[#0066FF] bg-[#0A1128] flex items-center justify-center shadow-none">
          <svg viewBox="0 0 100 100" className="w-12 h-12">
            <polygon points="50,6 88,28 88,72 50,94 12,72 12,28" fill="white" stroke="#0066FF" strokeWidth="6" strokeLinejoin="round" />
            <polyline points="10,50 35,50" fill="none" stroke="#0066FF" strokeWidth="6" strokeLinecap="round" />
            <polyline points="32,50 40,50 47,25 57,75 62,50 75,50" fill="none" stroke="#FF0033" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="72,50 90,50" fill="none" stroke="#0066FF" strokeWidth="6" strokeLinecap="round" />
          </svg>
        </div>
        {/* Text Stack */}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-black text-white tracking-wide uppercase leading-none">ALLEN</span>
            <span className="bg-[#FF0033] text-white text-lg font-black px-3 py-1 rounded-xl leading-tight">ATP</span>
          </div>
          <div className="text-sm font-bold tracking-[0.35em] mt-1.5 leading-none pl-0.5">
            <span className="text-[#FF0033]">TEMPO</span>
            <span className="text-white/40 mx-2">|</span>
            <span className="text-white">PULSE</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between bg-[#001f5c]/80 border-2 border-[#0047BA] px-6 py-4 rounded-3xl shadow-2xl">
        <MustangWordmark />

        <div className="flex items-center gap-3">
          <div className={`px-5 py-2.5 rounded-2xl border flex items-center gap-3 font-mono font-black text-base tracking-wider ${
            isConnected
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
              : 'bg-[#E32636]/20 text-[#E32636] border-[#E32636]/50 animate-pulse'
          }`}>
            <span className={`w-3.5 h-3.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-[#E32636]'}`} />
            {isConnected ? 'REMOTE CONNECTED' : `PIN: ${peerId || '----'}`}
          </div>
        </div>
      </div>

      <div className="bg-[#001f5c]/95 border-2 border-[#0047BA] rounded-3xl px-8 py-6 flex items-center justify-between shadow-2xl">
        <div>
          <div className="text-base uppercase font-black tracking-widest text-blue-300 mb-1">
            {isPassingPeriod ? 'NEXT CLASS IN' : 'ACTIVE CLASS PERIOD'}
          </div>
          <div className="text-4xl lg:text-6xl font-black text-white">
            {currentPeriod ? currentPeriod.name : 'Off Schedule'}
          </div>
        </div>

        <div className="flex items-center gap-12">
          {cleanupTimeFormatted !== null && (
            <div className="text-right">
              <div className="text-base uppercase font-black text-[#E32636] mb-1">Done Working Out</div>
              <div className={`text-5xl lg:text-6xl font-mono font-black ${cleanupSecLeft === 0 ? 'text-amber-400 animate-pulse' : 'text-[#E32636]'}`}>
                {cleanupSecLeft === 0 ? 'DONE' : cleanupTimeFormatted}
              </div>
            </div>
          )}

          <div className="text-right">
            <div className="text-base uppercase font-black text-blue-300 mb-1">
              {isPassingPeriod ? 'STARTS IN' : 'PERIOD BELL'}
            </div>
            <div className="text-6xl lg:text-8xl font-mono font-black text-emerald-400 leading-none">
              {bellTimeFormatted}
            </div>
          </div>
        </div>
      </div>

      <WorkoutEngine incomingState={incomingSync} isProjectorView={true} />

      <div className="text-center text-base font-black text-blue-400/60 tracking-widest uppercase">
        Ford Middle School Physical Education & Athletics
      </div>
    </main>
  );
}
