const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { getInitialState } = require('./data/stageElements');
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
const deviceManager = new DeviceManager();

// MQTT → Socket.IO wiring
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
  registerHandlers(io, socket, stageState, deviceManager);
  socket.emit('stage:stateReset', stageState);

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
