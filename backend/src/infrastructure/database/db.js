'use strict';
const fs   = require('fs');
const path = require('path');
const { logger } = require('../../utils/logger');

const DB_PATH  = path.join(__dirname, '..', '..', '..', 'data', 'db.json');
const DATA_DIR = path.dirname(DB_PATH);

const INITIAL_DB = {
  meta:         { version: 2, createdAt: new Date().toISOString() },
  players:      [],
  sessions:     [],
  brainScores:  [],
  achievements: [],
  auditLogs:    [],
  tips:         [],
  privacyRequests: [],
};

// ── I/O ───────────────────────────────────────────────────────────────────────
let _cache = null;

function load() {
  if (_cache) return _cache;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH))  { _cache = INITIAL_DB; persist(); return _cache; }
  try {
    _cache = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    // Migrate missing keys
    for (const [k, v] of Object.entries(INITIAL_DB)) {
      if (!(_cache[k] != null)) _cache[k] = v;
    }
    return _cache;
  } catch (err) {
    logger.error('Erro ao carregar DB — usando inicial', { err: err.message });
    _cache = { ...INITIAL_DB };
    return _cache;
  }
}

function persist() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(_cache, null, 2), 'utf8');
}

// ── Generic ops ───────────────────────────────────────────────────────────────
const db = {
  // Players
  findPlayer:    (id)       => load().players.find(p => p.id === id && !p.deletedAt) || null,
  findAllPlayers:()         => load().players.filter(p => !p.deletedAt),
  savePlayer(player) {
    const d = load();
    const i = d.players.findIndex(p => p.id === player.id);
    if (i >= 0) d.players[i] = player; else d.players.push(player);
    persist();
    return player;
  },

  // Sessions
  createSession(session) {
    const d = load(); d.sessions.push(session); persist(); return session;
  },
  findSessionsByPlayer: (pid, limit = 50) =>
    load().sessions.filter(s => s.playerId === pid)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit),

  getStats(playerId) {
    const sessions = load().sessions.filter(s => s.playerId === playerId);
    if (!sessions.length) return { totalGames: 0, totalPoints: 0, avgScore: 0, bestScore: 0, streakDays: 0, uniqueGames: 0, hasPlayedHard: false, gameBreakdown: {} };
    const totalPoints    = sessions.reduce((a, s) => a + s.score, 0);
    const bestScore      = Math.max(...sessions.map(s => s.score));
    const uniqueGames    = new Set(sessions.map(s => s.game)).size;
    const hasPlayedHard  = sessions.some(s => s.level === 'hard');
    const gameBreakdown  = {};
    sessions.forEach(s => { gameBreakdown[s.game] = (gameBreakdown[s.game] || 0) + 1; });
    return { totalGames: sessions.length, totalPoints, avgScore: Math.round(totalPoints / sessions.length), bestScore, streakDays: calcStreak(sessions), uniqueGames, hasPlayedHard, gameBreakdown };
  },

  // Brain scores
  getBrainScores(playerId) {
    const AREAS = ['memory','speed','attention','reasoning','language'];
    return AREAS.map(area => {
      const rec = load().brainScores.find(b => b.playerId === playerId && b.area === area);
      return rec || { playerId, area, totalScore: 0, playCount: 0, lastPlayed: null };
    });
  },
  updateBrainScore(playerId, area, points) {
    const d = load();
    const i = d.brainScores.findIndex(b => b.playerId === playerId && b.area === area);
    const now = new Date().toISOString();
    if (i >= 0) {
      d.brainScores[i].totalScore += points;
      d.brainScores[i].playCount  += 1;
      d.brainScores[i].lastPlayed  = now;
    } else {
      d.brainScores.push({ playerId, area, totalScore: points, playCount: 1, lastPlayed: now });
    }
    persist();
  },

  // Achievements
  findAchievements: (pid) => load().achievements.filter(a => a.playerId === pid),
  saveAchievements(list) {
    const d = load();
    list.forEach(a => { if (!d.achievements.find(x => x.playerId === a.playerId && x.achievementId === a.achievementId)) d.achievements.push(a); });
    persist();
  },

  // Tips
  getTips:   ()    => load().tips,
  seedTips:  (tips)=> { const d = load(); d.tips = tips; persist(); },

  // Audit
  writeAudit(entry) {
    const d = load();
    d.auditLogs.push({ ...entry, id: require('uuid').v4(), createdAt: new Date().toISOString() });
    // Manter apenas 10.000 logs em memória
    if (d.auditLogs.length > 10000) d.auditLogs = d.auditLogs.slice(-10000);
    try { persist(); } catch (e) { logger.error('Falha ao gravar audit log', { err: e.message }); }
  },
  getAuditLogs: (pid) => load().auditLogs.filter(a => a.actorId === pid || a.targetId === pid),

  // Privacy requests (LGPD)
  savePrivacyRequest(req) {
    const d = load(); d.privacyRequests.push(req); persist(); return req;
  },
  findPrivacyRequests: (pid) => load().privacyRequests.filter(r => r.playerId === pid),

  // Leaderboard
  getLeaderboard(limit = 10) {
    return db.findAllPlayers()
      .map(p => { const s = db.getStats(p.id); return { id: p.id, name: p.name, ...s }; })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);
  },

  // Health
  healthCheck() {
    const d = load();
    return { ok: true, players: d.players.length, sessions: d.sessions.length, version: d.meta.version };
  },

  // Export all personal data (LGPD portability)
  exportPlayerData(playerId) {
    const d = load();
    return {
      player:    d.players.find(p => p.id === playerId) || null,
      sessions:  d.sessions.filter(s => s.playerId === playerId),
      brain:     db.getBrainScores(playerId),
      achievements: db.findAchievements(playerId),
      auditLogs: db.getAuditLogs(playerId),
    };
  },
};

function calcStreak(sessions) {
  if (!sessions.length) return 0;
  const days = [...new Set(sessions.map(s => (s.createdAt || '').slice(0, 10)))].sort().reverse();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (days[0] !== today && days[0] !== yesterday) return 0;
  let streak = 1;
  for (let i = 1; i < days.length; i++) {
    const diff = (new Date(days[i-1]) - new Date(days[i])) / 86400000;
    if (diff === 1) streak++; else break;
  }
  return streak;
}

module.exports = { db };
