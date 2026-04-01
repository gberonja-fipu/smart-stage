const mqtt = require('mqtt');

class DeviceSimulator {
  constructor(element) {
    this.id = element.id;
    this.type = element.type;
    this.state = { ...element };
    this.client = null;
    this._heartbeatInterval = null;
    this._connect();
  }

  _connect() {
    this.client = mqtt.connect('mqtt://localhost:1883', {
      clientId: `device-${this.id}`,
      reconnectPeriod: 1000,
    });

    this.client.on('connect', () => {
      this.client.subscribe(`stage/command/${this.id}`, (err) => {
        if (!err) {
          console.log(`[Device ${this.id}] Subscribed: stage/command/${this.id}`);
        }
      });
      this._startHeartbeat();
    });

    this.client.on('message', (topic, message) => {
      if (topic === `stage/command/${this.id}`) {
        try {
          const command = JSON.parse(message.toString());
          this._handleCommand(command);
        } catch (e) {
          console.error(`[Device ${this.id}] Greška pri parsiranju komande:`, e.message);
        }
      }
    });

    this.client.on('error', (err) => {
      console.error(`[Device ${this.id}] MQTT greška:`, err.message);
    });
  }

  _handleCommand(command) {
    console.log(`[Device ${this.id}] Komanda primljena:`, command);
    this.state = { ...this.state, ...command };
    this._publishStatus();
  }

  _publishStatus() {
    if (this.client && this.client.connected) {
      this.client.publish(`stage/status/${this.id}`, JSON.stringify(this.state));
    }
  }

  _startHeartbeat() {
    if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);
    this._heartbeatInterval = setInterval(() => {
      if (this.client && this.client.connected) {
        const payload = JSON.stringify({ deviceId: this.id, timestamp: Date.now() });
        this.client.publish(`stage/heartbeat/${this.id}`, payload);
      }
    }, 5000);
  }

  sendCommand(command) {
    if (this.client && this.client.connected) {
      this.client.publish(`stage/command/${this.id}`, JSON.stringify(command));
    } else {
      console.warn(`[Device ${this.id}] Nije spojen, komanda ignorirana`);
    }
  }

  destroy() {
    if (this._heartbeatInterval) clearInterval(this._heartbeatInterval);
    if (this.client) this.client.end(true);
  }
}

module.exports = { DeviceSimulator };
