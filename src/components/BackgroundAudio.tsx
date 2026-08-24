import React, { useEffect, useRef } from 'react';

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

  useEffect(() => {
    if (!playerRef.current || typeof playerRef.current.playVideo !== 'function') return;

    // STRICT RULE: Play ONLY when actively playing AND in an actual work/run phase. 
    // Muted during stretches, pre-countdowns, rest intervals, and pauses.
    const shouldPlay = isPlaying && isWorkPhase && !isStretchMode && !isPreCountdown;

    if (shouldPlay) {
      playerRef.current.playVideo();
    } else {
      if (typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying, isWorkPhase, isStretchMode, isPreCountdown]);

  return <div id="background-audio-player" className="hidden"></div>;
};
