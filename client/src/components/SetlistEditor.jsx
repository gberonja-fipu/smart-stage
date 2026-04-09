import { useState } from 'react';

function secondsToMmss(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function mmssToSeconds(str) {
  const parts = str.split(':');
  const m = parseInt(parts[0], 10) || 0;
  const s = parseInt(parts[1], 10) || 0;
  return m * 60 + s;
}

export default function SetlistEditor({ presets, onSave, onCancel }) {
  const [name, setName] = useState('');
  const [presetId, setPresetId] = useState(presets[0]?.id || '');
  const [durationStr, setDurationStr] = useState('2:00');
  const [description, setDescription] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      presetId: presetId || null,
      duration: mmssToSeconds(durationStr),
      description: description.trim(),
    });
  }

  return (
    <form className="setlist-editor" onSubmit={handleSubmit}>
      <div className="setlist-editor-header">
        <h3 className="setlist-editor-title">Nova točka</h3>
        <button type="button" className="deselect-btn" onClick={onCancel}>✕</button>
      </div>

      <div className="setlist-editor-field">
        <label className="setlist-editor-label">Ime točke</label>
        <input
          className="setlist-editor-input"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="npr. Slavonsko kolo"
          required
          autoFocus
        />
      </div>

      <div className="setlist-editor-field">
        <label className="setlist-editor-label">Preset</label>
        <select
          className="setlist-editor-select"
          value={presetId}
          onChange={e => setPresetId(e.target.value)}
        >
          <option value="">— bez preseta —</option>
          {presets.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="setlist-editor-field">
        <label className="setlist-editor-label">Trajanje (mm:ss)</label>
        <input
          className="setlist-editor-input setlist-editor-input--sm"
          type="text"
          value={durationStr}
          onChange={e => setDurationStr(e.target.value)}
          placeholder="3:00"
          pattern="\d+:[0-5]\d"
        />
      </div>

      <div className="setlist-editor-field">
        <label className="setlist-editor-label">Opis</label>
        <textarea
          className="setlist-editor-textarea"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Kratak opis točke..."
          rows={3}
        />
      </div>

      <div className="setlist-editor-buttons">
        <button type="button" className="setlist-editor-cancel" onClick={onCancel}>Odustani</button>
        <button type="submit" className="setlist-editor-save" disabled={!name.trim()}>
          Dodaj točku
        </button>
      </div>
    </form>
  );
}
