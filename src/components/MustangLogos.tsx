import React from 'react';

export function MustangShield({ className = "w-14 h-14" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 500 550"
      className={`${className} select-none drop-shadow-lg`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer White Outlined Shield */}
      <path
        d="M 90 70 Q 250 15 410 70 Q 410 260 250 490 Q 90 260 90 70 Z"
        fill="#0047BA"
        stroke="#FFFFFF"
        strokeWidth="20"
        strokeLinejoin="round"
      />
      {/* Inner Royal Blue Layer */}
      <path
        d="M 115 95 Q 250 50 385 95 Q 385 245 250 455 Q 115 245 115 95 Z"
        fill="#003594"
        stroke="#FFFFFF"
        strokeWidth="6"
      />

      {/* Ford Mustang Stallion Head & Mane - Official Red Silhouette */}
      <path
        d="M 175 230 C 145 190 170 145 220 135 C 285 120 345 140 375 190 C 395 225 400 270 380 295 C 350 270 340 240 305 220 C 330 260 330 305 295 350 C 270 380 235 415 195 440 C 225 390 245 345 230 295 C 215 250 185 225 150 235 C 130 240 120 255 115 270 C 110 250 135 235 155 230 Z"
        fill="#E32636"
        stroke="#FFFFFF"
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* Stallion Mane Details (Royal Blue Flow Accents) */}
      <path
        d="M 260 160 Q 305 185 315 225 C 290 200 270 185 260 160 Z"
        fill="#0047BA"
      />
      <path
        d="M 290 210 Q 335 245 330 290 C 305 255 290 235 290 210 Z"
        fill="#0047BA"
      />
      <path
        d="M 270 280 Q 310 320 295 365 C 280 330 270 305 270 280 Z"
        fill="#0047BA"
      />

      {/* Mustang Eye & Facial Brow Accents */}
      <path
        d="M 210 205 Q 235 195 230 215 Q 205 215 210 205 Z"
        fill="#FFFFFF"
      />
      <path
        d="M 185 245 Q 195 255 180 265 C 170 260 175 250 185 245 Z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function MustangWordmark({ className = "h-10" }: { className?: string }) {
  return (
    <div className={`flex flex-col select-none justify-center leading-none ${className}`}>
      <span className="text-3xl sm:text-4xl font-black tracking-wider text-white drop-shadow-[0_3px_5px_rgba(0,0,0,0.8)] font-sans">
        FORD
      </span>
      <span className="text-xs sm:text-sm font-black tracking-[0.3em] text-[#E32636] drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] mt-0.5">
        MUSTANGS
      </span>
    </div>
  );
}
