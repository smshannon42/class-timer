'use client';
import React, { useState, useEffect } from 'react';

const QUOTES = [
  { text: "I've grown most not from victories, but setbacks.", author: "Serena Williams" },
  { text: "I can accept failure, everyone fails at something. But I can't accept not trying.", author: "Michael Jordan" },
  { text: "Champions keep playing until they get it right.", author: "Billie Jean King" },
  { text: "It’s not whether you get knocked down, it’s whether you get up.", author: "Vince Lombardi" },
  { text: "I'd rather regret the risks that didn't work out than the chances I didn't take at all.", author: "Simone Biles" },
  { text: "There may be people that have more talent than you, but there's no excuse for anyone to work harder than you do.", author: "Derek Jeter" },
  { text: "Left foot, right foot, breathe. Keep moving forward.", author: "Pat Summitt" },
  { text: "Success is not an accident, success is actually a choice.", author: "Stephen Curry" },
  { text: "You have to be willing to fail to succeed.", author: "Diana Taurasi" },
  { text: "Don't sell yourself short. You are your only limit.", author: "Bo Jackson" }
];

export default function GritQuote() {
  const [quote, setQuote] = useState<{text: string, author: string} | null>(null);

  useEffect(() => {
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

    const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  }, []);

  if (!isMounted || !quote) return null;

  return (
    <div className="w-full text-center py-2 mb-4">
      <p className="text-blue-300 text-xl sm:text-3xl md:text-4xl lg:text-5xl font-medium max-w-screen-2xl mx-auto px-6 tracking-wide">
        <span className="italic">"{quote.text}"</span>
        <span className="ml-3 font-black text-white/90 whitespace-nowrap">— {quote.author}</span>
      </p>
    </div>
  );
}
