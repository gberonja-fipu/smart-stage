import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';

export function useStage() {
  const { socket, isConnected } = useSocket();

  // Stage & MQTT
  const [stageState, setStageState] = useState(null);
  const [mqttHeartbeats, setMqttHeartbeats] = useState({});
  const heartbeatTimers = useRef({});

  // Performers & presets
  const [performers, setPerformers] = useState([]);
  const [presets, setPresets] = useState([]);
  const [activePresetId, setActivePresetId] = useState(null);

  // Cue lista & transport
  const [cueList, setCueList] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeCueId, setActiveCueId] = useState(null);

  // Setlista
  const [setlist, setSetlist] = useState([]);
  const [activeSetlistItemId, setActiveSetlistItemId] = useState(null);

  useEffect(() => {
    // ── Stage state ──────────────────────────────────────────────────────────
    function onStateReset(state) { setStageState(state); }

    function onElementUpdated({ category, element }) {
      setStageState(prev => {
        if (!prev) return prev;
        return { ...prev, [category]: prev[category].map(el => el.id === element.id ? element : el) };
      });
    }

    // ── Performers & presets ─────────────────────────────────────────────────
    function onPerformersReset(list) { setPerformers(list); }
    function onPerformerMoved({ id, position }) {
      setPerformers(prev => prev.map(p => p.id === id ? { ...p, position } : p));
    }
    function onPresetsLoaded(list) { setPresets(list); }
    function onPresetLoaded(id) { setActivePresetId(id); }

    // ── Cue lista ────────────────────────────────────────────────────────────
    function onCueListUpdated(list) { setCueList(list); }
    function onCueExecuted({ cueId }) { setActiveCueId(cueId); }
    function onCueTimeUpdate({ currentTime: t }) { setCurrentTime(t); }
    function onCueTransportChange({ isPlaying: playing, currentTime: t }) {
      setIsPlaying(playing);
      setCurrentTime(t);
    }
    function onCueFinished() {
      setIsPlaying(false);
      setActiveCueId(null);
    }

    // ── Setlista ─────────────────────────────────────────────────────────────
    function onSetlistUpdated(items) { setSetlist(items); }
    function onSetlistActiveItem(id) { setActiveSetlistItemId(id); }

    // ── MQTT heartbeat ───────────────────────────────────────────────────────
    function onHeartbeat({ deviceId }) {
      setMqttHeartbeats(prev => ({ ...prev, [deviceId]: true }));
      if (heartbeatTimers.current[deviceId]) clearTimeout(heartbeatTimers.current[deviceId]);
      heartbeatTimers.current[deviceId] = setTimeout(() => {
        setMqttHeartbeats(prev => ({ ...prev, [deviceId]: false }));
      }, 12000);
    }

    socket.on('stage:stateReset', onStateReset);
    socket.on('stage:elementUpdated', onElementUpdated);
    socket.on('stage:performersReset', onPerformersReset);
    socket.on('stage:performerMoved', onPerformerMoved);
    socket.on('stage:presetsLoaded', onPresetsLoaded);
    socket.on('stage:presetLoaded', onPresetLoaded);
    socket.on('cue:listUpdated', onCueListUpdated);
    socket.on('cue:executed', onCueExecuted);
    socket.on('cue:timeUpdate', onCueTimeUpdate);
    socket.on('cue:transportChange', onCueTransportChange);
    socket.on('cue:finished', onCueFinished);
    socket.on('mqtt:heartbeat', onHeartbeat);
    socket.on('setlist:updated', onSetlistUpdated);
    socket.on('setlist:activeItem', onSetlistActiveItem);

    socket.emit('stage:getState');
    socket.emit('stage:getPerformers');
    socket.emit('stage:getPresets');
    socket.emit('cue:getList');
    socket.emit('setlist:get');

    return () => {
      socket.off('stage:stateReset', onStateReset);
      socket.off('stage:elementUpdated', onElementUpdated);
      socket.off('stage:performersReset', onPerformersReset);
      socket.off('stage:performerMoved', onPerformerMoved);
      socket.off('stage:presetsLoaded', onPresetsLoaded);
      socket.off('stage:presetLoaded', onPresetLoaded);
      socket.off('cue:listUpdated', onCueListUpdated);
      socket.off('cue:executed', onCueExecuted);
      socket.off('cue:timeUpdate', onCueTimeUpdate);
      socket.off('cue:transportChange', onCueTransportChange);
      socket.off('cue:finished', onCueFinished);
      socket.off('mqtt:heartbeat', onHeartbeat);
      socket.off('setlist:updated', onSetlistUpdated);
      socket.off('setlist:activeItem', onSetlistActiveItem);
      Object.values(heartbeatTimers.current).forEach(clearTimeout);
    };
  }, [socket]);

  // ── Stage actions ──────────────────────────────────────────────────────────
  const updateElement = useCallback((category, id, changes) => {
    socket.emit('stage:updateElement', { category, id, changes });
  }, [socket]);

  const toggleElement = useCallback((category, id) => {
    socket.emit('stage:toggleElement', { category, id });
  }, [socket]);

  const resetAll = useCallback(() => {
    socket.emit('stage:resetAll');
  }, [socket]);

  // ── Performer actions ──────────────────────────────────────────────────────
  const updatePerformerPosition = useCallback((id, position) => {
    setPerformers(prev => prev.map(p => p.id === id ? { ...p, position } : p));
    socket.emit('stage:updatePerformerPosition', { id, position });
  }, [socket]);

  // ── Preset actions ─────────────────────────────────────────────────────────
  const loadPreset = useCallback((presetId) => {
    socket.emit('stage:loadPreset', { presetId });
  }, [socket]);

  const savePreset = useCallback((name, description) => {
    socket.emit('stage:savePreset', { name, description });
  }, [socket]);

  // ── Cue actions ────────────────────────────────────────────────────────────
  const addCue = useCallback((cueData) => {
    socket.emit('cue:add', cueData);
  }, [socket]);

  const removeCue = useCallback((id) => {
    socket.emit('cue:remove', { id });
  }, [socket]);

  const updateCue = useCallback((id, changes) => {
    socket.emit('cue:update', { id, changes });
  }, [socket]);

  const playCues = useCallback(() => { socket.emit('cue:play'); }, [socket]);
  const pauseCues = useCallback(() => { socket.emit('cue:pause'); }, [socket]);
  const stopCues = useCallback(() => { socket.emit('cue:stop'); }, [socket]);
  const seekCues = useCallback((time) => { socket.emit('cue:seek', { time }); }, [socket]);

  // ── Setlist actions ────────────────────────────────────────────────────────
  const loadSetlistItem = useCallback((id) => {
    socket.emit('setlist:loadItem', { id });
  }, [socket]);

  const nextItem = useCallback(() => {
    socket.emit('setlist:next');
  }, [socket]);

  const prevItem = useCallback(() => {
    socket.emit('setlist:prev');
  }, [socket]);

  const addSetlistItem = useCallback((itemData) => {
    socket.emit('setlist:add', itemData);
  }, [socket]);

  const removeSetlistItem = useCallback((id) => {
    socket.emit('setlist:remove', { id });
  }, [socket]);

  const reorderSetlist = useCallback((orderedIds) => {
    socket.emit('setlist:reorder', { orderedIds });
  }, [socket]);

  return {
    // Stage
    stageState, isConnected, mqttHeartbeats,
    updateElement, toggleElement, resetAll,
    // Performers
    performers, updatePerformerPosition,
    // Presets
    presets, activePresetId, loadPreset, savePreset,
    // Cues
    cueList, isPlaying, currentTime, activeCueId,
    addCue, removeCue, updateCue,
    playCues, pauseCues, stopCues, seekCues,
    // Setlista
    setlist, activeSetlistItemId,
    loadSetlistItem, nextItem, prevItem,
    addSetlistItem, removeSetlistItem, reorderSetlist,
  };
}
