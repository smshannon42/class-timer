'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX, ExternalLink } from 'lucide-react';

interface YouTubePlayerProps {
  isPlaying: boolean;
}

const PLAYLIST_ID = 'PLcPtvWDlA89cndyYu1fGI7DdXeMSZLrcu';

export default function YouTubePlayer({ isPlaying }: YouTubePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [manualPlay, setManualPlay] = useState(false);
  const [originUrl, setOriginUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOriginUrl(window.location.origin);
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
      'https://www.youtube.com'
    );
  };

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

  const embedUrl = `https://www.youtube.com/embed/videoseries?list=${PLAYLIST_ID}&enablejsapi=1&playsinline=1&modestbranding=1&rel=0${
    originUrl ? `&origin=${encodeURIComponent(originUrl)}` : ''
  }`;

  return (
    <div className="flex flex-col items-center gap-2 mt-2">
      {/* Blue Pill Control Bar */}
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm backdrop-blur-sm">
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

        {/* Pop-out Direct YouTube Link */}
        <a
          href={`https://music.youtube.com/playlist?list=${PLAYLIST_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors p-0.5"
          title="Open in YouTube Music"
        >
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Embed Frame with Referrer Policy and Cross-Origin Allowances */}
      <div className="w-[280px] h-[158px] rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-lg">
        <iframe
          ref={iframeRef}
          className="w-full h-full"
          src={embedUrl}
          title="Gym Playlist Player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </div>
  );
}
