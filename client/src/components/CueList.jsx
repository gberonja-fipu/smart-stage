function formatTime(seconds) {
  const s = Math.floor(seconds);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function CueList({ cues, activeCueId, currentTime, onRemove, onEdit, onAdd }) {
  const totalDuration = cues.length > 0 ? cues[cues.length - 1].timestamp : 0;

  return (
    <div className="cue-list">
      <div className="cue-list-header">
        <span className="cue-list-title">Cue lista</span>
        <button className="cue-add-btn" onClick={onAdd}>+ Dodaj cue</button>
      </div>

      {cues.length === 0 && (
        <p className="cue-empty">Nema cueova. Dodaj prvi cue.</p>
      )}

      <ul className="cue-items">
        {cues.map((cue, index) => {
          const isActive = cue.id === activeCueId;
          const isPast = cue.timestamp < currentTime;
          return (
            <li
              key={cue.id}
              className={`cue-item ${isActive ? 'active' : ''} ${isPast && !isActive ? 'past' : ''}`}
            >
              {/* Timeline marker */}
              <span className="cue-number">{index + 1}</span>

              {/* Progress line */}
              {totalDuration > 0 && (
                <span
                  className="cue-timeline-dot"
                  style={{ left: `${(cue.timestamp / totalDuration) * 100}%` }}
                />
              )}

              <div className="cue-info">
                <span className="cue-name">{cue.name}</span>
                <span className="cue-meta">
                  <span className="cue-time">{formatTime(cue.timestamp)}</span>
                  <span className="cue-actions-count">{cue.actions.length} akcija</span>
                </span>
              </div>

              <div className="cue-buttons">
                <button
                  className="cue-edit-btn"
                  onClick={() => onEdit(cue)}
                  title="Uredi"
                >
                  ✎
                </button>
                <button
                  className="cue-remove-btn"
                  onClick={() => onRemove(cue.id)}
                  title="Obriši"
                >
                  ×
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
