'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Music, AlertCircle } from 'lucide-react';

interface YouTubePlayerProps {
  isPlaying: boolean;
  defaultPlaylistId?: string;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

export default function YouTubePlayer({ isPlaying, defaultPlaylistId = 'PLw-VjHDlEOgvtnnnqWlTqByAtC7tXBg6D' }: YouTubePlayerProps) {
  const [playlistInput, setPlaylistInput] = useState('');
  const [activePlaylistId, setActivePlaylistId] = useState(defaultPlaylistId);
  const [isReady, setIsReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract playlist ID from full URL or bare ID
  const extractPlaylistId = (input: string) => {
    const match = input.match(/[?&]list=([^#&?]+)/);
    return match ? match[1] : input.trim();
  };

  // Load YouTube IFrame API script once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      playerRef.current = new window.YT.Player('yt-player-target', {
        height: '100%',
        width: '100%',
        playerVars: {
          listType: 'playlist',
          list: activePlaylistId,
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: () => setIsReady(true),
          onError: (e: any) => {
            console.warn('YouTube playback warning:', e.data);
            setErrorMsg('Make sure the playlist is set to Public or Unlisted.');
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
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
      console.warn('YT play/pause command failed:', err);
    }
  }, [isPlaying, isReady]);

  // Handle switching playlists
  const handlePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = extractPlaylistId(playlistInput);
    if (!cleanId) return;

    setActivePlaylistId(cleanId);
    setErrorMsg('');

    if (playerRef.current?.loadPlaylist) {
      playerRef.current.loadPlaylist({
        list: cleanId,
        listType: 'playlist',
        index: 0,
      });
      if (!isPlaying) {
        playerRef.current.pauseVideo();
      }
    }
    setPlaylistInput('');
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-6 p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
          <Music size={16} />
          <span>YouTube Workout Playlist</span>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
          isPlaying ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400'
        }`}>
          {isPlaying ? 'Music Active' : 'Music Paused'}
        </span>
      </div>

      {/* Embedded Video Target */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 mb-3">
        <div id="yt-player-target" className="w-full h-full" />
      </div>

      {/* Playlist Link Input */}
      <form onSubmit={handlePlaylistSubmit} className="flex gap-2">
        <input
          type="text"
          value={playlistInput}
          onChange={(e) => setPlaylistInput(e.target.value)}
          placeholder="Paste YouTube Playlist URL or ID..."
          className="flex-1 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-black text-xs transition-all"
        >
          Load
        </button>
      </form>

      {errorMsg && (
        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-400">
          <AlertCircle size={13} />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
