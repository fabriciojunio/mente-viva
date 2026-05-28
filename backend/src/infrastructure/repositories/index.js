'use strict';
const { db }          = require('../database/db');
const { Player }      = require('../../domain/entities/Player');
const { Session }     = require('../../domain/entities/Session');
const { Achievement } = require('../../domain/entities/Achievement');

/** Converte plain object → Player entity */
function hydratePlayer(raw) {
  return raw ? new Player(raw) : null;
}

const PlayerRepository = {
  findById:   (id) => hydratePlayer(db.findPlayer(id)),
  findAll:    ()   => db.findAllPlayers().map(hydratePlayer),
  save:       (p)  => { db.savePlayer({ id: p.id, name: p.name, birthDate: p.birthDate, createdAt: p.createdAt, updatedAt: p.updatedAt, deletedAt: p.deletedAt }); return p; },
};

const SessionRepository = {
  create:          (s)       => { db.createSession(s.toPublic ? s.toPublic() : s); return s; },
  findByPlayer:    (pid, lim)=> db.findSessionsByPlayer(pid, lim).map(r => new Session(r)),
  getStats:        (pid)     => db.getStats(pid),
  getBrainScores:  (pid)     => db.getBrainScores(pid),
  updateBrainScore:(pid, a, pts) => db.updateBrainScore(pid, a, pts),
};

const AchievementRepository = {
  findByPlayer: (pid) => db.findAchievements(pid).map(r => new Achievement(r)),
  saveMany:     (list)=> { db.saveAchievements(list.map(a => ({ playerId: a.playerId, achievementId: a.achievementId, unlockedAt: a.unlockedAt }))); return list; },
};

const TipRepository = {
  getAll:    ()    => db.getTips(),
  getTipOfDay()    {
    const tips = db.getTips();
    if (!tips.length) return null;
    const day = Math.floor(Date.now() / 86400000);
    return tips[day % tips.length];
  },
};

const AuditRepository = {
  write:  (entry) => { try { db.writeAudit(entry); } catch {} }, // fire-and-forget
  findByPlayer: (pid) => db.getAuditLogs(pid),
};

const PrivacyRepository = {
  save:         (req)  => db.savePrivacyRequest(req),
  findByPlayer: (pid)  => db.findPrivacyRequests(pid),
  exportAll:    (pid)  => db.exportPlayerData(pid),
};

module.exports = {
  PlayerRepository,
  SessionRepository,
  AchievementRepository,
  TipRepository,
  AuditRepository,
  PrivacyRepository,
};
