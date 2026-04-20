import { useState, useEffect } from 'react';

export default function StatusBar({
  isConnected,
  mqttHeartbeats,
  currentItemName,
  activeCueName,
  isTransitioning,
  transitionProgress,
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const allDevices    = Object.keys(mqttHeartbeats);
  const activeDevices = allDevices.filter(id => mqttHeartbeats[id]);

  const timeStr = time.toLocaleTimeString('hr-HR', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="status-bar">
      {/* Lijevo — Socket.IO i MQTT */}
      <div className="status-section status-left">
        <span className={`status-dot-sm ${isConnected ? 'on' : 'off'}`} />
        <span className="status-text">{isConnected ? 'Online' : 'Offline'}</span>
        <span className="status-sep">·</span>
        <span className="status-text">
          MQTT&nbsp;
          <span className={activeDevices.length > 0 ? 'status-mqtt-active' : 'status-mqtt-idle'}>
            {activeDevices.length}/{allDevices.length}
          </span>
        </span>
      </div>

      {/* Sredina — trenutna točka i cue */}
      <div className="status-section status-center">
        {isTransitioning && (
          <span className="status-fade-badge">
            Fade {Math.round(transitionProgress * 100)}%
          </span>
        )}
        {currentItemName && (
          <span className="status-item-name">{currentItemName}</span>
        )}
        {activeCueName && (
          <>
            <span className="status-arrow">›</span>
            <span className="status-cue-name">{activeCueName}</span>
          </>
        )}
        {!currentItemName && !activeCueName && !isTransitioning && (
          <span className="status-idle">Pametna pozornica</span>
        )}
      </div>

      {/* Desno — sat */}
      <div className="status-section status-right">
        <span className="status-clock">{timeStr}</span>
      </div>
    </div>
  );
}
