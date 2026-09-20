'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Music, Shuffle, SkipForward, Volume2, ShieldCheck } from 'lucide-react';

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

// Common markers for explicit uploads
const EXPLICIT_KEYWORDS = ['explicit', 'parental advisory', 'dirty version', '[explicit]', '(explicit)'];

export default function YouTubePlayer({ isPlaying }: YouTubePlayerProps) {
  const [isReady, setIsReady] = useState(false);
  const [currentTitle, setCurrentTitle] = useState<string>('Loading track...');
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
          loop: 1,
        },
        events: {
          onReady: (event: any) => {
            try {
              event.target.setShuffle(true);
              event.target.setLoop(true);

              const playlist = event.target.getPlaylist();
              const playlistLength = Array.isArray(playlist) ? playlist.length : 20;
              const randomIndex = Math.floor(Math.random() * Math.max(playlistLength, 1));

              event.target.cuePlaylist({
                list: GYM_PLAYLIST_ID,
                listType: 'playlist',
                index: randomIndex,
              });
            } catch (err) {
              console.warn('Playlist shuffle init warning:', err);
            }
            setIsReady(true);
          },
          onStateChange: (event: any) => {
            // When a track starts or cues, check title for explicit markers
            if (event.data === window.YT?.PlayerState?.PLAYING || event.data === window.YT?.PlayerState?.CUED) {
              const videoData = event.target.getVideoData();
              const title = videoData?.title || 'Gym Playlist Track';
              setCurrentTitle(title);

              const isExplicit = EXPLICIT_KEYWORDS.some((kw) => title.toLowerCase().includes(kw));
              if (isExplicit) {
                console.warn(`[ClassTimer] Skipped explicit track: "${title}"`);
                event.target.nextVideo();
              }
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
      console.warn('YT play/pause sync error:', err);
    }
  }, [isPlaying, isReady]);

  const handleNextSong = () => {
    if (playerRef.current?.nextVideo) {
      playerRef.current.nextVideo();
      if (!isPlaying) {
        // Keep it paused if the timer itself is paused
        setTimeout(() => {
          playerRef.current?.pauseVideo();
        }, 150);
      }
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-6 p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
          <Music size={16} />
          <span>Gym Audio Deck</span>
          <span className="flex items-center gap-1 text-[11px] text-neutral-400 bg-neutral-800/80 px-2 py-0.5 rounded-md border border-neutral-700">
            <Shuffle size={11} className="text-cyan-400" /> Shuffled
          </span>
          <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/50">
            <ShieldCheck size={11} /> Clean Filter
          </span>
        </div>
        <span
          className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
            isPlaying
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-neutral-800 text-neutral-400'
          }`}
        >
          {isPlaying ? 'Music Playing' : 'Music Paused'}
        </span>
      </div>

      {/* Music-Style Audio Deck (No video screen) */}
      <div className="flex items-center justify-between bg-neutral-950 border border-neutral-800 rounded-xl p-3.5">
        <div className="flex items-center gap-3 overflow-hidden mr-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0 text-cyan-400">
            <Volume2 size={18} className={isPlaying ? 'animate-pulse' : 'opacity-40'} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-white truncate">{currentTitle}</span>
            <span className="text-[10px] text-neutral-500">Auto-synced to timer intervals</span>
          </div>
        </div>

        {/* Next Song Button */}
        <button
          type="button"
          onClick={handleNextSong}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 text-xs font-bold transition-all border border-neutral-700 shrink-0"
          title="Skip to next song"
        >
          <SkipForward size={14} />
          <span>Skip</span>
        </button>
      </div>

      {/* Hidden YouTube IFrame container (Off-screen / 1px so audio still runs) */}
      <div className="absolute -left-[9999px] -top-[9999px] w-[1px] h-[1px] overflow-hidden pointer-events-none opacity-0">
        <div id="yt-player-target" />
      </div>
    </div>
  );
}
