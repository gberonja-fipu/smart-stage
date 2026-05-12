
function formatTime(totalSeconds) {
  const s = Math.floor(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatCueTime(seconds) {
  const s = Math.floor(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function StageManagerPanel({
  cueList,
  smStandbyId,
  smLastFiredId,
  onGo,
  onStandby,
  onHold,
  onReset,
  currentSetlistItem,
  isConnected,
  isTransitioning,
  elapsed,
  timerActive,
  onResetStopwatch,
}) {

  // ── Derived cue data ────────────────────────────────────────────────────────
  const sortedCues = [...cueList].sort((a, b) => a.timestamp - b.timestamp);
  const standbyCue   = smStandbyId   ? sortedCues.find(c => c.id === smStandbyId)   : null;
  const lastFiredCue = smLastFiredId ? sortedCues.find(c => c.id === smLastFiredId) : null;

  const lastFiredIdx = lastFiredCue ? sortedCues.indexOf(lastFiredCue) : -1;
  // Prikaži sljedeća 4 cue-a (od standby-a pa nadalje, ili od poslije lastFired)
  const upcomingStart = standbyCue
    ? sortedCues.indexOf(standbyCue)
    : lastFiredIdx + 1;
  const upcomingCues = sortedCues.slice(upcomingStart, upcomingStart + 4);

  const goDisabled = !isConnected || cueList.length === 0;
  const hasMore = lastFiredIdx >= sortedCues.length - 1 && !standbyCue;

  return (
    <div className="sm-panel">
      {/* ── Gornji kontekst ──────────────────────────────────────────────────── */}
      <div className="sm-context">
        {currentSetlistItem ? (
          <div className="sm-setlist-item">
            <span className="sm-label">Točka</span>
            <span className="sm-value">{currentSetlistItem.name}</span>
          </div>
        ) : (
          <div className="sm-setlist-item">
            <span className="sm-label">Točka</span>
            <span className="sm-value sm-value--dim">—</span>
          </div>
        )}

        <div className="sm-last-fired">
          <span className="sm-label">Prethodni cue</span>
          <span className="sm-value sm-value--dim">{lastFiredCue?.name ?? '—'}</span>
        </div>
      </div>

      {/* ── Štoperica ────────────────────────────────────────────────────────── */}
      <div className="sm-stopwatch-row">
        <span className={`sm-stopwatch ${timerActive ? 'running' : ''}`}>
          {formatTime(elapsed)}
        </span>
        <button className="sm-stopwatch-reset" onClick={onResetStopwatch} title="Reset štoperice">
          ↺
        </button>
      </div>

      {/* ── STANDBY indikator ────────────────────────────────────────────────── */}
      <div className={`sm-standby ${standbyCue ? 'active' : ''}`}>
        <span className="sm-standby-dot" />
        <span className="sm-standby-text">
          {standbyCue
            ? `STANDBY: ${standbyCue.name}`
            : hasMore
              ? 'Nema više cueova'
              : 'STANDBY: —'}
        </span>
      </div>

      {/* ── GO gumb ──────────────────────────────────────────────────────────── */}
      <button
        className={`sm-go-btn ${goDisabled || hasMore || isTransitioning ? 'disabled' : ''} ${isTransitioning ? 'transitioning' : ''}`}
        onClick={onGo}
        disabled={goDisabled || hasMore || isTransitioning}
      >
        GO
      </button>

      {/* ── Sekundarne akcije ────────────────────────────────────────────────── */}
      <div className="sm-actions">
        <button
          className="sm-hold-btn"
          onClick={onHold}
          disabled={!isConnected}
          title="Pauziraj timeline playback"
        >
          HOLD
        </button>
        <button
          className="sm-reset-btn"
          onClick={onReset}
          disabled={!isConnected}
          title="Vrati na početak liste"
        >
          RESET
        </button>
      </div>

      {/* ── Nadolazeći cueovi ────────────────────────────────────────────────── */}
      <div className="sm-upcoming">
        <span className="sm-label">Nadolazeći cueovi</span>
        {upcomingCues.length === 0 ? (
          <p className="sm-upcoming-empty">Kraj liste</p>
        ) : (
          <ul className="sm-upcoming-list">
            {upcomingCues.map((cue, i) => {
              const isStandby = cue.id === smStandbyId;
              return (
                <li
                  key={cue.id}
                  className={`sm-upcoming-item ${isStandby ? 'standby' : ''}`}
                  onClick={() => isConnected && onStandby(cue.id)}
                  title="Klikni za postavljanje kao standby"
                >
                  <span className="sm-upcoming-badge">
                    {isStandby ? 'SB' : i + 1}
                  </span>
                  <span className="sm-upcoming-name">{cue.name}</span>
                  <span className="sm-upcoming-time">{formatCueTime(cue.timestamp)}</span>
                  <span className="sm-upcoming-count">{cue.actions.length} ak.</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
