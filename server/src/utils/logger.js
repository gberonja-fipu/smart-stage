const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info;

function ts() {
  return new Date().toISOString().replace('T', ' ').slice(0, 23);
}

function write(level, ...args) {
  if (LEVELS[level] < MIN_LEVEL) return;
  const prefix = `[${ts()}] [${level.toUpperCase().padEnd(5)}]`;
  if (level === 'error') {
    console.error(prefix, ...args);
  } else if (level === 'warn') {
    console.warn(prefix, ...args);
  } else {
    console.log(prefix, ...args);
  }
}

const logger = {
  debug: (...args) => write('debug', ...args),
  info:  (...args) => write('info',  ...args),
  warn:  (...args) => write('warn',  ...args),
  error: (...args) => write('error', ...args),
};

module.exports = { logger };
