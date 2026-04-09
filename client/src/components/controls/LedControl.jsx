const MODES = ['static', 'pulse', 'chase'];

export default function LedControl({ element, onUpdate }) {
  return (
    <div className="control-rows">
      <div className="control-row">
        <span className="control-label">Boja</span>
        <div className="color-picker-wrapper">
          <input
            type="color"
            className="control-color"
            value={element.color}
            onChange={e => onUpdate({ color: e.target.value })}
          />
          <span className="color-hex">{element.color}</span>
        </div>
      </div>

      <div className="control-row control-row--col">
        <span className="control-label">Mod</span>
        <div className="mode-selector">
          {MODES.map(mode => (
            <label
              key={mode}
              className={`mode-option ${element.mode === mode ? 'active' : ''}`}
            >
              <input
                type="radio"
                name={`led-mode-${element.id}`}
                value={mode}
                checked={element.mode === mode}
                onChange={() => onUpdate({ mode })}
              />
              {mode}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
