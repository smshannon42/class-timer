import React, { useEffect, useRef, useState } from 'react';
import { Music, Volume2, VolumeX, Play, Pause, SkipForward, Radio } from 'lucide-react';

interface BackgroundAudioProps {
  isPlaying: boolean;
  isWorkPhase: boolean;
  isStretchMode?: boolean;
  isPreCountdown?: boolean;
  isPostRest?: boolean;
}

export const BackgroundAudio: React.FC<BackgroundAudioProps> = ({ 
  isPlaying, 
  isWorkPhase, 
  isStretchMode, 
  isPreCountdown,
  isPostRest 
}) => {
  const playerRef = useRef<any>(null);
  
  const [playlistId, setPlaylistId] = useState<string>('wfklPGkuTY4');
  const [isEditingPlaylist, setIsEditingPlaylist] = useState<boolean>(false);
  const [playlistInput, setPlaylistInput] = useState<string>('');

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
        initPlayer(playlistId);
      };
    } else if ((window as any).YT && (window as any).YT.Player) {
      initPlayer(playlistId);
    }
  }, [playlistId]);

  const initPlayer = (targetList: string) => {
    if (playerRef.current && typeof playerRef.current.loadPlaylist === 'function') {
      playerRef.current.loadPlaylist({ list: targetList, listType: 'playlist' });
      return;
    }
    try {
      playerRef.current = new (window as any).YT.Player('header-audio-player', {
        height: '0',
        width: '0',
        playerVars: {
          autoplay: 1,
          loop: 1,
          listType: 'playlist',
          list: targetList,
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(volume);
            event.target.loadPlaylist({ list: targetList, listType: 'playlist' });
          },
        },
      });
    } catch (err) {
      console.warn('Header audio init error:', err);
    }
  };

  const shouldPlay = isPlaying && isWorkPhase && !isStretchMode && !isPreCountdown && !isPostRest && !isUserPaused;

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
    if (playerRef.current && typeof playerRef.current.nextVideo === 'function') {
      playerRef.current.nextVideo();
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
    <div className="w-full bg-neutral-900 border-b border-neutral-800 px-6 py-3 flex flex-col md:flex-row items-center justify-between text-white shadow-md gap-3">
      <div id="header-audio-player" className="hidden"></div>

      {/* Left: Branding & Playlist Config */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20 text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wide uppercase">Custom Workout Playlist</h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${shouldPlay ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400'}`}>
                {shouldPlay ? 'LIVE' : 'MUTED / REST'}
              </span>
            </div>
            <button 
              onClick={() => setIsEditingPlaylist(!isEditingPlaylist)}
              className="text-xs text-cyan-400 hover:underline text-left mt-0.5 block"
            >
              {isEditingPlaylist ? 'Close Setup' : '⚙️ Change Playlist ID'}
            </button>
          </div>
        </div>
      </div>

      {/* Playlist Input Drawer */}
      {isEditingPlaylist && (
        <div className="flex items-center gap-2 bg-neutral-950 p-2 rounded-xl border border-neutral-800 w-full md:w-auto">
          <input
            type="text"
            placeholder="Paste Playlist ID (e.g. PL... or URL)"
            value={playlistInput}
            onChange={(e) => setPlaylistInput(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white flex-1 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={() => {
              let cleanId = playlistInput.trim();
              if (cleanId.includes('list=')) {
                cleanId = cleanId.split('list=')[1]?.split('&')[0] || cleanId;
              }
              if (cleanId) {
                setPlaylistId(cleanId);
                setIsEditingPlaylist(false);
                setPlaylistInput('');
                setIsUserPaused(false);
              }
            }}
            className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold px-3 py-1.5 rounded-lg text-xs transition"
          >
            Load & Play
          </button>
        </div>
      )}

      {/* Right: Full Controls Bar */}
      <div className="flex items-center gap-4 bg-neutral-950/80 border border-neutral-800 px-4 py-2 rounded-2xl shadow-inner w-full md:w-auto justify-end">
        <button
          onClick={() => setIsUserPaused(!isUserPaused)}
          className="p-2 bg-cyan-600 hover:bg-cyan-500 text-black rounded-xl transition font-bold shadow"
          title={isUserPaused ? "Resume Stream" : "Pause Stream"}
        >
          {isUserPaused ? <Play className="w-4 h-4 fill-black" /> : <Pause className="w-4 h-4 fill-black" />}
        </button>

        <button
          onClick={handleNextTrack}
          className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-300 hover:text-white transition"
          title="Next Track in Playlist"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-neutral-800" />

        <button
          onClick={toggleMute}
          className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-300 hover:text-white transition"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-20 md:w-24 accent-cyan-500 bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
          />
          <span className="text-xs text-neutral-400 w-8 text-right">{isMuted ? '0%' : `${volume}%`}</span>
        </div>
      </div>
    </div>
  );
};
