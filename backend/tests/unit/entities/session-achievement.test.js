'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'test';

const { Session }  = require('../../../src/domain/entities/Session');
const { Achievement, computeNewAchievements } = require('../../../src/domain/entities/Achievement');
const { ValidationError } = require('../../../src/domain/errors');

const baseSession = { playerId: '550e8400-e29b-41d4-a716-446655440000', game: 'memory', level: 'easy', score: 50, durationMs: 30000 };

describe('Session entity', () => {
  test('cria sessão com dados válidos', () => {
    const s = Session.create(baseSession);
    assert.equal(s.game, 'memory');
    assert.equal(s.score, 50);
    assert.equal(s.brainArea, 'memory');
    assert.ok(s.id);
  });

  test('mapeia jogo → área cerebral corretamente', () => {
    const mapping = { memory:'memory', speed:'speed', sequence:'attention', stroop:'attention', math:'reasoning', word:'language', wordsearch:'language' };
    for (const [game, area] of Object.entries(mapping)) {
      const s = Session.create({ ...baseSession, game });
      assert.equal(s.brainArea, area, `${game} deve mapear para ${area}`);
    }
  });

  test('rejeita jogo inválido', () => {
    assert.throws(() => Session.create({ ...baseSession, game: 'chess' }), ValidationError);
  });

  test('rejeita nível inválido', () => {
    assert.throws(() => Session.create({ ...baseSession, level: 'legendary' }), ValidationError);
  });

  test('rejeita score negativo', () => {
    assert.throws(() => Session.create({ ...baseSession, score: -1 }), ValidationError);
  });

  test('rejeita score acima de 9999', () => {
    assert.throws(() => Session.create({ ...baseSession, score: 10000 }), ValidationError);
  });

  test('aceita score = 0', () => {
    const s = Session.create({ ...baseSession, score: 0 });
    assert.equal(s.score, 0);
  });

  test('getBrainPoints — hard tem multiplicador maior', () => {
    const easy = Session.create({ ...baseSession, level: 'easy',   score: 100 });
    const hard = Session.create({ ...baseSession, level: 'hard',   score: 100 });
    assert.ok(hard.getBrainPoints() > easy.getBrainPoints());
  });

  test('rejeita playerId faltando', () => {
    assert.throws(() => Session.create({ ...baseSession, playerId: '' }), ValidationError);
  });
});

describe('Achievement system', () => {
  const pid = '550e8400-e29b-41d4-a716-446655440000';

  const stats = (overrides = {}) => ({
    playerId:        pid,
    totalGames:      0,
    totalPoints:     0,
    bestScore:       0,
    streakDays:      0,
    uniqueGames:     0,
    hasPlayedHard:   false,
    playedOnBirthday:false,
    gameBreakdown:   {},
    ...overrides,
  });

  test('desbloqueia first_game com 1 jogo', () => {
    const newAchs = computeNewAchievements(stats({ totalGames: 1 }), []);
    assert.ok(newAchs.some(a => a.achievementId === 'first_game'));
  });

  test('desbloqueia streak_2 com 2 dias', () => {
    const newAchs = computeNewAchievements(stats({ streakDays: 2 }), []);
    assert.ok(newAchs.some(a => a.achievementId === 'streak_2'));
  });

  test('não desbloqueia já unlocked', () => {
    const existing = [{ achievementId: 'first_game', playerId: pid }];
    const newAchs  = computeNewAchievements(stats({ totalGames: 1 }), existing);
    assert.equal(newAchs.filter(a => a.achievementId === 'first_game').length, 0);
  });

  test('desbloqueia multiple de vez', () => {
    const newAchs = computeNewAchievements(stats({ totalGames: 5, streakDays: 5, totalPoints: 100 }), []);
    assert.ok(newAchs.length >= 3);
  });

  test('desbloqueia birthday no aniversário', () => {
    const newAchs = computeNewAchievements(stats({ playedOnBirthday: true }), []);
    assert.ok(newAchs.some(a => a.achievementId === 'birthday'));
  });

  test('desbloqueia word_hunter com 5 caça-palavras', () => {
    const newAchs = computeNewAchievements(stats({ gameBreakdown: { wordsearch: 5 } }), []);
    assert.ok(newAchs.some(a => a.achievementId === 'word_hunter'));
  });

  test('toPublic() retorna campos corretos', () => {
    const a = new Achievement({ playerId: pid, achievementId: 'first_game', unlockedAt: new Date().toISOString() });
    const pub = a.toPublic();
    assert.ok('id' in pub);
    assert.ok('label' in pub);
    assert.ok('description' in pub);
    assert.ok('unlockedAt' in pub);
  });
});
