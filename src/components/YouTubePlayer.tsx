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

const GYM_PLAYLIST_ID = 'PLcPtvWDlA89dE5FE0FcWty9wav3sn0qyT';

export default function YouTubePlayer({ isPlaying }: YouTubePlayerProps) {
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playerState, setPlayerState] = useState<number>(-1);
  const [currentTitle, setCurrentTitle] = useState<string>('Ready to play');
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const setupPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      playerRef.current = new window.YT.Player('yt-player-target', {
        height: '64',
        width: '80',
        playerVars: {
          listType: 'playlist',
          list: GYM_PLAYLIST_ID,
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
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
            setPlayerState(event.data);
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
            console.error('YouTube player error code:', err.data);
            if (err.data === 150 || err.data === 101) {
              setCurrentTitle('Embedding restricted (skipping...)');
              try {
                (err as any)?.target?.nextVideo?.();
              } catch {
                playerRef.current?.nextVideo?.();
              }
            } else {
              setCurrentTitle('Audio error - tap skip');
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
      console.warn('YT sync error:', err);
    }
  }, [isPlaying, isReady]);

  const togglePlayManual = () => {
    if (!playerRef.current) return;
    if (playerState === window.YT?.PlayerState?.PLAYING) {
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

  const handleNextSong = () => {
    if (playerRef.current?.nextVideo) {
      playerRef.current.nextVideo();
    }
  };

  const isAudioActuallyPlaying = playerState === 1;

  return (
    <div className="flex items-center gap-2 mt-2 max-w-xl">
      {/* Mini Video Anchor - 80x64 ensures Chrome doesn't throttle background playback */}
      <div className="w-16 h-10 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950 shrink-0 relative">
        <div id="yt-player-target" className="w-full h-full object-cover scale-125" />
      </div>

      {/* Blue Pill Audio Control Bar */}
      <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm backdrop-blur-sm overflow-hidden">
        {/* Play/Pause Manual Direct Tap */}
        <button
          type="button"
          onClick={togglePlayManual}
          className="flex items-center gap-1 hover:text-white transition-colors active:scale-95 shrink-0"
          title={isAudioActuallyPlaying ? 'Pause Music' : 'Play Music'}
        >
          {isAudioActuallyPlaying ? <Pause size={13} /> : <Play size={13} className="fill-current" />}
        </button>

        <span className="text-cyan-500/40">|</span>

        {/* Track Title */}
        <span className="truncate max-w-[170px] sm:max-w-[240px]" title={currentTitle}>
          {currentTitle}
        </span>

        <span className="text-cyan-500/40">|</span>

        {/* Mute / Unmute */}
        <button
          type="button"
          onClick={toggleMute}
          className="flex items-center gap-1 hover:text-white transition-colors active:scale-95 shrink-0"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={13} className="text-amber-400" /> : <Volume2 size={13} />}
          <span className="text-[11px] uppercase tracking-wider">{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>

        <span className="text-cyan-500/40">|</span>

        {/* Skip Track */}
        <button
          type="button"
          onClick={handleNextSong}
          className="flex items-center gap-1 hover:text-white transition-colors active:scale-95 shrink-0"
          title="Skip track"
        >
          <SkipForward size={13} />
          <span className="text-[11px] uppercase tracking-wider">Skip</span>
        </button>
      </div>
    </div>
  );
}
