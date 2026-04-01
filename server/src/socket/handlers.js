const { getInitialState } = require('../data/stageElements');

function registerHandlers(io, socket, state, deviceManager) {
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
}

module.exports = { registerHandlers };
