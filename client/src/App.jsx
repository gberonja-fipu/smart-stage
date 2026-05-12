import { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import { useStage } from './hooks/useStage';
import { useEventLog } from './hooks/useEventLog';
import { useKeyboardShortcuts, KeyboardHelpModal } from './components/KeyboardShortcuts';
import { ToastProvider, useToast } from './components/Toast';
import Stage from './components/Stage';
import ControlPanel from './components/ControlPanel';
import PresetSelector from './components/PresetSelector';
import CueList from './components/CueList';
import CueEditor from './components/CueEditor';
import TransportControls from './components/TransportControls';
import Setlist from './components/Setlist';
import SetlistEditor from './components/SetlistEditor';
import StageManagerPanel from './components/StageManagerPanel';
import StatusBar from './components/StatusBar';
import DataManager from './components/DataManager';
import EventLog from './components/EventLog';
import MiniMap from './components/MiniMap';

const CATEGORY_LABELS = {
  lights: 'Rasvjeta',
  smoke: 'Dim',
  leds: 'LED',
  speakers: 'Zvuk',
};

const CATEGORY_ICONS = {
  lights: '💡',
  smoke:  '💨',
  leds:   '🌈',
  speakers: '🔊',
};

function findCategory(stageState, elementId) {
  for (const [category, elements] of Object.entries(stageState)) {
    if (elements.some(el => el.id === elementId)) return category;
  }
  return null;
}

// ── Skeleton placeholder while stage loads ────────────────────────────────────
function StageSkeleton() {
  return (
    <div className="stage-skeleton">
      <div className="skeleton skeleton-stage" />
      <div className="skeleton-row">
        <div className="skeleton skeleton-bar" />
        <div className="skeleton skeleton-bar skeleton-bar--short" />
      </div>
    </div>
  );
}

// ── Disconnect overlay ────────────────────────────────────────────────────────
function DisconnectOverlay({ visible }) {
  if (!visible) return null;
  return (
    <div className="disconnect-overlay">
      <div className="disconnect-card">
        <div className="disconnect-spinner" />
        <p className="disconnect-title">Spajanje na server...</p>
        <p className="disconnect-sub">Provjeri je li server pokrenut na portu 3001</p>
      </div>
    </div>
  );
}

// ── Inner app (needs ToastProvider in tree) ───────────────────────────────────
function AppInner() {
  const addToast = useToast();

  const {
    stageState, isConnected, isReconnecting, mqttHeartbeats,
    updateElement, toggleElement, resetAll,
    performers, updatePerformerPosition,
    presets, activePresetId,
    loadPreset: _loadPreset,
    savePreset: _savePreset,
    cueList, isPlaying, currentTime, activeCueId,
    addCue: _addCue, removeCue, updateCue,
    playCues, pauseCues, stopCues, seekCues,
    setlist, activeSetlistItemId,
    loadSetlistItem: _loadSetlistItem,
    nextItem, prevItem,
    addSetlistItem: _addSetlistItem,
    removeSetlistItem, reorderSetlist,
    isTransitioning, transitionProgress,
    autoPlay, toggleAutoPlay, lastCueFinishedAt,
    smStandbyId, smLastFiredId,
    smGo: _smGo, smStandby, smHold, smReset,
  } = useStage();

  // ── Wrapped actions with toast feedback ──────────────────────────────────────
  function loadPreset(id) {
    _loadPreset(id);
    const p = presets.find(pr => pr.id === id);
    addToast(p ? `Preset učitan: ${p.name}` : 'Preset učitan', 'success');
  }

  function savePreset(name, description) {
    _savePreset(name, description);
    addToast(`Preset spremljen: ${name}`, 'success');
  }

  function addCue(cueData) {
    _addCue(cueData);
    addToast(`Cue dodan: ${cueData.name || '—'}`, 'success');
  }

  function addSetlistItem(itemData) {
    _addSetlistItem(itemData);
    addToast(`Točka dodana: ${itemData.name || '—'}`, 'success');
  }

  function loadSetlistItem(id, instant = false) {
    _loadSetlistItem(id, instant);
    const item = setlist.find(i => i.id === id);
    if (item) addToast(`Točka: ${item.name}`, 'info');
  }

  function smGo() {
    startSmStopwatch();
    _smGo();
    addToast('GO →', 'success');
  }

  // ── Event log ────────────────────────────────────────────────────────────────
  const { entries: logEntries, clearLog } = useEventLog({ presets, cueList, setlist });

  // ── Local view state ─────────────────────────────────────────────────────────
  const [view, setView]                   = useState('technician');
  const [selectedId, setSelectedId]       = useState(null);
  const [activeTab, setActiveTab]         = useState('elementi');
  const [editingCue, setEditingCue]       = useState(null);
  const [bottomTab, setBottomTab]         = useState('setlista');
  const [addingSetlistItem, setAddingSetlistItem] = useState(false);
  const [showHelp, setShowHelp]           = useState(false);

  // ── Stage Manager stopwatch (lifted here so it survives tab switches) ─────────
  const [smElapsed, setSmElapsed]         = useState(0);
  const [smTimerActive, setSmTimerActive] = useState(false);
  const smIntervalRef = useRef(null);
  const smStartRef    = useRef(null);

  const startSmStopwatch = useCallback(() => {
    if (smIntervalRef.current) clearInterval(smIntervalRef.current);
    smStartRef.current = Date.now() - smElapsed * 1000;
    setSmTimerActive(true);
    smIntervalRef.current = setInterval(() => {
      setSmElapsed(Math.floor((Date.now() - smStartRef.current) / 1000));
    }, 500);
  }, [smElapsed]);

  const resetSmStopwatch = useCallback(() => {
    if (smIntervalRef.current) clearInterval(smIntervalRef.current);
    setSmElapsed(0);
    setSmTimerActive(false);
  }, []);

  useEffect(() => () => { if (smIntervalRef.current) clearInterval(smIntervalRef.current); }, []);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useKeyboardShortcuts({
    onPlayPause:  () => isPlaying ? pauseCues() : playCues(),
    onGo:         () => view === 'stageManager' ? smGo() : undefined,
    onEscape:     () => { setSelectedId(null); setShowHelp(false); setEditingCue(null); },
    onHelp:       () => setShowHelp(prev => !prev),
    onStageTab:   (tab) => handleTabChange(tab),
    onBottomTab:  (tab) => setBottomTab(tab),
    onSave:       () => activeTab === 'plot' ? undefined : undefined,
  });

  // ── Auto-play ────────────────────────────────────────────────────────────────
  const autoPlayRef = useRef(autoPlay);
  useEffect(() => { autoPlayRef.current = autoPlay; }, [autoPlay]);

  useEffect(() => {
    if (!lastCueFinishedAt) return;
    if (!autoPlayRef.current) return;
    if (setlist.length === 0) return;
    const timer = setTimeout(() => nextItem(), 1500);
    return () => clearTimeout(timer);
  }, [lastCueFinishedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toast on cue executed ────────────────────────────────────────────────────
  const prevActiveCueId = useRef(null);
  useEffect(() => {
    if (activeCueId && activeCueId !== prevActiveCueId.current) {
      const cue = cueList.find(c => c.id === activeCueId);
      if (cue) addToast(`Cue: ${cue.name}`, 'info');
    }
    prevActiveCueId.current = activeCueId;
  }, [activeCueId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Toast on reconnect ───────────────────────────────────────────────────────
  const wasConnected = useRef(isConnected);
  useEffect(() => {
    if (!wasConnected.current && isConnected) {
      addToast('Uspješno spojeno na server', 'success');
    }
    wasConnected.current = isConnected;
  }, [isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Computed ─────────────────────────────────────────────────────────────────
  const activeCount = stageState
    ? Object.values(stageState).flat().filter(el => el.on).length
    : 0;

  const selectedElement = stageState && selectedId
    ? Object.values(stageState).flat().find(el => el.id === selectedId)
    : null;

  const selectedCategory = stageState && selectedId
    ? findCategory(stageState, selectedId)
    : null;

  const totalDuration = cueList.length > 0 ? cueList[cueList.length - 1].timestamp : 0;

  const sortedSetlist = [...setlist].sort((a, b) => a.order - b.order);
  const activeSetlistIndex = activeSetlistItemId
    ? sortedSetlist.findIndex(i => i.id === activeSetlistItemId)
    : -1;
  const currentSetlistItem = activeSetlistIndex >= 0 ? sortedSetlist[activeSetlistIndex] : null;
  const currentItemName    = currentSetlistItem?.name ?? null;
  const nextItemName       = sortedSetlist.length > 0
    ? sortedSetlist[(activeSetlistIndex + 1) % sortedSetlist.length]?.name
    : null;

  const activeCue     = activeCueId ? cueList.find(c => c.id === activeCueId) : null;
  const activeCueName = activeCue?.name ?? null;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleTabChange(tab) {
    setActiveTab(tab);
    if (tab === 'plot') setSelectedId(null);
  }

  function handleSaveCue(cueData) {
    if (cueData.id) {
      const { id, ...changes } = cueData;
      updateCue(id, changes);
      addToast('Cue ažuriran', 'success');
    } else {
      addCue(cueData);
    }
    setEditingCue(null);
  }

  function handleResetAll() {
    resetAll();
    addToast('Sve resetirano', 'info');
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="app">
      {/* ── Disconnect overlay ─────────────────────────────────────────────── */}
      <DisconnectOverlay visible={isReconnecting && !isConnected} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="app-header">
        <h1>Pametna pozornica</h1>
        <div className="header-meta">
          <span className={`connection-badge ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? 'Spojeno' : 'Nije spojeno'}
          </span>
          {isTransitioning && (
            <span className="header-transition-badge">
              Fade {Math.round(transitionProgress * 100)}%
            </span>
          )}
          <span className="active-count">{activeCount} aktivnih</span>
          <button className="reset-button" onClick={handleResetAll} disabled={!isConnected}>
            Resetiraj sve
          </button>
          <DataManager onToast={addToast} />
          <button className="help-button" onClick={() => setShowHelp(prev => !prev)} title="Tipkovnički prečaci (?)">
            ?
          </button>
        </div>
      </header>

      {/* ── View tabs ──────────────────────────────────────────────────────── */}
      <nav className="view-tabs">
        <button
          className={`view-tab ${view === 'technician' ? 'active' : ''}`}
          onClick={() => setView('technician')}
        >
          Tehničar
        </button>
        <button
          className={`view-tab view-tab--sm ${view === 'stageManager' ? 'active' : ''}`}
          onClick={() => setView('stageManager')}
        >
          Stage Manager
        </button>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════════
          TEHNIČAR VIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {view === 'technician' && (
        <>
          <div className="workspace">
            {/* Lijevi panel — pozornica */}
            <div className="stage-panel">
              <div className="stage-tabs">
                <button
                  className={`stage-tab ${activeTab === 'elementi' ? 'active' : ''}`}
                  onClick={() => handleTabChange('elementi')}
                >
                  Elementi
                </button>
                <button
                  className={`stage-tab ${activeTab === 'plot' ? 'active' : ''}`}
                  onClick={() => handleTabChange('plot')}
                >
                  Stage plot
                </button>
              </div>

              {activeTab === 'plot' && (
                <PresetSelector
                  presets={presets}
                  activePresetId={activePresetId}
                  onLoadPreset={loadPreset}
                  onSavePreset={savePreset}
                  disabled={!isConnected}
                />
              )}

              {stageState
                ? (
                  <div className="stage-with-minimap">
                    <Stage
                      stageState={stageState}
                      selectedId={selectedId}
                      onSelectElement={activeTab === 'elementi' ? setSelectedId : () => {}}
                      performers={performers}
                      onMovePerformer={updatePerformerPosition}
                      showPlot={activeTab === 'plot'}
                    />
                    {activeTab === 'elementi' && (
                      <MiniMap
                        stageState={stageState}
                        selectedId={selectedId}
                        onSelectElement={setSelectedId}
                      />
                    )}
                  </div>
                )
                : <StageSkeleton />
              }
            </div>

            {/* Desni panel — kontrole */}
            <aside className="control-panel">
              <ControlPanel
                selectedElement={selectedElement}
                selectedCategory={selectedCategory}
                updateElement={updateElement}
                toggleElement={toggleElement}
                onDeselect={() => setSelectedId(null)}
              />

              <div className="element-lists">
                {stageState && Object.entries(CATEGORY_LABELS).map(([category, label]) => (
                  <section key={category} className="category-section">
                    <h2 className="category-header">
                      <span className="category-icon">{CATEGORY_ICONS[category]}</span>
                      {label}
                    </h2>
                    <ul className="element-list">
                      {stageState[category].map(element => (
                        <li
                          key={element.id}
                          className={`element-item ${element.on ? 'on' : 'off'} ${selectedId === element.id ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedId(element.id);
                            if (activeTab === 'elementi') toggleElement(category, element.id);
                          }}
                        >
                          <span className={`status-dot ${element.on ? 'on' : 'off'}`} />
                          <span className="element-name">{element.name}</span>
                          <span
                            className={`heartbeat-dot ${mqttHeartbeats[element.id] ? 'active' : ''}`}
                            title={mqttHeartbeats[element.id] ? 'IoT uređaj aktivan' : 'Čekanje heartbeat...'}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </aside>
          </div>

          {/* Donja sekcija — Setlista / Cue lista */}
          <section className="bottom-section">
            <div className="bottom-tabs">
              <button
                className={`bottom-tab ${bottomTab === 'setlista' ? 'active' : ''}`}
                onClick={() => setBottomTab('setlista')}
              >
                Setlista
              </button>
              <button
                className={`bottom-tab ${bottomTab === 'cues' ? 'active' : ''}`}
                onClick={() => setBottomTab('cues')}
              >
                Cue lista
              </button>
              <button
                className={`bottom-tab ${bottomTab === 'log' ? 'active' : ''}`}
                onClick={() => setBottomTab('log')}
              >
                Event log
                {logEntries.length > 0 && <span className="bottom-tab-badge">{logEntries.length}</span>}
              </button>
            </div>

            {bottomTab === 'setlista' && (
              addingSetlistItem ? (
                <SetlistEditor
                  presets={presets}
                  onSave={(itemData) => { addSetlistItem(itemData); setAddingSetlistItem(false); }}
                  onCancel={() => setAddingSetlistItem(false)}
                />
              ) : (
                <Setlist
                  items={setlist}
                  activeItemId={activeSetlistItemId}
                  presets={presets}
                  onLoad={loadSetlistItem}
                  onRemove={removeSetlistItem}
                  onReorder={reorderSetlist}
                  onAdd={() => setAddingSetlistItem(true)}
                  onNext={nextItem}
                  onPrev={prevItem}
                  disabled={!isConnected}
                />
              )
            )}

            {bottomTab === 'cues' && (
              <>
                <TransportControls
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  totalDuration={totalDuration}
                  onPlay={playCues}
                  onPause={pauseCues}
                  onStop={stopCues}
                  onSeek={seekCues}
                  disabled={!isConnected || cueList.length === 0}
                  autoPlay={autoPlay}
                  onToggleAutoPlay={toggleAutoPlay}
                  currentItemName={currentItemName}
                  nextItemName={nextItemName}
                  isTransitioning={isTransitioning}
                  transitionProgress={transitionProgress}
                />
                {editingCue ? (
                  <CueEditor
                    cue={editingCue === 'new' ? null : editingCue}
                    stageState={stageState}
                    onSave={handleSaveCue}
                    onCancel={() => setEditingCue(null)}
                  />
                ) : (
                  <CueList
                    cues={cueList}
                    activeCueId={activeCueId}
                    currentTime={currentTime}
                    onRemove={removeCue}
                    onEdit={cue => setEditingCue(cue)}
                    onAdd={() => setEditingCue('new')}
                  />
                )}
              </>
            )}

            {bottomTab === 'log' && (
              <EventLog entries={logEntries} onClear={clearLog} />
            )}
          </section>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          STAGE MANAGER VIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {view === 'stageManager' && (
        <div className="sm-view">
          <StageManagerPanel
            cueList={cueList}
            activeCueId={activeCueId}
            smStandbyId={smStandbyId}
            smLastFiredId={smLastFiredId}
            onGo={smGo}
            onStandby={smStandby}
            onHold={smHold}
            onReset={() => { smReset(); resetSmStopwatch(); }}
            currentSetlistItem={currentSetlistItem}
            isConnected={isConnected}
            isTransitioning={isTransitioning}
            elapsed={smElapsed}
            timerActive={smTimerActive}
            onResetStopwatch={resetSmStopwatch}
          />
        </div>
      )}

      {/* ── Keyboard help modal ────────────────────────────────────────────── */}
      {showHelp && <KeyboardHelpModal onClose={() => setShowHelp(false)} />}

      {/* ── Status bar (uvijek vidljiv) ─────────────────────────────────────── */}
      <StatusBar
        isConnected={isConnected}
        mqttHeartbeats={mqttHeartbeats}
        currentItemName={currentItemName}
        activeCueName={activeCueName}
        isTransitioning={isTransitioning}
        transitionProgress={transitionProgress}
      />
    </div>
  );
}

// ── Root — wraps AppInner with ToastProvider ──────────────────────────────────
export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
