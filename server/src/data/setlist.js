let _nextId = 4;

class Setlist {
  constructor() {
    this._items = [
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
  }

  getItems() {
    return [...this._items].sort((a, b) => a.order - b.order);
  }

  addItem(item) {
    const maxOrder = this._items.reduce((max, i) => Math.max(max, i.order), 0);
    const newItem = {
      id: `setlist-${_nextId++}`,
      name: item.name || 'Nova točka',
      description: item.description || '',
      presetId: item.presetId || null,
      cueListId: item.cueListId || null,
      duration: item.duration || 120,
      order: maxOrder + 1,
    };
    this._items.push(newItem);
    return newItem;
  }

  removeItem(id) {
    const before = this._items.length;
    this._items = this._items.filter(i => i.id !== id);
    return this._items.length < before;
  }

  reorderItems(orderedIds) {
    orderedIds.forEach((id, index) => {
      const item = this._items.find(i => i.id === id);
      if (item) item.order = index + 1;
    });
  }

  getItemById(id) {
    return this._items.find(i => i.id === id) || null;
  }
}

module.exports = { Setlist };
