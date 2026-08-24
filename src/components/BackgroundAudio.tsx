import React, { useEffect, useRef, useState } from 'react';
import { Music, Volume2, VolumeX, ChevronUp, ChevronDown, Play, Pause } from 'lucide-react';

interface BackgroundAudioProps {
  isPlaying: boolean;
  isWorkPhase: boolean;
  isStretchMode?: boolean;
  isPreCountdown?: boolean;
}

export const BackgroundAudio: React.FC<BackgroundAudioProps> = ({ 
  isPlaying, 
  isWorkPhase, 
  isStretchMode, 
  isPreCountdown 
}) => {
  const playerRef = useRef<any>(null);
  const playlistId = 'wfklPGkuTY4';
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isUserPaused, setIsUserPaused] = useState<boolean>(false);

  useEffect(() => {
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      (window as any).onYouTubeIframeAPIReady = () => {
        initPlayer();
      };
    } else if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    }
  }, []);

  const initPlayer = () => {
    if (playerRef.current) return;
    try {
      playerRef.current = new (window as any).YT.Player('background-audio-player', {
        height: '0',
        width: '0',
        videoId: playlistId,
        playerVars: {
          autoplay: 0,
          loop: 1,
          playlist: playlistId,
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(85);
          },
        },
      });
    } catch (err) {
      console.warn('Background audio init error:', err);
    }
  };

  const shouldPlay = isPlaying && isWorkPhase && !isStretchMode && !isPreCountdown && !isUserPaused;

  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.playVideo !== 'function') return;

    if (shouldPlay && !isMuted) {
      playerRef.current.playVideo();
    } else {
      if (typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
    }
  }, [shouldPlay, isMuted]);

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

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      <div id="background-audio-player" className="hidden"></div>

      {/* Expanded Control Drawer */}
      {isExpanded && (
        <div className="mb-2 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-2xl p-3 shadow-2xl text-white flex items-center gap-3 w-64 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-cyan-500/10 p-2 rounded-xl border border-cyan-500/20 text-cyan-400">
            <Music className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-semibold truncate">High-Energy Fitness Mix</p>
            <p className="text-[10px] text-neutral-400">
              {shouldPlay ? 'Streaming (Work Active)' : 'Paused / In Rest/Stretch'}
            </p>
          </div>
          
          <button
            onClick={() => setIsUserPaused(!isUserPaused)}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-300 hover:text-white transition"
            title={isUserPaused ? "Resume Audio" : "Pause Audio"}
          >
            {isUserPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={toggleMute}
            className="p-1.5 hover:bg-neutral-800 rounded-lg text-neutral-300 hover:text-white transition"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
          </button>
        </div>
      )}

      {/* Sleek Floating Audio Pill Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-neutral-900/80 hover:bg-neutral-800 backdrop-blur-md border border-neutral-800 text-neutral-300 hover:text-white px-3.5 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs font-medium transition-all group"
      >
        <Music className={`w-3.5 h-3.5 text-cyan-400 ${shouldPlay ? 'animate-bounce' : ''}`} />
        <span>DJ Stream</span>
        <span className={`w-2 h-2 rounded-full ${shouldPlay ? 'bg-emerald-500 animate-ping' : 'bg-neutral-600'}`} />
        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400" /> : <ChevronUp className="w-3.5 h-3.5 text-neutral-400" />}
      </button>
    </div>
  );
};
