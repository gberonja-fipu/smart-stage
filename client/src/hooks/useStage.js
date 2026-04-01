import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';

export function useStage() {
  const { socket, isConnected } = useSocket();
  const [stageState, setStageState] = useState(null);
  const [mqttHeartbeats, setMqttHeartbeats] = useState({});
  const heartbeatTimers = useRef({});

  useEffect(() => {
    function onStateReset(state) {
      setStageState(state);
    }

    function onElementUpdated({ category, element }) {
      setStageState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [category]: prev[category].map(el =>
            el.id === element.id ? element : el
          ),
        };
      });
    }

    function onHeartbeat({ deviceId }) {
      setMqttHeartbeats(prev => ({ ...prev, [deviceId]: true }));

      if (heartbeatTimers.current[deviceId]) {
        clearTimeout(heartbeatTimers.current[deviceId]);
      }
      heartbeatTimers.current[deviceId] = setTimeout(() => {
        setMqttHeartbeats(prev => ({ ...prev, [deviceId]: false }));
      }, 12000);
    }

    socket.on('stage:stateReset', onStateReset);
    socket.on('stage:elementUpdated', onElementUpdated);
    socket.on('mqtt:heartbeat', onHeartbeat);

    socket.emit('stage:getState');

    return () => {
      socket.off('stage:stateReset', onStateReset);
      socket.off('stage:elementUpdated', onElementUpdated);
      socket.off('mqtt:heartbeat', onHeartbeat);
      Object.values(heartbeatTimers.current).forEach(clearTimeout);
    };
  }, [socket]);

  const updateElement = useCallback((category, id, changes) => {
    socket.emit('stage:updateElement', { category, id, changes });
  }, [socket]);

  const toggleElement = useCallback((category, id) => {
    socket.emit('stage:toggleElement', { category, id });
  }, [socket]);

  const resetAll = useCallback(() => {
    socket.emit('stage:resetAll');
  }, [socket]);

  return { stageState, isConnected, mqttHeartbeats, updateElement, toggleElement, resetAll };
}
