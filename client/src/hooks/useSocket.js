import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

const socket = io(SERVER_URL, {
  autoConnect: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

export function useSocket() {
  const [isConnected, setIsConnected]       = useState(socket.connected);
  const [isReconnecting, setIsReconnecting] = useState(!socket.connected);

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
      setIsReconnecting(false);
    }

    function onDisconnect() {
      setIsConnected(false);
      setIsReconnecting(true);
    }

    function onReconnectAttempt() {
      setIsReconnecting(true);
    }

    socket.on('connect',           onConnect);
    socket.on('disconnect',        onDisconnect);
    socket.on('reconnect_attempt', onReconnectAttempt);

    return () => {
      socket.off('connect',           onConnect);
      socket.off('disconnect',        onDisconnect);
      socket.off('reconnect_attempt', onReconnectAttempt);
    };
  }, []);

  return { socket, isConnected, isReconnecting };
}
