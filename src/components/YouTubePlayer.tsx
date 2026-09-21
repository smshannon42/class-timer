'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, Volume2, VolumeX } from 'lucide-react';

interface YouTubePlayerProps {
  isPlaying: boolean;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

const PLAYLIST_ID = 'PLcPtvWDlA89dE5FE0FcWty9wav3sn0qyT';

export default function YouTubePlayer({ isPlaying }: YouTubePlayerProps) {
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTitle, setCurrentTitle] = useState<string>('Click video once to activate sound');
  const [playerState, setPlayerState] = useState<number>(-1);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      playerRef.current = new window.YT.Player('yt-player-frame', {
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
        },
        events: {
          onReady: (event: any) => {
            setIsReady(true);
            try {
              event.target.setShuffle(true);
              event.target.setLoop(true);
            } catch (e) {
              console.warn('Shuffle error', e);
            }
          },
          onStateChange: (event: any) => {
            setPlayerState(event.data);
            try {
              const videoData = event.target.getVideoData();
              if (videoData && videoData.title) {
                setCurrentTitle(videoData.title);
              }
            } catch (e) {
              console.warn('Title error', e);
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
    if (playerState === 1) {
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

  const isActuallyPlaying = playerState === 1;

  return (
    <div className="flex flex-col items-center gap-2 mt-2">
      {/* Blue Pill Control Bar */}
      <div className="flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm backdrop-blur-sm max-w-md">
        {/* Play/Pause */}
        <button
          type="button"
          onClick={togglePlay}
          className="flex items-center gap-1.5 hover:text-white transition-colors active:scale-95 shrink-0"
          title={isActuallyPlaying ? 'Pause' : 'Play'}
        >
          {isActuallyPlaying ? <Pause size={13} /> : <Play size={13} className="fill-current" />}
          <span className="text-[11px] uppercase tracking-wider">{isActuallyPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <span className="text-cyan-500/40">|</span>

        {/* Track Title */}
        <span className="truncate max-w-[140px] sm:max-w-[200px]" title={currentTitle}>
          {currentTitle}
        </span>

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

      {/* Mini Visible Video Surface (160x90 px) - Allows initial browser tap to grant audio permissions */}
      <div className="w-40 h-[90px] rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 shadow-md">
        <div id="yt-player-frame" className="w-full h-full" />
      </div>
    </div>
  );
}
