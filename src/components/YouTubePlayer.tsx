'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Music, Shuffle } from 'lucide-react';

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
          controls: 1,
          modestbranding: 1,
          rel: 0,
          loop: 1,
        },
        events: {
          onReady: (event: any) => {
            try {
              // Lock strictly to gym playlist, force shuffle, and loop
              event.target.cuePlaylist({
                list: GYM_PLAYLIST_ID,
                listType: 'playlist',
                index: 0,
              });
              event.target.setShuffle(true);
              event.target.setLoop(true);
            } catch (err) {
              console.warn('Playlist shuffle init warning:', err);
            }
            setIsReady(true);
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

  // Sync Workout Timer Play/Pause state to YouTube
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    try {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch (err) {
      console.warn('YT play/pause sync error:', err);
    }
  }, [isPlaying, isReady]);

  return (
    <div className="w-full max-w-xl mx-auto mt-6 p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
          <Music size={16} />
          <span>Gym Playlist</span>
          <span className="flex items-center gap-1 text-[11px] text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded-md border border-neutral-700">
            <Shuffle size={12} className="text-cyan-400" /> Shuffled
          </span>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
            isPlaying
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-neutral-800 text-neutral-400'
          }`}
        >
          {isPlaying ? 'Music Active' : 'Music Paused'}
        </span>
      </div>

      {/* Embedded Video Target */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800">
        <div id="yt-player-target" className="w-full h-full" />
      </div>
    </div>
  );
}
