import LightControl from './controls/LightControl';
import SmokeControl from './controls/SmokeControl';
import LedControl from './controls/LedControl';
import SpeakerControl from './controls/SpeakerControl';

const CONTROL_MAP = {
  light:   LightControl,
  smoke:   SmokeControl,
  led:     LedControl,
  speaker: SpeakerControl,
};

export default function ControlPanel({
  selectedElement,
  selectedCategory,
  updateElement,
  toggleElement,
  onDeselect,
}) {
  if (!selectedElement) {
    return <p className="no-selection">Klikni element na pozornici</p>;
  }

  const Control = CONTROL_MAP[selectedElement.type];

  function handleUpdate(changes) {
    updateElement(selectedCategory, selectedElement.id, changes);
  }

  function handleToggle() {
    toggleElement(selectedCategory, selectedElement.id);
  }

  return (
    <div className="control-panel-content">
      <div className="cp-header">
        <div className="cp-header-left">
          <span className="type-badge">{selectedElement.type}</span>
          <h3 className="cp-name">{selectedElement.name}</h3>
        </div>
        <button className="deselect-btn" onClick={onDeselect}>×</button>
      </div>

      <div className="cp-toggle-row">
        <span className="cp-status-label">
          {selectedElement.on ? 'Uključeno' : 'Isključeno'}
        </span>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={selectedElement.on}
            onChange={handleToggle}
          />
          <span className="toggle-track">
            <span className="toggle-thumb" />
          </span>
        </label>
      </div>

      {Control && <Control element={selectedElement} onUpdate={handleUpdate} />}
    </div>
  );
}
