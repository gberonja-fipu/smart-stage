const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { getInitialState } = require('./data/stageElements');
const { registerHandlers } = require('./socket/handlers');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const PORT = 3001;

let stageState = getInitialState();

app.get('/', (req, res) => {
  res.json({ message: 'Pametna pozornica - server radi!' });
});

io.on('connection', (socket) => {
  console.log(`Klijent spojen: ${socket.id}`);

  registerHandlers(io, socket, stageState);

  socket.emit('stage:stateReset', stageState);

  socket.on('disconnect', () => {
    console.log(`Klijent odvojen: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server pokrenut na http://localhost:${PORT}`);
});
