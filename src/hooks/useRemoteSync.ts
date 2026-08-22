'use client';
import { useEffect, useState, useCallback, useRef } from 'react';

export interface RemoteCommand {
  action: 'START' | 'PAUSE' | 'RESET' | 'SET_MODE' | 'ADJUST_SECONDS' | 'SET_CUSTOM_TIME' | 'PING';
  mode?: 'WARMUP' | 'TABATA' | 'AMRAP' | 'EMOM' | 'FOR_TIME';
  seconds?: number;
  periodId?: string;
  timestamp: number;
}

export function useRemoteSync(isHost = false) {
  const [pin, setPin] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<RemoteCommand | null>(null);

  const activePinRef = useRef<string>('');

  useEffect(() => {
    if (!isHost) return;

    const hostPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(hostPin);
    activePinRef.current = hostPin;

    const eventSource = new EventSource(`https://ntfy.sh/fordpulse_${hostPin}/sse`);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.message) {
          const cmd: RemoteCommand = JSON.parse(payload.message);
          setLastCommand(cmd);
          setIsConnected(true);
        }
      } catch (err) {
        console.error('Error parsing remote command:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [isHost]);

  const connectToHost = useCallback(async (targetPin: string) => {
    const cleanPin = targetPin.trim();
    if (!cleanPin) return;

    setIsConnecting(true);
    setErrorMessage(null);

    try {
      const pingCmd: RemoteCommand = { action: 'PING', timestamp: Date.now() };
      const res = await fetch(`https://ntfy.sh/fordpulse_${cleanPin}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(pingCmd),
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

  const sendCommand = useCallback((cmd: Omit<RemoteCommand, 'timestamp'>) => {
    const targetPin = activePinRef.current || pin;
    if (!targetPin) return;

    const payload: RemoteCommand = { ...cmd, timestamp: Date.now() };
    fetch(`https://ntfy.sh/fordpulse_${targetPin}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    }).catch((err) => console.error('Failed to send command:', err));
  }, [pin]);

  return {
    peerId: pin,
    isConnected,
    isConnecting,
    errorMessage,
    connectToHost,
    sendCommand,
    lastCommand,
  };
}
