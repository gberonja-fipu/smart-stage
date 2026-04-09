export default function LightControl({ element, onUpdate }) {
  return (
    <div className="control-rows">
      <div className="control-row">
        <label className="control-label">
          Intenzitet
          <span className="control-value">{element.intensity}%</span>
        </label>
        <input
          type="range"
          className="control-slider"
          min="0"
          max="100"
          value={element.intensity}
          onChange={e => onUpdate({ intensity: Number(e.target.value) })}
        />
      </div>

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
    </div>
  );
}
