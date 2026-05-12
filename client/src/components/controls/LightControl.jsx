import { useState, useRef, useEffect } from 'react';

export default function LightControl({ element, onUpdate }) {
  const [intensity, setIntensity] = useState(element.intensity);
  const throttleRef = useRef(null);

  // Sync if element changes from outside (e.g. cue execution)
  useEffect(() => { setIntensity(element.intensity); }, [element.intensity]);

  function handleIntensity(e) {
    const value = Number(e.target.value);
    setIntensity(value);
    if (throttleRef.current) clearTimeout(throttleRef.current);
    throttleRef.current = setTimeout(() => onUpdate({ intensity: value }), 50);
  }

  return (
    <div className="control-rows">
      <div className="control-row">
        <label className="control-label">
          Intenzitet
          <span className="control-value">{intensity}%</span>
        </label>
        <input
          type="range"
          className="control-slider"
          min="0"
          max="100"
          value={intensity}
          onChange={handleIntensity}
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
