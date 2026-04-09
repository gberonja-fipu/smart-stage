import { useState, useEffect } from 'react';

const CATEGORY_LABELS = {
  lights:   'Rasvjeta',
  smoke:    'Dim',
  leds:     'LED',
  speakers: 'Zvuk',
};

// Koja polja su dostupna za promjenu po tipu elementa
const CHANGE_FIELDS = {
  light:   ['on', 'intensity', 'color'],
  smoke:   ['on', 'intensity'],
  led:     ['on', 'color', 'mode'],
  speaker: ['on', 'volume'],
};

function timeToSeconds(mmss) {
  const parts = mmss.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + (parts[1] || 0);
  return Number(mmss) || 0;
}

function secondsToTime(s) {
  const sec = Math.floor(s);
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

function emptyAction() {
  return { category: 'lights', elementId: '', changes: {} };
}

export default function CueEditor({ cue, stageState, onSave, onCancel }) {
  const [name, setName] = useState(cue?.name ?? '');
  const [timeStr, setTimeStr] = useState(cue ? secondsToTime(cue.timestamp) : '00:00');
  const [actions, setActions] = useState(cue?.actions ? JSON.parse(JSON.stringify(cue.actions)) : [emptyAction()]);

  useEffect(() => {
    if (cue) {
      setName(cue.name);
      setTimeStr(secondsToTime(cue.timestamp));
      setActions(JSON.parse(JSON.stringify(cue.actions)));
    }
  }, [cue]);

  function handleSave() {
    const validActions = actions.filter(a => a.elementId && Object.keys(a.changes).length > 0);
    onSave({
      ...(cue ? { id: cue.id } : {}),
      name: name.trim() || 'Novi cue',
      timestamp: timeToSeconds(timeStr),
      actions: validActions,
    });
  }

  function updateAction(index, patch) {
    setActions(prev => prev.map((a, i) => i === index ? { ...a, ...patch } : a));
  }

  function setActionField(index, field, value) {
    setActions(prev => prev.map((a, i) => {
      if (i !== index) return a;
      const changes = { ...a.changes, [field]: value };
      return { ...a, changes };
    }));
  }

  function removeActionField(index, field) {
    setActions(prev => prev.map((a, i) => {
      if (i !== index) return a;
      const changes = { ...a.changes };
      delete changes[field];
      return { ...a, changes };
    }));
  }

  function removeAction(index) {
    setActions(prev => prev.filter((_, i) => i !== index));
  }

  function getElementsForCategory(category) {
    return stageState?.[category] ?? [];
  }

  function getTypeForElement(category, elementId) {
    const elements = getElementsForCategory(category);
    return elements.find(e => e.id === elementId)?.type ?? null;
  }

  const isValid = name.trim().length > 0;

  return (
    <div className="cue-editor">
      <div className="cue-editor-header">
        <h3 className="cue-editor-title">{cue ? 'Uredi cue' : 'Novi cue'}</h3>
        <button className="deselect-btn" onClick={onCancel}>×</button>
      </div>

      {/* Name & timestamp */}
      <div className="cue-editor-row">
        <label className="cue-editor-label">Naziv</label>
        <input
          className="preset-input"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Naziv cuea"
        />
      </div>

      <div className="cue-editor-row">
        <label className="cue-editor-label">Vrijeme (mm:ss)</label>
        <input
          className="preset-input cue-time-input"
          value={timeStr}
          onChange={e => setTimeStr(e.target.value)}
          placeholder="00:00"
        />
      </div>

      {/* Actions */}
      <div className="cue-editor-actions-header">
        <span className="cue-editor-label">Akcije</span>
        <button className="cue-add-action-btn" onClick={() => setActions(prev => [...prev, emptyAction()])}>
          + Dodaj
        </button>
      </div>

      <div className="cue-editor-action-list">
        {actions.map((action, i) => {
          const elType = getTypeForElement(action.category, action.elementId);
          const fields = elType ? CHANGE_FIELDS[elType] ?? [] : [];

          return (
            <div key={i} className="cue-action-row">
              <div className="cue-action-selects">
                {/* Category */}
                <select
                  className="cue-select"
                  value={action.category}
                  onChange={e => updateAction(i, { category: e.target.value, elementId: '', changes: {} })}
                >
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>

                {/* Element */}
                <select
                  className="cue-select"
                  value={action.elementId}
                  onChange={e => updateAction(i, { elementId: e.target.value, changes: {} })}
                >
                  <option value="">— element —</option>
                  {getElementsForCategory(action.category).map(el => (
                    <option key={el.id} value={el.id}>{el.name}</option>
                  ))}
                </select>

                <button className="cue-remove-btn" onClick={() => removeAction(i)}>×</button>
              </div>

              {/* Field controls */}
              {action.elementId && fields.length > 0 && (
                <div className="cue-action-fields">
                  {fields.map(field => {
                    const hasField = field in action.changes;
                    return (
                      <label key={field} className="cue-field-row">
                        <input
                          type="checkbox"
                          checked={hasField}
                          onChange={e => {
                            if (e.target.checked) {
                              const defaults = { on: true, intensity: 100, volume: 75, color: '#ffffff', mode: 'static' };
                              setActionField(i, field, defaults[field] ?? '');
                            } else {
                              removeActionField(i, field);
                            }
                          }}
                        />
                        <span className="cue-field-name">{field}</span>
                        {hasField && (
                          <FieldInput
                            field={field}
                            value={action.changes[field]}
                            onChange={v => setActionField(i, field, v)}
                          />
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button className="preset-save-confirm" onClick={handleSave} disabled={!isValid}>
        Spremi cue
      </button>
    </div>
  );
}

function FieldInput({ field, value, onChange }) {
  if (field === 'on') {
    return (
      <select className="cue-select cue-select--sm" value={String(value)} onChange={e => onChange(e.target.value === 'true')}>
        <option value="true">uključi</option>
        <option value="false">isključi</option>
      </select>
    );
  }
  if (field === 'color') {
    return <input type="color" className="control-color" value={value} onChange={e => onChange(e.target.value)} />;
  }
  if (field === 'mode') {
    return (
      <select className="cue-select cue-select--sm" value={value} onChange={e => onChange(e.target.value)}>
        {['static', 'pulse', 'chase'].map(m => <option key={m} value={m}>{m}</option>)}
      </select>
    );
  }
  // intensity, volume — number
  return (
    <input
      type="number"
      className="preset-input cue-number-input"
      min="0" max="100"
      value={value}
      onChange={e => onChange(Number(e.target.value))}
    />
  );
}
