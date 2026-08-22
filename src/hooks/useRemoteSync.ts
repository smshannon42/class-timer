'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';

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

  const clientRef = useRef<MqttClient | null>(null);
  const activePinRef = useRef<string>('');

  useEffect(() => {
    // Connect to public secure WebSocket broker
    const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
      clientId: `fp_${isHost ? 'host' : 'remote'}_${Math.random().toString(16).substring(2, 8)}`,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });

    clientRef.current = client;

    client.on('connect', () => {
      if (isHost) {
        // Generate random 4-digit PIN for host
        const hostPin = Math.floor(1000 + Math.random() * 9000).toString();
        setPin(hostPin);
        activePinRef.current = hostPin;
        client.subscribe(`ford-pulse/${hostPin}`, { qos: 0 });
        setIsConnected(true);
      }
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        setIncomingState({ ...payload });
      } catch (err) {
        console.error('Failed to parse incoming sync:', err);
      }
    });

    client.on('error', (err) => {
      console.error('MQTT error:', err);
      setErrorMessage('Sync relay connection error.');
    });

    return () => {
      client.end(true);
    };
  }, [isHost]);

  // Connect client (Phone) to Display PIN
  const connectToHost = useCallback((targetPin: string) => {
    if (!clientRef.current) return;
    setIsConnecting(true);
    setErrorMessage(null);

    const client = clientRef.current;
    const cleanPin = targetPin.trim();

    client.subscribe(`ford-pulse/${cleanPin}`, { qos: 0 }, (err) => {
      if (err) {
        setErrorMessage('Failed to link PIN.');
        setIsConnecting(false);
      } else {
        setPin(cleanPin);
        activePinRef.current = cleanPin;
        setIsConnected(true);
        setIsConnecting(false);
      }
    });
  }, []);

  // Broadcast state changes directly over WebSocket
  const sendState = useCallback((state: Partial<RemoteState>) => {
    const currentPin = activePinRef.current || pin;
    if (!clientRef.current || !currentPin) return;

    try {
      clientRef.current.publish(
        `ford-pulse/${currentPin}`,
        JSON.stringify(state),
        { qos: 0, retain: false }
      );
    } catch (err) {
      console.error('Failed to publish sync payload:', err);
    }
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
