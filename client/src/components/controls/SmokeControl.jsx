export default function SmokeControl({ element, onUpdate }) {
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
    </div>
  );
}
