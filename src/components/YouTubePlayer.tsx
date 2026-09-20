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

  // Send standard YouTube postMessage commands to iframe
  const postYTCommand = (func: string, args: any[] = []) => {
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

  // Sync Timer workout play/pause to the YouTube iframe
  useEffect(() => {
    if (isPlaying) {
      postYTCommand('playVideo');
      setManualPlay(true);
    } else {
      postYTCommand('pauseVideo');
      setManualPlay(false);
    }
  }, [isPlaying]);

  const togglePlay = () => {
    if (manualPlay) {
      postYTCommand('pauseVideo');
      setManualPlay(false);
    } else {
      postYTCommand('playVideo');
      setManualPlay(true);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      postYTCommand('unMute');
      setIsMuted(false);
    } else {
      postYTCommand('mute');
      setIsMuted(true);
    }
  };

  const handleNext = () => {
    postYTCommand('nextVideo');
  };

  return (
    <div className="flex items-center gap-2 mt-2 max-w-xl">
      {/* Standard Embed Video Viewport (120x80) - Guaranteed to bypass Chrome zero-size/invisible throttling */}
      <div className="w-24 h-16 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950 shrink-0 shadow-md">
        <iframe
          ref={iframeRef}
          className="w-full h-full"
          src={`https://www.youtube-nocookie.com/embed?listType=playlist&list=${PLAYLIST_ID}&enablejsapi=1&playsinline=1&modestbranding=1&rel=0`}
          title="Gym Playlist"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
      </div>

      {/* Blue Pill Control Bar */}
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
    </div>
  );
}
