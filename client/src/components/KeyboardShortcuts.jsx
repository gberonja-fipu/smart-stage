import { useEffect, useRef } from 'react';

export function useKeyboardShortcuts(handlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    function onKeyDown(e) {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      const h = handlersRef.current;
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          h.onPlayPause?.();
          break;
        case 'Enter':
          e.preventDefault();
          h.onGo?.();
          break;
        case 'Escape':
          h.onEscape?.();
          break;
        default:
          break;
      }
      switch (e.key) {
        case '?':
          h.onHelp?.();
          break;
        case '1':
          h.onStageTab?.('elementi');
          break;
        case '2':
          h.onStageTab?.('plot');
          break;
        case '3':
          h.onBottomTab?.('setlista');
          break;
        case '4':
          h.onBottomTab?.('cues');
          break;
        case '5':
          h.onBottomTab?.('log');
          break;
        default:
          break;
      }
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        h.onSave?.();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}

const SHORTCUTS = [
  { key: 'Space',    desc: 'Play / Pauza (cue lista)' },
  { key: 'Enter',    desc: 'GO (Stage Manager)' },
  { key: 'Escape',   desc: 'Odznači element / zatvori' },
  { key: '1',        desc: 'Tab — Elementi' },
  { key: '2',        desc: 'Tab — Stage plot' },
  { key: '3',        desc: 'Donji tab — Setlista' },
  { key: '4',        desc: 'Donji tab — Cue lista' },
  { key: '5',        desc: 'Donji tab — Event log' },
  { key: 'Ctrl+S',   desc: 'Spremi preset' },
  { key: '?',        desc: 'Otvori / zatvori ovu pomoć' },
];

export function KeyboardHelpModal({ onClose }) {
  return (
    <div className="kb-overlay" onClick={onClose}>
      <div className="kb-modal" onClick={e => e.stopPropagation()}>
        <div className="kb-modal-header">
          <h3 className="kb-modal-title">Tipkovnički prečaci</h3>
          <button className="kb-modal-close" onClick={onClose}>✕</button>
        </div>
        <table className="kb-table">
          <tbody>
            {SHORTCUTS.map(({ key, desc }) => (
              <tr key={key} className="kb-row">
                <td className="kb-key"><kbd>{key}</kbd></td>
                <td className="kb-desc">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
