'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX, ExternalLink } from 'lucide-react';

interface YouTubePlayerProps {
  isPlaying: boolean;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

const PLAYLIST_ID = 'PLcPtvWDlA89cndyYu1fGI7DdXeMSZLrcu';

export default function YouTubePlayer({ isPlaying }: YouTubePlayerProps) {
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [manualPlay, setManualPlay] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      playerRef.current = new window.YT.Player('yt-player-element', {
        height: '100%',
        width: '100%',
        playerVars: {
          listType: 'playlist',
          list: PLAYLIST_ID,
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: any) => {
            setIsReady(true);
            try {
              event.target.setShuffle(true);
            } catch (e) {
              console.warn(e);
            }
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT?.PlayerState?.PLAYING) {
              setManualPlay(true);
            } else if (event.data === window.YT?.PlayerState?.PAUSED) {
              setManualPlay(false);
            }
          },
          onError: (event: any) => {
            // Auto-skip videos that cannot be embedded (100, 101, 150)
            console.warn('Skipping unplayable video, code:', event.data);
            try {
              event.target.nextVideo();
            } catch {
              playerRef.current?.nextVideo();
            }
          },
        },
      });
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = setupPlayer;
    } else if (window.YT && window.YT.Player) {
      setupPlayer();
    }

    return () => {
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
      }
    };
  }, []);

  // Sync Timer Play/Pause state to YouTube
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    try {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch (err) {
      console.warn('Sync error:', err);
    }
  }, [isPlaying, isReady]);

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (manualPlay) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const toggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleNext = () => {
    if (playerRef.current?.nextVideo) {
      playerRef.current.nextVideo();
    }
  };

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

        {/* Direct Link */}
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

      {/* Embed Frame */}
      <div className="w-[280px] h-[158px] rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-lg">
        <div id="yt-player-element" className="w-full h-full" />
      </div>
    </div>
  );
}
