'use client';
import React, { useState } from 'react';
import { Maximize2, Minimize2, SlidersHorizontal, Bell, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useAutoPeriodCountdown } from '@/hooks/useAutoPeriodCountdown';
import WorkoutEngine from '@/components/WorkoutEngine';
import { MustangWordmark } from '@/components/MustangLogos';
import { BELL_SCHEDULE } from '@/data/schedule';
import { soundEngine } from '@/utils/audio';

export default function Home() {
  const [manualPeriodId, setManualPeriodId] = useState<string>('AUTO');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const { isDimmed, isMobile } = useWakeLock();
  const { currentPeriod, isPassingPeriod, bellTimeFormatted, cleanupTimeFormatted, cleanupSecLeft } = useAutoPeriodCountdown(manualPeriodId);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    soundEngine.isMuted = nextMute;
  };

  return (
    <main className="relative min-h-screen w-full bg-[#020b1c] text-white flex flex-col justify-between p-3 sm:p-5 select-none transition-opacity duration-1000">
      
      {/* Inactivity Overlay */}
      {isDimmed && (
        <div 
          className={`fixed inset-0 z-50 transition-opacity duration-1000 pointer-events-none flex items-end justify-center pb-6 ${
            isMobile ? 'bg-black opacity-100' : 'bg-black/85'
          }`}
        >
          <span className="text-xs uppercase font-mono tracking-widest text-slate-500 animate-pulse">
            Tap anywhere to wake display
          </span>
        </div>
      )}

      <div className={`max-w-4xl mx-auto w-full space-y-4 transition-all duration-1000 ${isDimmed && !isMobile ? 'opacity-25' : 'opacity-100'}`}>
        
        {/* Top Header Controls */}
        <div className="flex items-center justify-between gap-2 bg-[#001f5c]/70 border border-[#0047BA] px-4 py-2.5 rounded-2xl backdrop-blur-md">
          <MustangWordmark />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#020b1c] border border-[#0047BA]/70 rounded-xl px-2.5 py-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#E32636]" />
              <select
                value={manualPeriodId}
                onChange={(e) => setManualPeriodId(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer max-w-[140px] sm:max-w-none"
              >
                <option value="AUTO" className="bg-[#020b1c]">Auto Schedule</option>
                {BELL_SCHEDULE.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#020b1c]">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={toggleMute}
              className={`p-2 rounded-xl border transition ${
                isMuted ? 'bg-[#E32636]/20 text-[#E32636] border-[#E32636]/50' : 'bg-[#020b1c] text-emerald-400 border-[#0047BA]'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 bg-[#020b1c] hover:bg-[#0047BA]/40 border border-[#0047BA] rounded-xl text-white transition"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* EXTRA-LARGE CLASS HUB BANNER */}
        <div className="bg-[#001f5c]/95 border-2 border-[#0047BA] rounded-3xl p-5 sm:p-6 flex flex-wrap items-center justify-between shadow-2xl gap-4">
          
          {/* Active Period Name */}
          <div className="flex items-center gap-3.5">
            <div className="p-4 rounded-2xl bg-[#0047BA]/50 text-[#E32636] border border-white/10 shadow-md">
              <Bell className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <div className="text-xs sm:text-sm uppercase font-black tracking-widest text-blue-300">
                {isPassingPeriod ? 'Next Class Period' : 'Active Class Period'}
              </div>
              <div className="text-2xl sm:text-4xl font-black text-white leading-tight">
                {currentPeriod ? currentPeriod.name : 'Off Schedule'}
              </div>
            </div>
          </div>

          {/* Massive Countdown Timers */}
          <div className="flex items-center gap-6 sm:gap-12">
            {/* Cleanup Timer */}
            {cleanupTimeFormatted !== null && (
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5 text-xs sm:text-sm uppercase font-black tracking-wider text-[#E32636]">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> Cleanup Alert
                </div>
                <div className={`text-4xl sm:text-6xl font-mono font-black tracking-tight leading-none mt-1.5 ${cleanupSecLeft === 0 ? 'text-amber-400 animate-pulse' : 'text-[#E32636]'}`}>
                  {cleanupSecLeft === 0 ? 'CLEAN NOW' : cleanupTimeFormatted}
                </div>
              </div>
            )}

            {/* Bell Timer */}
            <div className="text-right">
              <div className="text-xs sm:text-sm uppercase font-black tracking-wider text-blue-300">
                {isPassingPeriod ? 'Starts In' : 'Period Bell'}
              </div>
              <div className="text-4xl sm:text-6xl font-mono font-black tracking-tight leading-none text-emerald-400 mt-1.5">
                {bellTimeFormatted}
              </div>
            </div>
          </div>
        </div>

        {/* Workout Engine Hub */}
        <WorkoutEngine />
      </div>

      <div className="text-center text-[10px] font-black text-blue-400/60 tracking-widest uppercase mt-3">
        Ford Middle School • Cardio Weights
      </div>
    </main>
  );
}
