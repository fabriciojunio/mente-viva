'use strict';
const { ValidationError } = require('../errors');
const { v4: uuidv4 } = require('uuid');

const VALID_GAMES  = ['memory', 'speed', 'sequence', 'stroop', 'math', 'word', 'wordsearch'];
const VALID_LEVELS = ['easy', 'medium', 'hard'];

const GAME_BRAIN_MAP = {
  memory:     'memory',
  speed:      'speed',
  sequence:   'attention',
  stroop:     'attention',
  math:       'reasoning',
  word:       'language',
  wordsearch: 'language',
};

/**
 * Session — representa uma partida jogada.
 */
class Session {
  constructor({ id, playerId, game, level, score, durationMs, createdAt }) {
    this.id         = id;
    this.playerId   = playerId;
    this.game       = game;
    this.level      = level;
    this.score      = score;
    this.durationMs = durationMs;
    this.createdAt  = createdAt;
    this.brainArea  = GAME_BRAIN_MAP[game] || 'memory';
  }

  static create(raw) {
    const { playerId, game, level, score, durationMs } = raw;

    if (!playerId || typeof playerId !== 'string') {
      throw new ValidationError('playerId é obrigatório');
    }
    if (!VALID_GAMES.includes(game)) {
      throw new ValidationError(`Jogo inválido. Válidos: ${VALID_GAMES.join(', ')}`);
    }
    if (!VALID_LEVELS.includes(level)) {
      throw new ValidationError(`Nível inválido. Válidos: ${VALID_LEVELS.join(', ')}`);
    }
    if (typeof score !== 'number' || score < 0 || score > 9999) {
      throw new ValidationError('score deve ser número entre 0 e 9999');
    }
    if (typeof durationMs !== 'number' || durationMs < 0) {
      throw new ValidationError('durationMs deve ser número positivo');
    }

    return new Session({
      id: uuidv4(),
      playerId, game, level, score, durationMs,
      createdAt: new Date().toISOString(),
    });
  }

  /** Pontos de reforço cerebral ponderados por nível */
  getBrainPoints() {
    const multiplier = this.level === 'easy' ? 1 : this.level === 'medium' ? 1.5 : 2;
    return Math.round(this.score * multiplier);
  }

  toPublic() {
    return {
      id:         this.id,
      playerId:   this.playerId,
      game:       this.game,
      level:      this.level,
      score:      this.score,
      durationMs: this.durationMs,
      brainArea:  this.brainArea,
      brainPoints:this.getBrainPoints(),
      createdAt:  this.createdAt,
    };
  }
}

module.exports = { Session, VALID_GAMES, VALID_LEVELS };
