'use client';
import { useState, useEffect, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';

export interface RemoteSyncState {
  mode: 'WARMUP' | 'TABATA' | 'AMRAP' | 'EMOM' | 'FOR_TIME';
  isActive: boolean;
  secondsRemaining: number;
  currentRound: number;
  isWorkPhase: boolean;
  warmupPhase?: 'RUN' | 'POST_RUN_REST' | 'WAITING_FOR_STRETCH' | 'STRETCH' | 'REST';
  stretchRound?: number;
  timestamp: number;
}

export function useRemoteSync(isHost: boolean = false) {
  const [peerId, setPeerId] = useState<string>('');
  const [pinCode, setPinCode] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remoteState, setRemoteState] = useState<RemoteSyncState | null>(null);

  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);

  useEffect(() => {
    let generatedPin = '';
    if (isHost) {
      generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
      setPinCode(generatedPin);
    }

    const hostPeerId = isHost ? `atp-timer-${generatedPin}` : undefined;
    const peer = new Peer(hostPeerId as string);
    peerRef.current = peer;

    peer.on('open', (id) => {
      setPeerId(id);
    });

    peer.on('connection', (conn) => {
      connRef.current = conn;
      setIsConnected(true);

      conn.on('data', (data) => {
        setRemoteState(data as RemoteSyncState);
      });

      conn.on('close', () => {
        setIsConnected(false);
      });

      conn.on('error', () => {
        setIsConnected(false);
      });
    });

    peer.on('error', (err) => {
      setErrorMessage(err.message);
      setIsConnecting(false);
    });

    return () => {
      peer.destroy();
    };
  }, [isHost]);

  const connectToHost = (pin: string) => {
    if (!peerRef.current) return;
    setIsConnecting(true);
    setErrorMessage(null);

    const targetId = `atp-timer-${pin}`;
    const conn = peerRef.current.connect(targetId);
    connRef.current = conn;

    conn.on('open', () => {
      setIsConnected(true);
      setIsConnecting(false);
    });

    conn.on('data', (data) => {
      setRemoteState(data as RemoteSyncState);
    });

    conn.on('close', () => {
      setIsConnected(false);
      setIsConnecting(false);
    });

    conn.on('error', (err) => {
      setErrorMessage('Failed to connect to display PIN.');
      setIsConnecting(false);
    });
  };

  const broadcastState = (state: Omit<RemoteSyncState, 'timestamp'>) => {
    if (connRef.current && isConnected) {
      connRef.current.send({
        ...state,
        timestamp: Date.now(),
      });
    }
  };

  return {
    peerId,
    pinCode,
    isConnected,
    isConnecting,
    errorMessage,
    remoteState,
    connectToHost,
    broadcastState,
  };
}
