import { useState } from 'react';

export default function PresetSelector({
  presets,
  activePresetId,
  onLoadPreset,
  onSavePreset,
  disabled,
}) {
  const [saveMode, setSaveMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  function handleSave(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    onSavePreset(newName.trim(), newDesc.trim());
    setNewName('');
    setNewDesc('');
    setSaveMode(false);
  }

  if (!presets || presets.length === 0) return null;

  return (
    <div className="preset-selector">
      <div className="preset-selector-header">
        <span className="preset-label">Preset</span>
        <button
          className="preset-save-btn"
          onClick={() => setSaveMode(v => !v)}
          disabled={disabled}
          title="Spremi trenutno stanje kao novi preset"
        >
          {saveMode ? 'Odustani' : '+ Spremi'}
        </button>
      </div>

      {saveMode ? (
        <form className="preset-save-form" onSubmit={handleSave}>
          <input
            className="preset-input"
            placeholder="Naziv preseta"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            autoFocus
          />
          <input
            className="preset-input"
            placeholder="Opis (opcijalno)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
          />
          <button
            type="submit"
            className="preset-save-confirm"
            disabled={!newName.trim()}
          >
            Spremi
          </button>
        </form>
      ) : (
        <div className="preset-cards">
          {presets.map(preset => (
            <button
              key={preset.id}
              className={`preset-card ${activePresetId === preset.id ? 'active' : ''}`}
              onClick={() => onLoadPreset(preset.id)}
              disabled={disabled}
              title={preset.description}
            >
              <span className="preset-card-name">{preset.name}</span>
              {preset.description && (
                <span className="preset-card-desc">{preset.description}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
