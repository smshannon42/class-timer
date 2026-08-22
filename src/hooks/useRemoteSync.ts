'use client';
import { useEffect, useState, useCallback, useRef } from 'react';

export interface RemoteState {
  mode: 'WARMUP' | 'TABATA' | 'AMRAP' | 'EMOM' | 'FOR_TIME';
  isActive: boolean;
  secondsRemaining: number;
  currentRound: number;
  isWorkPhase: boolean;
  warmupPhase: 'RUN' | 'STRETCH';
  stretchRound: number;
  manualPeriodId: string;
}

export function useRemoteSync(isHost = false) {
  const [pin, setPin] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [incomingState, setIncomingState] = useState<Partial<RemoteState> | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const activePinRef = useRef<string>('');

  // Host Display: generate PIN and listen for live events
  useEffect(() => {
    if (!isHost) return;

    const hostPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(hostPin);
    activePinRef.current = hostPin;

    const topic = `fordpulse_${hostPin}`;
    const sse = new EventSource(`https://ntfy.sh/${topic}/sse`);
    eventSourceRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.message) {
          const parsed = JSON.parse(payload.message);
          setIncomingState(parsed);
          setIsConnected(true);
        }
      } catch (err) {
        console.error('Error parsing sync message:', err);
      }
    };

    sse.onerror = () => {
      // Reconnect automatically if temporarily dropped
    };

    return () => {
      sse.close();
    };
  }, [isHost]);

  // Phone: Connects to display PIN and verifies channel
  const connectToHost = useCallback(async (targetPin: string) => {
    const cleanPin = targetPin.trim();
    if (!cleanPin) return;

    setIsConnecting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`https://ntfy.sh/fordpulse_${cleanPin}`, {
        method: 'POST',
        body: JSON.stringify({ ping: true }),
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
      setErrorMessage('Network error connecting to PIN.');
      setIsConnecting(false);
    }
  }, []);

  // Broadcast state changes directly over HTTPS
  const sendState = useCallback((state: Partial<RemoteState>) => {
    const currentPin = activePinRef.current || pin;
    if (!currentPin) return;

    fetch(`https://ntfy.sh/fordpulse_${currentPin}`, {
      method: 'POST',
      body: JSON.stringify(state),
    }).catch((err) => {
      console.error('Failed to post state update:', err);
    });
  }, [pin]);

  return {
    peerId: pin,
    isConnected,
    isConnecting,
    errorMessage,
    connectToHost,
    sendState,
    incomingState,
  };
}
