'use client';
import React from 'react';
import { useAutoPeriodCountdown } from '@/hooks/useAutoPeriodCountdown';
import { useRemoteSync } from '@/hooks/useRemoteSync';
import { MustangWordmark } from '@/components/MustangLogos';
import WorkoutEngine from '@/components/WorkoutEngine';

export default function DisplayPage() {
  const { peerId, isConnected, lastCommand } = useRemoteSync(true);
  const { currentPeriod, isPassingPeriod, bellTimeFormatted, cleanupTimeFormatted, cleanupSecLeft } = useAutoPeriodCountdown('AUTO');

  return (
    <main className="min-h-screen w-full bg-[#020b1c] text-white flex flex-col justify-between p-6 lg:p-10 select-none">
      <div className="flex items-center justify-between bg-[#001f5c]/80 border-2 border-[#0047BA] px-6 py-4 rounded-3xl shadow-2xl">
        <MustangWordmark />

        <div className="flex items-center gap-3">
          <div className={`px-5 py-2.5 rounded-2xl border flex items-center gap-3 font-mono font-black text-sm tracking-wider ${
            isConnected
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
              : 'bg-[#E32636]/20 text-[#E32636] border-[#E32636]/50 animate-pulse'
          }`}>
            <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-[#E32636]'}`} />
            {isConnected ? 'REMOTE CONNECTED' : `PIN: ${peerId || '----'}`}
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

      <WorkoutEngine incomingCommand={lastCommand} isProjectorView={true} />

      <div className="text-center text-sm font-black text-blue-400/60 tracking-widest uppercase">
        Ford Middle School Physical Education & Athletics
      </div>
    </main>
  );
}
