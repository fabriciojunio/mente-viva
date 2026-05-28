'use strict';

const SENSITIVE = ['password', 'token', 'authorization', 'cookie', 'secret', 'cpf', 'creditCard', 'passwordHash'];

function redact(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE.some(s => k.toLowerCase().includes(s))) {
      out[k] = '[REDACTED]';
    } else if (typeof v === 'object') {
      out[k] = redact(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

const LEVELS = { fatal: 60, error: 50, warn: 40, info: 30, debug: 20 };
const isDev  = process.env.NODE_ENV === 'development';
const minLvl = isDev ? 20 : 30;

function log(level, message, meta = {}) {
  if (LEVELS[level] < minLvl) return;
  const entry = {
    ts:      new Date().toISOString(),
    level,
    message,
    ...redact(meta),
  };
  if (isDev) {
    const color = { fatal: '\x1b[35m', error: '\x1b[31m', warn: '\x1b[33m', info: '\x1b[36m', debug: '\x1b[90m' };
    const reset  = '\x1b[0m';
    process.stdout.write(`${color[level] || ''}[${level.toUpperCase()}]${reset} ${message}\n`);
    if (Object.keys(meta).length) process.stdout.write(`  ${JSON.stringify(redact(meta), null, 2)}\n`);
  } else {
    process.stdout.write(JSON.stringify(entry) + '\n');
  }
}

const logger = {
  fatal: (msg, meta) => log('fatal', msg, meta),
  error: (msg, meta) => log('error', msg, meta),
  warn:  (msg, meta) => log('warn',  msg, meta),
  info:  (msg, meta) => log('info',  msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),
};

module.exports = { logger };
