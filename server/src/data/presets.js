const presets = [
  {
    id: 'slavonija',
    name: 'Slavonija',
    description: 'Plesači u dva reda, orkestar lijevo',
    performerPositions: {
      // Orkestar — lijevo uz rub
      'orch-1': { x: 8,  y: 80 }, 'orch-2': { x: 8,  y: 68 },
      'orch-3': { x: 8,  y: 56 }, 'orch-4': { x: 8,  y: 44 },
      'orch-5': { x: 8,  y: 32 }, 'orch-6': { x: 8,  y: 20 },
      'orch-7': { x: 8,  y: 8  },
      // Plesači — dva reda po sredini
      'dance-1a': { x: 30, y: 65 }, 'dance-1b': { x: 37, y: 65 },
      'dance-2a': { x: 44, y: 65 }, 'dance-2b': { x: 51, y: 65 },
      'dance-3a': { x: 58, y: 65 }, 'dance-3b': { x: 65, y: 65 },
      'dance-4a': { x: 72, y: 65 }, 'dance-4b': { x: 79, y: 65 },
      'dance-5a': { x: 30, y: 40 }, 'dance-5b': { x: 37, y: 40 },
      'dance-6a': { x: 44, y: 40 }, 'dance-6b': { x: 51, y: 40 },
      'dance-7a': { x: 58, y: 40 }, 'dance-7b': { x: 65, y: 40 },
      'dance-8a': { x: 72, y: 40 }, 'dance-8b': { x: 79, y: 40 },
      // Solisti — naprijed u sredini
      'vocal-1': { x: 45, y: 15 }, 'vocal-2': { x: 55, y: 15 },
    },
    lightPreset: {
      'light-1': { on: true,  intensity: 90, color: '#ffe8c0' },
      'light-2': { on: true,  intensity: 90, color: '#ffe8c0' },
      'light-3': { on: true,  intensity: 70, color: '#ffffff' },
      'light-4': { on: true,  intensity: 70, color: '#ffffff' },
    },
  },
  {
    id: 'dalmacija',
    name: 'Dalmacija',
    description: 'Plesači u krugu, orkestar pozadi',
    performerPositions: {
      // Orkestar — pozadi u nizu
      'orch-1': { x: 22, y: 88 }, 'orch-2': { x: 32, y: 88 },
      'orch-3': { x: 42, y: 88 }, 'orch-4': { x: 52, y: 88 },
      'orch-5': { x: 62, y: 88 }, 'orch-6': { x: 72, y: 88 },
      'orch-7': { x: 82, y: 88 },
      // Plesači — krug (8 parova, 16 točaka po kružnici r≈25)
      'dance-1a': { x: 50, y: 68 }, 'dance-1b': { x: 56, y: 60 },
      'dance-2a': { x: 63, y: 53 }, 'dance-2b': { x: 68, y: 43 },
      'dance-3a': { x: 68, y: 33 }, 'dance-3b': { x: 63, y: 23 },
      'dance-4a': { x: 56, y: 17 }, 'dance-4b': { x: 50, y: 13 },
      'dance-5a': { x: 44, y: 13 }, 'dance-5b': { x: 38, y: 17 },
      'dance-6a': { x: 32, y: 23 }, 'dance-6b': { x: 27, y: 33 },
      'dance-7a': { x: 27, y: 43 }, 'dance-7b': { x: 32, y: 53 },
      'dance-8a': { x: 38, y: 60 }, 'dance-8b': { x: 44, y: 68 },
      // Solisti — u sredini kruga
      'vocal-1': { x: 47, y: 42 }, 'vocal-2': { x: 53, y: 42 },
    },
    lightPreset: {
      'light-1': { on: true,  intensity: 80, color: '#c0d8ff' },
      'light-2': { on: true,  intensity: 80, color: '#c0d8ff' },
      'light-3': { on: false, intensity: 60, color: '#ffffff' },
      'light-4': { on: false, intensity: 60, color: '#ffffff' },
    },
  },
  {
    id: 'medjimurje',
    name: 'Međimurje',
    description: 'Plesači raspršeni, vokalni solisti naprijed',
    performerPositions: {
      // Orkestar — desno uz rub
      'orch-1': { x: 92, y: 80 }, 'orch-2': { x: 92, y: 68 },
      'orch-3': { x: 92, y: 56 }, 'orch-4': { x: 92, y: 44 },
      'orch-5': { x: 92, y: 32 }, 'orch-6': { x: 92, y: 20 },
      'orch-7': { x: 92, y: 8  },
      // Plesači — raspršeni u skupinama
      'dance-1a': { x: 25, y: 75 }, 'dance-1b': { x: 32, y: 70 },
      'dance-2a': { x: 40, y: 78 }, 'dance-2b': { x: 47, y: 72 },
      'dance-3a': { x: 55, y: 75 }, 'dance-3b': { x: 62, y: 70 },
      'dance-4a': { x: 70, y: 78 }, 'dance-4b': { x: 77, y: 72 },
      'dance-5a': { x: 25, y: 50 }, 'dance-5b': { x: 32, y: 45 },
      'dance-6a': { x: 40, y: 52 }, 'dance-6b': { x: 47, y: 46 },
      'dance-7a': { x: 55, y: 50 }, 'dance-7b': { x: 62, y: 45 },
      'dance-8a': { x: 70, y: 52 }, 'dance-8b': { x: 77, y: 46 },
      // Solisti — naprijed u centru
      'vocal-1': { x: 40, y: 12 }, 'vocal-2': { x: 60, y: 12 },
    },
    lightPreset: {
      'light-1': { on: true,  intensity: 100, color: '#ffd700' },
      'light-2': { on: true,  intensity: 100, color: '#ffd700' },
      'light-3': { on: true,  intensity: 50,  color: '#ff8c00' },
      'light-4': { on: true,  intensity: 50,  color: '#ff8c00' },
    },
  },
];

function getPresets() {
  return presets;
}

function getPresetById(id) {
  return presets.find(p => p.id === id) || null;
}

function savePreset(preset) {
  const existing = presets.findIndex(p => p.id === preset.id);
  if (existing !== -1) {
    presets[existing] = preset;
  } else {
    presets.push(preset);
  }
}

module.exports = { getPresets, getPresetById, savePreset };
