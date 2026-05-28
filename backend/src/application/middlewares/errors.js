'use strict';
const { AppError, ValidationError } = require('../../domain/errors');
const { logger }                    = require('../../utils/logger');
const { v4: uuidv4 }                = require('uuid');

/**
 * Injeta request_id em cada requisição — propagado em todos os logs.
 */
function requestId(req, res, next) {
  req.requestId = uuidv4();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

/**
 * Loga cada requisição com método, path, status e duração.
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level    = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level]('HTTP request', {
      method:     req.method,
      path:       req.path,
      status:     res.statusCode,
      duration,
      requestId:  req.requestId,
      ip:         req.ip,
    });
  });
  next();
}

/**
 * Handler de erros centralizado.
 * Nunca expõe stack trace em produção.
 */
function errorHandler(err, req, res, _next) {
  const isProd = process.env.NODE_ENV === 'production';

  if (err instanceof AppError) {
    if (err.status >= 500) {
      logger.error('Application error', { err: err.message, requestId: req.requestId, code: err.code });
    }
    return res.status(err.status).json({
      error: {
        code:      err.code,
        message:   err.message,
        details:   err.details || undefined,
        requestId: req.requestId,
      }
    });
  }

  // Erro inesperado
  logger.error('Unexpected error', { err: err.message, stack: isProd ? undefined : err.stack, requestId: req.requestId });
  res.status(500).json({
    error: {
      code:      'INTERNAL_ERROR',
      message:   'Erro interno. Por favor tente novamente.',
      requestId: req.requestId,
    }
  });
}

function notFound(req, res) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Rota não encontrada: ${req.method} ${req.path}` }
  });
}

module.exports = { requestId, requestLogger, errorHandler, notFound };
