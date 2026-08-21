import React from 'react';

export function MustangWordmark({ className = "h-auto" }: { className?: string }) {
  return (
    <div className={`flex flex-col select-none justify-center leading-none ${className}`}>
      <span className="text-2xl sm:text-3xl font-black tracking-wider text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-sans">
        FORD
      </span>
      <span className="text-[10px] sm:text-xs font-black tracking-[0.28em] text-[#E32636] drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] mt-0.5">
        MUSTANGS
      </span>
    </div>
  );
}
