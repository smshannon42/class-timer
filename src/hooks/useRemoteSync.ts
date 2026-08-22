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
  // Generate a clean 4-digit PIN immediately for host screens
  const [pin, setPin] = useState<string>(() => {
    if (typeof window !== 'undefined' && isHost) {
      return Math.floor(1000 + Math.random() * 9000).toString();
    }
    return '';
  });
  
  const [isBrokerReady, setIsBrokerReady] = useState(false);
  const [hasRemoteClient, setHasRemoteClient] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [incomingState, setIncomingState] = useState<Partial<RemoteState> | null>(null);

  const clientRef = useRef<MqttClient | null>(null);
  const activePinRef = useRef<string>(pin);

  useEffect(() => {
    if (pin) {
      activePinRef.current = pin;
    }
  }, [pin]);

  useEffect(() => {
    const currentPin = activePinRef.current;
    
    // Connect to public secure WebSocket broker
    const client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
      clientId: `fp_${isHost ? 'host' : 'remote'}_${Math.random().toString(16).substring(2, 8)}`,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 2000,
    });

    clientRef.current = client;

    client.on('connect', () => {
      setIsBrokerReady(true);
      if (isHost && currentPin) {
        client.subscribe(`ford-pulse/${currentPin}`, { qos: 0 });
      }
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        setIncomingState({ ...payload });
        if (isHost) {
          setHasRemoteClient(true);
        }
      } catch (err) {
        console.error('Failed to parse incoming sync:', err);
      }
    });

    client.on('error', (err) => {
      console.error('MQTT error:', err);
      setErrorMessage('Relay connection error.');
    });

    return () => {
      client.end(true);
    };
  }, [isHost]);

  // Connect Phone Remote to the Host PIN
  const connectToHost = useCallback((targetPin: string) => {
    if (!clientRef.current) return;
    setIsConnecting(true);
    setErrorMessage(null);

    const client = clientRef.current;
    const cleanPin = targetPin.trim();

    client.subscribe(`ford-pulse/${cleanPin}`, { qos: 0 }, (err) => {
      if (err) {
        setErrorMessage('Failed to connect to PIN.');
        setIsConnecting(false);
      } else {
        setPin(cleanPin);
        activePinRef.current = cleanPin;
        setIsConnecting(false);
        // Send a handshake ping so the display acknowledges the connection
        client.publish(`ford-pulse/${cleanPin}`, JSON.stringify({ ping: true }), { qos: 0 });
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
    isConnected: isHost ? hasRemoteClient : Boolean(pin && isBrokerReady),
    isConnecting,
    errorMessage,
    connectToHost,
    sendState,
    incomingState,
  };
}
