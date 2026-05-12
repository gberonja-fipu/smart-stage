const net  = require('net');
const aedes = require('aedes');
const { logger } = require('../utils/logger');

const broker = aedes();
const server = net.createServer(broker.handle.bind(broker));

broker.on('client', (client) => {
  logger.debug(`[MQTT] Klijent spojen: ${client.id}`);
});

broker.on('clientDisconnect', (client) => {
  logger.debug(`[MQTT] Klijent odvojen: ${client.id}`);
});

broker.on('publish', (packet, client) => {
  if (client) {
    logger.debug(`[MQTT] Publish od ${client.id}: ${packet.topic}`);
  }
});

broker.on('error', (err) => {
  logger.error('[MQTT Broker] Greška:', err.message);
});

module.exports = { broker, server };
