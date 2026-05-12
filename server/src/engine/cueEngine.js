const { EventEmitter } = require('events');
const { logger } = require('../utils/logger');

const TICK_MS = 500; // resolucija timera

// ── Cue action format ─────────────────────────────────────────────────────────
// Svaka akcija u cue-u može biti instant ili animirana:
//
// Instant:
//   { category: 'lights', elementId: 'light-1', changes: { on: true, intensity: 80 } }
//
// S tranzicijom (obrađuje transitionEngine u index.js):
//   { category: 'lights', elementId: 'light-1', changes: { ... },
//     transition: { duration: 2000, easing: 'easeInOut' } }
//
// Podržani easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'

class CueEngine extends EventEmitter {
  constructor(cueList) {
    super();
    this._cueList = cueList;
    this._currentTime = 0;   // sekunde
    this._isPlaying = false;
    this._interval = null;
    this._executedIds = new Set(); // cueovi izvršeni u ovom play-u
    this._startWallTime = null;   // Date.now() kad je play krenuo
    this._startOffset = 0;        // _currentTime u trenutku play()
  }

  // ── Transport ──────────────────────────────────────────────────────────────

  play() {
    if (this._isPlaying) return;
    if (this._cueList.getCues().length === 0) return;
    this._isPlaying = true;
    this._startWallTime = Date.now();
    this._startOffset = this._currentTime;

    this._interval = setInterval(() => this._tick(), TICK_MS);
    this.emit('cue:transportChange', { isPlaying: true, currentTime: this._currentTime });
  }

  pause() {
    if (!this._isPlaying) return;
    this._isPlaying = false;
    clearInterval(this._interval);
    this._interval = null;
    this._currentTime = this._elapsed();
    this.emit('cue:transportChange', { isPlaying: false, currentTime: this._currentTime });
  }

  stop() {
    this._isPlaying = false;
    clearInterval(this._interval);
    this._interval = null;
    this._currentTime = 0;
    this._executedIds.clear();
    this.emit('cue:transportChange', { isPlaying: false, currentTime: 0 });
  }

  seek(time) {
    const wasPlaying = this._isPlaying;
    if (wasPlaying) {
      clearInterval(this._interval);
      this._interval = null;
      this._isPlaying = false;
    }

    this._currentTime = Math.max(0, time);
    this._executedIds = new Set(
      this._cueList.getCues()
        .filter(c => c.timestamp < this._currentTime)
        .map(c => c.id)
    );

    if (wasPlaying) {
      this._startOffset = this._currentTime;
      this._startWallTime = Date.now();
      this._isPlaying = true;
      this._interval = setInterval(() => this._tick(), TICK_MS);
    }

    this.emit('cue:timeUpdate', { currentTime: this._currentTime });
  }

  getCurrentTime() {
    return this._isPlaying ? this._elapsed() : this._currentTime;
  }

  getState() {
    return { isPlaying: this._isPlaying, currentTime: this.getCurrentTime() };
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  _elapsed() {
    return this._startOffset + (Date.now() - this._startWallTime) / 1000;
  }

  _tick() {
    this._currentTime = this._elapsed();

    const cues = this._cueList.getCues();

    for (const cue of cues) {
      if (!this._executedIds.has(cue.id) && cue.timestamp <= this._currentTime) {
        this._executedIds.add(cue.id);
        const actions = this._cueList.executeCue(cue);
        this.emit('cue:executed', { cue, actions });
        logger.info(`[CUE] "${cue.name}" @ ${cue.timestamp}s`);
      }
    }

    this.emit('cue:timeUpdate', { currentTime: this._currentTime });

    const lastTimestamp = cues.length > 0 ? cues[cues.length - 1].timestamp : 0;
    if (this._currentTime >= lastTimestamp + 1 && cues.length > 0) {
      this.stop();
      this.emit('cue:finished');
    }
  }
}

module.exports = { CueEngine };
