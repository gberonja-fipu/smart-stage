import { useState, useRef, useEffect } from 'react';

export default function SmokeControl({ element, onUpdate }) {
  const [intensity, setIntensity] = useState(element.intensity);
  const throttleRef = useRef(null);

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
    </div>
  );
}
