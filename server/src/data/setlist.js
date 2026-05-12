const { loadData, saveData } = require('../utils/storage');

const FILE = 'setlist';

const DEFAULT_ITEMS = [
  {
    id: 'setlist-1',
    name: 'Slavonsko kolo',
    description: 'Energičan plesni komad iz Slavonije',
    presetId: 'slavonija',
    cueListId: null,
    duration: 240,
    order: 1,
  },
  {
    id: 'setlist-2',
    name: 'Dalmatinska noć',
    description: 'Romantična večernja kompozicija',
    presetId: 'dalmacija',
    cueListId: null,
    duration: 300,
    order: 2,
  },
  {
    id: 'setlist-3',
    name: 'Međimurska popevka',
    description: 'Tradicionalna međimurska melodija',
    presetId: 'medjimurje',
    cueListId: null,
    duration: 180,
    order: 3,
  },
];

function _computeNextId(items) {
  if (!items.length) return 1;
  const max = Math.max(...items.map(i => {
    const n = parseInt(String(i.id).replace(/\D/g, ''), 10);
    return isNaN(n) ? 0 : n;
  }));
  return max + 1;
}

class Setlist {
  constructor() {
    const saved = loadData(FILE);
    this._items = saved ? [...saved] : [...DEFAULT_ITEMS];
    this._nextId = _computeNextId(this._items);
  }

  _save() {
    saveData(FILE, this._items);
  }

  getItems() {
    return [...this._items].sort((a, b) => a.order - b.order);
  }

  addItem(item) {
    const maxOrder = this._items.reduce((max, i) => Math.max(max, i.order), 0);
    const newItem = {
      id: `setlist-${this._nextId++}`,
      name: item.name || 'Nova točka',
      description: item.description || '',
      presetId: item.presetId || null,
      cueListId: item.cueListId || null,
      duration: item.duration || 120,
      order: maxOrder + 1,
    };
    this._items.push(newItem);
    this._save();
    return newItem;
  }

  removeItem(id) {
    const before = this._items.length;
    this._items = this._items.filter(i => i.id !== id);
    if (this._items.length < before) this._save();
    return this._items.length < before;
  }

  reorderItems(orderedIds) {
    orderedIds.forEach((id, index) => {
      const item = this._items.find(i => i.id === id);
      if (item) item.order = index + 1;
    });
    this._save();
  }

  getItemById(id) {
    return this._items.find(i => i.id === id) || null;
  }

  // Zamijeni cijelu listu (koristi se pri importu)
  importItems(items) {
    this._items = [...items];
    this._nextId = _computeNextId(this._items);
    this._save();
  }
}

module.exports = { Setlist };
