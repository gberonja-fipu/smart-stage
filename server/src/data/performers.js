function getInitialPerformers() {
  return [
    // ── Orkestar ────────────────────────────────────────────────────────────
    { id: 'orch-1',  name: 'Prva violina',  role: '1. violina (primvajaš)', group: 'orchestra', color: '#4a90d0', position: { x: 12, y: 75 } },
    { id: 'orch-2',  name: 'Druga violina', role: '2. violina',             group: 'orchestra', color: '#4a90d0', position: { x: 12, y: 65 } },
    { id: 'orch-3',  name: 'Brač',          role: 'Brač',                   group: 'orchestra', color: '#4a90d0', position: { x: 12, y: 55 } },
    { id: 'orch-4',  name: 'Bas',           role: 'Bas',                    group: 'orchestra', color: '#4a90d0', position: { x: 12, y: 45 } },
    { id: 'orch-5',  name: 'Cimbalom',      role: 'Cimbalom',               group: 'orchestra', color: '#4a90d0', position: { x: 12, y: 35 } },
    { id: 'orch-6',  name: 'Klarinet',      role: 'Klarinet',               group: 'orchestra', color: '#4a90d0', position: { x: 12, y: 25 } },
    { id: 'orch-7',  name: 'Tamburica',     role: 'Tamburica',              group: 'orchestra', color: '#4a90d0', position: { x: 12, y: 15 } },

    // ── Plesači — par 1-8 ───────────────────────────────────────────────────
    { id: 'dance-1a', name: 'Par 1 — Ž', role: 'Plesačica', group: 'dancer', color: '#e05c5c', position: { x: 32, y: 30 } },
    { id: 'dance-1b', name: 'Par 1 — M', role: 'Plesač',    group: 'dancer', color: '#e05c5c', position: { x: 38, y: 30 } },
    { id: 'dance-2a', name: 'Par 2 — Ž', role: 'Plesačica', group: 'dancer', color: '#e05c5c', position: { x: 46, y: 30 } },
    { id: 'dance-2b', name: 'Par 2 — M', role: 'Plesač',    group: 'dancer', color: '#e05c5c', position: { x: 52, y: 30 } },
    { id: 'dance-3a', name: 'Par 3 — Ž', role: 'Plesačica', group: 'dancer', color: '#e05c5c', position: { x: 60, y: 30 } },
    { id: 'dance-3b', name: 'Par 3 — M', role: 'Plesač',    group: 'dancer', color: '#e05c5c', position: { x: 66, y: 30 } },
    { id: 'dance-4a', name: 'Par 4 — Ž', role: 'Plesačica', group: 'dancer', color: '#e05c5c', position: { x: 74, y: 30 } },
    { id: 'dance-4b', name: 'Par 4 — M', role: 'Plesač',    group: 'dancer', color: '#e05c5c', position: { x: 80, y: 30 } },
    { id: 'dance-5a', name: 'Par 5 — Ž', role: 'Plesačica', group: 'dancer', color: '#e05c5c', position: { x: 32, y: 55 } },
    { id: 'dance-5b', name: 'Par 5 — M', role: 'Plesač',    group: 'dancer', color: '#e05c5c', position: { x: 38, y: 55 } },
    { id: 'dance-6a', name: 'Par 6 — Ž', role: 'Plesačica', group: 'dancer', color: '#e05c5c', position: { x: 46, y: 55 } },
    { id: 'dance-6b', name: 'Par 6 — M', role: 'Plesač',    group: 'dancer', color: '#e05c5c', position: { x: 52, y: 55 } },
    { id: 'dance-7a', name: 'Par 7 — Ž', role: 'Plesačica', group: 'dancer', color: '#e05c5c', position: { x: 60, y: 55 } },
    { id: 'dance-7b', name: 'Par 7 — M', role: 'Plesač',    group: 'dancer', color: '#e05c5c', position: { x: 66, y: 55 } },
    { id: 'dance-8a', name: 'Par 8 — Ž', role: 'Plesačica', group: 'dancer', color: '#e05c5c', position: { x: 74, y: 55 } },
    { id: 'dance-8b', name: 'Par 8 — M', role: 'Plesač',    group: 'dancer', color: '#e05c5c', position: { x: 80, y: 55 } },

    // ── Vokalni solisti ─────────────────────────────────────────────────────
    { id: 'vocal-1', name: 'Sopran',   role: 'Vokalni solist', group: 'vocalist', color: '#f0b429', position: { x: 42, y: 12 } },
    { id: 'vocal-2', name: 'Bariton',  role: 'Vokalni solist', group: 'vocalist', color: '#f0b429', position: { x: 58, y: 12 } },
  ];
}

module.exports = { getInitialPerformers };
