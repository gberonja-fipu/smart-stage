import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from './useSocket';

const MAX_ENTRIES = 200;

let _nextSeq = 1;
function makeEntry(type, message, meta = {}) {
  return { id: _nextSeq++, type, message, meta, ts: new Date() };
}

export function useEventLog({ presets = [], cueList = [], setlist = [] } = {}) {
  const { socket } = useSocket();
  const [entries, setEntries] = useState([]);

  const refs = useRef({ presets, cueList, setlist });
  refs.current = { presets, cueList, setlist };

  const push = useCallback((entry) => {
    setEntries(prev => {
      const next = [...prev, entry];
      return next.length > MAX_ENTRIES ? next.slice(next.length - MAX_ENTRIES) : next;
    });
  }, []);

  useEffect(() => {
    function onConnect() {
      push(makeEntry('system', 'Spojeno na server'));
    }
    function onDisconnect() {
      push(makeEntry('system', 'Odspojeno od servera'));
    }
    function onElementUpdated({ category, element }) {
      const state = element.on ? 'uključen' : 'isključen';
      push(makeEntry('element', `${element.name} ${state}`, { category, elementId: element.id }));
    }
    function onCueExecuted({ cueId }) {
      const cue = refs.current.cueList.find(c => c.id === cueId);
      push(makeEntry('cue', `Cue: ${cue?.name ?? cueId}`, { cueId }));
    }
    function onTransportChange({ isPlaying, currentTime }) {
      if (isPlaying) push(makeEntry('transport', 'Reprodukcija pokrenuta'));
      else push(makeEntry('transport', 'Reprodukcija pauzirana'));
    }
    function onCueFinished() {
      push(makeEntry('transport', 'Cue lista završena'));
    }
    function onPresetLoaded(presets) {
      push(makeEntry('preset', 'Preseti osvježeni'));
    }
    function onActiveItem(itemId) {
      if (!itemId) return;
      const item = refs.current.setlist.find(i => i.id === itemId);
      push(makeEntry('setlist', `Točka: ${item?.name ?? itemId}`, { itemId }));
    }
    function onHeartbeat({ deviceId }) {
      push(makeEntry('mqtt', `Heartbeat: ${deviceId}`, { deviceId }));
    }
    function onTransitionStart({ id, durationMs }) {
      push(makeEntry('transition', `Fade start (${(durationMs / 1000).toFixed(1)}s)`, { id }));
    }
    function onTransitionComplete({ id }) {
      push(makeEntry('transition', 'Fade završen', { id }));
    }

    socket.on('connect',                onConnect);
    socket.on('disconnect',             onDisconnect);
    socket.on('stage:elementUpdated',   onElementUpdated);
    socket.on('cue:executed',           onCueExecuted);
    socket.on('cue:transportChange',    onTransportChange);
    socket.on('cue:finished',           onCueFinished);
    socket.on('stage:presetsLoaded',    onPresetLoaded);
    socket.on('setlist:activeItem',     onActiveItem);
    socket.on('mqtt:heartbeat',         onHeartbeat);
    socket.on('transition:start',       onTransitionStart);
    socket.on('transition:complete',    onTransitionComplete);

    return () => {
      socket.off('connect',               onConnect);
      socket.off('disconnect',            onDisconnect);
      socket.off('stage:elementUpdated',  onElementUpdated);
      socket.off('cue:executed',          onCueExecuted);
      socket.off('cue:transportChange',   onTransportChange);
      socket.off('cue:finished',          onCueFinished);
      socket.off('stage:presetsLoaded',   onPresetLoaded);
      socket.off('setlist:activeItem',    onActiveItem);
      socket.off('mqtt:heartbeat',        onHeartbeat);
      socket.off('transition:start',      onTransitionStart);
      socket.off('transition:complete',   onTransitionComplete);
    };
  }, [socket, push]);

  function clearLog() {
    setEntries([]);
  }

  return { entries, clearLog };
}
