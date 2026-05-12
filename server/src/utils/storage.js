const path = require('path');
const fs   = require('fs');
const { logger } = require('./logger');

const DATA_DIR = path.join(__dirname, '../../../data');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    logger.info(`[storage] Kreiran data direktorij: ${DATA_DIR}`);
  }
}

/**
 * Učitaj JSON datoteku iz server/data/{filename}.json.
 * Vraća parsiran objekt, ili `defaultValue` ako datoteka ne postoji / nije validna.
 */
function loadData(filename, defaultValue = null) {
  const filepath = path.join(DATA_DIR, `${filename}.json`);
  if (!fs.existsSync(filepath)) return defaultValue;
  try {
    const raw = fs.readFileSync(filepath, 'utf-8');
    const parsed = JSON.parse(raw);
    logger.info(`[storage] Učitano: ${filename}.json`);
    return parsed;
  } catch (e) {
    logger.warn(`[storage] Greška čitanja ${filename}.json: ${e.message}`);
    return defaultValue;
  }
}

/**
 * Zapiši data u server/data/{filename}.json (sinkrono).
 */
function saveData(filename, data) {
  ensureDataDir();
  const filepath = path.join(DATA_DIR, `${filename}.json`);
  try {
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    logger.error(`[storage] Greška pisanja ${filename}.json: ${e.message}`);
  }
}

// Osiguraj da folder postoji pri pokretanju
ensureDataDir();

module.exports = { loadData, saveData };
