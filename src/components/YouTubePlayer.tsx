'use client';

import React, { useEffect, useRef, useState } from 'react';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';

interface YouTubePlayerProps {
  isPlaying: boolean;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

const GYM_PLAYLIST_ID = 'PLcPtvWDlA89dE5FE0FcWty9wav3sn0qyT';

export default function YouTubePlayer({ isPlaying }: YouTubePlayerProps) {
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTitle, setCurrentTitle] = useState<string>('Ready to play');
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      playerRef.current = new window.YT.Player('yt-player-target', {
        height: '100%',
        width: '100%',
        playerVars: {
          listType: 'playlist',
          list: GYM_PLAYLIST_ID,
          autoplay: 0,
          controls: 0,
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
            } catch (err) {
              console.warn('YT shuffle error:', err);
            }
          },
          onStateChange: (event: any) => {
            try {
              const videoData = event.target.getVideoData();
              if (videoData && videoData.title) {
                setCurrentTitle(videoData.title);
              }
            } catch (err) {
              console.warn('Error reading track title:', err);
            }
          },
          onError: (err: any) => {
            console.error('YouTube player error:', err);
            setCurrentTitle('Tap to start or skip track');
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
      console.warn('YT sync error:', err);
    }
  }, [isPlaying, isReady]);

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

  const handleNextSong = () => {
    if (playerRef.current?.nextVideo) {
      playerRef.current.nextVideo();
    }
  };

  return (
    <div className="flex items-center gap-2 mt-2 max-w-lg">
      {/* Blue Pill Container */}
      <div className="flex items-center gap-3 px-3 py-1.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm backdrop-blur-sm">
        {/* Track Title */}
        <span className="truncate max-w-[190px] sm:max-w-[260px]" title={currentTitle}>
          {currentTitle}
        </span>

        <span className="text-cyan-500/40">|</span>

        {/* Mute / Unmute Button */}
        <button
          type="button"
          onClick={toggleMute}
          className="flex items-center gap-1 hover:text-white transition-colors active:scale-95"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={13} className="text-amber-400" /> : <Volume2 size={13} />}
          <span className="text-[11px] uppercase tracking-wider">{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        <span className="text-cyan-500/40">|</span>

        {/* Skip Button */}
        <button
          type="button"
          onClick={handleNextSong}
          className="flex items-center gap-1 hover:text-white transition-colors active:scale-95"
          title="Skip track"
        >
          <SkipForward size={13} />
          <span className="text-[11px] uppercase tracking-wider">Skip</span>
        </button>
      </div>

      {/* Tiny hidden render container for YouTube engine to prevent Chrome throttle */}
      <div className="w-[1px] h-[1px] opacity-0 overflow-hidden pointer-events-none relative">
        <div id="yt-player-target" />
      </div>
    </div>
  );
}
