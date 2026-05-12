import { useState, useRef, useEffect } from 'react';

export default function SpeakerControl({ element, onUpdate }) {
  const [volume, setVolume] = useState(element.volume);
  const throttleRef = useRef(null);

  useEffect(() => { setVolume(element.volume); }, [element.volume]);

  function handleVolume(e) {
    const value = Number(e.target.value);
    setVolume(value);
    if (throttleRef.current) clearTimeout(throttleRef.current);
    throttleRef.current = setTimeout(() => onUpdate({ volume: value }), 50);
  }

  return (
    <div className="control-rows">
      <div className="control-row">
        <label className="control-label">
          Glasnoća
          <span className="control-value">{volume}%</span>
        </label>
        <input
          type="range"
          className="control-slider"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolume}
        />
      </div>

      <div className="control-row">
        <span className="control-label">Zona</span>
        <span className={`zone-badge zone-badge--${element.zone}`}>{element.zone}</span>
      </div>
    </div>
  );
}
