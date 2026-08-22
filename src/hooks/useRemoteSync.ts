'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

// Public browser-safe Supabase credentials bundled directly
const SUPABASE_URL = 'https://vdrxlienzhlmvwzsdcmk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_j1TPjY8brWt1fz2UGGVxAA_ksJ1tqdL';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

  const channelRef = useRef<RealtimeChannel | null>(null);
  const activePinRef = useRef<string>('');

  useEffect(() => {
    if (!isHost) return;

    const hostPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(hostPin);
    activePinRef.current = hostPin;

    const channel = supabase.channel(`ford_room_${hostPin}`, {
      config: {
        broadcast: { self: false },
      },
    });

    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'command' }, ({ payload }) => {
        setLastCommand(payload);
        setIsConnected(true);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Host] Ready on channel ford_room_${hostPin}`);
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

    const channel = supabase.channel(`ford_room_${cleanPin}`, {
      config: {
        broadcast: { self: false },
      },
    });

    channelRef.current = channel;

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setPin(cleanPin);
        activePinRef.current = cleanPin;
        setIsConnected(true);
        setIsConnecting(false);

        await channel.send({
          type: 'broadcast',
          event: 'command',
          payload: { action: 'PING', timestamp: Date.now() },
        });
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setErrorMessage('Failed to connect to PIN. Try again.');
        setIsConnecting(false);
      }
    });
  }, []);

  const sendCommand = useCallback(async (cmd: Omit<RemoteCommand, 'timestamp'>) => {
    const currentChannel = channelRef.current;
    if (!currentChannel) return;

    const payload: RemoteCommand = { ...cmd, timestamp: Date.now() };
    await currentChannel.send({
      type: 'broadcast',
      event: 'command',
      payload,
    });
  }, []);

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
