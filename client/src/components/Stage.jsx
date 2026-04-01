import StageElement from './StageElement';

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

export default function Stage({ stageState, selectedId, onSelectElement }) {
  if (!stageState) return null;

  const allElements = Object.values(stageState).flat();

  return (
    <div className="stage-wrapper">
      <svg
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

        {/* Direction labels */}
        <text x={STAGE.x + 10} y={STAGE.y + 16}
          fill="#252850" fontSize="10" fontFamily="monospace" letterSpacing="2">
          STRAŽNJE
        </text>
        <text x={STAGE.x + 10} y={STAGE.y + STAGE.h - 8}
          fill="#252850" fontSize="10" fontFamily="monospace" letterSpacing="2">
          PREDNJA
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

        {/* Stage elements */}
        {allElements.map(element => {
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
      </svg>
    </div>
  );
}
