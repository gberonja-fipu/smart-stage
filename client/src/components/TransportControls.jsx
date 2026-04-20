function formatTime(seconds) {
  const s = Math.floor(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function TransportControls({
  isPlaying,
  currentTime,
  totalDuration,
  onPlay,
  onPause,
  onStop,
  onSeek,
  disabled,
  // Auto-play
  autoPlay,
  onToggleAutoPlay,
  // Setlist context
  currentItemName,
  nextItemName,
  // Transition
  isTransitioning,
  transitionProgress,
}) {
  const progress = totalDuration > 0 ? Math.min(1, currentTime / totalDuration) : 0;

  function handleBarClick(e) {
    if (!totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * totalDuration);
  }

  return (
    <div className="transport-wrapper">
      {/* Transition progress bar (renders above transport when active) */}
      {isTransitioning && (
        <div className="transition-bar">
          <div
            className="transition-bar-fill"
            style={{ width: `${(transitionProgress || 0) * 100}%` }}
          />
          <span className="transition-label">Fade...</span>
        </div>
      )}

      <div className="transport">
        {/* Transport buttons */}
        <div className="transport-buttons">
          <button
            className="transport-btn transport-btn--stop"
            onClick={onStop}
            disabled={disabled}
            title="Stop"
          >
            ■
          </button>

          {isPlaying ? (
            <button
              className="transport-btn transport-btn--pause"
              onClick={onPause}
              disabled={disabled}
              title="Pauza"
            >
              ❚❚
            </button>
          ) : (
            <button
              className="transport-btn transport-btn--play"
              onClick={onPlay}
              disabled={disabled}
              title="Play"
            >
              ▶
            </button>
          )}
        </div>

        {/* Time display */}
        <span className="transport-time">
          {formatTime(currentTime)}
          {totalDuration > 0 && (
            <span className="transport-duration"> / {formatTime(totalDuration)}</span>
          )}
        </span>

        {/* Progress bar / seek */}
        <div
          className="transport-bar"
          onClick={handleBarClick}
          title="Klikni za seek"
        >
          <div
            className="transport-progress"
            style={{ width: `${progress * 100}%` }}
          />
          {progress > 0 && progress < 1 && (
            <div
              className="transport-head"
              style={{ left: `${progress * 100}%` }}
            />
          )}
        </div>

        {/* Auto-play toggle */}
        <button
          className={`autoplay-btn ${autoPlay ? 'active' : ''}`}
          onClick={onToggleAutoPlay}
          title={autoPlay ? 'Auto-play uključen — isključi' : 'Auto-play isključen — uključi'}
        >
          AUTO
        </button>
      </div>

      {/* Current / next item context */}
      {(currentItemName || nextItemName) && (
        <div className="transport-context">
          {currentItemName && (
            <span className="transport-item transport-item--current">
              ▶ {currentItemName}
            </span>
          )}
          {nextItemName && autoPlay && (
            <span className="transport-item transport-item--next">
              → {nextItemName}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
