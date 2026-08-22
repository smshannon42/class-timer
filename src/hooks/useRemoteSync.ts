'use client';
import { useEffect, useRef, useState } from 'react';
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

export function useRemoteSync(isHost = false, hostId?: string) {
  const [peerId, setPeerId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const connRef = useRef<DataConnection | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const [incomingState, setIncomingState] = useState<Partial<RemoteState> | null>(null);

  useEffect(() => {
    let peer: Peer;

    import('peerjs').then(({ default: Peer }) => {
      // 4-digit readable pin for host or auto-generated ID
      const generatedId = isHost 
        ? Math.floor(1000 + Math.random() * 9000).toString()
        : undefined;

      peer = new Peer(generatedId || '', {
        debug: 1,
      });

      peerRef.current = peer;

      peer.on('open', (id) => {
        setPeerId(id);
        if (!isHost && hostId) {
          connectToHost(hostId);
        }
      });

      if (isHost) {
        peer.on('connection', (conn) => {
          connRef.current = conn;
          setIsConnected(true);

          conn.on('data', (data: any) => {
            setIncomingState(data);
          });

          conn.on('close', () => setIsConnected(false));
        });
      }
    });

    return () => {
      peerRef.current?.destroy();
    };
  }, [isHost]);

  const connectToHost = (targetPin: string) => {
    if (!peerRef.current) return;
    const conn = peerRef.current.connect(targetPin);
    connRef.current = conn;

    conn.on('open', () => {
      setIsConnected(true);
    });

    conn.on('close', () => {
      setIsConnected(false);
    });
  };

  const sendState = (state: Partial<RemoteState>) => {
    if (connRef.current && isConnected) {
      connRef.current.send(state);
    }
  };

  return {
    peerId,
    isConnected,
    connectToHost,
    sendState,
    incomingState,
  };
}
