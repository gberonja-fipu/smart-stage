import { memo } from 'react';

const VIEWBOX = '0 0 800 480';

const STAGE    = { x: 40,  y: 30,  w: 720, h: 390 };
const AUDIENCE = { x: 40,  y: 424, w: 720, h: 46  };

const TYPE_COLORS = {
  lights:   '#ffd666',
  smoke:    '#a0aec0',
  leds:     '#9f7aea',
  speakers: '#68d391',
};

function toSVG({ x, y }) {
  return {
    x: STAGE.x + (x / 100) * STAGE.w,
    y: STAGE.y + ((100 - y) / 100) * STAGE.h,
  };
}

const MiniMap = memo(function MiniMap({ stageState, selectedId, onSelectElement }) {
  if (!stageState) return null;

  const allElements = Object.entries(stageState).flatMap(([cat, els]) =>
    els.map(el => ({ ...el, category: cat }))
  );

  return (
    <div className="mini-map" title="Klikni element za odabir">
      <svg
        viewBox={VIEWBOX}
        className="mini-map-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Stage area */}
        <rect
          x={STAGE.x} y={STAGE.y} width={STAGE.w} height={STAGE.h}
          fill="#1a1d30" stroke="#252850" strokeWidth={3}
        />
        {/* Audience area */}
        <rect
          x={AUDIENCE.x} y={AUDIENCE.y} width={AUDIENCE.w} height={AUDIENCE.h}
          fill="#101220" stroke="#252850" strokeWidth={2}
        />

        {allElements.map(el => {
          if (!el.position) return null;
          const { x, y } = toSVG(el.position);
          const color = TYPE_COLORS[el.category] ?? '#999';
          const isOn       = el.on;
          const isSelected = el.id === selectedId;

          return (
            <g
              key={el.id}
              transform={`translate(${x},${y})`}
              onClick={() => onSelectElement?.(el.id)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                r={isSelected ? 20 : 14}
                fill={isOn ? color : '#2a2d40'}
                stroke={isSelected ? '#7c6cff' : color}
                strokeWidth={isSelected ? 4 : 2}
                opacity={isOn ? 0.9 : 0.4}
              />
              {isOn && (
                <circle r={isSelected ? 28 : 20} fill={color} opacity={0.15} />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
});

export default MiniMap;
