import { useRef } from 'react';
import StageElement from './StageElement';
import StagePlot from './StagePlot';

// SVG stage area bounds
const STAGE = { x: 40, y: 30, w: 720, h: 390 };
// Audience strip below stage
const AUDIENCE = { x: 40, y: 424, w: 720, h: 46 };

// Default positions (0–100) for elements that have no position property.
// Y is inverted: y=0 → downstage (near audience, SVG bottom), y=100 → upstage (SVG top)
const FALLBACK_POSITIONS = {
  'smoke-1':   { x: 50, y: 88 },   // centre upstage
  'led-1':     { x: 3,  y: 50 },   // left wing
  'led-2':     { x: 97, y: 50 },   // right wing
  'speaker-1': { x: 78, y: 12 },   // downstage right
  'speaker-2': { x: 22, y: 12 },   // downstage left
};

// Map 0–100 position to SVG coordinates.
// Y is inverted so that y=0 (front/downstage) appears near audience (bottom of SVG).
function toSVG({ x, y }) {
  return {
    x: STAGE.x + (x / 100) * STAGE.w,
    y: STAGE.y + ((100 - y) / 100) * STAGE.h,
  };
}

export default function Stage({ stageState, selectedId, onSelectElement, performers, onMovePerformer, showPlot }) {
  const svgRef = useRef(null);

  if (!stageState) return null;

  const allElements = Object.values(stageState).flat();

  // Zone X positions (SVG)
  const zL  = STAGE.x + STAGE.w * 0.25;  // 25 % — lijevo
  const zC  = STAGE.x + STAGE.w * 0.50;  // 50 % — centar
  const zR  = STAGE.x + STAGE.w * 0.75;  // 75 % — desno
  const zY0 = STAGE.y;
  const zY1 = STAGE.y + STAGE.h;

  return (
    <div className="stage-wrapper">
      <svg
        ref={svgRef}
        viewBox="0 0 800 480"
        className="stage-svg"
        xmlns="http://www.w3.org/2000/svg"
        onClick={() => onSelectElement(null)}
      >
        <defs>
          <pattern id="stage-grid" width="72" height="39" patternUnits="userSpaceOnUse"
            x={STAGE.x} y={STAGE.y}>
            <path d="M 72 0 L 0 0 0 39" fill="none" stroke="#1c1f3a" strokeWidth="0.6" />
          </pattern>
        </defs>

        {/* Stage floor */}
        <rect x={STAGE.x} y={STAGE.y} width={STAGE.w} height={STAGE.h}
          fill="#16192a" rx="4" />
        <rect x={STAGE.x} y={STAGE.y} width={STAGE.w} height={STAGE.h}
          fill="url(#stage-grid)" rx="4" />
        <rect x={STAGE.x} y={STAGE.y} width={STAGE.w} height={STAGE.h}
          fill="none" stroke="#252850" strokeWidth="2" rx="4" />

        {/* ── Zone dividers ──────────────────────────────────────────────── */}
        {[zL, zC, zR].map((xPos, i) => (
          <line key={i}
            x1={xPos} y1={zY0} x2={xPos} y2={zY1}
            stroke="#1e2244" strokeWidth="1" strokeDasharray="4 6"
          />
        ))}

        {/* Zone labels — top row */}
        {[
          { x: STAGE.x + STAGE.w * 0.125, label: 'LIJEVO' },
          { x: STAGE.x + STAGE.w * 0.375, label: 'CENTAR-L' },
          { x: STAGE.x + STAGE.w * 0.625, label: 'CENTAR-D' },
          { x: STAGE.x + STAGE.w * 0.875, label: 'DESNO' },
        ].map(({ x, label }) => (
          <text key={label} x={x} y={STAGE.y + 14}
            fill="#1e2244" fontSize="9" textAnchor="middle"
            fontFamily="monospace" letterSpacing="1">
            {label}
          </text>
        ))}

        {/* Backstage label — top-left */}
        <text x={STAGE.x + 8} y={STAGE.y + 26}
          fill="#252850" fontSize="9" fontFamily="monospace" letterSpacing="2">
          BACKSTAGE
        </text>

        {/* Front-of-stage label — bottom-left */}
        <text x={STAGE.x + 8} y={STAGE.y + STAGE.h - 6}
          fill="#252850" fontSize="9" fontFamily="monospace" letterSpacing="2">
          PREDNJA SCENA
        </text>

        {/* Front-of-stage edge line */}
        <line
          x1={STAGE.x} y1={STAGE.y + STAGE.h}
          x2={STAGE.x + STAGE.w} y2={STAGE.y + STAGE.h}
          stroke="#3a3d6b" strokeWidth="3"
        />

        {/* Audience strip */}
        <rect x={AUDIENCE.x} y={AUDIENCE.y} width={AUDIENCE.w} height={AUDIENCE.h}
          fill="#0d0f18" rx="3" />
        <text
          x={AUDIENCE.x + AUDIENCE.w / 2}
          y={AUDIENCE.y + 28}
          fill="#252850" fontSize="12" textAnchor="middle"
          fontFamily="monospace" letterSpacing="10"
        >
          P U B L I K A
        </text>

        {/* Stage elements (elementi mode) */}
        {!showPlot && allElements.map(element => {
          const rawPos = element.position || FALLBACK_POSITIONS[element.id];
          if (!rawPos) return null;
          const svgPos = toSVG(rawPos);
          return (
            <StageElement
              key={element.id}
              element={element}
              x={svgPos.x}
              y={svgPos.y}
              isSelected={selectedId === element.id}
              onSelect={() => onSelectElement(element.id)}
            />
          );
        })}

        {/* Stage plot (izvođači mode) */}
        {showPlot && performers && (
          <StagePlot
            performers={performers}
            onMovePerformer={onMovePerformer}
            svgRef={svgRef}
          />
        )}
      </svg>
    </div>
  );
}
