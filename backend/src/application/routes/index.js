'use strict';
const { Router } = require('express');
const { validate, validatePlayerBody, validateSessionBody, validateIdParam } = require('../middlewares/validators');

function buildRoutes(ctrl) {
  const r = Router();

  // Health
  r.get('/health', ctrl.healthCheck);

  // Misc
  r.get('/tips',        ctrl.getTips);
  r.get('/leaderboard', ctrl.getLeaderboard);

  // Players
  r.post  ('/players',     validate(validatePlayerBody),  ctrl.createPlayer);
  r.get   ('/players',                                    ctrl.getAllPlayers);
  r.get   ('/players/:id', validateIdParam,               ctrl.getPlayer);
  r.put   ('/players/:id', validateIdParam,               ctrl.updatePlayer);
  r.delete('/players/:id', validateIdParam,               ctrl.deletePlayer);

  // Achievements
  r.get('/players/:id/achievements', validateIdParam, ctrl.checkAchievements);

  // Sessions
  r.post('/sessions',                         validate(validateSessionBody), ctrl.submitSession);
  r.get ('/sessions/:playerId',               validateIdParam,               ctrl.getSessionsByPlayer);
  r.get ('/sessions/:playerId/brain',         validateIdParam,               ctrl.getBrainScores);

  // Privacy / LGPD
  r.get ('/privacy/:id/export',   validateIdParam, ctrl.exportMyData);
  r.post('/privacy/:id/deletion', validateIdParam, ctrl.requestDeletion);
  r.get ('/privacy/:id/audit',    validateIdParam, ctrl.getAuditLogs);

  return r;
}

module.exports = { buildRoutes };
