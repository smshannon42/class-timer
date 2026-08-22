'use client';
import React, { useState } from 'react';
import { Maximize2, Minimize2, SlidersHorizontal, Sparkles, Volume2, VolumeX, Radio, Check, X, Loader2 } from 'lucide-react';
import { useWakeLock } from '@/hooks/useWakeLock';
import { useAutoPeriodCountdown } from '@/hooks/useAutoPeriodCountdown';
import WorkoutEngine from '@/components/WorkoutEngine';
import { BELL_SCHEDULE } from '@/data/schedule';
import { soundEngine } from '@/utils/audio';
import { useRemoteSync } from '@/hooks/useRemoteSync';

export default function Home() {
  const [manualPeriodId, setManualPeriodId] = useState<string>('AUTO');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAntennaModalOpen, setIsAntennaModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  useWakeLock();

  const { isConnected, isConnecting, errorMessage, connectToHost, broadcastState } = useRemoteSync(false);
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

  const handlePairWithDisplay = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim().length > 0) {
      connectToHost(pinInput.trim());
    }
  };

  return (
    <main className="min-h-screen w-full bg-[#020b1c] text-white flex flex-col justify-between p-3 sm:p-5 select-none">
      <div className="max-w-5xl mx-auto w-full space-y-4">
        
        {/* TOP HEADER WITH DIRECT ATP VECTOR LOGO */}
        <div className="flex items-center justify-between gap-2 bg-[#001f5c]/70 border border-[#0047BA] px-3.5 py-2.5 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-2.5 select-none">
            {/* Tactical Hex Heartbeat Logo Icon */}
            <div className="relative flex items-center justify-center w-10 h-10 bg-[#020b1c] border-2 border-[#0047BA] rounded-xl shadow-md p-1">
              <svg
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full"
              >
                <polygon
                  points="50,6 88,27 88,73 50,94 12,73 12,27"
                  stroke="#0047BA"
                  strokeWidth="7"
                  strokeLinejoin="round"
                  fill="#020b1c"
                />
                <polygon
                  points="50,14 80,31 80,69 50,86 20,69 20,31"
                  fill="#FFFFFF"
                />
                <path
                  d="M6 50H36"
                  stroke="#0047BA"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <path
                  d="M36 50L44 38L52 68L60 22L68 56L72 50H94"
                  stroke="#E32636"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Brand Typography */}
            <div className="flex flex-col leading-none">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl tracking-tight text-white font-mono">
                  ALLEN
                </span>
                <span className="bg-[#E32636] text-white text-[9px] font-black px-1.5 py-0.5 rounded tracking-widest font-mono shadow-sm">
                  ATP
                </span>
              </div>
              <div className="flex items-center gap-1 text-[9px] font-black tracking-widest uppercase text-blue-300 mt-1">
                <span className="text-[#E32636]">TEMPO</span>
                <span className="text-white/40">|</span>
                <span className="text-white">PULSE</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-[#020b1c] border border-[#0047BA]/70 rounded-xl px-2 py-1.5">
              <SlidersHorizontal className="w-3 h-3 text-[#E32636]" />
              <select
                value={manualPeriodId}
                onChange={(e) => setManualPeriodId(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer max-w-[120px] sm:max-w-none"
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
              type="button"
              onClick={() => setIsAntennaModalOpen(true)}
              className={`p-2 rounded-xl border transition flex items-center gap-1 cursor-pointer ${
                isConnected
                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/40'
                  : 'bg-[#020b1c] text-blue-300 hover:text-white border-[#0047BA]'
              }`}
              title="Pair with Projector Screen"
            >
              <Radio className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleMute}
              className={`p-2 rounded-xl border transition ${
                isMuted ? 'bg-[#E32636]/20 text-[#E32636] border-[#E32636]/50' : 'bg-[#020b1c] text-emerald-400 border-[#0047BA]'
              }`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 bg-[#020b1c] hover:bg-[#0047BA]/40 border border-[#0047BA] rounded-xl text-white transition"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Pairing Modal */}
        {isAntennaModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <form onSubmit={handlePairWithDisplay} className="bg-[#001f5c] border-2 border-[#0047BA] p-6 rounded-3xl max-w-sm w-full shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-black text-white">Projector Link</span>
                <button type="button" onClick={() => setIsAntennaModalOpen(false)} className="text-blue-300 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-xs text-blue-200 mb-3">
                Open <span className="text-emerald-400 font-mono">/display</span> on the TV/Projector, then enter the PIN:
              </p>

              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="4-digit PIN"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full text-center bg-[#020b1c] border-2 border-[#0047BA] text-white font-mono font-black text-4xl rounded-2xl p-3 focus:outline-none focus:border-[#E32636] mb-3"
                autoFocus
              />

              {errorMessage && (
                <p className="text-xs text-[#E32636] font-bold text-center mb-3">
                  {errorMessage}
                </p>
              )}

              {isConnected && (
                <p className="text-xs text-emerald-400 font-bold text-center mb-3">
                  ✓ Connected to Screen!
                </p>
              )}

              <button
                type="submit"
                disabled={isConnecting || pinInput.trim().length === 0}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-black transition shadow-lg cursor-pointer ${
                  isConnected 
                    ? 'bg-emerald-600' 
                    : 'bg-[#0047BA] hover:bg-[#003da5] disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {isConnecting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Connecting...</>
                ) : isConnected ? (
                  <><Check className="w-5 h-5" /> Connected</>
                ) : (
                  <><Check className="w-5 h-5" /> Connect Screen</>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Period Countdown Box */}
        <div className="bg-[#001f5c]/90 border-2 border-[#0047BA] rounded-3xl px-6 py-5 flex items-center justify-between shadow-2xl">
          <div>
            <div className="text-xs sm:text-sm uppercase font-black tracking-widest text-blue-300 mb-1">
              {isPassingPeriod ? 'NEXT CLASS IN' : 'ACTIVE CLASS PERIOD'}
            </div>
            <div className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-none">
              {currentPeriod ? currentPeriod.name : 'Off Schedule'}
            </div>
          </div>

          <div className="flex items-center gap-6 sm:gap-10">
            {cleanupTimeFormatted !== null && (
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-xs uppercase font-black text-[#E32636] mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> Cleanup
                </div>
                <div className={`text-3xl sm:text-5xl font-mono font-black ${cleanupSecLeft === 0 ? 'text-amber-400 animate-pulse' : 'text-[#E32636]'}`}>
                  {cleanupSecLeft === 0 ? 'DONE' : cleanupTimeFormatted}
                </div>
              </div>
            )}

            <div className="text-right">
              <div className="text-xs sm:text-sm uppercase font-black text-blue-300 mb-1">
                {isPassingPeriod ? 'STARTS IN' : 'PERIOD BELL'}
              </div>
              <div className="text-4xl sm:text-6xl lg:text-7xl font-mono font-black text-emerald-400 leading-none">
                {bellTimeFormatted}
              </div>
            </div>
          </div>
        </div>

        {/* Workout Engine */}
        <WorkoutEngine onBroadcast={broadcastState} />
      </div>

      <div className="text-center text-[10px] sm:text-xs font-black text-blue-400/60 tracking-widest uppercase mt-3">
        Allen Tempo Pulse • ATP Timer
      </div>
    </main>
  );
}
