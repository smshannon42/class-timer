'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX } from 'lucide-react';

interface YouTubePlayerProps {
  isPlaying: boolean;
}

const PLAYLIST_ID = 'PLcPtvWDlA89dE5FE0FcWty9wav3sn0qyT';

export default function YouTubePlayer({ isPlaying }: YouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [manualPlay, setManualPlay] = useState(false);

  // Send YouTube postMessage API commands
  const sendCommand = (func: string, args: any[] = []) => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({
        event: 'command',
        func,
        args,
      }),
      '*'
    );
  };

  // Sync Timer workout play/pause to YouTube
  useEffect(() => {
    if (isPlaying) {
      sendCommand('playVideo');
      setManualPlay(true);
    } else {
      sendCommand('pauseVideo');
      setManualPlay(false);
    }
  }, [isPlaying]);

  const togglePlay = () => {
    if (manualPlay) {
      sendCommand('pauseVideo');
      setManualPlay(false);
    } else {
      sendCommand('playVideo');
      setManualPlay(true);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      sendCommand('unMute');
      setIsMuted(false);
    } else {
      sendCommand('mute');
      setIsMuted(true);
    }
  };

  const handleNext = () => {
    sendCommand('nextVideo');
  };

  return (
    <div className="flex items-center justify-center mt-2">
      {/* Blue Pill Control Bar Only (Video Completely Hidden from View) */}
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm backdrop-blur-sm">
        {/* Play/Pause Toggle */}
        <button
          type="button"
          onClick={togglePlay}
          className="flex items-center gap-1.5 hover:text-white transition-colors active:scale-95 shrink-0"
          title={manualPlay ? 'Pause' : 'Play'}
        >
          {manualPlay ? <Pause size={13} /> : <Play size={13} className="fill-current" />}
          <span className="text-[11px] uppercase tracking-wider">{manualPlay ? 'Pause' : 'Play'}</span>
        </button>

        <span className="text-cyan-500/40">|</span>

        {/* Mute / Unmute */}
        <button
          type="button"
          onClick={toggleMute}
          className="flex items-center gap-1.5 hover:text-white transition-colors active:scale-95 shrink-0"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={13} className="text-amber-400" /> : <Volume2 size={13} />}
          <span className="text-[11px] uppercase tracking-wider">{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        <span className="text-cyan-500/40">|</span>

        {/* Skip Track */}
        <button
          type="button"
          onClick={handleNext}
          className="flex items-center gap-1.5 hover:text-white transition-colors active:scale-95 shrink-0"
          title="Next Track"
        >
          <SkipForward size={13} />
          <span className="text-[11px] uppercase tracking-wider">Skip</span>
        </button>
      </div>

      {/* Hidden iframe rendering off-screen so Chrome processes audio stream without visual output */}
      <div
        style={{
          position: 'fixed',
          top: -9999,
          left: -9999,
          width: '200px',
          height: '200px',
          pointerEvents: 'none',
          visibility: 'hidden',
        }}
      >
        <iframe
          ref={iframeRef}
          width="200"
          height="200"
          src={`https://www.youtube.com/embed?listType=playlist&list=${PLAYLIST_ID}&enablejsapi=1&playsinline=1&modestbranding=1&rel=0`}
          title="Workout Audio Engine"
          allow="autoplay; encrypted-media"
        />
      </div>
    </div>
  );
}
