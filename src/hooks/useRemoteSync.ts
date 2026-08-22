'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vdrxlienzhlmvwzsdcmk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_j1TPjY8brWt1fz2UGGVxAA_ksJ1tqdL';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface RemoteSyncState {
  mode: 'WARMUP' | 'TABATA' | 'AMRAP' | 'EMOM' | 'FOR_TIME';
  isActive: boolean;
  secondsRemaining: number;
  currentRound: number;
  isWorkPhase: boolean;
  warmupPhase: 'RUN' | 'STRETCH';
  stretchRound: number;
  timestamp: number;
}

export function useRemoteSync(isHost = false) {
  const [pin, setPin] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [incomingSync, setIncomingSync] = useState<RemoteSyncState | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const activePinRef = useRef<string>('');

  useEffect(() => {
    if (!isHost) return;

    const hostPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(hostPin);
    activePinRef.current = hostPin;

    const channel = supabase.channel(`room_${hostPin}`, {
      config: { broadcast: { self: false } },
    });

    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'sync' }, ({ payload }) => {
        setIncomingSync(payload as RemoteSyncState);
        setIsConnected(true);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Display] Subscribed to room:', hostPin);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isHost]);

  const connectToHost = useCallback(async (targetPin: string) => {
    const cleanPin = targetPin.trim();
    if (!cleanPin) return;

    setIsConnecting(true);
    setErrorMessage(null);

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase.channel(`room_${cleanPin}`, {
      config: { broadcast: { self: false } },
    });

    channelRef.current = channel;

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setPin(cleanPin);
        activePinRef.current = cleanPin;
        setIsConnected(true);
        setIsConnecting(false);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setErrorMessage('Failed to connect to PIN. Try again.');
        setIsConnecting(false);
      }
    });
  }, []);

  const broadcastState = useCallback(async (state: Omit<RemoteSyncState, 'timestamp'>) => {
    const channel = channelRef.current;
    if (!channel) return;

    const payload: RemoteSyncState = { ...state, timestamp: Date.now() };
    await channel.send({
      type: 'broadcast',
      event: 'sync',
      payload,
    });
  }, []);

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
