import './App.css';
import { useStage } from './hooks/useStage';

const CATEGORY_LABELS = {
  lights: 'Rasvjeta',
  smoke: 'Dim',
  leds: 'LED',
  speakers: 'Zvuk',
};

function App() {
  const { stageState, isConnected, toggleElement, resetAll } = useStage();

  const activeCount = stageState
    ? Object.values(stageState).flat().filter(el => el.on).length
    : 0;

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

      <main className="stage-grid">
        {!stageState && <p className="loading">Učitavanje...</p>}

        {stageState && Object.entries(CATEGORY_LABELS).map(([category, label]) => (
          <section key={category} className="category-section">
            <h2 className="category-header">{label}</h2>
            <ul className="element-list">
              {stageState[category].map(element => (
                <li
                  key={element.id}
                  className={`element-item ${element.on ? 'on' : 'off'}`}
                  onClick={() => toggleElement(category, element.id)}
                >
                  <span className={`status-dot ${element.on ? 'on' : 'off'}`} />
                  <span className="element-name">{element.name}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}

export default App;
