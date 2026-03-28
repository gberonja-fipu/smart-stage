import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

export function useStage() {
  const { socket, isConnected } = useSocket();
  const [stageState, setStageState] = useState(null);

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

    socket.on('stage:stateReset', onStateReset);
    socket.on('stage:elementUpdated', onElementUpdated);

    socket.emit('stage:getState');

    return () => {
      socket.off('stage:stateReset', onStateReset);
      socket.off('stage:elementUpdated', onElementUpdated);
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

  return { stageState, isConnected, updateElement, toggleElement, resetAll };
}
