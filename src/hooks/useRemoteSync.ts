'use client';
import { useState, useEffect, useRef } from 'react';
import Peer, { DataConnection } from 'peerjs';

export function useRemoteSync(onCommandReceived?: (data: any) => void) {
  const [roomCode, setRoomCode] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isHost, setIsHost] = useState<boolean>(false);
  const peerRef = useRef<Peer | null>(null);
  const connRef = useRef<DataConnection | null>(null);

  const initHost = () => {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const peerId = `mustang-pulse-${code}`;
    const peer = new Peer(peerId);

    peer.on('open', () => {
      setRoomCode(code);
      setIsHost(true);
    });

    peer.on('connection', (conn) => {
      connRef.current = conn;
      conn.on('open', () => setIsConnected(true));
      conn.on('data', (data) => {
        if (onCommandReceived) onCommandReceived(data);
      });
      conn.on('close', () => setIsConnected(false));
    });

    peerRef.current = peer;
  };

  const connectToHost = (targetCode: string) => {
    const peer = new Peer();
    peer.on('open', () => {
      const conn = peer.connect(`mustang-pulse-${targetCode.toUpperCase()}`);
      conn.on('open', () => {
        connRef.current = conn;
        setIsConnected(true);
        setRoomCode(targetCode.toUpperCase());
      });
      conn.on('close', () => setIsConnected(false));
    });
    peerRef.current = peer;
  };

  const sendCommand = (action: string, payload?: any) => {
    if (connRef.current && connRef.current.open) {
      connRef.current.send({ action, payload });
    }
  };

  useEffect(() => {
    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, []);

  return { roomCode, isConnected, isHost, initHost, connectToHost, sendCommand };
}
