import React from 'react';

export function MustangShield({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer White Border & Blue Shield */}
      <path
        d="M 80 80 Q 200 40 320 80 Q 320 220 200 360 Q 80 220 80 80 Z"
        fill="#0047BA"
        stroke="#FFFFFF"
        strokeWidth="14"
        strokeLinejoin="round"
      />
      {/* Inner White Ring */}
      <path
        d="M 98 96 Q 200 60 302 96 Q 302 214 200 334 Q 98 214 98 96 Z"
        fill="#003594"
        stroke="#FFFFFF"
        strokeWidth="4"
      />
      {/* Mustang Stallion Head (Scarlet Red Silhouette) */}
      <path
        d="M 140 180 C 130 155 155 125 185 115 C 225 102 270 120 295 155 C 310 176 320 205 310 220 C 290 205 285 185 260 170 C 275 195 280 230 255 260 C 240 280 215 305 185 320 C 205 290 220 260 210 230 C 200 200 175 180 150 185 C 135 188 120 200 115 210 C 110 200 125 185 140 180 Z"
        fill="#E32636"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* Eye & Mane Accent Cuts */}
      <path d="M 180 160 Q 195 155 190 170 Q 175 168 180 160 Z" fill="#FFFFFF" />
      <path d="M 215 135 Q 245 150 250 175 C 235 160 220 150 215 135 Z" fill="#0047BA" />
      <path d="M 240 170 Q 270 195 270 225 C 255 205 240 190 240 170 Z" fill="#0047BA" />
    </svg>
  );
}

export function MustangWordmark({ className = "h-10" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center font-black tracking-tighter uppercase select-none ${className}`}>
      <span className="text-2xl sm:text-3xl tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,71,186,1)] leading-none">
        FORD
      </span>
      <span className="text-sm sm:text-base tracking-[0.25em] text-[#E32636] font-extrabold -mt-0.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        MUSTANGS
      </span>
    </div>
  );
}
