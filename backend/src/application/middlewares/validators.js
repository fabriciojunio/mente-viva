'use strict';
const { ValidationError } = require('../../domain/errors');
const { VALID_GAMES, VALID_LEVELS } = require('../../domain/entities/Session');

// Funções puras de validação — retornam erros, não lançam
function validatePlayerBody(body) {
  const errors = [];
  const name = (body?.name || '').trim();
  if (!name)              errors.push('name é obrigatório');
  else if (name.length < 2)  errors.push('name deve ter pelo menos 2 caracteres');
  else if (name.length > 50) errors.push('name deve ter no máximo 50 caracteres');
  // Sanitiza: apenas letras, espaços e acentos
  if (name && !/^[\p{L}\s'-]+$/u.test(name)) errors.push('name contém caracteres inválidos');
  return errors;
}

function validateSessionBody(body) {
  const errors = [];
  if (!body?.playerId)                      errors.push('playerId é obrigatório');
  if (!VALID_GAMES.includes(body?.game))    errors.push(`game deve ser um de: ${VALID_GAMES.join(', ')}`);
  if (!VALID_LEVELS.includes(body?.level))  errors.push(`level deve ser um de: ${VALID_LEVELS.join(', ')}`);
  if (typeof body?.score !== 'number' || body.score < 0 || body.score > 9999)
    errors.push('score deve ser número entre 0 e 9999');
  if (typeof body?.durationMs !== 'number' || body.durationMs < 0)
    errors.push('durationMs deve ser número positivo');
  return errors;
}

function validateUUID(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

// Middleware factory
function validate(validatorFn) {
  return (req, res, next) => {
    const errors = validatorFn(req.body);
    if (errors.length) {
      return next(new ValidationError('Dados inválidos', errors));
    }
    next();
  };
}

function validateIdParam(req, res, next) {
  const id = req.params.id || req.params.playerId;
  if (!validateUUID(id)) {
    return next(new ValidationError('ID inválido'));
  }
  next();
}

module.exports = {
  validatePlayerBody,
  validateSessionBody,
  validateUUID,
  validate,
  validateIdParam,
};
