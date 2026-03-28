function getInitialState() {
  return {
    lights: [
      { id: 'light-1', name: 'Reflektor Front L', type: 'light', on: false, intensity: 100, color: '#ffffff', position: { x: 10, y: 10 } },
      { id: 'light-2', name: 'Reflektor Front D', type: 'light', on: false, intensity: 100, color: '#ffffff', position: { x: 90, y: 10 } },
      { id: 'light-3', name: 'Reflektor Stražnje L', type: 'light', on: false, intensity: 100, color: '#ffffff', position: { x: 10, y: 90 } },
      { id: 'light-4', name: 'Reflektor Stražnje D', type: 'light', on: false, intensity: 100, color: '#ffffff', position: { x: 90, y: 90 } },
    ],
    smoke: [
      { id: 'smoke-1', name: 'Dimna mašina', type: 'smoke', on: false, intensity: 50 },
    ],
    leds: [
      { id: 'led-1', name: 'LED bar L', type: 'led', on: false, color: '#ff0000', mode: 'static' },
      { id: 'led-2', name: 'LED bar D', type: 'led', on: false, color: '#ff0000', mode: 'static' },
    ],
    speakers: [
      { id: 'speaker-1', name: 'Zvučnik glavni', type: 'speaker', on: true, volume: 75, zone: 'main' },
      { id: 'speaker-2', name: 'Zvučnik monitor', type: 'speaker', on: true, volume: 75, zone: 'monitor' },
    ],
  };
}

module.exports = { getInitialState };
