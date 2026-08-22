'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import type { DataConnection, Peer } from 'peerjs';

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
  const [peerId, setPeerId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const connRef = useRef<DataConnection | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const [incomingState, setIncomingState] = useState<Partial<RemoteState> | null>(null);

  useEffect(() => {
    let peer: Peer;

    import('peerjs').then(({ default: Peer }) => {
      const customId = isHost ? Math.floor(1000 + Math.random() * 9000).toString() : undefined;
      peer = customId ? new Peer(customId) : new Peer();
      peerRef.current = peer;

      peer.on('open', (id) => {
        setPeerId(id);
      });

      peer.on('error', (err) => {
        console.error('Peer error:', err);
        setErrorMessage('Connection failed. Please retry.');
        setIsConnecting(false);
      });

      if (isHost) {
        peer.on('connection', (conn) => {
          connRef.current = conn;
          setIsConnected(true);

          conn.on('data', (data: any) => {
            setIncomingState({ ...data });
          });

          conn.on('close', () => setIsConnected(false));
        });
      }
    });

    return () => {
      peerRef.current?.destroy();
    };
  }, [isHost]);

  const connectToHost = useCallback((targetPin: string) => {
    if (!peerRef.current) return;
    setIsConnecting(true);
    setErrorMessage(null);

    const conn = peerRef.current.connect(targetPin, { reliable: true });
    connRef.current = conn;

    conn.on('open', () => {
      setIsConnected(true);
      setIsConnecting(false);
    });

    conn.on('error', () => {
      setErrorMessage('Could not find display. Check PIN.');
      setIsConnecting(false);
    });

    conn.on('close', () => {
      setIsConnected(false);
      setIsConnecting(false);
    });
  }, []);

  const sendState = useCallback((state: Partial<RemoteState>) => {
    if (connRef.current && connRef.current.open) {
      try {
        connRef.current.send(state);
      } catch (err) {
        console.error('Error broadcasting state:', err);
      }
    }
  }, []);

  return {
    peerId,
    isConnected,
    isConnecting,
    errorMessage,
    connectToHost,
    sendState,
    incomingState,
  };
}
