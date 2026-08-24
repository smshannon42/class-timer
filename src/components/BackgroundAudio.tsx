'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Radio, Shuffle, SkipForward } from 'lucide-react';

interface BackgroundAudioProps {
  isPlaying: boolean;
  isWorkPhase: boolean;
  isStretchMode?: boolean;
  isPreCountdown?: boolean;
  isPostRest?: boolean;
}

export const BackgroundAudio: React.FC<BackgroundAudioProps> = ({ 
  isPlaying, 
  isWorkPhase, 
  isStretchMode, 
  isPreCountdown,
  isPostRest 
}) => {
  // Hardcoded target playlist ID from your URL: PLcPtvWDlA89dE5FE0FcWty9wav3sn0qyT
  const playlistId = 'PLcPtvWDlA89dE5FE0FcWty9wav3sn0qyT';

  const [isUserPaused, setIsUserPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(80);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Strict rule: Only play when timer is active, during work intervals, and not overridden/paused/resting
  const shouldPlay = isPlaying && isWorkPhase && !isStretchMode && !isPreCountdown && !isPostRest && !isUserPaused && !isMuted;

  // Generate a fresh random start index (0 to 30) on every hard page refresh/load for auto-shuffling
  const [randomIndex] = useState<number>(() => Math.floor(Math.random() * 30));

  // YouTube embedded playlist URL with JS API enabled, shuffle active, and randomized starting track index
  const embedUrl = `https://www.youtube.com/embed/videoseries?list=${playlistId}&enablejsapi=1&shuffle=1&index=${randomIndex}`;

  // Sync play/pause commands via postMessage without remounting or resetting the iframe
  useEffect(() => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    const command = shouldPlay ? 'playVideo' : 'pauseVideo';
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: command, args: [] }),
      '*'
    );
  }, [shouldPlay]);

  // Sync volume level updates dynamically
  useEffect(() => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    const targetVol = isMuted ? 0 : volume;
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: 'setVolume', args: [targetVol] }),
      '*'
    );
  }, [volume, isMuted]);

  // Handle manual track skipping
  const handleNextTrack = () => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: 'nextVideo', args: [] }),
      '*'
    );
  };

  return (
    <div className="w-full bg-neutral-900 border-b border-neutral-800 px-6 py-3 flex flex-col md:flex-row items-center justify-between text-white shadow-md gap-3">
      {/* Headless persistent iframe stream container */}
      <div className="hidden">
        <iframe
          ref={iframeRef}
          src={embedUrl}
          allow="autoplay; encrypted-media"
          title="Workout Playlist Stream"
        />
      </div>

      {/* Left: Branding & Status */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20 text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wide uppercase flex items-center gap-1.5">
                Workout DJ Deck <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
              </h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${shouldPlay ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400'}`}>
                {shouldPlay ? 'SHUFFLING LIVE' : 'PAUSED / REST'}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">Auto-synced with active work intervals</p>
          </div>
        </div>
      </div>

      {/* Right: Full Interactive Controls Bar */}
      <div className="flex items-center gap-4 bg-neutral-950/80 border border-neutral-800 px-4 py-2 rounded-2xl shadow-inner w-full md:w-auto justify-end">
        {/* Play / Pause Toggle */}
        <button
          onClick={() => setIsUserPaused(!isUserPaused)}
          className="p-2 bg-cyan-600 hover:bg-cyan-500 text-black rounded-xl transition font-bold shadow"
          title={isUserPaused ? "Resume Stream" : "Pause Stream"}
        >
          {isUserPaused ? <Play className="w-4 h-4 fill-black" /> : <Pause className="w-4 h-4 fill-black" />}
        </button>

        {/* Skip Forward / Next Track */}
        <button
          onClick={handleNextTrack}
          className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-300 hover:text-white transition"
          title="Skip to Next Track"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-neutral-800" />

        {/* Mute Toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-300 hover:text-white transition"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Volume Slider */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-20 md:w-24 accent-cyan-500 bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
          />
          <span className="text-xs text-neutral-400 w-8 text-right">{isMuted ? '0%' : `${volume}%`}</span>
        </div>
      </div>
    </div>
  );
};
