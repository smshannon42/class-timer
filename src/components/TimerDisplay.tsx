'use client';

import React from 'react';

interface TimerDisplayProps {
  timeLeft: number;
  totalDuration: number;
  isWorkPhase: boolean;
  isPreCountdown: boolean;
  isPostRest: boolean;
  currentRound: number;
  totalRounds: number;
  phaseName?: string;
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeLeft,
  totalDuration,
  isWorkPhase,
  isPreCountdown,
  isPostRest,
  currentRound,
  totalRounds,
  phaseName
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isWorkPreCountdown = isPreCountdown && isWorkPhase;
  const isTransitionCountdown = isWorkPreCountdown && timeLeft <= 3 && timeLeft > 0;

  return (
    <div className="flex flex-col items-center justify-center w-full py-12 px-4">
      <div className="flex items-center gap-4 mb-6">
        <span className="px-4 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase bg-neutral-800 text-neutral-300 border border-neutral-700">
          Round {currentRound} of {totalRounds}
        </span>
        <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase ${
          isWorkPhase ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse' : 
          isPostRest ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 
          'bg-purple-500/20 text-purple-400 border border-purple-500/30'
        }`}>
          {phaseName || (isWorkPhase ? 'Work Interval' : 'Rest Period')}
        </span>
      </div>

      <div className="relative flex items-center justify-center">
        <div className={`font-black tracking-tighter transition-all duration-300 select-none ${
          isTransitionCountdown 
            ? 'text-9xl md:text-[14rem] text-cyan-400 scale-125 animate-ping opacity-90 drop-shadow-[0_0_35px_rgba(6,182,212,0.6)]' 
            : 'text-8xl md:text-[12rem] text-white drop-shadow-2xl'
        }`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {isPreCountdown && (
        <div className="mt-6 text-xl font-bold uppercase tracking-widest text-amber-400 animate-bounce">
          {isWorkPhase ? 'Get Ready for Work...' : 'Get Ready for Rest...'}
        </div>
      )}
    </div>
  );
};
