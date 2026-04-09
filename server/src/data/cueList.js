let _nextId = 1;

class CueList {
  constructor() {
    this._cues = [
      {
        id: 'cue-1',
        name: 'Otvaranje — rasvjeta',
        timestamp: 5,
        actions: [
          { category: 'lights', elementId: 'light-1', changes: { on: true, intensity: 80, color: '#ffe8c0' } },
          { category: 'lights', elementId: 'light-2', changes: { on: true, intensity: 80, color: '#ffe8c0' } },
        ],
      },
      {
        id: 'cue-2',
        name: 'Ulazak plesača',
        timestamp: 15,
        actions: [
          { category: 'lights', elementId: 'light-3', changes: { on: true, intensity: 70, color: '#ffffff' } },
          { category: 'lights', elementId: 'light-4', changes: { on: true, intensity: 70, color: '#ffffff' } },
          { category: 'leds',   elementId: 'led-1',   changes: { on: true, color: '#ff6600' } },
          { category: 'leds',   elementId: 'led-2',   changes: { on: true, color: '#ff6600' } },
        ],
      },
      {
        id: 'cue-3',
        name: 'Dim efekt',
        timestamp: 30,
        actions: [
          { category: 'smoke', elementId: 'smoke-1', changes: { on: true, intensity: 60 } },
        ],
      },
    ];
    _nextId = 4;
  }

  getCues() {
    return [...this._cues].sort((a, b) => a.timestamp - b.timestamp);
  }

  addCue(cue) {
    const newCue = { ...cue, id: `cue-${_nextId++}` };
    this._cues.push(newCue);
    return newCue;
  }

  removeCue(id) {
    const before = this._cues.length;
    this._cues = this._cues.filter(c => c.id !== id);
    return this._cues.length < before;
  }

  updateCue(id, changes) {
    const index = this._cues.findIndex(c => c.id === id);
    if (index === -1) return null;
    this._cues[index] = { ...this._cues[index], ...changes };
    return this._cues[index];
  }

  getCueById(id) {
    return this._cues.find(c => c.id === id) || null;
  }

  // Returns the actions array for the given cue (no side effects)
  executeCue(cue) {
    return cue.actions || [];
  }
}

module.exports = { CueList };
