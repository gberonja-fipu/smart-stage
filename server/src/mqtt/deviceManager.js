const EventEmitter = require('events');
const mqtt = require('mqtt');
const { getInitialState } = require('../data/stageElements');
const { DeviceSimulator } = require('./deviceSimulator');

class DeviceManager extends EventEmitter {
  constructor() {
    super();
    this.devices = new Map();   // deviceId -> DeviceSimulator
    this.statuses = new Map();  // deviceId -> last known status
    this._managerClient = null;
  }

  initialize() {
    const state = getInitialState();
    const allElements = Object.values(state).flat();

    for (const element of allElements) {
      const simulator = new DeviceSimulator(element);
      this.devices.set(element.id, simulator);
    }

    this._managerClient = mqtt.connect('mqtt://localhost:1883', {
      clientId: 'device-manager',
      reconnectPeriod: 1000,
    });

    this._managerClient.on('connect', () => {
      this._managerClient.subscribe('stage/status/#');
      this._managerClient.subscribe('stage/heartbeat/#');
      console.log('[DeviceManager] Spojen na MQTT broker');
    });

    this._managerClient.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        if (topic.startsWith('stage/status/')) {
          const deviceId = topic.split('/')[2];
          this.statuses.set(deviceId, payload);
          this.emit('statusUpdate', { deviceId, status: payload });
        } else if (topic.startsWith('stage/heartbeat/')) {
          const deviceId = topic.split('/')[2];
          this.emit('heartbeat', { deviceId, timestamp: payload.timestamp });
        }
      } catch (e) {
        console.error('[DeviceManager] Greška pri parsiranju poruke:', e.message);
      }
    });

    this._managerClient.on('error', (err) => {
      console.error('[DeviceManager] MQTT greška:', err.message);
    });
  }

  sendCommand(deviceId, command) {
    const device = this.devices.get(deviceId);
    if (device) {
      device.sendCommand(command);
    } else {
      console.warn(`[DeviceManager] Uređaj ${deviceId} nije pronađen`);
    }
  }

  getDeviceStatus(deviceId) {
    return this.statuses.get(deviceId) || null;
  }

  resetAll() {
    const freshState = getInitialState();
    const allElements = Object.values(freshState).flat();
    for (const element of allElements) {
      this.sendCommand(element.id, element);
    }
  }
}

module.exports = { DeviceManager };
