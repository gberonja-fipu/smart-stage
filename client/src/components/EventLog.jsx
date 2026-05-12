import { useEffect, useRef, useState, memo } from 'react';

const TYPE_LABELS = {
  system:     'SYS',
  element:    'ELM',
  cue:        'CUE',
  transport:  'TRN',
  preset:     'PRE',
  setlist:    'SET',
  mqtt:       'IOT',
  transition: 'FAD',
};

const ALL_TYPES = Object.keys(TYPE_LABELS);

function pad(n) {
  return String(n).padStart(2, '0');
}

function fmtTime(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

const EventLog = memo(function EventLog({ entries, onClear }) {
  const [filter, setFilter]     = useState(new Set(ALL_TYPES));
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  const visible = entries.filter(e => filter.has(e.type));

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [visible.length, autoScroll]);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 32;
    setAutoScroll(atBottom);
  }

  function toggleType(type) {
    setFilter(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function toggleAll() {
    setFilter(prev => prev.size === ALL_TYPES.length ? new Set() : new Set(ALL_TYPES));
  }

  return (
    <div className="event-log">
      <div className="event-log-toolbar">
        <div className="event-log-filters">
          <button
            className={`elf-btn elf-btn--all ${filter.size === ALL_TYPES.length ? 'active' : ''}`}
            onClick={toggleAll}
          >
            SVE
          </button>
          {ALL_TYPES.map(type => (
            <button
              key={type}
              className={`elf-btn elf-btn--${type} ${filter.has(type) ? 'active' : ''}`}
              onClick={() => toggleType(type)}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>
        <div className="event-log-actions">
          <span className="elf-count">{visible.length} unosa</span>
          <button className="elf-clear-btn" onClick={onClear} title="Obriši log">
            Obriši
          </button>
        </div>
      </div>

      <div className="event-log-body" ref={containerRef} onScroll={handleScroll}>
        {visible.length === 0 && (
          <p className="event-log-empty">Nema unosa.</p>
        )}
        {visible.map(entry => (
          <div key={entry.id} className={`elf-entry elf-entry--${entry.type}`}>
            <span className="elf-ts">{fmtTime(entry.ts)}</span>
            <span className="elf-badge">{TYPE_LABELS[entry.type]}</span>
            <span className="elf-msg">{entry.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {!autoScroll && (
        <button
          className="elf-scroll-btn"
          onClick={() => { setAutoScroll(true); bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
        >
          ↓ Najnovije
        </button>
      )}
    </div>
  );
});

export default EventLog;
