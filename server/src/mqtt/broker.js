const { Aedes } = require('aedes');
const aedes = new Aedes();
const { createServer } = require('aedes-server-factory');

const server = createServer(aedes);

aedes.on('client', (client) => {
  console.log(`[MQTT] Klijent spojen: ${client.id}`);
});

aedes.on('clientDisconnect', (client) => {
  console.log(`[MQTT] Klijent odvojen: ${client.id}`);
});

aedes.on('publish', (packet, client) => {
  if (client) {
    console.log(`[MQTT] Publish od ${client.id}: ${packet.topic}`);
  }
});

module.exports = { broker: aedes, server };
