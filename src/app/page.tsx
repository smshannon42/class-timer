'use client';
import React, { useState } from 'react';
import { Maximize2, Minimize2, SlidersHorizontal, Bell, Sparkles, AlertCircle, Volume2, VolumeX } from 'lucide-react';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useAutoPeriodCountdown } from '@/hooks/useAutoPeriodCountdown';
import WorkoutEngine from '@/components/WorkoutEngine';
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
    <main className="min-h-screen w-full bg-[#07132b] text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 select-none">
      {/* Top Utility Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2 bg-[#0d2044] border border-blue-900/60 rounded-xl px-3 py-1.5 shadow-lg">
          <SlidersHorizontal className="w-4 h-4 text-blue-400" />
          <select
            value={manualPeriodId}
            onChange={(e) => setManualPeriodId(e.target.value)}
            className="bg-transparent text-sm font-bold text-blue-100 focus:outline-none cursor-pointer"
          >
            <option value="AUTO" className="bg-[#0d2044] text-white">Auto-Detect Bell Schedule</option>
            {BELL_SCHEDULE.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#0d2044] text-white">
                {p.name} ({p.startTime} - {p.endTime})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className={`p-2 rounded-xl border transition ${isMuted ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-[#0d2044] text-emerald-400 border-blue-900/60'}`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 bg-[#0d2044] hover:bg-blue-900/50 border border-blue-900/60 px-3 py-2 rounded-xl text-xs font-bold text-blue-100 transition shadow-md"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">TV Mode</span>
          </button>
        </div>
      </div>

      {/* Main Clock Area */}
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Class Banner */}
        {currentPeriod ? (
          <div className="bg-[#0d2044] border border-blue-800/60 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between shadow-2xl gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isPassingPeriod ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-600/30 text-blue-300'}`}>
                {isPassingPeriod ? <AlertCircle className="w-6 h-6" /> : <Bell className="w-6 h-6" />}
              </div>
              <div>
                <div className="text-xs uppercase font-bold tracking-wider text-blue-300">
                  {isPassingPeriod ? 'Next Class In' : 'Current Period'}
                </div>
                <div className="text-lg font-black text-white">{currentPeriod.name}</div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {cleanupTimeFormatted !== null && (
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1 text-xs uppercase font-bold tracking-wider text-amber-400">
                    <Sparkles className="w-3.5 h-3.5" /> Cleanup
                  </div>
                  <div className={`text-2xl sm:text-3xl font-mono font-black ${cleanupSecLeft === 0 ? 'text-slate-400' : 'text-amber-400'}`}>
                    {cleanupSecLeft === 0 ? 'CLEANUP NOW' : cleanupTimeFormatted}
                  </div>
                </div>
              )}

              <div className="text-right">
                <div className="text-xs uppercase font-bold tracking-wider text-blue-300">
                  {isPassingPeriod ? 'Starts In' : 'Final Bell'}
                </div>
                <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-400">
                  {bellTimeFormatted}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0d2044] border border-blue-900/60 rounded-2xl p-4 text-center text-blue-300 font-bold">
            Outside Scheduled School Hours
          </div>
        )}

        <WorkoutEngine />
      </div>

      <div className="text-center text-xs font-black text-blue-400/70 tracking-widest uppercase mt-4">
        Ford Mustangs • Cardio Weights
      </div>
    </main>
  );
}
