'use client';
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Tv, Smartphone, X, Check, Radio } from 'lucide-react';

interface RemoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  isConnected: boolean;
  isHost: boolean;
  onInitHost: () => void;
  onConnectHost: (code: string) => void;
}

export default function RemoteModal({
  isOpen,
  onClose,
  roomCode,
  isConnected,
  isHost,
  onInitHost,
  onConnectHost,
}: RemoteModalProps) {
  const [inputCode, setInputCode] = useState('');

  if (!isOpen) return null;

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}?remote=${roomCode}` : '';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#001f5c] border-2 border-[#0047BA] rounded-3xl p-6 max-w-sm w-full shadow-2xl text-white relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-blue-200 hover:text-white bg-[#020b1c] rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 text-[#E32636]">
          <Radio className={`w-5 h-5 ${isConnected ? 'text-emerald-400 animate-pulse' : ''}`} />
          <span className="text-sm uppercase font-black tracking-wider text-white">
            Remote Control Sync
          </span>
        </div>

        {!roomCode && !isConnected ? (
          <div className="space-y-4">
            <button
              onClick={onInitHost}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#0047BA] hover:bg-[#003da5] rounded-2xl font-bold transition"
            >
              <Tv className="w-5 h-5" />
              <span>Make This Screen the Display</span>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-blue-400/30"></div>
              <span className="flex-shrink mx-4 text-xs uppercase font-bold text-blue-300">Or Connect Phone</span>
              <div className="flex-grow border-t border-blue-400/30"></div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                maxLength={4}
                placeholder="CODE"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="w-28 text-center uppercase tracking-widest font-mono font-black text-xl bg-[#020b1c] border-2 border-[#0047BA] rounded-xl p-2 focus:outline-none"
              />
              <button
                onClick={() => onConnectHost(inputCode)}
                disabled={inputCode.length !== 4}
                className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl font-bold transition"
              >
                <Smartphone className="w-4 h-4" /> Link
              </button>
            </div>
          </div>
        ) : isHost ? (
          <div className="flex flex-col items-center text-center space-y-4">
            <span className="text-xs uppercase tracking-widest text-blue-200">
              Scan with phone camera to remote control:
            </span>

            <div className="p-3 bg-white rounded-2xl shadow-lg">
              <QRCodeSVG value={shareUrl} size={160} />
            </div>

            <div className="bg-[#020b1c] px-4 py-2 rounded-xl border border-[#0047BA]">
              <span className="text-xs text-blue-300 uppercase block font-bold">Room Code</span>
              <span className="text-3xl font-mono font-black text-emerald-400 tracking-widest">{roomCode}</span>
            </div>

            <span className={`text-xs font-bold ${isConnected ? 'text-emerald-400' : 'text-blue-300 animate-pulse'}`}>
              {isConnected ? '✓ Phone Connected & Ready' : 'Waiting for phone to connect...'}
            </span>
          </div>
        ) : (
          <div className="text-center py-4 space-y-3">
            <Check className="w-12 h-12 text-emerald-400 mx-auto" />
            <div className="text-lg font-black text-white">Connected to TV Screen</div>
            <div className="text-xs text-blue-200">Your taps will now control the main display.</div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-[#0047BA] rounded-xl font-bold mt-2"
            >
              Open Remote
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
