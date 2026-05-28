'use strict';
const { Result }                                    = require('../../utils/result');
const { Player }                                    = require('../entities/Player');
const { Session }                                   = require('../entities/Session');
const { computeNewAchievements }                    = require('../entities/Achievement');
const { NotFoundError, ValidationError }            = require('../errors');
const { v4: uuidv4 }                                = require('uuid');

// ── CreatePlayer ──────────────────────────────────────────────────────────────
function createPlayerUseCase({ playerRepo, auditRepo }) {
  return async function execute(input, meta = {}) {
    try {
      const player = Player.create(input);
      playerRepo.save(player);
      auditRepo.write({ actorId: player.id, targetId: player.id, action: 'PLAYER_CREATED', entity: 'Player', entityId: player.id, ip: meta.ip, userAgent: meta.userAgent, metadata: { name: player.name } });
      return Result.ok(player.toPublic());
    } catch (err) {
      return Result.fail(err);
    }
  };
}

// ── GetPlayer ─────────────────────────────────────────────────────────────────
function getPlayerUseCase({ playerRepo, sessionRepo, achievementRepo }) {
  return async function execute(playerId) {
    try {
      const player = playerRepo.findById(playerId);
      if (!player || player.isDeleted()) return Result.fail(new NotFoundError('Jogadora'));
      const stats        = sessionRepo.getStats(playerId);
      const brainScores  = sessionRepo.getBrainScores(playerId);
      const achievements = achievementRepo.findByPlayer(playerId).map(a => a.toPublic());
      const history      = sessionRepo.findByPlayer(playerId, 20).map(s => s.toPublic());
      return Result.ok({ ...player.toPublic(), stats, brainScores, achievements, history });
    } catch (err) {
      return Result.fail(err);
    }
  };
}

// ── UpdatePlayer ──────────────────────────────────────────────────────────────
function updatePlayerUseCase({ playerRepo, auditRepo }) {
  return async function execute(playerId, input, meta = {}) {
    try {
      const player = playerRepo.findById(playerId);
      if (!player || player.isDeleted()) return Result.fail(new NotFoundError('Jogadora'));
      if (input.name) player.updateName(input.name);
      playerRepo.save(player);
      auditRepo.write({ actorId: playerId, targetId: playerId, action: 'PLAYER_UPDATED', entity: 'Player', entityId: playerId, ip: meta.ip, userAgent: meta.userAgent });
      return Result.ok(player.toPublic());
    } catch (err) {
      return Result.fail(err);
    }
  };
}

// ── DeletePlayer (LGPD soft delete) ──────────────────────────────────────────
function deletePlayerUseCase({ playerRepo, auditRepo }) {
  return async function execute(playerId, meta = {}) {
    try {
      const player = playerRepo.findById(playerId);
      if (!player || player.isDeleted()) return Result.fail(new NotFoundError('Jogadora'));
      player.softDelete();
      playerRepo.save(player);
      auditRepo.write({ actorId: playerId, targetId: playerId, action: 'PLAYER_DELETED', entity: 'Player', entityId: playerId, ip: meta.ip, userAgent: meta.userAgent });
      return Result.ok({ message: 'Conta removida. Os dados serão apagados conforme a política de privacidade.' });
    } catch (err) {
      return Result.fail(err);
    }
  };
}

// ── SubmitSession ─────────────────────────────────────────────────────────────
function submitSessionUseCase({ playerRepo, sessionRepo, achievementRepo, auditRepo }) {
  return async function execute(input, meta = {}) {
    try {
      const player = playerRepo.findById(input.playerId);
      if (!player || player.isDeleted()) return Result.fail(new NotFoundError('Jogadora'));

      const session = Session.create(input);
      sessionRepo.create(session);
      sessionRepo.updateBrainScore(input.playerId, session.brainArea, session.getBrainPoints());

      // Checar conquistas
      const stats = sessionRepo.getStats(input.playerId);
      stats.playerId         = input.playerId;
      stats.playedOnBirthday = player.isBirthdayToday();
      const existing         = achievementRepo.findByPlayer(input.playerId);
      const newAchs          = computeNewAchievements(stats, existing);
      if (newAchs.length) achievementRepo.saveMany(newAchs);

      auditRepo.write({ actorId: input.playerId, targetId: input.playerId, action: 'SESSION_CREATED', entity: 'Session', entityId: session.id, ip: meta.ip, metadata: { game: session.game, level: session.level, score: session.score } });

      return Result.ok({
        session:    session.toPublic(),
        newAchievements: newAchs.map(a => a.toPublic()),
      });
    } catch (err) {
      return Result.fail(err);
    }
  };
}

// ── CheckAchievements ─────────────────────────────────────────────────────────
function checkAchievementsUseCase({ playerRepo, sessionRepo, achievementRepo }) {
  return async function execute(playerId) {
    try {
      const player = playerRepo.findById(playerId);
      if (!player || player.isDeleted()) return Result.fail(new NotFoundError('Jogadora'));
      const stats    = sessionRepo.getStats(playerId);
      stats.playerId = playerId;
      stats.playedOnBirthday = player.isBirthdayToday();
      const existing = achievementRepo.findByPlayer(playerId);
      const newAchs  = computeNewAchievements(stats, existing);
      if (newAchs.length) achievementRepo.saveMany(newAchs);
      const all = achievementRepo.findByPlayer(playerId).map(a => a.toPublic());
      return Result.ok({ all, newlyUnlocked: newAchs.map(a => a.toPublic()) });
    } catch (err) {
      return Result.fail(err);
    }
  };
}

// ── Privacy / LGPD ────────────────────────────────────────────────────────────
function exportMyDataUseCase({ playerRepo, privacyRepo, auditRepo }) {
  return async function execute(playerId, meta = {}) {
    try {
      const player = playerRepo.findById(playerId);
      if (!player) return Result.fail(new NotFoundError('Jogadora'));
      const data = privacyRepo.exportAll(playerId);
      auditRepo.write({ actorId: playerId, targetId: playerId, action: 'DATA_EXPORT', entity: 'Player', entityId: playerId, ip: meta.ip });
      return Result.ok(data);
    } catch (err) {
      return Result.fail(err);
    }
  };
}

function requestDeletionUseCase({ playerRepo, privacyRepo, auditRepo }) {
  return async function execute(playerId, meta = {}) {
    try {
      const player = playerRepo.findById(playerId);
      if (!player) return Result.fail(new NotFoundError('Jogadora'));
      const protocol = uuidv4();
      const req = privacyRepo.save({ id: protocol, playerId, requestedAt: new Date().toISOString(), status: 'PENDING', slaDays: 15 });
      auditRepo.write({ actorId: playerId, targetId: playerId, action: 'DELETION_REQUEST', entity: 'Player', entityId: playerId, ip: meta.ip, metadata: { protocol } });
      return Result.ok({ protocol, message: 'Solicitação recebida. Será processada em até 15 dias úteis (LGPD Art. 18).', slaDays: 15 });
    } catch (err) {
      return Result.fail(err);
    }
  };
}

module.exports = {
  createPlayerUseCase,
  getPlayerUseCase,
  updatePlayerUseCase,
  deletePlayerUseCase,
  submitSessionUseCase,
  checkAchievementsUseCase,
  exportMyDataUseCase,
  requestDeletionUseCase,
};
