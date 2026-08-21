import React from 'react';

export function MustangShield({ className = "w-14 h-14" }: { className?: string }) {
  return (
    <img
      src="/logo-shield.png"
      alt="Ford MS Mustang Shield"
      className={`${className} object-contain`}
      onError={(e) => {
        (e.target as HTMLImageElement).src = '/logo-shield.jpg';
      }}
    />
  );
}

export function MustangWordmark({ className = "h-10" }: { className?: string }) {
  return (
    <img
      src="/logo-words.png"
      alt="Ford Mustangs"
      className={`${className} object-contain`}
      onError={(e) => {
        (e.target as HTMLImageElement).src = '/logo-words.jpg';
      }}
    />
  );
}
