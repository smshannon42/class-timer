'use client';
import React from 'react';

export function MustangWordmark() {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Tactical Hex Heartbeat Logo Icon */}
      <div className="relative flex items-center justify-center w-12 h-12 bg-[#020b1c] border-2 border-[#0047BA] rounded-2xl shadow-lg shadow-[#0047BA]/40 p-1">
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Hexagon Border */}
          <polygon
            points="50,6 88,27 88,73 50,94 12,73 12,27"
            stroke="#0047BA"
            strokeWidth="7"
            strokeLinejoin="round"
            fill="#020b1c"
          />
          <polygon
            points="50,14 80,31 80,69 50,86 20,69 20,31"
            fill="#FFFFFF"
          />

          {/* Blue Leading Line */}
          <path
            d="M6 50H36"
            stroke="#0047BA"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Pulse Spike */}
          <path
            d="M36 50L44 38L52 68L60 22L68 56L72 50H94"
            stroke="#E32636"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center gap-2">
          <span className="font-black text-2xl tracking-tighter text-white font-mono">
            ALLEN
          </span>
          <span className="bg-[#E32636] text-white text-[11px] font-black px-1.5 py-0.5 rounded tracking-widest font-mono shadow-sm">
            ATP
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-black tracking-widest uppercase text-blue-300 mt-1">
          <span className="text-[#E32636]">TEMPO</span>
          <span className="text-white/40">|</span>
          <span className="text-white">PULSE</span>
        </div>
      </div>
    </div>
  );
}

export function MustangShield() {
  return <MustangWordmark />;
}
