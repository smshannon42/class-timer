'use client';
import React, { useState, useEffect } from 'react';

const QUOTES = [
  { text: "I've grown most not from victories, but setbacks.", author: "Serena Williams" },
  { text: "I can accept failure, everyone fails at something. But I can't accept not trying.", author: "Michael Jordan" },
  { text: "Champions keep playing until they get it right.", author: "Billie Jean King" },
  { text: "It’s not whether you get knocked down, it’s whether you get up.", author: "Vince Lombardi" },
  { text: "I'd rather regret the risks that didn't work out than the chances I didn't take at all.", author: "Simone Biles" },
  { text: "There may be people that have more talent than you, but there's no excuse for anyone to work harder than you do.", author: "Derek Jeter" },
  { text: "Obstacles don't have to stop you. Figure out how to climb it, go through it, or work around it.", author: "Michael Jordan" },
  { text: "A champion is someone who gets up when they can't.", author: "Jack Dempsey" },
  { text: "You can’t get much done in life if you only work on the days when you feel good.", author: "Jerry West" },
  { text: "I hated every minute of training, but I said, 'Don\'t quit. Suffer now and live the rest of your life as a champion.'", author: "Muhammad Ali" },
  { text: "Left foot, right foot, breathe. Keep moving forward.", author: "Pat Summitt" },
  { text: "Success is not an accident, success is actually a choice.", author: "Stephen Curry" },
  { text: "You have to be willing to fail to succeed.", author: "Diana Taurasi" },
  { text: "Don't sell yourself short. You are your only limit.", author: "Bo Jackson" }
];

export default function GritQuote() {
  const [quote, setQuote] = useState<{text: string, author: string} | null>(null);

  useEffect(() => {
    // Randomize on the client to prevent Next.js hydration errors
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  if (!quote) return null;

  return (
    <div className="w-full text-center pb-6 pt-8 mt-auto flex-shrink-0 z-10 relative">
      <p className="text-blue-200/80 text-xs sm:text-sm font-medium max-w-4xl mx-auto px-6 tracking-wide drop-shadow-md">
        <span className="italic">"{quote.text}"</span>
        <span className="ml-2 font-black text-white/70 whitespace-nowrap">— {quote.author}</span>
      </p>
    </div>
  );
}
