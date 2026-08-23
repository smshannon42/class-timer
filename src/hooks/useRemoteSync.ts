'use client';
import { useEffect, useState, useCallback, useRef } from 'react';

export interface RemoteSyncState {
  mode: 'WARMUP' | 'TABATA' | 'AMRAP' | 'EMOM' | 'FOR_TIME' | 'DYNAMIC' | 'COOLDOWN';
  isActive: boolean;
  secondsRemaining: number;
  currentRound: number;
  isWorkPhase: boolean;
  warmupPhase?: 'RUN' | 'STRETCH';
  dynamicSubMode?: 'RUN' | 'STRETCH';
  stretchRound?: number;
  warmupPhase: 'RUN' | 'STRETCH';
  stretchRound: number;
  timestamp: number;
}

const FIREBASE_REST_URL = 'https://class-timer-remote-default-rtdb.firebaseio.com';

export function useRemoteSync(isHost = false) {
  const [pin, setPin] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [incomingSync, setIncomingSync] = useState<RemoteSyncState | null>(null);

  const activePinRef = useRef<string>('');
  const lastTimestampRef = useRef<number>(0);

  // Host Display (Projector): Assign clean 4-digit PIN and poll
  useEffect(() => {
    if (!isHost) return;

    const hostPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(hostPin);
    activePinRef.current = hostPin;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${FIREBASE_REST_URL}/rooms/${hostPin}.json?ts=${Date.now()}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data: RemoteSyncState | null = await res.json();
          if (data && data.timestamp > lastTimestampRef.current) {
            lastTimestampRef.current = data.timestamp;
            setIncomingSync(data);
            setIsConnected(true);
          }
        }
      } catch {
        // Silent recovery on network blips
      }
    }, 300);

    return () => clearInterval(interval);
  }, [isHost]);

  // Client (Phone): Connect to PIN
  const connectToHost = useCallback(async (targetPin: string) => {
    const cleanPin = targetPin.trim();
    if (!cleanPin) return;

    setIsConnecting(true);
    setErrorMessage(null);

    try {
      const payload: RemoteSyncState = {
        mode: 'WARMUP',
        isActive: false,
        secondsRemaining: 180,
        currentRound: 1,
        isWorkPhase: true,
        warmupPhase: 'RUN',
        stretchRound: 1,
        timestamp: Date.now(),
      };

      const res = await fetch(`${FIREBASE_REST_URL}/rooms/${cleanPin}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setPin(cleanPin);
        activePinRef.current = cleanPin;
        setIsConnected(true);
        setIsConnecting(false);
      } else {
        setErrorMessage('Failed to connect to PIN.');
        setIsConnecting(false);
      }
    } catch {
      setErrorMessage('Network connection error.');
      setIsConnecting(false);
    }
  }, []);

  // Broadcast state changes directly over HTTPS PUT
  const broadcastState = useCallback(async (state: Omit<RemoteSyncState, 'timestamp'>) => {
    const currentPin = activePinRef.current || pin;
    if (!currentPin) return;

    try {
      const payload: RemoteSyncState = {
        ...state,
        timestamp: Date.now(),
      };

      await fetch(`${FIREBASE_REST_URL}/rooms/${currentPin}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('Remote sync error:', err);
    }
  }, [pin]);

  return {
    peerId: pin,
    isConnected,
    isConnecting,
    errorMessage,
    connectToHost,
    broadcastState,
    incomingSync,
  };
}
