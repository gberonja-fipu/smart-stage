const { getInitialState } = require('../data/stageElements');
const { getPresets, getPresetById, savePreset } = require('../data/presets');

// Shared helper — applies a preset to stage state and broadcasts results
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
  console.log(`[PRESET] "${preset.name}" učitan`);
}

function registerHandlers(io, socket, state, deviceManager, performersRef, cueEngine, setlistRef) {
  // ── Stage state ────────────────────────────────────────────────────────────

  socket.on('stage:getState', () => {
    console.log(`[${socket.id}] stage:getState`);
    socket.emit('stage:stateReset', state);
  });

  socket.on('stage:updateElement', ({ category, id, changes }) => {
    console.log(`[${socket.id}] stage:updateElement — ${category}/${id}`, changes);

    const elements = state[category];
    if (!elements) return;

    const index = elements.findIndex(el => el.id === id);
    if (index === -1) return;

    elements[index] = { ...elements[index], ...changes };
    io.emit('stage:elementUpdated', { category, element: elements[index] });

    deviceManager.sendCommand(id, changes);
  });

  socket.on('stage:toggleElement', ({ category, id }) => {
    console.log(`[${socket.id}] stage:toggleElement — ${category}/${id}`);

    const elements = state[category];
    if (!elements) return;

    const index = elements.findIndex(el => el.id === id);
    if (index === -1) return;

    elements[index] = { ...elements[index], on: !elements[index].on };
    io.emit('stage:elementUpdated', { category, element: elements[index] });

    deviceManager.sendCommand(id, { on: elements[index].on });
  });

  socket.on('stage:resetAll', () => {
    console.log(`[${socket.id}] stage:resetAll`);

    const fresh = getInitialState();
    Object.keys(state).forEach(key => delete state[key]);
    Object.assign(state, fresh);

    io.emit('stage:stateReset', state);

    deviceManager.resetAll();
  });

  // ── Performers ────────────────────────────────────────────────────────────

  socket.on('stage:getPerformers', () => {
    console.log(`[${socket.id}] stage:getPerformers`);
    socket.emit('stage:performersReset', performersRef.list);
  });

  socket.on('stage:updatePerformerPosition', ({ id, position }) => {
    console.log(`[${socket.id}] stage:updatePerformerPosition — ${id}`, position);

    const index = performersRef.list.findIndex(p => p.id === id);
    if (index === -1) return;

    performersRef.list[index] = { ...performersRef.list[index], position };
    io.emit('stage:performerMoved', { id, position });
  });

  // ── Presets ───────────────────────────────────────────────────────────────

  socket.on('stage:getPresets', () => {
    console.log(`[${socket.id}] stage:getPresets`);
    socket.emit('stage:presetsLoaded', getPresets());
  });

  socket.on('stage:loadPreset', ({ presetId }) => {
    console.log(`[${socket.id}] stage:loadPreset — ${presetId}`);

    const preset = getPresetById(presetId);
    if (!preset) return;

    applyPreset(io, state, deviceManager, performersRef, preset);
  });

  socket.on('stage:savePreset', ({ name, description }) => {
    console.log(`[${socket.id}] stage:savePreset — "${name}"`);

    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const performerPositions = {};
    performersRef.list.forEach(p => {
      performerPositions[p.id] = p.position;
    });

    const lightPreset = {};
    state.lights.forEach(l => {
      lightPreset[l.id] = { on: l.on, intensity: l.intensity, color: l.color };
    });

    const newPreset = { id, name, description: description || '', performerPositions, lightPreset };
    savePreset(newPreset);

    io.emit('stage:presetsLoaded', getPresets());
    console.log(`[PRESET] "${name}" spremljen`);
  });

  // ── Cue list ───────────────────────────────────────────────────────────────

  socket.on('cue:getList', () => {
    console.log(`[${socket.id}] cue:getList`);
    socket.emit('cue:listUpdated', cueEngine.getCueList().getCues());
    socket.emit('cue:transportChange', cueEngine.getState());
  });

  socket.on('cue:add', (cueData) => {
    console.log(`[${socket.id}] cue:add — "${cueData.name}"`);
    const newCue = cueEngine.getCueList().addCue(cueData);
    io.emit('cue:listUpdated', cueEngine.getCueList().getCues());
    void newCue;
  });

  socket.on('cue:remove', ({ id }) => {
    console.log(`[${socket.id}] cue:remove — ${id}`);
    cueEngine.getCueList().removeCue(id);
    io.emit('cue:listUpdated', cueEngine.getCueList().getCues());
  });

  socket.on('cue:update', ({ id, changes }) => {
    console.log(`[${socket.id}] cue:update — ${id}`);
    const updated = cueEngine.getCueList().updateCue(id, changes);
    if (updated) io.emit('cue:listUpdated', cueEngine.getCueList().getCues());
  });

  socket.on('cue:play',  () => { cueEngine.play(); });
  socket.on('cue:pause', () => { cueEngine.pause(); });
  socket.on('cue:stop',  () => { cueEngine.stop(); });
  socket.on('cue:seek',  ({ time }) => { cueEngine.seek(time); });

  // ── Setlist ────────────────────────────────────────────────────────────────

  socket.on('setlist:get', () => {
    console.log(`[${socket.id}] setlist:get`);
    socket.emit('setlist:updated', setlistRef.instance.getItems());
    socket.emit('setlist:activeItem', setlistRef.activeItemId);
  });

  socket.on('setlist:add', (itemData) => {
    console.log(`[${socket.id}] setlist:add — "${itemData.name}"`);
    const newItem = setlistRef.instance.addItem(itemData);
    io.emit('setlist:updated', setlistRef.instance.getItems());
    void newItem;
  });

  socket.on('setlist:remove', ({ id }) => {
    console.log(`[${socket.id}] setlist:remove — ${id}`);
    if (setlistRef.activeItemId === id) setlistRef.activeItemId = null;
    setlistRef.instance.removeItem(id);
    io.emit('setlist:updated', setlistRef.instance.getItems());
    io.emit('setlist:activeItem', setlistRef.activeItemId);
  });

  socket.on('setlist:reorder', ({ orderedIds }) => {
    console.log(`[${socket.id}] setlist:reorder`);
    setlistRef.instance.reorderItems(orderedIds);
    io.emit('setlist:updated', setlistRef.instance.getItems());
  });

  socket.on('setlist:loadItem', ({ id }) => {
    console.log(`[${socket.id}] setlist:loadItem — ${id}`);
    const item = setlistRef.instance.getItemById(id);
    if (!item) return;

    setlistRef.activeItemId = id;
    io.emit('setlist:activeItem', id);

    if (item.presetId) {
      const preset = getPresetById(item.presetId);
      if (preset) {
        applyPreset(io, state, deviceManager, performersRef, preset);
        console.log(`[SETLIST] Preset "${preset.name}" učitan za točku "${item.name}"`);
      }
    }
  });

  socket.on('setlist:next', () => {
    console.log(`[${socket.id}] setlist:next`);
    const items = setlistRef.instance.getItems();
    if (items.length === 0) return;

    const currentIndex = setlistRef.activeItemId
      ? items.findIndex(i => i.id === setlistRef.activeItemId)
      : -1;

    const nextIndex = currentIndex + 1 < items.length ? currentIndex + 1 : 0;
    const nextItem = items[nextIndex];

    setlistRef.activeItemId = nextItem.id;
    io.emit('setlist:activeItem', nextItem.id);

    if (nextItem.presetId) {
      const preset = getPresetById(nextItem.presetId);
      if (preset) applyPreset(io, state, deviceManager, performersRef, preset);
    }
  });

  socket.on('setlist:prev', () => {
    console.log(`[${socket.id}] setlist:prev`);
    const items = setlistRef.instance.getItems();
    if (items.length === 0) return;

    const currentIndex = setlistRef.activeItemId
      ? items.findIndex(i => i.id === setlistRef.activeItemId)
      : 0;

    const prevIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : items.length - 1;
    const prevItem = items[prevIndex];

    setlistRef.activeItemId = prevItem.id;
    io.emit('setlist:activeItem', prevItem.id);

    if (prevItem.presetId) {
      const preset = getPresetById(prevItem.presetId);
      if (preset) applyPreset(io, state, deviceManager, performersRef, preset);
    }
  });
}

module.exports = { registerHandlers };
