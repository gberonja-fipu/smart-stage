const { EventEmitter } = require('events');

const STEP_MS = 50; // interval interpolacije u ms

// ── Math helpers ──────────────────────────────────────────────────────────────

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function hexToRgb(hex) {
  const h = (hex || '#000000').replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16) || 0,
    g: parseInt(h.slice(2, 4), 16) || 0,
    b: parseInt(h.slice(4, 6), 16) || 0,
  };
}

function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b]
    .map(c => Math.round(Math.max(0, Math.min(255, c))).toString(16).padStart(2, '0'))
    .join('');
}

function lerpColor(from, to, t) {
  if (!from || !from.startsWith('#')) return to;
  const f = hexToRgb(from);
  const e = hexToRgb(to);
  return rgbToHex({
    r: lerp(f.r, e.r, t),
    g: lerp(f.g, e.g, t),
    b: lerp(f.b, e.b, t),
  });
}

// Easing functions
const EASING = {
  linear:   t => t,
  easeIn:   t => t * t,
  easeOut:  t => t * (2 - t),
  easeInOut: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
};

function interpolateState(from, to, t) {
  const result = {};
  for (const key of Object.keys(to)) {
    const toVal  = to[key];
    const fromVal = from != null ? from[key] : undefined;

    if (key === 'color' && typeof toVal === 'string' && toVal.startsWith('#')) {
      result[key] = lerpColor(fromVal || '#000000', toVal, t);
    } else if (typeof toVal === 'number') {
      result[key] = lerp(fromVal ?? 0, toVal, t);
    } else if (typeof toVal === 'boolean') {
      // Switch boolean at the midpoint
      result[key] = t >= 0.5 ? toVal : (fromVal ?? toVal);
    } else {
      result[key] = toVal;
    }
  }
  return result;
}

// ── TransitionEngine ──────────────────────────────────────────────────────────
//
// Manages concurrent animated transitions between stage element states.
//
// Usage:
//   engine.start(id, changes, durationMs, easing?)
//   changes: [{ elementId, category, fromState, toState }]
//
// Emits:
//   'transition:start'    — { id, durationMs }
//   'transition:step'     — { id, updates: [{ elementId, category, state }], progress }
//   'transition:complete' — { id, updates: [{ elementId, category, state }] }

class TransitionEngine extends EventEmitter {
  constructor() {
    super();
    this._active = new Map(); // id → intervalHandle
  }

  /**
   * Start an animated transition.
   * @param {string}   id         Unique transition identifier (cancels any previous with same id)
   * @param {Array}    changes    [{ elementId, category, fromState, toState }]
   * @param {number}   durationMs Duration in milliseconds
   * @param {string}   [easing]   'linear' | 'easeIn' | 'easeOut' | 'easeInOut'
   */
  start(id, changes, durationMs, easing = 'easeInOut') {
    this.cancel(id);

    const easeFn = EASING[easing] || EASING.easeInOut;
    const steps  = Math.max(1, Math.ceil(durationMs / STEP_MS));
    let step = 0;

    this.emit('transition:start', { id, durationMs });

    const interval = setInterval(() => {
      step++;
      const raw = Math.min(step / steps, 1);
      const t   = easeFn(raw);

      const updates = changes.map(({ elementId, category, fromState, toState }) => ({
        elementId,
        category,
        state: interpolateState(fromState, toState, t),
      }));

      this.emit('transition:step', { id, updates, progress: raw });

      if (raw >= 1) {
        clearInterval(interval);
        this._active.delete(id);
        this.emit('transition:complete', { id, updates });
      }
    }, STEP_MS);

    this._active.set(id, interval);
  }

  /**
   * Convenience method for crossfading lights between two presets.
   * @param {string} id
   * @param {Object} currentLights  Current stage light elements array
   * @param {Object} targetPreset   Preset lightPreset object { lightId: { on, intensity, color } }
   * @param {number} durationMs
   * @param {string} [easing]
   */
  crossfade(id, currentLights, targetPreset, durationMs, easing = 'easeInOut') {
    const changes = Object.entries(targetPreset).map(([lightId, toState]) => {
      const current   = currentLights.find(l => l.id === lightId);
      const fromState = current
        ? { on: current.on, intensity: current.intensity ?? 0, color: current.color ?? '#000000' }
        : { on: false, intensity: 0, color: toState.color ?? '#000000' };
      return { elementId: lightId, category: 'lights', fromState, toState };
    });

    this.start(id, changes, durationMs, easing);
  }

  /** Cancel a transition by id (no-op if not active). */
  cancel(id) {
    if (this._active.has(id)) {
      clearInterval(this._active.get(id));
      this._active.delete(id);
    }
  }

  /** Cancel all active transitions. */
  cancelAll() {
    for (const interval of this._active.values()) clearInterval(interval);
    this._active.clear();
  }

  /** True if a transition with this id is currently running. */
  isActive(id) {
    return this._active.has(id);
  }
}

module.exports = { TransitionEngine };
