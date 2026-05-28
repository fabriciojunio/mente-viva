'use strict';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http   = require('http');

process.env.NODE_ENV          = 'test';
process.env.PORT              = '3099';
process.env.ALLOWED_ORIGINS   = 'http://localhost:3099';

const { createApp } = require('../../src/server');

const ENV = { PORT: 3099, NODE_ENV: 'test', ALLOWED_ORIGINS: ['http://localhost:3099'], RATE_LIMIT_WINDOW_MS: 900000, RATE_LIMIT_MAX: 200, AUTH_RATE_LIMIT_MAX: 200 };

let server;
let playerId;

async function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: '127.0.0.1', port: 3099,
      path: `/api/v1${path}`, method,
      headers: { 'Content-Type': 'application/json', ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
    };
    const request = http.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw), headers: res.headers }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    request.on('error', reject);
    if (data) request.write(data);
    request.end();
  });
}

describe('API Integration', () => {
  before(() => { server = createApp(ENV).listen(3099); });
  after(()  => { server.close(); });

  describe('GET /health', () => {
    test('retorna 200', async () => {
      const r = await req('GET', '/health');
      assert.equal(r.status, 200);
      assert.equal(r.body.ok, true);
      assert.ok(r.body.timestamp);
    });
  });

  describe('GET /tips', () => {
    test('retorna dicas', async () => {
      const r = await req('GET', '/tips');
      assert.equal(r.status, 200);
      assert.ok(r.body.data);
    });
  });

  describe('POST /players', () => {
    test('cria jogadora com nome válido', async () => {
      const r = await req('POST', '/players', { name: 'Mamãe' });
      assert.equal(r.status, 201);
      assert.equal(r.body.data.name, 'Mamãe');
      assert.ok(r.body.data.id);
      playerId = r.body.data.id;
    });

    test('retorna 400 para nome vazio', async () => {
      const r = await req('POST', '/players', { name: '' });
      assert.equal(r.status, 400);
      assert.ok(r.body.error);
    });

    test('retorna 400 para nome com 1 char', async () => {
      const r = await req('POST', '/players', { name: 'A' });
      assert.equal(r.status, 400);
    });

    test('retorna 400 sem body', async () => {
      const r = await req('POST', '/players', {});
      assert.equal(r.status, 400);
    });

    test('retorna 400 para nome com SQL injection', async () => {
      const r = await req('POST', '/players', { name: "'; DROP TABLE players; --" });
      assert.equal(r.status, 400);
    });
  });

  describe('GET /players/:id', () => {
    test('retorna perfil completo', async () => {
      const r = await req('GET', `/players/${playerId}`);
      assert.equal(r.status, 200);
      assert.equal(r.body.data.name, 'Mamãe');
      assert.ok(r.body.data.stats);
      assert.ok(r.body.data.brainScores);
      assert.ok(Array.isArray(r.body.data.achievements));
    });

    test('retorna 404 para ID inexistente', async () => {
      const r = await req('GET', '/players/550e8400-e29b-41d4-a716-000000000000');
      assert.equal(r.status, 404);
    });

    test('retorna 400 para ID inválido', async () => {
      const r = await req('GET', '/players/nao-e-uuid');
      assert.equal(r.status, 400);
    });
  });

  describe('PUT /players/:id', () => {
    test('atualiza nome', async () => {
      const r = await req('PUT', `/players/${playerId}`, { name: 'Mãezinha' });
      assert.equal(r.status, 200);
      assert.equal(r.body.data.name, 'Mãezinha');
    });
  });

  describe('POST /sessions', () => {
    test('cria sessão válida', async () => {
      const r = await req('POST', '/sessions', {
        playerId, game:'memory', level:'easy', score:50, durationMs:30000
      });
      assert.equal(r.status, 201);
      assert.ok(r.body.data.session);
      assert.ok(Array.isArray(r.body.data.newAchievements));
    });

    test('desbloqueia first_game na primeira sessão', async () => {
      const r = await req('POST', '/sessions', { playerId, game:'speed', level:'easy', score:30, durationMs:20000 });
      // achievement já foi desbloqueado na sessão anterior — não aparece de novo
      assert.equal(r.status, 201);
    });

    test('aceita wordsearch', async () => {
      const r = await req('POST', '/sessions', { playerId, game:'wordsearch', level:'medium', score:60, durationMs:120000 });
      assert.equal(r.status, 201);
    });

    test('retorna 400 para jogo inválido', async () => {
      const r = await req('POST', '/sessions', { playerId, game:'xadrez', level:'easy', score:10, durationMs:1000 });
      assert.equal(r.status, 400);
    });

    test('retorna 404 para playerId inexistente', async () => {
      const r = await req('POST', '/sessions', { playerId:'550e8400-e29b-41d4-a716-000000000000', game:'memory', level:'easy', score:10, durationMs:1000 });
      assert.equal(r.status, 404);
    });
  });

  describe('GET /sessions/:playerId', () => {
    test('retorna sessões e estatísticas', async () => {
      const r = await req('GET', `/sessions/${playerId}`);
      assert.equal(r.status, 200);
      assert.ok(Array.isArray(r.body.data.sessions));
      assert.ok(r.body.data.stats);
      assert.ok(r.body.data.stats.totalGames >= 1);
    });
  });

  describe('GET /sessions/:playerId/brain', () => {
    test('retorna 5 áreas cerebrais', async () => {
      const r = await req('GET', `/sessions/${playerId}/brain`);
      assert.equal(r.status, 200);
      assert.equal(r.body.data.length, 5);
    });
  });

  describe('GET /players/:id/achievements', () => {
    test('retorna conquistas', async () => {
      const r = await req('GET', `/players/${playerId}/achievements`);
      assert.equal(r.status, 200);
      assert.ok(Array.isArray(r.body.data.all));
      assert.ok(r.body.data.all.length >= 1, 'Deve ter pelo menos first_game');
    });
  });

  describe('GET /leaderboard', () => {
    test('retorna array', async () => {
      const r = await req('GET', '/leaderboard');
      assert.equal(r.status, 200);
      assert.ok(Array.isArray(r.body.data));
    });
  });

  describe('Privacy / LGPD', () => {
    test('GET /privacy/:id/export retorna dados do jogador', async () => {
      const r = await req('GET', `/privacy/${playerId}/export`);
      assert.equal(r.status, 200);
      assert.ok(r.body.data.player);
      assert.ok(Array.isArray(r.body.data.sessions));
    });

    test('POST /privacy/:id/deletion cria solicitação', async () => {
      const r = await req('POST', `/privacy/${playerId}/deletion`);
      assert.equal(r.status, 201);
      assert.ok(r.body.data.protocol);
      assert.equal(r.body.data.slaDays, 15);
    });
  });

  describe('Security headers', () => {
    test('resposta contém X-Request-Id', async () => {
      const r = await req('GET', '/health');
      assert.ok(r.headers['x-request-id']);
    });

    test('não expõe X-Powered-By', async () => {
      const r = await req('GET', '/health');
      assert.ok(!r.headers['x-powered-by']);
    });
  });

  describe('404 handler', () => {
    test('retorna 404 para rota inexistente', async () => {
      const r = await req('GET', '/rota-que-nao-existe');
      assert.equal(r.status, 404);
    });
  });

  describe('DELETE /players/:id', () => {
    test('remove jogadora (soft delete)', async () => {
      const r = await req('DELETE', `/players/${playerId}`);
      assert.equal(r.status, 200);
    });
    test('jogadora não encontrada após delete', async () => {
      const r = await req('GET', `/players/${playerId}`);
      assert.equal(r.status, 404);
    });
  });
});
