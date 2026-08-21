import React from 'react';

export function MustangShield({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 500 500" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer White Border */}
      <path
        d="M 90 70 Q 250 20 410 70 Q 410 250 250 450 Q 90 250 90 70 Z"
        fill="#0047BA"
        stroke="#FFFFFF"
        strokeWidth="18"
        strokeLinejoin="round"
      />
      {/* Inner Accent Line */}
      <path
        d="M 115 95 Q 250 50 385 95 Q 385 240 250 420 Q 115 240 115 95 Z"
        fill="#003594"
        stroke="#FFFFFF"
        strokeWidth="6"
      />
      {/* Scarlet Red Mustang Stallion */}
      <path
        d="M 170 210 C 150 170 180 130 225 120 C 285 105 345 130 375 180 C 390 210 395 250 380 270 C 355 250 345 225 315 205 C 335 240 338 280 305 320 C 285 345 255 375 220 395 C 245 355 260 315 250 275 C 235 235 205 210 175 215 C 155 220 140 235 135 250 C 130 235 150 215 170 210 Z"
        fill="#E32636"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {/* Mane & Detail Cuts */}
      <path d="M 220 185 Q 240 175 235 195 Q 215 195 220 185 Z" fill="#FFFFFF" />
      <path d="M 265 150 Q 305 170 310 205 C 290 185 270 170 265 150 Z" fill="#0047BA" />
      <path d="M 295 195 Q 335 230 330 270 C 310 240 295 220 295 195 Z" fill="#0047BA" />
    </svg>
  );
}

export function MustangWordmark() {
  return (
    <div className="flex flex-col select-none">
      <span className="text-3xl sm:text-4xl font-black tracking-wider text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.9)] leading-none">
        FORD
      </span>
      <span className="text-sm sm:text-base font-black tracking-[0.28em] text-[#E32636] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] -mt-0.5">
        MUSTANGS
      </span>
    </div>
  );
}
