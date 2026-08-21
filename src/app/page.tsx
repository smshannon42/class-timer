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
  useWakeLock();

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
    <main className="min-h-screen w-full bg-[#020b1c] text-white flex flex-col justify-between p-3 sm:p-5 select-none">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        
        {/* Streamlined Top Bar */}
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

        {/* Unified Class Hub Status Strip */}
        <div className="bg-[#001f5c]/90 border border-[#0047BA] rounded-2xl px-4 py-3 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#0047BA]/40 text-[#E32636]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-black tracking-widest text-blue-300">
                {isPassingPeriod ? 'Passing Period' : 'Class Period'}
              </div>
              <div className="text-base sm:text-lg font-black text-white leading-tight">
                {currentPeriod ? currentPeriod.name : 'Off Schedule'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-5 sm:gap-8">
            {cleanupTimeFormatted !== null && (
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-[10px] uppercase font-black text-[#E32636]">
                  <Sparkles className="w-3 h-3" /> Cleanup
                </div>
                <div className={`text-xl sm:text-2xl font-mono font-black ${cleanupSecLeft === 0 ? 'text-amber-400 animate-pulse' : 'text-[#E32636]'}`}>
                  {cleanupSecLeft === 0 ? 'NOW' : cleanupTimeFormatted}
                </div>
              </div>
            )}

            <div className="text-right">
              <div className="text-[10px] uppercase font-black text-blue-300">
                {isPassingPeriod ? 'Starts' : 'Bell'}
              </div>
              <div className="text-xl sm:text-2xl font-mono font-black text-emerald-400">
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
