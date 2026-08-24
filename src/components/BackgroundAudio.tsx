import React, { useEffect, useRef, useState } from 'react';
import { Music, Volume2, VolumeX, Play, Pause, SkipForward, Radio } from 'lucide-react';

interface BackgroundAudioProps {
  isPlaying: boolean;
  isWorkPhase: boolean;
  isStretchMode?: boolean;
  isPreCountdown?: boolean;
}

// Curated high-energy, radio-clean workout track IDs
const WORKOUT_TRACKS = [
  'wfklPGkuTY4', // High-energy fitness mix stream
  'dQw4w9WgXcQ', // Placeholder track 2 (Replace with preferred workout track ID)
  'M7lc1UVf-VE'  // Placeholder track 3 (Replace with preferred workout track ID)
];

export const BackgroundAudio: React.FC<BackgroundAudioProps> = ({ 
  isPlaying, 
  isWorkPhase, 
  isStretchMode, 
  isPreCountdown 
}) => {
  const playerRef = useRef<any>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [isUserPaused, setIsUserPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(80);

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
      playerRef.current = new (window as any).YT.Player('header-audio-player', {
        height: '0',
        width: '0',
        videoId: WORKOUT_TRACKS[currentTrackIndex],
        playerVars: {
          autoplay: 0,
          loop: 1,
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(volume);
          },
        },
      });
    } catch (err) {
      console.warn('Header audio init error:', err);
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

  const handleNextTrack = () => {
    const nextIndex = (currentTrackIndex + 1) % WORKOUT_TRACKS.length;
    setCurrentTrackIndex(nextIndex);
    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      playerRef.current.loadVideoById(WORKOUT_TRACKS[nextIndex]);
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      playerRef.current.setVolume(newVol);
    }
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
      playerRef.current?.unMute();
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

  return (
    <div className="w-full bg-neutral-900 border-b border-neutral-800 px-6 py-3 flex items-center justify-between text-white shadow-md">
      <div id="header-audio-player" className="hidden"></div>

      {/* Left: Branding & Status */}
      <div className="flex items-center gap-3">
        <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20 text-cyan-400">
          <Radio className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-wide uppercase">Workout DJ Deck</h2>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${shouldPlay ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400'}`}>
              {shouldPlay ? 'LIVE STREAM' : 'PAUSED / REST'}
            </span>
          </div>
          <p className="text-xs text-neutral-400">Track {currentTrackIndex + 1} of {WORKOUT_TRACKS.length} (Auto-syncs with work intervals)</p>
        </div>
      </div>

      {/* Right: Full Controls Bar */}
      <div className="flex items-center gap-4 bg-neutral-950/80 border border-neutral-800 px-4 py-2 rounded-2xl shadow-inner">
        {/* Play / Pause Toggle */}
        <button
          onClick={() => setIsUserPaused(!isUserPaused)}
          className="p-2 bg-cyan-600 hover:bg-cyan-500 text-black rounded-xl transition font-bold shadow"
          title={isUserPaused ? "Resume Stream" : "Pause Stream"}
        >
          {isUserPaused ? <Play className="w-4 h-4 fill-black" /> : <Pause className="w-4 h-4 fill-black" />}
        </button>

        {/* Skip to Next Track */}
        <button
          onClick={handleNextTrack}
          className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-300 hover:text-white transition"
          title="Next Track"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-neutral-800" />

        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-300 hover:text-white transition"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Volume Slider */}
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-24 accent-cyan-500 bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
          />
          <span className="text-xs text-neutral-400 w-8 text-right">{isMuted ? '0%' : `${volume}%`}</span>
        </div>
      </div>
    </div>
  );
};
