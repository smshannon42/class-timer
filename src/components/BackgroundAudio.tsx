import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Radio, Shuffle, SkipForward } from 'lucide-react';

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
  const defaultPlaylistId = 'PLcPtvWDlA89dE5FE0FcWty9wav3sn0qyT';
  
  const [playlistId, setPlaylistId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('workout_playlist_id') || defaultPlaylistId;
    }
    return defaultPlaylistId;
  });

  const [isEditingPlaylist, setIsEditingPlaylist] = useState<boolean>(false);
  const [playlistInput, setPlaylistInput] = useState<string>('');
  const [isUserPaused, setIsUserPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(80);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    localStorage.setItem('workout_playlist_id', playlistId);
  }, [playlistId]);

  // STRICT RULE: Only play when clock is active, in work phase, not resting/stretching/pre-countdown, and not paused by user.
  const shouldPlay = isPlaying && isWorkPhase && !isStretchMode && !isPreCountdown && !isPostRest && !isUserPaused && !isMuted;

  // Randomized starting index on load for fresh shuffle each refresh, autoplay=0 to prevent choppy background audio loops
  const randomStartIndex = typeof window !== 'undefined' ? Math.floor(Math.random() * 20) : 0;
  const embedUrl = `https://www.youtube.com/embed/videoseries?list=${playlistId}&enablejsapi=1&autoplay=0&shuffle=1&index=${randomStartIndex}`;

  // Control playback strictly via postMessage based on `shouldPlay`
  useEffect(() => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;

    const command = shouldPlay ? 'playVideo' : 'pauseVideo';
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: command, args: [] }),
      '*'
    );
  }, [shouldPlay]);

  // Handle volume updates dynamically
  useEffect(() => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    const targetVol = isMuted ? 0 : volume;
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: 'setVolume', args: [targetVol] }),
      '*'
    );
  }, [volume, isMuted]);

  // Handle Next Track skipping
  const handleNextTrack = () => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: 'nextVideo', args: [] }),
      '*'
    );
  };

  const handleLoadPlaylist = (input: string) => {
    let cleanId = input.trim();
    if (cleanId.includes('list=')) {
      cleanId = cleanId.split('list=')[1]?.split('&')[0] || cleanId;
    }
    if (cleanId) {
      setPlaylistId(cleanId);
      setIsEditingPlaylist(false);
      setPlaylistInput('');
      setIsUserPaused(false);
    }
  };

  return (
    <div className="w-full bg-neutral-900 border-b border-neutral-800 px-6 py-3 flex flex-col md:flex-row items-center justify-between text-white shadow-md gap-3">
      {/* Headless iframe stream container */}
      <div className="hidden">
        <iframe
          ref={iframeRef}
          key={playlistId}
          src={embedUrl}
          allow="autoplay; encrypted-media"
          title="Workout Playlist Stream"
        />
      </div>

      {/* Left: Branding & Playlist Config */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20 text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-wide uppercase flex items-center gap-1.5">
                Shuffle DJ Deck <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
              </h2>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${shouldPlay ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400'}`}>
                {shouldPlay ? 'SHUFFLING LIVE' : 'PAUSED / REST'}
              </span>
            </div>
            <button 
              onClick={() => setIsEditingPlaylist(!isEditingPlaylist)}
              className="text-xs text-cyan-400 hover:underline text-left mt-0.5 block"
            >
              {isEditingPlaylist ? 'Close Setup' : '⚙️ Change Playlist'}
            </button>
          </div>
        </div>
      </div>

      {/* Playlist Input Drawer */}
      {isEditingPlaylist && (
        <div className="flex items-center gap-2 bg-neutral-950 p-2 rounded-xl border border-neutral-800 w-full md:w-auto">
          <input
            type="text"
            placeholder="Paste YouTube Playlist URL..."
            value={playlistInput}
            onChange={(e) => setPlaylistInput(e.target.value)}
            className="bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white flex-1 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={() => handleLoadPlaylist(playlistInput)}
            className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold px-3 py-1.5 rounded-lg text-xs transition"
          >
            Load & Shuffle
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

        {/* Skip to Next Track Button */}
        <button
          onClick={handleNextTrack}
          className="p-2 hover:bg-neutral-800 rounded-xl text-neutral-300 hover:text-white transition"
          title="Skip to Next Track"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-neutral-800" />

        <button
          onClick={() => setIsMuted(!isMuted)}
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
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-20 md:w-24 accent-cyan-500 bg-neutral-800 h-1.5 rounded-lg cursor-pointer"
          />
          <span className="text-xs text-neutral-400 w-8 text-right">{isMuted ? '0%' : `${volume}%`}</span>
        </div>
      </div>
    </div>
  );
};
