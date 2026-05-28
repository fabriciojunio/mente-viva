/**
 * gameEngine.js — Lógica pura de todos os jogos.
 * Zero UI, zero AsyncStorage, 100% testável com node --test.
 */

// ── Configurações por nível ───────────────────────────────────────────────────
export const LEVEL_CONFIG = {
  easy:   { timeLimit: 90,  label: 'Fácil',   emoji: '🌱' },
  medium: { timeLimit: 60,  label: 'Normal',  emoji: '⭐' },
  hard:   { timeLimit: 45,  label: 'Difícil', emoji: '🔥' },
};

// ── Shuffle (Fisher-Yates) ────────────────────────────────────────────────────
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── JOGO 1: MEMÓRIA ───────────────────────────────────────────────────────────
const MEM_EMOJIS = ['🌸','🌺','🍎','🐶','🦋','🌈','⭐','🎵','🍓','🌙','🏠','🎈','🐱','🌻','🦁','🍦','🎀','🔔','🌊','🐢'];

export const MemoryEngine = {
  setup(level) {
    const n     = { easy:6, medium:8, hard:10 }[level] || 6;
    const emojis= MEM_EMOJIS.slice(0, n);
    const cards = shuffle([...emojis, ...emojis]).map((emoji, i) => ({
      id: i, emoji, flipped: false, matched: false,
    }));
    return { cards, pairsFound: 0, totalPairs: n, flipped: [] };
  },

  flip(state, cardId) {
    const { cards, flipped, pairsFound } = state;
    if (flipped.length >= 2) return state;
    const card = cards.find(c => c.id === cardId);
    if (!card || card.flipped || card.matched) return state;
    const newCards   = cards.map(c => c.id === cardId ? { ...c, flipped: true } : c);
    const newFlipped = [...flipped, cardId];
    if (newFlipped.length === 2) {
      const [a, b] = newFlipped.map(id => newCards.find(c => c.id === id));
      if (a.emoji === b.emoji) {
        const matched = newCards.map(c => newFlipped.includes(c.id) ? { ...c, matched: true } : c);
        return { cards: matched, flipped: [], pairsFound: pairsFound + 1, totalPairs: state.totalPairs, lastResult: 'match' };
      }
      return { cards: newCards, flipped: newFlipped, pairsFound, totalPairs: state.totalPairs, lastResult: 'mismatch' };
    }
    return { cards: newCards, flipped: newFlipped, pairsFound, totalPairs: state.totalPairs };
  },

  unflip(state) {
    const newCards = state.cards.map(c => state.flipped.includes(c.id) ? { ...c, flipped: false } : c);
    return { ...state, cards: newCards, flipped: [], lastResult: null };
  },

  calcScore(pairs, timeLeft, level) {
    const base  = pairs * ({ easy:10, medium:15, hard:20 }[level] || 10);
    const bonus = Math.max(0, Math.floor(timeLeft / 10)) * 5;
    return base + bonus;
  },

  isComplete: (s) => s.pairsFound >= s.totalPairs,
};

// ── JOGO 2: RAPIDEZ ───────────────────────────────────────────────────────────
const SPEED_EMOJIS = ['😀','😂','🥰','😎','🤩','😜','🥳','😴','🤔','🙄','😮','🥺','😡','🤗','😇'];

export const SpeedEngine = {
  init: () => ({ prev: null, current: null, correct: 0, wrong: 0 }),

  next(state) {
    const same    = state.current && Math.random() < 0.45;
    const current = same ? state.current : SPEED_EMOJIS[Math.floor(Math.random() * SPEED_EMOJIS.length)];
    return { ...state, prev: state.current, current };
  },

  answer(state, userSaysYes, level) {
    if (!state.prev) return { ...state, lastResult: 'skip' };
    const isMatch  = state.current === state.prev;
    const correct  = isMatch === userSaysYes;
    const pts      = { easy:5, medium:8, hard:12 }[level] || 5;
    return {
      ...state,
      correct: state.correct + (correct ? 1 : 0),
      wrong:   state.wrong   + (correct ? 0 : 1),
      lastResult: correct ? 'correct' : 'wrong',
      lastPoints: correct ? pts : 0,
    };
  },

  calcScore: (correct, wrong, level) =>
    Math.max(0, correct * ({ easy:5, medium:8, hard:12 }[level]||5) - wrong * 2),
};

// ── JOGO 3: SEQUÊNCIA ─────────────────────────────────────────────────────────
const SEQ_OPTIONS = ['🌸','⭐','🎵','🍎','🐶','🌈','🦋','🎈'];

export const SequenceEngine = {
  setup: (level) => ({ length: { easy:3, medium:4, hard:5 }[level]||3, score:0, round:0 }),
  generate: (length) => Array.from({ length }, () => SEQ_OPTIONS[Math.floor(Math.random() * SEQ_OPTIONS.length)]),
  validate: (input, correct) => input.length === correct.length && input.every((v,i) => v === correct[i]),
  calcScore: (ok, level, round) => ok ? ({ easy:15, medium:25, hard:35 }[level]||15) + round*5 : 0,
  OPTIONS: SEQ_OPTIONS,
};

// ── JOGO 4: STROOP (CORES) ───────────────────────────────────────────────────
export const STROOP_COLORS = [
  { name:'VERMELHO', hex:'#DC2626' }, { name:'AZUL',     hex:'#2563EB' },
  { name:'VERDE',    hex:'#16A34A' }, { name:'AMARELO',  hex:'#CA8A04' },
  { name:'ROSA',     hex:'#DB2777' }, { name:'LARANJA',  hex:'#EA580C' },
];

export const StroopEngine = {
  next(level) {
    const word    = STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)];
    const inkColor= STROOP_COLORS[Math.floor(Math.random() * STROOP_COLORS.length)];
    const askInk  = level !== 'easy' || Math.random() > 0.3;
    const correct = askInk ? inkColor.name : word.name;
    const question= askInk ? '🖌️ Qual é a COR da tinta?' : '📖 Qual PALAVRA está escrita?';
    const opts    = shuffle([...STROOP_COLORS]).slice(0, 4);
    if (!opts.find(o => o.name === correct)) opts[0] = STROOP_COLORS.find(o => o.name === correct);
    return { word: word.name, inkHex: inkColor.hex, correct, question, options: shuffle(opts) };
  },
  calcScore: (ok, level) => ok ? ({ easy:8, medium:12, hard:18 }[level]||8) : 0,
};

// ── JOGO 5: MATEMÁTICA ───────────────────────────────────────────────────────
export const MathEngine = {
  next(level) {
    const ops = { easy:['+','-'], medium:['+','-','×'], hard:['+','-','×','÷'] }[level]||['+'];
    const op  = ops[Math.floor(Math.random() * ops.length)];
    let a, b;
    if (level==='easy')   { a=randInt(1,10);  b=randInt(1,10);  }
    else if (level==='medium') { a=randInt(1,20); b=randInt(1,10); }
    else                  { a=randInt(5,30);  b=randInt(2,12);  }
    if (op==='-' && b>a) [a,b]=[b,a];
    if (op==='÷') { b=[2,3,4,5][Math.floor(Math.random()*4)]; a=b*randInt(2,9); }
    const answer = op==='+'?a+b:op==='-'?a-b:op==='×'?a*b:a/b;
    const wrongs = new Set();
    while (wrongs.size < 3) {
      const delta = randInt(1,9);
      const w = Math.random()>0.5 ? answer+delta : Math.max(0,answer-delta);
      if (w!==answer) wrongs.add(w);
    }
    return { display:`${a} ${op} ${b} = ?`, answer, options: shuffle([answer,...wrongs]) };
  },
  calcScore: (level) => ({ easy:8, medium:12, hard:16 }[level]||8),
};

function randInt(min, max) { return Math.floor(Math.random()*(max-min+1))+min; }

// ── JOGO 6: PALAVRAS (Forca) ─────────────────────────────────────────────────
export const WORD_BANK = {
  easy: [
    {word:'GATO',  clue:'Animal doméstico que mia 🐱'},
    {word:'FLOR',  clue:'Nasce em jardins e é linda 🌸'},
    {word:'BOLO',  clue:'Sobremesa de aniversário 🎂'},
    {word:'CASA',  clue:'Lugar onde moramos 🏠'},
    {word:'AGUA',  clue:'Bebida essencial para a vida 💧'},
    {word:'AMOR',  clue:'O sentimento mais bonito ❤️'},
    {word:'PATO',  clue:'Ave que vive perto da água 🦆'},
    {word:'UVAS',  clue:'Fruta usada para fazer vinho 🍇'},
    {word:'BOCA',  clue:'Usada para comer e falar 👄'},
    {word:'MALA',  clue:'Guarda roupas para viagens 🧳'},
    {word:'RATO',  clue:'Pequeno roedor cinza 🐭'},
    {word:'FOGO',  clue:'Produz calor e luz 🔥'},
  ],
  medium: [
    {word:'POMBO', clue:'Ave cinza comum nas cidades 🕊️'},
    {word:'VERDE', clue:'Cor das folhas das plantas 🍃'},
    {word:'PIANO', clue:'Instrumento musical com teclas 🎹'},
    {word:'NUVEM', clue:'Flutua no céu e traz chuva ☁️'},
    {word:'LIMAO', clue:'Fruta azeda de cor amarela 🍋'},
    {word:'TIGRE', clue:'Grande felino listrado 🐯'},
    {word:'BURRO', clue:'Animal de carga resistente 🫏'},
    {word:'FOLHA', clue:'Parte verde da árvore 🍃'},
    {word:'CHAVE', clue:'Abre e fecha portas 🔑'},
    {word:'BORLA', clue:'Serve para apagar o lápis'},
  ],
  hard: [
    {word:'ABOBORA',  clue:'Legume laranja usado em sopas 🎃'},
    {word:'CORAGEM',  clue:'Virtude de ser valente e forte 💪'},
    {word:'CANARIO',  clue:'Pássaro que canta muito bem 🐤'},
    {word:'MEMORIA',  clue:'Capacidade de lembrar as coisas 🧠'},
    {word:'FAMILIA',  clue:'Pessoas que amamos muito 👨‍👩‍👧‍👦'},
    {word:'JANELAS',  clue:'Aberturas nas paredes para luz ☀️'},
    {word:'BANDEJA',  clue:'Usada para servir alimentos 🍽️'},
    {word:'LARANJA',  clue:'Fruta cítrica de cor alaranjada 🍊'},
  ],
};

export const WordEngine = {
  setup(level) {
    const bank = WORD_BANK[level] || WORD_BANK.easy;
    const { word, clue } = bank[Math.floor(Math.random() * bank.length)];
    return { word, clue, guessed:[], wrong:[], maxGuesses: {easy:8,medium:6,hard:5}[level]||6 };
  },
  guess(state, letter) {
    if (state.guessed.includes(letter)||state.wrong.includes(letter)) return {...state,lastResult:'already'};
    if (state.word.includes(letter)) {
      const guessed = [...state.guessed, letter];
      const won     = state.word.split('').every(l => guessed.includes(l));
      return {...state, guessed, lastResult: won?'won':'correct'};
    }
    const wrong = [...state.wrong, letter];
    return {...state, wrong, lastResult: wrong.length>=state.maxGuesses?'lost':'wrong'};
  },
  getDisplay: (s) => s.word.split('').map(l=>s.guessed.includes(l)?l:'_').join(' '),
  calcScore:  (s, level) => ({easy:20,medium:30,hard:50}[level]||20) + Math.max(0,(s.maxGuesses-s.wrong.length)*5),
  LETTERS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l=>!['K','W','Y'].includes(l)),
};

// ── JOGO 7: CAÇA-PALAVRAS ────────────────────────────────────────────────────
// Temas para a caça-palavras — categorias afetivas e cotidianas
export const WORDSEARCH_THEMES = {
  easy: [
    {
      title: '💕 Família e Amor',
      words: ['MAE','PAI','AMOR','FILHA','FILHO','AVOS','CASA','LAR'],
    },
    {
      title: '🌸 Flores e Natureza',
      words: ['ROSA','FLOR','SOL','MAR','RIO','CAMPO','CHUVA','ARVORE'],
    },
    {
      title: '🍎 Frutas Deliciosas',
      words: ['UVA','PERA','MACA','MANGA','ABACAXI','BANANA','LARANJA','LIMAO'],
    },
  ],
  medium: [
    {
      title: '🧠 Saúde e Bem-estar',
      words: ['SAUDE','CORPO','MENTE','ALEGRIA','CALMA','FORÇA','ENERGIA','SONO'],
    },
    {
      title: '🌍 Brasil e Cultura',
      words: ['BRASIL','SAMBA','CAIPIRA','PRAIA','FUTEBOL','CARNAVAL','FESTA','MUSICA'],
    },
    {
      title: '🍳 Na Cozinha',
      words: ['ARROZ','FEIJAO','PIMENTA','ALHO','CEBOLA','TOMATE','FRANGO','CALDO'],
    },
  ],
  hard: [
    {
      title: '💪 Virtudes e Valores',
      words: ['CORAGEM','BONDADE','RESPEITO','GRATIDAO','PACIENCIA','DEDICACAO','AMIZADE','CARIDADE'],
    },
    {
      title: '🎶 Músicas e Ritmos',
      words: ['SERTANEJO','AXE','PAGODE','FORRO','BOLERO','BAIAO','FREVO','LAMBADA'],
    },
  ],
};

// Direções possíveis para colocar palavras na grade
const DIRECTIONS = [
  [0,1],   // →
  [0,-1],  // ←
  [1,0],   // ↓
  [-1,0],  // ↑
  [1,1],   // ↘
  [1,-1],  // ↙
];

export const WordSearchEngine = {
  /**
   * Gera uma grade de caça-palavras.
   * @param {string[]} words — palavras a esconder
   * @param {number}   size  — tamanho da grade (linhas = colunas)
   * @returns {{ grid, placed, wordPositions }}
   */
  buildGrid(words, size = 12) {
    const grid = Array.from({ length: size }, () => Array(size).fill(''));
    const wordPositions = {}; // { WORD: [{row,col},...] }

    for (const rawWord of words) {
      const word = rawWord.toUpperCase().replace(/[^A-Z]/g, '');
      if (!word.length) continue;

      let placedOk = false;
      const dirs = shuffle(DIRECTIONS);
      outerLoop: for (let attempt = 0; attempt < 40; attempt++) {
        const [dr, dc] = dirs[attempt % dirs.length];
        const row = Math.floor(Math.random() * size);
        const col = Math.floor(Math.random() * size);
        const cells = [];
        for (let i = 0; i < word.length; i++) {
          const r = row + dr * i, c = col + dc * i;
          if (r < 0 || r >= size || c < 0 || c >= size) continue outerLoop;
          if (grid[r][c] !== '' && grid[r][c] !== word[i]) continue outerLoop;
          cells.push({ row: r, col: c });
        }
        // Place word
        cells.forEach(({row:r, col:c}, i) => { grid[r][c] = word[i]; });
        wordPositions[word] = cells;
        placedOk = true;
        break;
      }
    }

    // Fill blanks with random letters
    const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < size; r++)
      for (let c = 0; c < size; c++)
        if (!grid[r][c]) grid[r][c] = ALPHA[Math.floor(Math.random() * ALPHA.length)];

    return { grid, wordPositions, placedWords: Object.keys(wordPositions) };
  },

  /**
   * Verifica se uma seleção de células forma uma palavra válida.
   */
  checkSelection(selection, wordPositions) {
    for (const [word, cells] of Object.entries(wordPositions)) {
      if (cells.length !== selection.length) continue;
      const match = cells.every((c, i) => c.row === selection[i].row && c.col === selection[i].col);
      const matchReverse = cells.every((c, i) => c.row === selection[selection.length-1-i].row && c.col === selection[selection.length-1-i].col);
      if (match || matchReverse) return word;
    }
    return null;
  },

  setup(level) {
    const themes  = WORDSEARCH_THEMES[level] || WORDSEARCH_THEMES.easy;
    const theme   = themes[Math.floor(Math.random() * themes.length)];
    const size    = { easy:10, medium:12, hard:14 }[level] || 10;
    const { grid, wordPositions, placedWords } = this.buildGrid(theme.words, size);
    return {
      title:      theme.title,
      words:      placedWords,
      grid,
      wordPositions,
      found:      [],
      size,
      selection:  [],
    };
  },

  toggleCell(state, row, col) {
    const { selection } = state;
    const already = selection.findIndex(c => c.row === row && c.col === col);
    if (already >= 0) {
      return { ...state, selection: selection.slice(0, already) };
    }
    return { ...state, selection: [...selection, { row, col }] };
  },

  confirmSelection(state) {
    const found = WordSearchEngine.checkSelection(state.selection, state.wordPositions);
    if (found && !state.found.includes(found)) {
      return { ...state, found: [...state.found, found], selection: [], lastFound: found };
    }
    return { ...state, selection: [], lastFound: null };
  },

  calcScore(foundCount, totalWords, timeLeft, level) {
    const base      = foundCount * ({ easy:10, medium:15, hard:25 }[level]||10);
    const timeBonus = foundCount === totalWords ? Math.max(0, Math.floor(timeLeft/10)*3) : 0;
    return base + timeBonus;
  },

  isComplete: (s) => s.found.length >= s.words.length,
};

// ── Achievements check (frontend) ────────────────────────────────────────────
export const ACHIEVEMENTS = [
  { id:'first_game',    label:'Primeira Jogada! 🎮',   check: s => s.totalGames >= 1 },
  { id:'five_games',    label:'Começando Bem! 🌟',      check: s => s.totalGames >= 5 },
  { id:'ten_games',     label:'Veterana! 💪',           check: s => s.totalGames >= 10 },
  { id:'fifty_games',   label:'Mestre do Jogo! 🏆',     check: s => s.totalGames >= 50 },
  { id:'streak_2',      label:'2 Dias Seguidos! 🔥',    check: s => s.streakDays >= 2 },
  { id:'streak_5',      label:'5 Dias Seguidos! 🔥🔥',  check: s => s.streakDays >= 5 },
  { id:'streak_7',      label:'Uma Semana Inteira! 🌈', check: s => s.streakDays >= 7 },
  { id:'points_100',    label:'100 Pontos! ⭐',         check: s => s.totalPoints >= 100 },
  { id:'points_500',    label:'500 Pontos! 💎',         check: s => s.totalPoints >= 500 },
  { id:'all_games',     label:'Exploradora! 🗺️',        check: s => (s.uniqueGames||0) >= 7 },
  { id:'word_hunter',   label:'Caçadora de Palavras! 🔍',check:s => (s.wordSearchCount||0) >= 5 },
  { id:'perfect_score', label:'Nota 100! 🎯',           check: s => s.bestScore >= 100 },
];

export async function checkAndUnlock(stats, storageRef) {
  const existing  = await storageRef.getAchievements();
  const existIds  = new Set(existing.map(a => a.id));
  const newOnes   = [];
  for (const ach of ACHIEVEMENTS) {
    if (!existIds.has(ach.id) && ach.check(stats)) {
      const r = await storageRef.unlockAchievement(ach.id, ach.label);
      if (r) newOnes.push(r);
    }
  }
  return newOnes;
}
