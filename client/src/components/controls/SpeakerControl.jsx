export default function SpeakerControl({ element, onUpdate }) {
  return (
    <div className="control-rows">
      <div className="control-row">
        <label className="control-label">
          Glasnoća
          <span className="control-value">{element.volume}%</span>
        </label>
        <input
          type="range"
          className="control-slider"
          min="0"
          max="100"
          value={element.volume}
          onChange={e => onUpdate({ volume: Number(e.target.value) })}
        />
      </div>

      <div className="control-row">
        <span className="control-label">Zona</span>
        <span className={`zone-badge zone-badge--${element.zone}`}>{element.zone}</span>
      </div>
    </div>
  );
}
