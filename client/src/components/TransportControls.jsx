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
}) {
  const progress = totalDuration > 0 ? Math.min(1, currentTime / totalDuration) : 0;

  function handleBarClick(e) {
    if (!totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    onSeek(ratio * totalDuration);
  }

  return (
    <div className="transport">
      {/* Buttons */}
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
    </div>
  );
}
