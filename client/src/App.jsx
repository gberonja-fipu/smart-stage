import { useState } from 'react';
import './App.css';
import { useStage } from './hooks/useStage';
import Stage from './components/Stage';

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
  const { stageState, isConnected, mqttHeartbeats, toggleElement, resetAll } = useStage();
  const [selectedId, setSelectedId] = useState(null);

  const activeCount = stageState
    ? Object.values(stageState).flat().filter(el => el.on).length
    : 0;

  const selectedElement = stageState && selectedId
    ? Object.values(stageState).flat().find(el => el.id === selectedId)
    : null;

  const selectedCategory = stageState && selectedId
    ? findCategory(stageState, selectedId)
    : null;

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
        {/* 2D Stage visualization */}
        <div className="stage-panel">
          <h2 className="panel-title">Pozornica</h2>
          {stageState
            ? <Stage stageState={stageState} selectedId={selectedId} onSelectElement={setSelectedId} />
            : <p className="loading">Učitavanje...</p>
          }
        </div>

        {/* Control panel */}
        <aside className="control-panel">
          {/* Selected element detail */}
          {selectedElement && selectedCategory ? (
            <div className="element-detail">
              <div className="element-detail-header">
                <span className="type-badge">{selectedElement.type}</span>
                <button className="deselect-btn" onClick={() => setSelectedId(null)}>×</button>
              </div>
              <h3 className="detail-name">{selectedElement.name}</h3>
              <div className="detail-props">
                {selectedElement.color !== undefined && (
                  <div className="prop-row">
                    <span>Boja</span>
                    <span className="prop-value">
                      <span className="color-swatch" style={{ background: selectedElement.color }} />
                      {selectedElement.color}
                    </span>
                  </div>
                )}
                {selectedElement.intensity !== undefined && (
                  <div className="prop-row">
                    <span>Intenzitet</span>
                    <span className="prop-value">{selectedElement.intensity}%</span>
                  </div>
                )}
                {selectedElement.volume !== undefined && (
                  <div className="prop-row">
                    <span>Glasnoća</span>
                    <span className="prop-value">{selectedElement.volume}%</span>
                  </div>
                )}
                {selectedElement.zone && (
                  <div className="prop-row">
                    <span>Zona</span>
                    <span className="prop-value">{selectedElement.zone}</span>
                  </div>
                )}
                {selectedElement.mode && (
                  <div className="prop-row">
                    <span>Mod</span>
                    <span className="prop-value">{selectedElement.mode}</span>
                  </div>
                )}
              </div>
              <button
                className={`toggle-btn ${selectedElement.on ? 'active' : ''}`}
                onClick={() => toggleElement(selectedCategory, selectedElement.id)}
              >
                {selectedElement.on ? 'Isključi' : 'Uključi'}
              </button>
            </div>
          ) : (
            <p className="no-selection">Klikni element na pozornici</p>
          )}

          {/* Category lists */}
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
                        toggleElement(category, element.id);
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
    </div>
  );
}

export default App;
