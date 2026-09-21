'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX, Link, Check } from 'lucide-react';

interface YouTubePlayerProps {
  isPlaying: boolean;
}

const DEFAULT_PLAYLIST_ID = 'PLcPtvWDlA89dE5FE0FcWty9wav3sn0qyT';

export default function YouTubePlayer({ isPlaying }: YouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [playlistId, setPlaylistId] = useState<string>(DEFAULT_PLAYLIST_ID);
  const [inputUrl, setInputUrl] = useState<string>('');
  const [showUrlInput, setShowUrlInput] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [manualPlay, setManualPlay] = useState<boolean>(false);

  // Load saved playlist ID from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('class_timer_playlist_id');
      if (saved) {
        setPlaylistId(saved);
      }
    }
  }, []);

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

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    let extractedId = inputUrl.trim();

    // Check for ?list= or &list=
    const listMatch = inputUrl.match(/[?&]list=([^#&?]+)/);
    if (listMatch && listMatch[1]) {
      extractedId = listMatch[1];
    } else {
      // Check if it's a direct video link v=
      const vMatch = inputUrl.match(/[?&]v=([^#&?]+)/);
      if (vMatch && vMatch[1]) {
        extractedId = vMatch[1];
      }
    }

    setPlaylistId(extractedId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('class_timer_playlist_id', extractedId);
    }
    setShowUrlInput(false);
    setInputUrl('');
  };

  return (
    <div className="flex flex-col items-center gap-2 mt-2 w-full max-w-md">
      {/* Blue Pill Audio Control Bar */}
      <div className="flex items-center justify-center gap-2.5 px-4 py-2 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm backdrop-blur-sm">
        {/* Play/Pause */}
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

        <span className="text-cyan-500/40">|</span>

        {/* Toggle Paste URL Input */}
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-all active:scale-95 ${
            showUrlInput ? 'bg-cyan-500 text-neutral-950' : 'hover:text-white'
          }`}
          title="Paste playlist or video URL"
        >
          <Link size={13} />
          <span className="text-[10px] uppercase tracking-wider">Link</span>
        </button>
      </div>

      {/* Pop-down URL Input Form */}
      {showUrlInput && (
        <form
          onSubmit={handleSaveUrl}
          className="flex items-center gap-2 w-full px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 shadow-lg text-xs"
        >
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            placeholder="Paste YouTube or YT Music playlist URL..."
            className="flex-1 bg-transparent text-white placeholder-neutral-500 outline-none text-xs"
            autoFocus
          />
          <button
            type="submit"
            className="p-1 rounded-lg bg-cyan-500 text-neutral-950 font-bold hover:bg-cyan-400 transition-all shrink-0"
            title="Load URL"
          >
            <Check size={14} />
          </button>
        </form>
      )}

      {/* Zero Visual Display: Kept minimally alive off-canvas so Chrome executes the audio thread */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: '1px',
          height: '1px',
          opacity: 0.01,
          pointerEvents: 'none',
          zIndex: -9999,
        }}
      >
        <iframe
          key={playlistId}
          ref={iframeRef}
          width="200"
          height="200"
          src={`https://www.youtube.com/embed/videoseries?list=${playlistId}&enablejsapi=1&playsinline=1`}
          title="Background Gym Audio"
          allow="autoplay; encrypted-media"
        />
      </div>
    </div>
  );
}
