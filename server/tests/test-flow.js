/**
 * test-flow.js — Integration test for Pametna pozornica server
 * Run with: node tests/test-flow.js
 *
 * Requires server running on port 3001.
 * Install dependency first: npm install --save-dev socket.io-client
 */

'use strict';

const { io } = require('socket.io-client');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001';
const TIMEOUT_MS = 5000;

// ── Helpers ───────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function pass(label) {
  console.log(`  ✓  ${label}`);
  passed++;
}

function fail(label, reason = '') {
  console.error(`  ✗  ${label}${reason ? ` — ${reason}` : ''}`);
  failed++;
}

function wait(socket, event, timeoutMs = TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for "${event}"`));
    }, timeoutMs);
    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Test runner ───────────────────────────────────────────────────────────────

async function run() {
  console.log('\n══════════════════════════════════════════════');
  console.log(' Pametna pozornica — Integration test');
  console.log(`  Server: ${SERVER_URL}`);
  console.log('══════════════════════════════════════════════\n');

  const socket = io(SERVER_URL, { transports: ['websocket'], timeout: TIMEOUT_MS });

  // ── 1. Connection ──────────────────────────────────────────────────────────
  console.log('[1] Konekcija');
  try {
    await wait(socket, 'connect', TIMEOUT_MS);
    pass('Spojen na server');
  } catch (e) {
    fail('Konekcija neuspješna', e.message);
    socket.disconnect();
    return finish();
  }

  // ── 2. Initial state ───────────────────────────────────────────────────────
  console.log('\n[2] Početno stanje');
  try {
    const statePromise = wait(socket, 'stage:stateReset');
    socket.emit('stage:getState');
    const state = await statePromise;

    if (state && state.lights && Array.isArray(state.lights)) {
      pass(`Primljeno stanje — ${state.lights.length} svjetla, ${(state.leds || []).length} LED`);
    } else {
      fail('Stanje scene nije ispravnog formata', JSON.stringify(state));
    }
  } catch (e) {
    fail('stage:getState timeout', e.message);
  }

  // ── 3. Presets ────────────────────────────────────────────────────────────
  console.log('\n[3] Preseti');
  let presets = [];
  try {
    const p = wait(socket, 'stage:presetsLoaded');
    socket.emit('stage:getPresets');
    presets = await p;

    if (Array.isArray(presets) && presets.length > 0) {
      pass(`Preseti učitani — ${presets.length} preseta (${presets.map(p => p.name).join(', ')})`);
    } else {
      fail('Nema preseta ili pogrešan format');
    }
  } catch (e) {
    fail('stage:getPresets timeout', e.message);
  }

  // ── 4. Toggle element ─────────────────────────────────────────────────────
  console.log('\n[4] Toggle elementa');
  try {
    const updatePromise = wait(socket, 'stage:elementUpdated');
    socket.emit('stage:toggleElement', { category: 'lights', id: 'light-1' });
    const { category, element } = await updatePromise;

    if (category === 'lights' && element.id === 'light-1' && typeof element.on === 'boolean') {
      pass(`Toggle light-1 → on=${element.on}`);
    } else {
      fail('Toggle element — neočekivani odgovor', JSON.stringify({ category, element }));
    }
  } catch (e) {
    fail('stage:toggleElement timeout', e.message);
  }

  // ── 5. Update element ─────────────────────────────────────────────────────
  console.log('\n[5] Update elementa');
  try {
    const updatePromise = wait(socket, 'stage:elementUpdated');
    socket.emit('stage:updateElement', { category: 'lights', id: 'light-1', changes: { intensity: 75 } });
    const { element } = await updatePromise;

    if (element && element.intensity === 75) {
      pass('Update light-1 intensity → 75');
    } else {
      fail('Update element — intensity nije 75', JSON.stringify(element));
    }
  } catch (e) {
    fail('stage:updateElement timeout', e.message);
  }

  // ── 6. Load preset ────────────────────────────────────────────────────────
  console.log('\n[6] Učitavanje preseta');
  if (presets.length > 0) {
    try {
      const firstPreset = presets[0];
      const loadedPromise = wait(socket, 'stage:presetLoaded');
      socket.emit('stage:loadPreset', { presetId: firstPreset.id });
      const presetId = await loadedPromise;

      if (presetId === firstPreset.id) {
        pass(`Preset učitan — "${firstPreset.name}" (${presetId})`);
      } else {
        fail('Preset ID ne odgovara', `expected=${firstPreset.id} got=${presetId}`);
      }
    } catch (e) {
      fail('stage:loadPreset timeout', e.message);
    }
  } else {
    fail('Preskačem load preset — nema preseta');
  }

  // ── 7. Cue list ───────────────────────────────────────────────────────────
  console.log('\n[7] Cue lista');
  let cues = [];
  try {
    const cuePromise = wait(socket, 'cue:listUpdated');
    socket.emit('cue:getList');
    cues = await cuePromise;

    if (Array.isArray(cues)) {
      pass(`Cue lista primljena — ${cues.length} cue-ova`);
    } else {
      fail('Cue lista — pogrešan format');
    }
  } catch (e) {
    fail('cue:getList timeout', e.message);
  }

  // ── 8. Add cue ────────────────────────────────────────────────────────────
  console.log('\n[8] Dodavanje cue-a');
  let addedCue = null;
  try {
    const addPromise = wait(socket, 'cue:listUpdated');
    socket.emit('cue:add', {
      name: 'Test Cue',
      timestamp: 2,
      actions: [
        { category: 'lights', elementId: 'light-2', changes: { on: true, intensity: 50 } },
      ],
    });
    const updatedCues = await addPromise;
    addedCue = updatedCues.find(c => c.name === 'Test Cue');

    if (addedCue && addedCue.id) {
      pass(`Cue dodan — id=${addedCue.id}, timestamp=${addedCue.timestamp}s`);
    } else {
      fail('Cue nije dodan');
    }
  } catch (e) {
    fail('cue:add timeout', e.message);
  }

  // ── 9. Play cue list ─────────────────────────────────────────────────────
  console.log('\n[9] Playback cue liste');
  if (cues.length > 0 || addedCue) {
    try {
      // First stop to reset
      socket.emit('cue:stop');
      await sleep(200);

      // Seek to timestamp=1 so "Test Cue" at t=2 fires soon
      socket.emit('cue:seek', { time: 1 });
      await sleep(100);

      const executedPromise = wait(socket, 'cue:executed', 8000);
      socket.emit('cue:play');

      const { cueId } = await executedPromise;
      if (cueId) {
        const name = (cues.find(c => c.id === cueId) || addedCue || {}).name || cueId;
        pass(`Cue izvršen — "${name}" (${cueId})`);
      } else {
        fail('cue:executed — nema cueId');
      }

      // Stop after test
      socket.emit('cue:stop');
      await sleep(200);
    } catch (e) {
      fail('Cue playback timeout', e.message);
      socket.emit('cue:stop');
    }
  } else {
    fail('Preskačem playback — nema cue-ova');
  }

  // ── 10. Setlist ───────────────────────────────────────────────────────────
  console.log('\n[10] Setlista');
  let setlist = [];
  try {
    const setlistPromise = wait(socket, 'setlist:updated');
    socket.emit('setlist:get');
    setlist = await setlistPromise;

    if (Array.isArray(setlist)) {
      pass(`Setlista primljena — ${setlist.length} točaka`);
    } else {
      fail('Setlista — pogrešan format');
    }
  } catch (e) {
    fail('setlist:get timeout', e.message);
  }

  // ── 11. Load setlist item ─────────────────────────────────────────────────
  console.log('\n[11] Učitavanje točke iz setliste');
  if (setlist.length > 0) {
    try {
      const first = setlist[0];
      const activePromise = wait(socket, 'setlist:activeItem');
      socket.emit('setlist:loadItem', { id: first.id, instant: true });
      const activeId = await activePromise;

      if (activeId === first.id) {
        pass(`Točka učitana — "${first.name}" (${activeId})`);
      } else {
        fail('Active item ID ne odgovara', `expected=${first.id} got=${activeId}`);
      }
    } catch (e) {
      fail('setlist:loadItem timeout', e.message);
    }
  } else {
    fail('Preskačem load setlist item — setlista prazna');
  }

  // ── 12. Stage Manager ─────────────────────────────────────────────────────
  console.log('\n[12] Stage Manager');
  try {
    const smPromise = wait(socket, 'stageManager:state');
    socket.emit('stageManager:getState');
    const smState = await smPromise;

    if ('standbyId' in smState && 'lastFiredId' in smState) {
      pass(`SM state primljen — standby=${smState.standbyId}, lastFired=${smState.lastFiredId}`);
    } else {
      fail('SM state — pogrešan format', JSON.stringify(smState));
    }
  } catch (e) {
    fail('stageManager:getState timeout', e.message);
  }

  // ── 13. SM Reset ──────────────────────────────────────────────────────────
  try {
    const resetPromise = wait(socket, 'stageManager:state');
    socket.emit('stageManager:reset');
    const smState = await resetPromise;

    if (smState.lastFiredId === null) {
      pass('SM reset — lastFiredId=null');
    } else {
      fail('SM reset nije resetirao lastFiredId', JSON.stringify(smState));
    }
  } catch (e) {
    fail('stageManager:reset timeout', e.message);
  }

  // ── 14. Remove test cue ──────────────────────────────────────────────────
  console.log('\n[14] Čišćenje — brisanje test cue-a');
  if (addedCue) {
    try {
      const removePromise = wait(socket, 'cue:listUpdated');
      socket.emit('cue:remove', { id: addedCue.id });
      const finalCues = await removePromise;

      if (!finalCues.find(c => c.id === addedCue.id)) {
        pass('Test cue obrisan');
      } else {
        fail('Test cue i dalje postoji nakon brisanja');
      }
    } catch (e) {
      fail('cue:remove timeout', e.message);
    }
  }

  // ── 15. Reset all ─────────────────────────────────────────────────────────
  try {
    const resetPromise = wait(socket, 'stage:stateReset');
    socket.emit('stage:resetAll');
    const freshState = await resetPromise;

    const anyOn = Object.values(freshState).flat().some(el => el.on);
    if (!anyOn) {
      pass('Sve resetirano — svi elementi isključeni');
    } else {
      fail('Reset — neki elementi i dalje uključeni');
    }
  } catch (e) {
    fail('stage:resetAll timeout', e.message);
  }

  socket.disconnect();
  finish();
}

function finish() {
  const total = passed + failed;
  console.log('\n══════════════════════════════════════════════');
  console.log(` Rezultati: ${passed}/${total} testova prošlo`);
  if (failed > 0) {
    console.error(` FAILED: ${failed} test(ova)`);
  } else {
    console.log(' Svi testovi prošli!');
  }
  console.log('══════════════════════════════════════════════\n');
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Kritična greška:', err);
  process.exit(1);
});
