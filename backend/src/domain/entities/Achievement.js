'use strict';

/**
 * Sistema de conquistas — 100% lógica de domínio.
 * Condições baseadas em psicologia de gamificação (reforço positivo variável).
 */
const ACHIEVEMENT_CATALOG = [
  // Primeiros passos
  { id: 'first_game',       label: 'Primeira Jogada! 🎮',      desc: 'Completou seu primeiro jogo',         condition: s => s.totalGames >= 1 },
  { id: 'five_games',       label: 'Começando Bem! 🌟',         desc: '5 jogos completados',                 condition: s => s.totalGames >= 5 },
  { id: 'ten_games',        label: 'Veterana! 💪',              desc: '10 jogos completados',                condition: s => s.totalGames >= 10 },
  { id: 'fifty_games',      label: 'Mestre do Jogo! 🏆',        desc: '50 jogos completados',                condition: s => s.totalGames >= 50 },

  // Sequências (mantém engajamento)
  { id: 'streak_2',         label: '2 Dias Seguidos! 🔥',       desc: 'Jogou 2 dias consecutivos',          condition: s => s.streakDays >= 2 },
  { id: 'streak_5',         label: 'Semana Quase Lá! 🔥🔥',     desc: 'Jogou 5 dias consecutivos',          condition: s => s.streakDays >= 5 },
  { id: 'streak_7',         label: 'Uma Semana Inteira! 🌈',    desc: 'Jogou 7 dias consecutivos',          condition: s => s.streakDays >= 7 },
  { id: 'streak_30',        label: 'Um Mês de Dedicação! 👑',   desc: 'Jogou 30 dias consecutivos',         condition: s => s.streakDays >= 30 },

  // Pontuação
  { id: 'points_100',       label: '100 Pontos! ⭐',            desc: 'Acumulou 100 pontos no total',       condition: s => s.totalPoints >= 100 },
  { id: 'points_500',       label: '500 Pontos! 💎',            desc: 'Acumulou 500 pontos no total',       condition: s => s.totalPoints >= 500 },
  { id: 'points_2000',      label: '2.000 Pontos! 🚀',          desc: 'Acumulou 2.000 pontos',              condition: s => s.totalPoints >= 2000 },

  // Variedade (incentiva explorar todos os jogos)
  { id: 'all_games',        label: 'Exploradora! 🗺️',           desc: 'Jogou todos os tipos de jogos',     condition: s => s.uniqueGames >= 7 },
  { id: 'hard_mode',        label: 'Corajosa! 🦁',              desc: 'Completou um jogo no nível Difícil', condition: s => s.hasPlayedHard },
  { id: 'perfect_score',    label: 'Nota 100! 🎯',              desc: 'Fez 100 pontos em um único jogo',   condition: s => s.bestScore >= 100 },

  // Aniversário especial
  { id: 'birthday',         label: 'Feliz Aniversário! 🎂',     desc: 'Jogou no seu dia de aniversário!',   condition: s => s.playedOnBirthday },

  // Caça-palavras
  { id: 'word_hunter',      label: 'Caçadora de Palavras! 🔍',  desc: 'Completou 5 caças-palavras',         condition: s => (s.gameBreakdown?.wordsearch || 0) >= 5 },
  { id: 'word_master',      label: 'Mestra das Palavras! 📚',   desc: 'Completou 20 caças-palavras',        condition: s => (s.gameBreakdown?.wordsearch || 0) >= 20 },
];

class Achievement {
  constructor({ playerId, achievementId, unlockedAt }) {
    this.playerId      = playerId;
    this.achievementId = achievementId;
    this.unlockedAt    = unlockedAt;
    this.meta          = ACHIEVEMENT_CATALOG.find(a => a.id === achievementId) || {};
  }

  toPublic() {
    return {
      id:          this.achievementId,
      label:       this.meta.label || this.achievementId,
      description: this.meta.desc  || '',
      unlockedAt:  this.unlockedAt,
    };
  }
}

/** Verifica quais conquistas foram desbloqueadas com base nas stats */
function computeNewAchievements(stats, alreadyUnlocked) {
  const unlockedIds = new Set(alreadyUnlocked.map(a => a.achievementId));
  return ACHIEVEMENT_CATALOG
    .filter(a => !unlockedIds.has(a.id) && a.condition(stats))
    .map(a => new Achievement({
      playerId:      stats.playerId,
      achievementId: a.id,
      unlockedAt:    new Date().toISOString(),
    }));
}

module.exports = { Achievement, ACHIEVEMENT_CATALOG, computeNewAchievements };
