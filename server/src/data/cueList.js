const { loadData, saveData } = require('../utils/storage');

const FILE = 'cuelists';

const DEFAULT_CUES = [
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

function _computeNextId(cues) {
  if (!cues.length) return 1;
  const max = Math.max(...cues.map(c => {
    const n = parseInt(String(c.id).replace(/\D/g, ''), 10);
    return isNaN(n) ? 0 : n;
  }));
  return max + 1;
}

class CueList {
  constructor() {
    const saved = loadData(FILE);
    this._cues = saved ? [...saved] : [...DEFAULT_CUES];
    this._nextId = _computeNextId(this._cues);
  }

  _save() {
    saveData(FILE, this._cues);
  }

  getCues() {
    return [...this._cues].sort((a, b) => a.timestamp - b.timestamp);
  }

  addCue(cue) {
    const newCue = { ...cue, id: `cue-${this._nextId++}` };
    this._cues.push(newCue);
    this._save();
    return newCue;
  }

  removeCue(id) {
    const before = this._cues.length;
    this._cues = this._cues.filter(c => c.id !== id);
    if (this._cues.length < before) this._save();
    return this._cues.length < before;
  }

  updateCue(id, changes) {
    const index = this._cues.findIndex(c => c.id === id);
    if (index === -1) return null;
    this._cues[index] = { ...this._cues[index], ...changes };
    this._save();
    return this._cues[index];
  }

  getCueById(id) {
    return this._cues.find(c => c.id === id) || null;
  }

  executeCue(cue) {
    return cue.actions || [];
  }

  // Zamijeni cijelu listu (koristi se pri importu)
  importCues(cues) {
    this._cues = [...cues];
    this._nextId = _computeNextId(this._cues);
    this._save();
  }
}

module.exports = { CueList };
