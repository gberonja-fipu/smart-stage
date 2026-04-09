import { useState } from 'react';
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
  } = useStage();

  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState('elementi'); // 'elementi' | 'plot'
  const [editingCue, setEditingCue] = useState(null); // null | cue object | 'new'
  const [bottomTab, setBottomTab] = useState('setlista'); // 'setlista' | 'cues'
  const [addingSetlistItem, setAddingSetlistItem] = useState(false);

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

  return (
    <div className="app">
      <header className="app-header">
        <h1>Pametna pozornica</h1>
        <div className="header-meta">
          <span className={`connection-badge ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? 'Spojeno' : 'Nije spojeno'}
          </span>
          <span className="active-count">{activeCount} aktivnih</span>
          <button className="reset-button" onClick={resetAll} disabled={!isConnected}>
            Resetiraj sve
          </button>
        </div>
      </header>

      <div className="workspace">
        {/* Lijevi panel — pozornica */}
        <div className="stage-panel">
          <div className="stage-tabs">
            <button className={`stage-tab ${activeTab === 'elementi' ? 'active' : ''}`} onClick={() => handleTabChange('elementi')}>
              Elementi
            </button>
            <button className={`stage-tab ${activeTab === 'plot' ? 'active' : ''}`} onClick={() => handleTabChange('plot')}>
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

      {/* Donja sekcija — Setlista i Cue lista kao tabovi */}
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
              onSave={(itemData) => {
                addSetlistItem(itemData);
                setAddingSetlistItem(false);
              }}
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
    </div>
  );
}

export default App;
