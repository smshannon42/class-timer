'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Music, SkipForward, Volume2, VolumeX } from 'lucide-react';

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
    <div className="w-full max-w-xl mx-auto mt-6 p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-3">
        <Music size={16} />
        <span>Gym Audio Deck</span>
      </div>

      {/* Audio Deck Controls */}
      <div className="flex items-center justify-between bg-neutral-950 border border-neutral-800 rounded-xl p-3.5">
        <div className="flex items-center gap-3 overflow-hidden mr-3">
          {/* Active Thumbnail: Gives YouTube an active, non-throttled visual surface without taking over the screen */}
          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-neutral-800 bg-neutral-900 relative">
            <div id="yt-player-target" className="w-full h-full object-cover scale-150 pointer-events-none" />
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-white truncate">{currentTitle}</span>
            <span className="text-[10px] text-neutral-500">Auto-synced to timer intervals</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleMute}
            className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all border active:scale-95 ${
              isMuted
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                : 'bg-neutral-800 border-neutral-700 text-neutral-200 hover:bg-neutral-700'
            }`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          <button
            type="button"
            onClick={handleNextSong}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 text-xs font-bold transition-all border border-neutral-700"
            title="Skip to next song"
          >
            <SkipForward size={14} />
            <span>Skip</span>
          </button>
        </div>
      </div>
    </div>
  );
}
