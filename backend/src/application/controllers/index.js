'use strict';
/**
 * Controllers — finos. Apenas:
 * 1. Extraem dados do request
 * 2. Chamam o use case
 * 3. Convertem Result → HTTP response
 */

function buildControllers({ useCases, tipRepo }) {
  const meta = (req) => ({ ip: req.ip, userAgent: req.headers['user-agent'] });

  return {
    // ── Players ──────────────────────────────────────────────────────────────
    async createPlayer(req, res, next) {
      const result = await useCases.createPlayer(req.body, meta(req));
      if (!result.ok) return next(result.error);
      res.status(201).json({ data: result.value });
    },

    async getAllPlayers(req, res, next) {
      try {
        const players = useCases.playerRepo.findAll().map(p => p.toPublic());
        res.json({ data: players });
      } catch (err) { next(err); }
    },

    async getPlayer(req, res, next) {
      const result = await useCases.getPlayer(req.params.id);
      if (!result.ok) return next(result.error);
      res.json({ data: result.value });
    },

    async updatePlayer(req, res, next) {
      const result = await useCases.updatePlayer(req.params.id, req.body, meta(req));
      if (!result.ok) return next(result.error);
      res.json({ data: result.value });
    },

    async deletePlayer(req, res, next) {
      const result = await useCases.deletePlayer(req.params.id, meta(req));
      if (!result.ok) return next(result.error);
      res.json({ data: result.value });
    },

    // ── Sessions ─────────────────────────────────────────────────────────────
    async submitSession(req, res, next) {
      const result = await useCases.submitSession(req.body, meta(req));
      if (!result.ok) return next(result.error);
      res.status(201).json({ data: result.value });
    },

    async getSessionsByPlayer(req, res, next) {
      try {
        const limit    = Math.min(parseInt(req.query.limit) || 50, 200);
        const sessions = useCases.sessionRepo.findByPlayer(req.params.playerId, limit).map(s => s.toPublic());
        const stats    = useCases.sessionRepo.getStats(req.params.playerId);
        res.json({ data: { sessions, stats } });
      } catch (err) { next(err); }
    },

    async getBrainScores(req, res, next) {
      try {
        const scores = useCases.sessionRepo.getBrainScores(req.params.playerId);
        res.json({ data: scores });
      } catch (err) { next(err); }
    },

    // ── Achievements ─────────────────────────────────────────────────────────
    async checkAchievements(req, res, next) {
      const result = await useCases.checkAchievements(req.params.id);
      if (!result.ok) return next(result.error);
      res.json({ data: result.value });
    },

    // ── Misc ──────────────────────────────────────────────────────────────────
    async getTips(req, res) {
      const tipOfDay = tipRepo.getTipOfDay();
      const all      = tipRepo.getAll();
      res.json({ data: { tipOfDay, all } });
    },

    async getLeaderboard(req, res) {
      const limit  = Math.min(parseInt(req.query.limit) || 10, 50);
      const board  = useCases.leaderboard(limit);
      res.json({ data: board });
    },

    healthCheck(req, res) {
      res.json({ ok: true, timestamp: new Date().toISOString() });
    },

    // ── Privacy / LGPD ────────────────────────────────────────────────────────
    async exportMyData(req, res, next) {
      const result = await useCases.exportMyData(req.params.id, meta(req));
      if (!result.ok) return next(result.error);
      res.setHeader('Content-Disposition', 'attachment; filename="mente-viva-meus-dados.json"');
      res.json({ data: result.value });
    },

    async requestDeletion(req, res, next) {
      const result = await useCases.requestDeletion(req.params.id, meta(req));
      if (!result.ok) return next(result.error);
      res.status(201).json({ data: result.value });
    },

    async getAuditLogs(req, res, next) {
      try {
        const logs = useCases.auditRepo.findByPlayer(req.params.id);
        res.json({ data: logs });
      } catch (err) { next(err); }
    },
  };
}

module.exports = { buildControllers };
