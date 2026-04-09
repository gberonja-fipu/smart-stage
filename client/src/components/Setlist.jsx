function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Setlist({
  items,
  activeItemId,
  presets,
  onLoad,
  onRemove,
  onReorder,
  onAdd,
  onNext,
  onPrev,
  disabled,
}) {
  function getPresetName(presetId) {
    if (!presetId) return '—';
    const preset = presets.find(p => p.id === presetId);
    return preset ? preset.name : presetId;
  }

  function moveUp(index) {
    if (index === 0) return;
    const ids = items.map(i => i.id);
    [ids[index - 1], ids[index]] = [ids[index], ids[index - 1]];
    onReorder(ids);
  }

  function moveDown(index) {
    if (index === items.length - 1) return;
    const ids = items.map(i => i.id);
    [ids[index], ids[index + 1]] = [ids[index + 1], ids[index]];
    onReorder(ids);
  }

  return (
    <div className="setlist">
      <div className="setlist-header">
        <span className="setlist-title">Setlista</span>
        <div className="setlist-nav">
          <button
            className="setlist-nav-btn"
            onClick={onPrev}
            disabled={disabled || items.length === 0}
            title="Prethodna točka"
          >
            &#8592;
          </button>
          <button
            className="setlist-nav-btn"
            onClick={onNext}
            disabled={disabled || items.length === 0}
            title="Sljedeća točka"
          >
            &#8594;
          </button>
          <button
            className="setlist-add-btn"
            onClick={onAdd}
            disabled={disabled}
          >
            + Dodaj točku
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="setlist-empty">Setlista je prazna.</p>
      ) : (
        <ol className="setlist-items">
          {items.map((item, index) => (
            <li
              key={item.id}
              className={`setlist-item ${item.id === activeItemId ? 'active' : ''}`}
              onClick={() => !disabled && onLoad(item.id)}
            >
              <span className="setlist-number">{item.order}</span>

              <div className="setlist-info">
                <span className="setlist-name">{item.name}</span>
                <span className="setlist-meta">
                  <span className="setlist-preset">{getPresetName(item.presetId)}</span>
                  <span className="setlist-duration">{formatDuration(item.duration)}</span>
                </span>
              </div>

              <div className="setlist-actions" onClick={e => e.stopPropagation()}>
                <button
                  className="setlist-order-btn"
                  onClick={() => moveUp(index)}
                  disabled={disabled || index === 0}
                  title="Gore"
                >
                  ▲
                </button>
                <button
                  className="setlist-order-btn"
                  onClick={() => moveDown(index)}
                  disabled={disabled || index === items.length - 1}
                  title="Dolje"
                >
                  ▼
                </button>
                <button
                  className="setlist-remove-btn"
                  onClick={() => onRemove(item.id)}
                  disabled={disabled}
                  title="Ukloni"
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
