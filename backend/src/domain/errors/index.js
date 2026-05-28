'use strict';

class AppError extends Error {
  constructor(message, code, status = 400) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 'VALIDATION_ERROR', 400);
    this.details = details;
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} não encontrado(a)`, 'NOT_FOUND', 404);
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 'CONFLICT', 409);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Acesso negado') {
    super(message, 'FORBIDDEN', 403);
  }
}

class RateLimitError extends AppError {
  constructor() {
    super('Muitas requisições. Tente em alguns minutos.', 'RATE_LIMIT', 429);
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  RateLimitError,
};
