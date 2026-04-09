import { useRef, useCallback } from 'react';

// SVG stage area — mora biti isti kao u Stage.jsx
const STAGE = { x: 40, y: 30, w: 720, h: 390 };

const GROUP_COLORS = {
  orchestra: '#4a90d0',
  dancer:    '#e05c5c',
  vocalist:  '#f0b429',
};

const GROUP_LABELS = {
  orchestra: 'Orkestar',
  dancer:    'Plesači',
  vocalist:  'Solisti',
};

// Iste koordinatne transformacije kao u Stage.jsx
function toSVG({ x, y }) {
  return {
    x: STAGE.x + (x / 100) * STAGE.w,
    y: STAGE.y + ((100 - y) / 100) * STAGE.h,
  };
}

function fromSVG(svgX, svgY) {
  return {
    x: Math.round(Math.min(100, Math.max(0, ((svgX - STAGE.x) / STAGE.w) * 100))),
    y: Math.round(Math.min(100, Math.max(0, (1 - (svgY - STAGE.y) / STAGE.h) * 100))),
  };
}

function initials(name) {
  return name
    .split(/[\s—-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();
}

export default function StagePlot({ performers, onMovePerformer }) {
  const svgRef = useRef(null);
  const dragging = useRef(null); // { id, startX, startY }

  const getSVGPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }, []);

  const onMouseDown = useCallback((e, performer) => {
    e.stopPropagation();
    const pt = getSVGPoint(e);
    if (!pt) return;
    dragging.current = { id: performer.id };

    const onMove = (moveEvent) => {
      if (!dragging.current) return;
      const movePt = getSVGPoint(moveEvent);
      if (!movePt) return;
      const pos = fromSVG(movePt.x, movePt.y);
      onMovePerformer(dragging.current.id, pos);
    };

    const onUp = () => {
      dragging.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [getSVGPoint, onMovePerformer]);

  if (!performers || performers.length === 0) return null;

  return (
    <g>
      {performers.map(performer => {
        const { x, y } = toSVG(performer.position);
        const color = GROUP_COLORS[performer.group] || '#888';
        const label = initials(performer.name);
        const isDragging = dragging.current?.id === performer.id;

        return (
          <g
            key={performer.id}
            transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)})`}
            onMouseDown={e => onMouseDown(e, performer)}
            style={{ cursor: 'grab' }}
          >
            <title>{performer.name} — {performer.role}</title>
            {/* Shadow */}
            <circle r={13} fill="rgba(0,0,0,0.4)" cy={2} />
            {/* Body */}
            <circle
              r={12}
              fill={color}
              opacity={isDragging ? 0.7 : 1}
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
            />
            {/* Initials */}
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fill="#fff"
              fontSize="8"
              fontWeight="600"
              fontFamily="system-ui, sans-serif"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {label}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <StagePlotLegend />
    </g>
  );
}

function StagePlotLegend() {
  const items = Object.entries(GROUP_LABELS);
  const startX = STAGE.x + STAGE.w - 10;
  const startY = STAGE.y + 12;

  return (
    <g>
      {items.map(([group, label], i) => (
        <g key={group} transform={`translate(${startX}, ${startY + i * 18})`}>
          <circle r={5} fill={GROUP_COLORS[group]} />
          <text
            x={-10}
            dominantBaseline="central"
            textAnchor="end"
            fill="#666"
            fontSize="9"
            fontFamily="monospace"
          >
            {label}
          </text>
        </g>
      ))}
    </g>
  );
}
