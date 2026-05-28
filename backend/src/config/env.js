'use strict';
/**
 * Valida variáveis de ambiente na inicialização.
 * O servidor recusa iniciar se alguma configuração estiver errada.
 */

const { logger } = require('../utils/logger');

function validateEnv() {
  const PORT         = parseInt(process.env.PORT || '3001', 10);
  const NODE_ENV     = process.env.NODE_ENV || 'development';
  const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:8081,exp://localhost:8081').split(',').map(s => s.trim());
  const RATE_LIMIT_WINDOW_MS   = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10);
  const RATE_LIMIT_MAX          = parseInt(process.env.RATE_LIMIT_MAX        || '200',    10);
  const AUTH_RATE_LIMIT_MAX     = parseInt(process.env.AUTH_RATE_LIMIT_MAX   || '20',     10);

  if (isNaN(PORT) || PORT < 1 || PORT > 65535) {
    logger.fatal('Config inválida: PORT deve ser 1-65535');
    process.exit(1);
  }

  logger.info('Configuração validada', { PORT, NODE_ENV, ALLOWED_ORIGINS: ALLOWED_ORIGINS.length + ' origens' });

  return { PORT, NODE_ENV, ALLOWED_ORIGINS, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, AUTH_RATE_LIMIT_MAX };
}

module.exports = { validateEnv };
