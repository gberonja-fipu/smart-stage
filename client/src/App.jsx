import { useState, useEffect, useRef } from 'react';
import './App.css';
import { useStage } from './hooks/useStage';
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

const CATEGORY_LABELS = {
  lights: 'Rasvjeta',
  smoke: 'Dim',
  leds: 'LED',
  speakers: 'Zvuk',
};

function findCategory(stageState, elementId) {
  for (const [category, elements] of Object.entries(stageState)) {
    if (elements.some(el => el.id === elementId)) return category;
  }
  return null;
}

function App() {
  const {
    stageState, isConnected, mqttHeartbeats,
    updateElement, toggleElement, resetAll,
    performers, updatePerformerPosition,
    presets, activePresetId, loadPreset, savePreset,
    cueList, isPlaying, currentTime, activeCueId,
    addCue, removeCue, updateCue,
    playCues, pauseCues, stopCues, seekCues,
    setlist, activeSetlistItemId,
    loadSetlistItem, nextItem, prevItem,
    addSetlistItem, removeSetlistItem, reorderSetlist,
    isTransitioning, transitionProgress,
    autoPlay, toggleAutoPlay, lastCueFinishedAt,
    smStandbyId, smLastFiredId, smGo, smStandby, smHold, smReset,
  } = useStage();

  // Aktivni view: 'technician' | 'stageManager'
  const [view, setView]                   = useState('technician');
  const [selectedId, setSelectedId]       = useState(null);
  const [activeTab, setActiveTab]         = useState('elementi');
  const [editingCue, setEditingCue]       = useState(null);
  const [bottomTab, setBottomTab]         = useState('setlista');
  const [addingSetlistItem, setAddingSetlistItem] = useState(false);

  // ── Auto-play ──────────────────────────────────────────────────────────────
  const autoPlayRef = useRef(autoPlay);
  useEffect(() => { autoPlayRef.current = autoPlay; }, [autoPlay]);

  useEffect(() => {
    if (!lastCueFinishedAt) return;
    if (!autoPlayRef.current) return;
    if (setlist.length === 0) return;
    const timer = setTimeout(() => nextItem(), 1500);
    return () => clearTimeout(timer);
  }, [lastCueFinishedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Computed ───────────────────────────────────────────────────────────────
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
  const currentSetlistItem  = activeSetlistIndex >= 0 ? sortedSetlist[activeSetlistIndex] : null;
  const currentItemName     = currentSetlistItem?.name ?? null;
  const nextItemName        = sortedSetlist.length > 0
    ? sortedSetlist[(activeSetlistIndex + 1) % sortedSetlist.length]?.name
    : null;

  const activeCue     = activeCueId ? cueList.find(c => c.id === activeCueId) : null;
  const activeCueName = activeCue?.name ?? null;

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleTabChange(tab) {
    setActiveTab(tab);
    if (tab === 'plot') setSelectedId(null);
  }

  function handleSaveCue(cueData) {
    if (cueData.id) {
      const { id, ...changes } = cueData;
      updateCue(id, changes);
    } else {
      addCue(cueData);
    }
    setEditingCue(null);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="app">
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
          <button className="reset-button" onClick={resetAll} disabled={!isConnected}>
            Resetiraj sve
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
                  <Stage
                    stageState={stageState}
                    selectedId={selectedId}
                    onSelectElement={activeTab === 'elementi' ? setSelectedId : () => {}}
                    performers={performers}
                    onMovePerformer={updatePerformerPosition}
                    showPlot={activeTab === 'plot'}
                  />
                )
                : <p className="loading">Učitavanje...</p>
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
                    <h2 className="category-header">{label}</h2>
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
            onReset={smReset}
            currentSetlistItem={currentSetlistItem}
            isConnected={isConnected}
            isTransitioning={isTransitioning}
          />
        </div>
      )}

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

export default App;
