import { useState, useRef } from 'react';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export default function DataManager({ onToast }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData]  = useState(null);
  const [importing, setImporting]      = useState(false);
  const [exporting, setExporting]      = useState(false);
  const fileRef = useRef(null);

  // ── Export ────────────────────────────────────────────────────────────────
  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/export`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `pametna-pozornica-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onToast?.('Podatci izvezeni', 'success');
    } catch (e) {
      onToast?.(`Greška izvoza: ${e.message}`, 'error');
    } finally {
      setExporting(false);
    }
  }

  // ── Import — step 1: odabir datoteke ─────────────────────────────────────
  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.presets && !data.cues && !data.setlist) {
          throw new Error('Neispravan format datoteke');
        }
        setPendingData(data);
        setShowConfirm(true);
      } catch (err) {
        onToast?.(`Greška čitanja: ${err.message}`, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ── Import — step 2: potvrda i slanje na server ───────────────────────────
  async function confirmImport() {
    if (!pendingData) return;
    setImporting(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/import`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(pendingData),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      onToast?.('Podatci uvezeni', 'success');
      setShowConfirm(false);
      setPendingData(null);
    } catch (e) {
      onToast?.(`Greška uvoza: ${e.message}`, 'error');
    } finally {
      setImporting(false);
    }
  }

  function cancelImport() {
    setShowConfirm(false);
    setPendingData(null);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="data-manager">
        <button
          className="dm-btn"
          onClick={handleExport}
          disabled={exporting}
          title="Izvezi presete, cue listu i setlistu u JSON"
        >
          {exporting ? '…' : '↓'} Izvezi
        </button>

        <button
          className="dm-btn dm-btn--import"
          onClick={() => fileRef.current?.click()}
          title="Uvezi podatke iz JSON datoteke"
        >
          ↑ Uvezi
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {/* ── Confirm modal ───────────────────────────────────────────────── */}
      {showConfirm && (
        <div className="dm-overlay" onClick={cancelImport}>
          <div className="dm-modal" onClick={e => e.stopPropagation()}>
            <h3 className="dm-modal-title">Uvoz podataka</h3>
            <p className="dm-modal-body">
              Ovo će <strong>zamijeniti</strong> sve postojeće podatke na serveru.
              Radnja se ne može poništiti.
            </p>

            {pendingData && (
              <ul className="dm-preview">
                {pendingData.presets  && <li>{pendingData.presets.length} preseta</li>}
                {pendingData.cues     && <li>{pendingData.cues.length} cue-ova</li>}
                {pendingData.setlist  && <li>{pendingData.setlist.length} stavki setliste</li>}
                {pendingData.exportedAt && (
                  <li className="dm-preview-date">
                    Izvezeno: {new Date(pendingData.exportedAt).toLocaleString('hr-HR')}
                  </li>
                )}
              </ul>
            )}

            <div className="dm-modal-actions">
              <button className="dm-cancel-btn" onClick={cancelImport} disabled={importing}>
                Odustani
              </button>
              <button className="dm-confirm-btn" onClick={confirmImport} disabled={importing}>
                {importing ? 'Uvozim…' : 'Potvrdi uvoz'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
