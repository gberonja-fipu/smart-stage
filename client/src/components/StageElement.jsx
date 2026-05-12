// CSS transition durations that match the server's STEP_MS (50ms) intervals
const FADE_TRANSITION = 'fill 0.1s ease, stroke 0.1s ease, opacity 0.1s ease, filter 0.1s ease';

export default function StageElement({ element, x, y, isSelected, onSelect }) {
  return (
    <g
      transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)})`}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      style={{ cursor: 'pointer' }}
    >
      <title>{element.name} — {element.on ? 'uključeno' : 'isključeno'}</title>
      {isSelected && <SelectionRing element={element} />}
      <ElementShape element={element} />
      <ElementLabel element={element} />
    </g>
  );
}

function SelectionRing({ element }) {
  if (element.type === 'led') {
    return (
      <rect x={-15} y={-46} width={30} height={92} rx={6}
        fill="none" stroke="#ffffff" strokeWidth="1.5"
        strokeDasharray="4 2" opacity="0.7" />
    );
  }
  if (element.type === 'smoke') {
    return (
      <rect x={-28} y={-23} width={56} height={46} rx={9}
        fill="none" stroke="#ffffff" strokeWidth="1.5"
        strokeDasharray="4 2" opacity="0.7" />
    );
  }
  return (
    <circle r={22} fill="none" stroke="#ffffff"
      strokeWidth="1.5" strokeDasharray="4 2" opacity="0.7" />
  );
}

const TYPE_ICON = {
  light:   '💡',
  smoke:   '💨',
  led:     '🌈',
  speaker: '🔊',
};

function ElementLabel({ element }) {
  const shortName = element.name.split(' ').slice(-2).join(' ');
  const icon = TYPE_ICON[element.type] ?? '';
  return (
    <text
      textAnchor="middle"
      y={labelOffset(element.type)}
      fill="#666"
      fontSize="9"
      fontFamily="monospace"
      style={{ userSelect: 'none', pointerEvents: 'none' }}
    >
      {icon} {shortName}
    </text>
  );
}

function labelOffset(type) {
  switch (type) {
    case 'led':     return 52;
    case 'smoke':   return 24;
    case 'speaker': return 22;
    default:        return 24;
  }
}

function ElementShape({ element }) {
  switch (element.type) {
    case 'light':   return <LightShape element={element} />;
    case 'smoke':   return <SmokeShape element={element} />;
    case 'led':     return <LEDShape element={element} />;
    case 'speaker': return <SpeakerShape element={element} />;
    default:        return null;
  }
}

// ─── Light / Reflektor ───────────────────────────────────────────────────────

function LightShape({ element }) {
  const { on, color = '#ffffff', intensity = 100 } = element;
  const beamOpacity   = on ? (intensity / 100) * 0.22 : 0;
  const fixtureColor  = on ? color : '#3a3a4a';
  const strokeColor   = on ? color : '#555555';
  const innerColor    = on ? '#ffffff' : '#1e1e2e';
  const innerOpacity  = on ? 0.9 : 0.4;
  const glowFilter    = on
    ? `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 4px ${color})`
    : 'none';

  return (
    <g style={{ filter: glowFilter, transition: 'filter 0.15s ease' }}>
      {/* Beam halo — always rendered, opacity animated */}
      <circle r={28}
        style={{
          fill: color,
          opacity: beamOpacity,
          transition: `opacity 0.15s ease, ${FADE_TRANSITION}`,
        }}
      />
      {/* Fixture body */}
      <circle r={13}
        style={{
          fill: fixtureColor,
          stroke: strokeColor,
          transition: FADE_TRANSITION,
        }}
        strokeWidth="1.5"
      />
      {/* Inner lamp */}
      <circle r={5}
        style={{
          fill: innerColor,
          opacity: innerOpacity,
          transition: FADE_TRANSITION,
        }}
      />
    </g>
  );
}

// ─── Smoke machine / Dimna mašina ────────────────────────────────────────────

function SmokeShape({ element }) {
  const { on } = element;
  const bodyFill   = on ? '#5a5a6e' : '#2a2a38';
  const bodyStroke = on ? '#9090b8' : '#444444';

  return (
    <g>
      {on && (
        <g>
          <circle className="smoke-puff puff-1" r={9}  cy={-24} fill="rgba(180,180,200,0.35)" />
          <circle className="smoke-puff puff-2" r={7} cx={-10} cy={-40} fill="rgba(180,180,200,0.25)" />
          <circle className="smoke-puff puff-3" r={6} cx={9}  cy={-54} fill="rgba(180,180,200,0.17)" />
        </g>
      )}
      <rect x={-22} y={-11} width={44} height={22} rx={5}
        style={{ fill: bodyFill, stroke: bodyStroke, transition: FADE_TRANSITION }}
        strokeWidth="1.5"
      />
      <rect x={-5} y={-17} width={10} height={7} rx={2}
        style={{ fill: on ? '#888888' : '#333333', transition: 'fill 0.15s ease' }}
      />
    </g>
  );
}

// ─── LED bar ─────────────────────────────────────────────────────────────────

function LEDShape({ element }) {
  const { on, color = '#ff0000', mode = 'static' } = element;
  const barFill    = on ? color : '#1a1a28';
  const barStroke  = on ? color : '#333333';
  const dotFill    = on ? 'rgba(255,255,255,0.55)' : '#1e1e2e';
  const glowFilter = on
    ? `drop-shadow(0 0 8px ${color}) drop-shadow(0 0 3px ${color})`
    : 'none';

  return (
    <g style={{ filter: glowFilter, transition: 'filter 0.15s ease' }}>
      <rect x={-9} y={-40} width={18} height={80} rx={4}
        style={{ fill: barFill, stroke: barStroke, transition: FADE_TRANSITION }}
        strokeWidth="1.5"
        className={on && mode === 'pulse' ? 'led-pulse' : ''}
      />
      {[0, 1, 2, 3, 4].map(i => (
        <circle key={i} cy={-28 + i * 14} r={3}
          style={{ fill: dotFill, transition: 'fill 0.15s ease' }}
        />
      ))}
    </g>
  );
}

// ─── Speaker / Zvučnik ───────────────────────────────────────────────────────

function SpeakerShape({ element }) {
  const { on, volume = 75 } = element;
  const size     = 14 + Math.round((volume / 100) * 8);
  const half     = size / 2;
  const boxFill  = on ? '#1e3a5f' : '#161e2a';
  const boxStroke = on ? '#4a7aaa' : '#2a3a4a';
  const coneFill  = on ? '#4a90d0' : '#223344';
  const capFill   = on ? '#aad0f0' : '#1a2233';

  return (
    <g>
      <rect x={-half} y={-half} width={size} height={size} rx={3}
        style={{ fill: boxFill, stroke: boxStroke, transition: FADE_TRANSITION }}
        strokeWidth="1.5"
      />
      <circle r={half * 0.65}
        style={{ fill: coneFill, opacity: 0.85, transition: 'fill 0.15s ease' }}
      />
      <circle r={half * 0.22}
        style={{ fill: capFill, transition: 'fill 0.15s ease' }}
      />
    </g>
  );
}
