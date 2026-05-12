const { getInitialState } = require('../data/stageElements');
const { getPresets, getPresetById, savePreset } = require('../data/presets');
const { logger } = require('../utils/logger');

// Default crossfade duration (ms) for setlist transitions
const CROSSFADE_DURATION_MS = 2000;

// ── Helpers ───────────────────────────────────────────────────────────────────

// Instantly apply a preset: snap performers + lights, broadcast, command devices
function applyPreset(io, state, deviceManager, performersRef, preset) {
  for (const [id, position] of Object.entries(preset.performerPositions)) {
    const index = performersRef.list.findIndex(p => p.id === id);
    if (index !== -1) performersRef.list[index] = { ...performersRef.list[index], position };
  }

  for (const [lightId, changes] of Object.entries(preset.lightPreset)) {
    const index = state.lights.findIndex(el => el.id === lightId);
    if (index !== -1) {
      state.lights[index] = { ...state.lights[index], ...changes };
      io.emit('stage:elementUpdated', { category: 'lights', element: state.lights[index] });
      deviceManager.sendCommand(lightId, changes);
    }
  }

  io.emit('stage:performersReset', performersRef.list);
  io.emit('stage:presetLoaded', preset.id);
  logger.info(`[PRESET] "${preset.name}" učitan`);
}

// Snap performer positions without touching lights (used during crossfade)
function applyPerformerPositions(io, performersRef, positionMap) {
  for (const [id, position] of Object.entries(positionMap)) {
    const index = performersRef.list.findIndex(p => p.id === id);
    if (index !== -1) performersRef.list[index] = { ...performersRef.list[index], position };
  }
  io.emit('stage:performersReset', performersRef.list);
}

// Start a crossfade from current light state to target preset's lights
function startCrossfade(io, state, performersRef, transitionEngine, preset, durationMs) {
  // Snap performers immediately (no visual animation needed for positions)
  applyPerformerPositions(io, performersRef, preset.performerPositions);
  io.emit('stage:presetLoaded', preset.id);

  // Crossfade lights via transitionEngine
  transitionEngine.crossfade(
    'setlist-crossfade',
    state.lights,
    preset.lightPreset,
    durationMs,
    'easeInOut',
  );
  logger.info(`[TRANSITION] Crossfade → "${preset.name}" (${durationMs}ms)`);
}

// ── registerHandlers ──────────────────────────────────────────────────────────

// Apply a single cue's actions directly to stage state (instant — no timeline)
function applyCueActions(io, state, deviceManager, transitionEngine, cue) {
  const actions = cue.actions || [];
  for (const action of actions) {
    const elements = state[action.category];
    if (!elements) continue;
    const index = elements.findIndex(el => el.id === action.elementId);
    if (index === -1) continue;

    if (action.transition && action.transition.duration > 0 && transitionEngine) {
      const current = elements[index];
      const fromState = { on: current.on, intensity: current.intensity ?? 0, color: current.color ?? '#000000' };
      transitionEngine.start(
        `sm-${cue.id}-${action.elementId}`,
        [{ elementId: action.elementId, category: action.category, fromState, toState: action.changes }],
        action.transition.duration,
        action.transition.easing || 'easeInOut',
      );
    } else {
      elements[index] = { ...elements[index], ...action.changes };
      io.emit('stage:elementUpdated', { category: action.category, element: elements[index] });
      deviceManager.sendCommand(action.elementId, action.changes);
    }
  }
}

function registerHandlers(io, socket, state, deviceManager, performersRef, cueEngine, setlistRef, transitionEngine, smRef) {
  // ── Stage state ────────────────────────────────────────────────────────────

  socket.on('stage:getState', () => {
    logger.info(`[${socket.id}] stage:getState`);
    socket.emit('stage:stateReset', state);
  });

  socket.on('stage:updateElement', ({ category, id, changes }) => {
    logger.info(`[${socket.id}] stage:updateElement — ${category}/${id}`, changes);

    const elements = state[category];
    if (!elements) return;

    const index = elements.findIndex(el => el.id === id);
    if (index === -1) return;

    elements[index] = { ...elements[index], ...changes };
    io.emit('stage:elementUpdated', { category, element: elements[index] });
    deviceManager.sendCommand(id, changes);
  });

  socket.on('stage:toggleElement', ({ category, id }) => {
    logger.info(`[${socket.id}] stage:toggleElement — ${category}/${id}`);

    const elements = state[category];
    if (!elements) return;

    const index = elements.findIndex(el => el.id === id);
    if (index === -1) return;

    elements[index] = { ...elements[index], on: !elements[index].on };
    io.emit('stage:elementUpdated', { category, element: elements[index] });
    deviceManager.sendCommand(id, { on: elements[index].on });
  });

  socket.on('stage:resetAll', () => {
    logger.info(`[${socket.id}] stage:resetAll`);
    transitionEngine.cancelAll();

    const fresh = getInitialState();
    Object.keys(state).forEach(key => delete state[key]);
    Object.assign(state, fresh);

    io.emit('stage:stateReset', state);
    deviceManager.resetAll();
  });

  // ── Performers ────────────────────────────────────────────────────────────

  socket.on('stage:getPerformers', () => {
    logger.info(`[${socket.id}] stage:getPerformers`);
    socket.emit('stage:performersReset', performersRef.list);
  });

  socket.on('stage:updatePerformerPosition', ({ id, position }) => {
    logger.info(`[${socket.id}] stage:updatePerformerPosition — ${id}`, position);

    const index = performersRef.list.findIndex(p => p.id === id);
    if (index === -1) return;

    performersRef.list[index] = { ...performersRef.list[index], position };
    io.emit('stage:performerMoved', { id, position });
  });

  // ── Presets ───────────────────────────────────────────────────────────────

  socket.on('stage:getPresets', () => {
    logger.info(`[${socket.id}] stage:getPresets`);
    socket.emit('stage:presetsLoaded', getPresets());
  });

  socket.on('stage:loadPreset', ({ presetId }) => {
    logger.info(`[${socket.id}] stage:loadPreset — ${presetId}`);
    const preset = getPresetById(presetId);
    if (!preset) return;
    applyPreset(io, state, deviceManager, performersRef, preset);
  });

  socket.on('stage:savePreset', ({ name, description }) => {
    logger.info(`[${socket.id}] stage:savePreset — "${name}"`);

    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const performerPositions = {};
    performersRef.list.forEach(p => { performerPositions[p.id] = p.position; });

    const lightPreset = {};
    state.lights.forEach(l => { lightPreset[l.id] = { on: l.on, intensity: l.intensity, color: l.color }; });

    const newPreset = { id, name, description: description || '', performerPositions, lightPreset };
    savePreset(newPreset);

    io.emit('stage:presetsLoaded', getPresets());
    logger.info(`[PRESET] "${name}" spremljen`);
  });

  // ── Cue list ───────────────────────────────────────────────────────────────

  socket.on('cue:getList', () => {
    logger.info(`[${socket.id}] cue:getList`);
    socket.emit('cue:listUpdated', cueEngine.getCueList().getCues());
    socket.emit('cue:transportChange', cueEngine.getState());
  });

  socket.on('cue:add', (cueData) => {
    logger.info(`[${socket.id}] cue:add — "${cueData.name}"`);
    const newCue = cueEngine.getCueList().addCue(cueData);
    io.emit('cue:listUpdated', cueEngine.getCueList().getCues());
    void newCue;
  });

  socket.on('cue:remove', ({ id }) => {
    logger.info(`[${socket.id}] cue:remove — ${id}`);
    cueEngine.getCueList().removeCue(id);
    io.emit('cue:listUpdated', cueEngine.getCueList().getCues());
  });

  socket.on('cue:update', ({ id, changes }) => {
    logger.info(`[${socket.id}] cue:update — ${id}`);
    const updated = cueEngine.getCueList().updateCue(id, changes);
    if (updated) io.emit('cue:listUpdated', cueEngine.getCueList().getCues());
  });

  socket.on('cue:play',  () => { cueEngine.play(); });
  socket.on('cue:pause', () => { cueEngine.pause(); });
  socket.on('cue:stop',  () => { cueEngine.stop(); });
  socket.on('cue:seek',  ({ time }) => { cueEngine.seek(time); });

  // ── Setlist ────────────────────────────────────────────────────────────────

  socket.on('setlist:get', () => {
    logger.info(`[${socket.id}] setlist:get`);
    socket.emit('setlist:updated', setlistRef.instance.getItems());
    socket.emit('setlist:activeItem', setlistRef.activeItemId);
  });

  socket.on('setlist:add', (itemData) => {
    logger.info(`[${socket.id}] setlist:add — "${itemData.name}"`);
    const newItem = setlistRef.instance.addItem(itemData);
    io.emit('setlist:updated', setlistRef.instance.getItems());
    void newItem;
  });

  socket.on('setlist:remove', ({ id }) => {
    logger.info(`[${socket.id}] setlist:remove — ${id}`);
    if (setlistRef.activeItemId === id) setlistRef.activeItemId = null;
    setlistRef.instance.removeItem(id);
    io.emit('setlist:updated', setlistRef.instance.getItems());
    io.emit('setlist:activeItem', setlistRef.activeItemId);
  });

  socket.on('setlist:reorder', ({ orderedIds }) => {
    logger.info(`[${socket.id}] setlist:reorder`);
    setlistRef.instance.reorderItems(orderedIds);
    io.emit('setlist:updated', setlistRef.instance.getItems());
  });

  // instant: true → odmah primijeni preset bez fade efekta
  socket.on('setlist:loadItem', ({ id, instant = false }) => {
    logger.info(`[${socket.id}] setlist:loadItem — ${id} (instant=${instant})`);
    const item = setlistRef.instance.getItemById(id);
    if (!item) return;

    setlistRef.activeItemId = id;
    io.emit('setlist:activeItem', id);

    if (!item.presetId) return;
    const preset = getPresetById(item.presetId);
    if (!preset) return;

    if (instant) {
      applyPreset(io, state, deviceManager, performersRef, preset);
      logger.info(`[SETLIST] Instant load "${preset.name}" za "${item.name}"`);
    } else {
      startCrossfade(io, state, performersRef, transitionEngine, preset, CROSSFADE_DURATION_MS);
      logger.info(`[SETLIST] Crossfade "${preset.name}" za "${item.name}"`);
    }
  });

  socket.on('setlist:next', ({ instant = false } = {}) => {
    logger.info(`[${socket.id}] setlist:next (instant=${instant})`);
    const items = setlistRef.instance.getItems();
    if (items.length === 0) return;

    const currentIndex = setlistRef.activeItemId
      ? items.findIndex(i => i.id === setlistRef.activeItemId)
      : -1;

    const nextIndex = currentIndex + 1 < items.length ? currentIndex + 1 : 0;
    const nextItem  = items[nextIndex];

    setlistRef.activeItemId = nextItem.id;
    io.emit('setlist:activeItem', nextItem.id);

    if (!nextItem.presetId) return;
    const preset = getPresetById(nextItem.presetId);
    if (!preset) return;

    if (instant) {
      applyPreset(io, state, deviceManager, performersRef, preset);
    } else {
      startCrossfade(io, state, performersRef, transitionEngine, preset, CROSSFADE_DURATION_MS);
    }
  });

  socket.on('setlist:prev', ({ instant = false } = {}) => {
    logger.info(`[${socket.id}] setlist:prev (instant=${instant})`);
    const items = setlistRef.instance.getItems();
    if (items.length === 0) return;

    const currentIndex = setlistRef.activeItemId
      ? items.findIndex(i => i.id === setlistRef.activeItemId)
      : 0;

    const prevIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : items.length - 1;
    const prevItem  = items[prevIndex];

    setlistRef.activeItemId = prevItem.id;
    io.emit('setlist:activeItem', prevItem.id);

    if (!prevItem.presetId) return;
    const preset = getPresetById(prevItem.presetId);
    if (!preset) return;

    if (instant) {
      applyPreset(io, state, deviceManager, performersRef, preset);
    } else {
      startCrossfade(io, state, performersRef, transitionEngine, preset, CROSSFADE_DURATION_MS);
    }
  });

  // ── Stage Manager ─────────────────────────────────────────────────────────

  socket.on('stageManager:getState', () => {
    logger.info(`[${socket.id}] stageManager:getState`);
    socket.emit('stageManager:state', { standbyId: smRef.standbyId, lastFiredId: smRef.lastFiredId });
  });

  // GO — okida standby cue (ili prvi/sljedeći ako standby nije postavljen)
  socket.on('stageManager:go', () => {
    logger.info(`[${socket.id}] stageManager:go`);
    const cues = cueEngine.getCueList().getCues(); // sorted by timestamp
    if (cues.length === 0) return;

    // Odredi koji cue okidamo
    let targetCue = null;
    if (smRef.standbyId) {
      targetCue = cues.find(c => c.id === smRef.standbyId) || null;
    }
    if (!targetCue) {
      const lastIdx = smRef.lastFiredId ? cues.findIndex(c => c.id === smRef.lastFiredId) : -1;
      targetCue = lastIdx + 1 < cues.length ? cues[lastIdx + 1] : null;
    }
    if (!targetCue) {
      logger.info('[SM] Nema više cueova za okidanje');
      return;
    }

    // Primijeni akcije
    applyCueActions(io, state, deviceManager, transitionEngine, targetCue);
    io.emit('cue:executed', { cueId: targetCue.id });
    logger.info(`[SM] GO — "${targetCue.name}"`);

    // Pomakni pokazivač
    smRef.lastFiredId = targetCue.id;
    const firedIdx = cues.findIndex(c => c.id === targetCue.id);
    smRef.standbyId = firedIdx + 1 < cues.length ? cues[firedIdx + 1].id : null;

    io.emit('stageManager:state', { standbyId: smRef.standbyId, lastFiredId: smRef.lastFiredId });
  });

  // STANDBY — ručno postavi koji cue je sljedeći na redu
  socket.on('stageManager:standby', ({ cueId }) => {
    logger.info(`[${socket.id}] stageManager:standby — ${cueId}`);
    smRef.standbyId = cueId || null;
    io.emit('stageManager:state', { standbyId: smRef.standbyId, lastFiredId: smRef.lastFiredId });
  });

  // HOLD — pauzira cue engine (timeline playback)
  socket.on('stageManager:hold', () => {
    logger.info(`[${socket.id}] stageManager:hold`);
    cueEngine.pause();
    io.emit('stageManager:held');
  });

  // RESET SM — vraća pokazivač na početak
  socket.on('stageManager:reset', () => {
    logger.info(`[${socket.id}] stageManager:reset`);
    smRef.standbyId = null;
    smRef.lastFiredId = null;
    const cues = cueEngine.getCueList().getCues();
    if (cues.length > 0) smRef.standbyId = cues[0].id;
    io.emit('stageManager:state', { standbyId: smRef.standbyId, lastFiredId: smRef.lastFiredId });
  });
}

module.exports = { registerHandlers };
