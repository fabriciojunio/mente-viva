'use strict';
/**
 * server.js — Composition root.
 * Conecta todos os módulos: config → infra → use cases → controllers → server.
 */
const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');

const { validateEnv }          = require('./config/env');
const { logger }               = require('./utils/logger');
const { requestId, requestLogger, errorHandler, notFound } = require('./application/middlewares/errors');

const { PlayerRepository, SessionRepository, AchievementRepository, TipRepository, AuditRepository, PrivacyRepository } = require('./infrastructure/repositories');
const { db } = require('./infrastructure/database/db');

const {
  createPlayerUseCase, getPlayerUseCase, updatePlayerUseCase, deletePlayerUseCase,
  submitSessionUseCase, checkAchievementsUseCase, exportMyDataUseCase, requestDeletionUseCase,
} = require('./domain/use-cases');

const { buildControllers } = require('./application/controllers');
const { buildRoutes }      = require('./application/routes');

function createApp(env) {
  const app = express();

  // ── Security headers ───────────────────────────────────────────────────────
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'"],
        styleSrc:   ["'self'", "'unsafe-inline'"],
        imgSrc:     ["'self'", 'data:'],
        connectSrc: ["'self'"],
        frameSrc:   ["'none'"],
        objectSrc:  ["'none'"],
      }
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    frameguard:         { action: 'DENY' },
    noSniff:            true,
    referrerPolicy:     { policy: 'strict-origin-when-cross-origin' },
    permittedCrossDomainPolicies: false,
  }));
  app.set('x-powered-by', false);

  // ── CORS ───────────────────────────────────────────────────────────────────
  app.use(cors({
    origin(origin, cb) {
      if (!origin || env.ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error('Origem não permitida'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Request-Id', 'Idempotency-Key'],
    exposedHeaders: ['X-Request-Id'],
    credentials: false,
    maxAge: 86400,
  }));

  // ── Rate limiting ──────────────────────────────────────────────────────────
  app.use('/api', rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max:      env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { error: { code: 'RATE_LIMIT', message: 'Muitas requisições. Tente em alguns minutos.' } },
  }));
  app.use('/api/v1/players', rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max:      env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { error: { code: 'RATE_LIMIT', message: 'Muitas tentativas de criação. Aguarde.' } },
  }));

  // ── Body parsing ───────────────────────────────────────────────────────────
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  // ── Request lifecycle ──────────────────────────────────────────────────────
  app.use(requestId);
  if (env.NODE_ENV !== 'test') app.use(requestLogger);

  // ── Seed tips on first run ─────────────────────────────────────────────────
  if (!TipRepository.getAll().length) {
    require('./infrastructure/database/seed');
  }

  // ── Dependency injection (composition root) ────────────────────────────────
  const useCases = {
    playerRepo:   PlayerRepository,
    sessionRepo:  SessionRepository,
    auditRepo:    AuditRepository,
    createPlayer: createPlayerUseCase({ playerRepo: PlayerRepository, auditRepo: AuditRepository }),
    getPlayer:    getPlayerUseCase({ playerRepo: PlayerRepository, sessionRepo: SessionRepository, achievementRepo: AchievementRepository }),
    updatePlayer: updatePlayerUseCase({ playerRepo: PlayerRepository, auditRepo: AuditRepository }),
    deletePlayer: deletePlayerUseCase({ playerRepo: PlayerRepository, auditRepo: AuditRepository }),
    submitSession:   submitSessionUseCase({ playerRepo: PlayerRepository, sessionRepo: SessionRepository, achievementRepo: AchievementRepository, auditRepo: AuditRepository }),
    checkAchievements: checkAchievementsUseCase({ playerRepo: PlayerRepository, sessionRepo: SessionRepository, achievementRepo: AchievementRepository }),
    exportMyData:  exportMyDataUseCase({ playerRepo: PlayerRepository, privacyRepo: PrivacyRepository, auditRepo: AuditRepository }),
    requestDeletion: requestDeletionUseCase({ playerRepo: PlayerRepository, privacyRepo: PrivacyRepository, auditRepo: AuditRepository }),
    leaderboard:   (limit) => db.getLeaderboard(limit),
  };

  const controllers = buildControllers({ useCases, tipRepo: TipRepository });
  const routes      = buildRoutes(controllers);

  app.use('/api/v1', routes);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

function start() {
  const env = validateEnv();
  const app = createApp(env);
  const server = app.listen(env.PORT, () => {
    logger.info('🧠 Mente Viva Backend iniciado', {
      port: env.PORT,
      env:  env.NODE_ENV,
      api:  `http://localhost:${env.PORT}/api/v1`,
    });
  });
  server.on('error', (err) => { logger.fatal('Falha ao iniciar servidor', { err: err.message }); process.exit(1); });
  return server;
}

if (require.main === module) start();
module.exports = { createApp, start };
