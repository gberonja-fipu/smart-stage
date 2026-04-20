const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { getInitialState } = require('./data/stageElements');
const { getInitialPerformers } = require('./data/performers');
const { CueList } = require('./data/cueList');
const { CueEngine } = require('./engine/cueEngine');
const { TransitionEngine } = require('./engine/transitionEngine');
const { Setlist } = require('./data/setlist');
const { registerHandlers } = require('./socket/handlers');
const { server: mqttServer } = require('./mqtt/broker');
const { DeviceManager } = require('./mqtt/deviceManager');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const PORT = 3001;
const MQTT_PORT = 1883;

let stageState = getInitialState();
const performersRef = { list: getInitialPerformers() };
const deviceManager = new DeviceManager();
const cueList = new CueList();
const cueEngine = new CueEngine(cueList);
const transitionEngine = new TransitionEngine();
const setlistRef = { instance: new Setlist(), activeItemId: null };
// Stage Manager state — standby (sljedeći na redu) i zadnji okidani cue
const smRef = { standbyId: null, lastFiredId: null };

// Cue engine API shim — expose getCueList() so handlers can reach it
cueEngine.getCueList = () => cueList;

// ── TransitionEngine → Socket.IO wiring ───────────────────────────────────────

transitionEngine.on('transition:start', ({ id, durationMs }) => {
  io.emit('transition:start', { id, durationMs });
});

transitionEngine.on('transition:step', ({ id, updates, progress }) => {
  for (const { elementId, category, state } of updates) {
    const elements = stageState[category];
    if (!elements) continue;
    const index = elements.findIndex(el => el.id === elementId);
    if (index !== -1) {
      stageState[category][index] = { ...stageState[category][index], ...state };
      io.emit('stage:elementUpdated', { category, element: stageState[category][index] });
    }
  }
  io.emit('transition:progress', { id, progress });
});

transitionEngine.on('transition:complete', ({ id, updates }) => {
  // Sync final values to devices
  for (const { elementId, state } of updates) {
    deviceManager.sendCommand(elementId, state);
  }
  io.emit('transition:complete', { id });
});

// ── Cue engine → Socket.IO wiring ────────────────────────────────────────────

cueEngine.on('cue:executed', ({ cue, actions }) => {
  io.emit('cue:executed', { cueId: cue.id });

  for (const action of actions) {
    const elements = stageState[action.category];
    if (!elements) continue;
    const index = elements.findIndex(el => el.id === action.elementId);
    if (index === -1) continue;

    // If action carries a transition field, delegate to transitionEngine
    if (action.transition && action.transition.duration > 0) {
      const current = stageState[action.category][index];
      const fromState = {
        on: current.on,
        intensity: current.intensity ?? 0,
        color: current.color ?? '#000000',
      };
      transitionEngine.start(
        `cue-${cue.id}-${action.elementId}`,
        [{ elementId: action.elementId, category: action.category, fromState, toState: action.changes }],
        action.transition.duration,
        action.transition.easing || 'easeInOut',
      );
    } else {
      // Instant apply
      stageState[action.category][index] = { ...stageState[action.category][index], ...action.changes };
      io.emit('stage:elementUpdated', { category: action.category, element: stageState[action.category][index] });
      deviceManager.sendCommand(action.elementId, action.changes);
    }
  }
});

cueEngine.on('cue:timeUpdate', ({ currentTime }) => {
  io.emit('cue:timeUpdate', { currentTime });
});

cueEngine.on('cue:transportChange', (transportState) => {
  io.emit('cue:transportChange', transportState);
});

cueEngine.on('cue:finished', () => {
  io.emit('cue:finished');
});

// ── MQTT → Socket.IO wiring ───────────────────────────────────────────────────

deviceManager.on('heartbeat', ({ deviceId, timestamp }) => {
  io.emit('mqtt:heartbeat', { deviceId, timestamp });
});

deviceManager.on('statusUpdate', ({ deviceId, status }) => {
  for (const [category, elements] of Object.entries(stageState)) {
    const index = elements.findIndex(el => el.id === deviceId);
    if (index !== -1) {
      stageState[category][index] = { ...stageState[category][index], ...status };
      io.emit('stage:elementUpdated', { category, element: stageState[category][index] });
      break;
    }
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Pametna pozornica - server radi!' });
});

io.on('connection', (socket) => {
  console.log(`Klijent spojen: ${socket.id}`);
  registerHandlers(io, socket, stageState, deviceManager, performersRef, cueEngine, setlistRef, transitionEngine, smRef);
  socket.emit('stage:stateReset', stageState);
  socket.emit('stage:performersReset', performersRef.list);
  socket.emit('cue:listUpdated', cueList.getCues());
  socket.emit('cue:transportChange', cueEngine.getState());
  socket.emit('setlist:updated', setlistRef.instance.getItems());
  socket.emit('setlist:activeItem', setlistRef.activeItemId);

  socket.on('disconnect', () => {
    console.log(`Klijent odvojen: ${socket.id}`);
  });
});

// Pokreni MQTT broker, zatim inicijaliziraj uređaje i HTTP server
mqttServer.listen(MQTT_PORT, () => {
  console.log(`MQTT broker pokrenut na portu ${MQTT_PORT}`);
  deviceManager.initialize();
});

server.listen(PORT, () => {
  console.log(`Server pokrenut na http://localhost:${PORT}`);
});
