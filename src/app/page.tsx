'use client';
import React, { useState } from 'react';
import { Maximize2, Minimize2, SlidersHorizontal, Bell, Sparkles, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useAutoPeriodCountdown } from '@/hooks/useAutoPeriodCountdown';
import WorkoutEngine from '@/components/WorkoutEngine';
import { MustangShield, MustangWordmark } from '@/components/MustangLogos';
import { BELL_SCHEDULE } from '@/data/schedule';
import { soundEngine } from '@/utils/audio';

export default function Home() {
  const [manualPeriodId, setManualPeriodId] = useState<string>('AUTO');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const isWakeLocked = useWakeLock();

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
    <main className="relative min-h-screen w-full bg-[#040c1e] text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none overflow-hidden">
      {/* Background Watermark Shield */}
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center opacity-10 z-0">
        <MustangShield className="w-[550px] max-w-[85vw] h-auto" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto w-full">
        {/* Top Header Bar & Wordmark */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3 bg-[#001f5c]/70 border border-[#0047BA]/80 py-2 px-4 rounded-2xl shadow-xl backdrop-blur-md">
            <MustangShield className="w-10 h-10 sm:w-12 sm:h-12 drop-shadow-md" />
            <MustangWordmark className="h-auto" />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#001f5c]/80 border border-[#0047BA] rounded-xl px-3 py-2 shadow-lg backdrop-blur-sm">
              <SlidersHorizontal className="w-4 h-4 text-[#E32636]" />
              <select
                value={manualPeriodId}
                onChange={(e) => setManualPeriodId(e.target.value)}
                className="bg-transparent text-xs sm:text-sm font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="AUTO" className="bg-[#040c1e] text-white">Auto-Detect Schedule</option>
                {BELL_SCHEDULE.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#040c1e] text-white">
                    {p.name} ({p.startTime} - {p.endTime})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={toggleMute}
              className={`p-2.5 rounded-xl border transition backdrop-blur-sm ${
                isMuted ? 'bg-[#E32636]/20 text-[#E32636] border-[#E32636]/40' : 'bg-[#001f5c]/80 text-emerald-400 border-[#0047BA]'
              }`}
              title="Toggle Sound"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 bg-[#001f5c]/80 hover:bg-[#0047BA]/60 border border-[#0047BA] px-3 py-2.5 rounded-xl text-xs font-bold text-white transition shadow-md backdrop-blur-sm"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden sm:inline">TV Mode</span>
            </button>
          </div>
        </div>

        {/* Master Bell Banner */}
        {currentPeriod ? (
          <div className="bg-[#001f5c]/90 border-2 border-[#0047BA] rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between shadow-2xl gap-4 mb-6 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isPassingPeriod ? 'bg-amber-500/20 text-amber-400' : 'bg-[#E32636]/20 text-[#E32636]'}`}>
                {isPassingPeriod ? <AlertCircle className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
              </div>
              <div>
                <div className="text-xs uppercase font-black tracking-widest text-blue-200">
                  {isPassingPeriod ? 'Next Class In' : 'Active Class Period'}
                </div>
                <div className="text-xl sm:text-2xl font-black text-white">{currentPeriod.name}</div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {cleanupTimeFormatted !== null && (
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-xs uppercase font-black tracking-wider text-[#E32636]">
                    <Sparkles className="w-3.5 h-3.5" /> Cleanup Alert
                  </div>
                  <div className={`text-2xl sm:text-3xl font-mono font-black ${cleanupSecLeft === 0 ? 'text-amber-400 animate-pulse' : 'text-[#E32636]'}`}>
                    {cleanupSecLeft === 0 ? 'CLEANUP NOW' : cleanupTimeFormatted}
                  </div>
                </div>
              )}

              <div className="text-right">
                <div className="text-xs uppercase font-black tracking-wider text-blue-200">
                  {isPassingPeriod ? 'Starts In' : 'Final Bell'}
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-400">
                  {bellTimeFormatted}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#001f5c]/90 border border-[#0047BA] rounded-2xl p-4 text-center text-blue-200 font-bold mb-6">
            Outside Scheduled School Hours
          </div>
        )}

        {/* Workout Engine */}
        <WorkoutEngine />
      </div>

      <div className="relative z-10 text-center text-xs font-black text-blue-300/80 tracking-widest uppercase mt-6">
        Ford Middle School Physical Education & Athletics
      </div>
    </main>
  );
}
