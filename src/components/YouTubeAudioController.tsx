import React, { useEffect, useRef, useState } from 'react';

interface YouTubeAudioControllerProps {
  isWorkPhase: boolean;
  isPlaying: boolean;
}

export const YouTubeAudioController: React.FC<YouTubeAudioControllerProps> = ({ isWorkPhase, isPlaying }) => {
  const playerRef = useRef<any>(null);
  const [overrideMode, setOverrideMode] = useState<'AUTO' | 'MUTE' | 'FULL' | 'OFF'>('AUTO');
  const [videoId, setVideoId] = useState<string>('dQw4w9WgXcQ'); // Default high-energy track/mix ID
  const [customInput, setCustomInput] = useState<string>('');

  useEffect(() => {
    // Load YouTube IFrame API script if not present
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
  }, [videoId]);

  const initPlayer = () => {
    if (playerRef.current) return;
    try {
      playerRef.current = new (window as any).YT.Player('youtube-audio-player', {
        height: '0',
        width: '0',
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          loop: 1,
          playlist: videoId,
        },
        events: {
          onReady: (event: any) => {
            event.target.setVolume(80);
            if (isPlaying) event.target.playVideo();
          },
        },
      });
    } catch (err) {
      console.warn('YouTube Player initialization error:', err);
    }
  };

  // Handle Ducking & State Changes
  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.setVolume !== 'function') return;

    if (overrideMode === 'OFF' || !isPlaying) {
      playerRef.current.pauseVideo();
      return;
    } else {
      playerRef.current.playVideo();
    }

    if (overrideMode === 'MUTE') {
      playerRef.current.setVolume(0);
      return;
    }

    if (overrideMode === 'FULL') {
      playerRef.current.setVolume(100);
      return;
    }

    // AUTO Ducking logic based on work vs rest phase
    if (isWorkPhase) {
      playerRef.current.setVolume(90); // Surge volume during work
    } else {
      playerRef.current.setVolume(15); // Duck volume low during rest
    }
  }, [isWorkPhase, isPlaying, overrideMode]);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-white shadow-lg flex flex-col gap-3">
      <div id="youtube-audio-player" className="hidden"></div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold tracking-wide text-cyan-400 uppercase">DJ Music & Ducking</span>
        <div className="flex gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
          {(['AUTO', 'FULL', 'MUTE', 'OFF'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setOverrideMode(mode)}
              className={`px-3 py-1 rounded-md transition-all font-medium ${
                overrideMode === mode ? 'bg-cyan-500 text-black shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Paste YouTube Video ID or URL..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs flex-1 text-white focus:outline-none focus:border-cyan-500"
        />
        <button
          onClick={() => {
            const cleanId = customInput.includes('watch?v=') 
              ? customInput.split('watch?v=')[1]?.substring(0, 11) 
              : customInput;
            if (cleanId) {
              setVideoId(cleanId);
              setCustomInput('');
              if (playerRef.current?.loadVideoById) {
                playerRef.current.loadVideoById(cleanId);
              }
            }
          }}
          className="bg-cyan-600 hover:bg-cyan-500 text-black font-bold px-3 py-1.5 rounded-lg text-xs transition"
        >
          Load Track
        </button>
      </div>
    </div>
  );
};
