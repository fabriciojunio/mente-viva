'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
process.env.NODE_ENV = 'test';

// ── Lógica pura dos jogos (sem UI) ────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length-1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i+1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Memory
function memorySetup(level) {
  const EMOJIS = ['🌸','🌺','🍎','🐶','🦋','🌈','⭐','🎵','🍓','🌙'];
  const n = { easy:6, medium:8, hard:10 }[level] || 6;
  const cards = shuffle([...EMOJIS.slice(0,n), ...EMOJIS.slice(0,n)]).map((e,i) => ({ id:i, emoji:e, flipped:false, matched:false }));
  return { cards, pairsFound:0, totalPairs:n, flipped:[] };
}
function memoryScore(pairs, timeLeft, level) {
  return pairs * ({easy:10,medium:15,hard:20}[level]||10) + Math.max(0, Math.floor(timeLeft/10)*5);
}

// Speed
function speedScore(correct, wrong, level) {
  return Math.max(0, correct * ({easy:5,medium:8,hard:12}[level]||5) - wrong * 2);
}

// Sequence
function seqValidate(input, correct) {
  return input.length === correct.length && input.every((v,i) => v === correct[i]);
}
function seqScore(correct, level, round) {
  return correct ? ({easy:15,medium:25,hard:35}[level]||15) + round*5 : 0;
}

// Math
function mathScore(level) {
  return {easy:8,medium:12,hard:16}[level]||8;
}

// Word
function wordGuess(state, letter) {
  if (state.guessed.includes(letter)||state.wrong.includes(letter)) return {...state,result:'already'};
  if (state.word.includes(letter)) {
    const guessed = [...state.guessed, letter];
    return {...state, guessed, result: state.word.split('').every(l=>guessed.includes(l)) ? 'won' : 'correct'};
  }
  const wrong = [...state.wrong, letter];
  return {...state, wrong, result: wrong.length >= state.maxGuesses ? 'lost' : 'wrong'};
}
function wordDisplay(word, guessed) {
  return word.split('').map(l => guessed.includes(l) ? l : '_').join(' ');
}

// Word Search
function buildGrid(size, words) {
  const grid = Array.from({length:size}, () => Array(size).fill(''));
  let placed = 0;
  for (const word of words) {
    // Try to place horizontally
    for (let attempt = 0; attempt < 20; attempt++) {
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * (size - word.length));
      const cells = Array.from({length:word.length}, (_,i) => grid[row][col+i]);
      if (cells.every((c,i) => c==='' || c===word[i])) {
        word.split('').forEach((ch,i) => grid[row][col+i] = ch);
        placed++;
        break;
      }
    }
  }
  // Fill remaining with random letters
  const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let r=0; r<size; r++)
    for (let c=0; c<size; c++)
      if (!grid[r][c]) grid[r][c] = ALPHA[Math.floor(Math.random()*ALPHA.length)];
  return { grid, placed };
}

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('MemoryEngine', () => {
  test('easy cria 12 cartas (6 pares)', () => {
    const s = memorySetup('easy');
    assert.equal(s.cards.length, 12);
    assert.equal(s.totalPairs, 6);
  });
  test('hard cria 20 cartas', () => assert.equal(memorySetup('hard').cards.length, 20));
  test('cada emoji aparece exatamente 2 vezes', () => {
    const s = memorySetup('easy');
    const counts = {};
    s.cards.forEach(c => { counts[c.emoji] = (counts[c.emoji]||0)+1; });
    Object.values(counts).forEach(v => assert.equal(v, 2));
  });
  test('score aumenta com mais pares', () => {
    assert.ok(memoryScore(6,0,'easy') > memoryScore(3,0,'easy'));
  });
  test('score aumenta com tempo restante', () => {
    assert.ok(memoryScore(6,60,'easy') > memoryScore(6,0,'easy'));
  });
  test('score hard > medium > easy', () => {
    const e = memoryScore(6,0,'easy'), m = memoryScore(6,0,'medium'), h = memoryScore(6,0,'hard');
    assert.ok(m > e && h > m);
  });
});

describe('SpeedEngine', () => {
  test('10 corretos easy = 50', () => assert.equal(speedScore(10,0,'easy'), 50));
  test('10 corretos hard = 120', () => assert.equal(speedScore(10,0,'hard'), 120));
  test('score mínimo é 0', () => assert.equal(speedScore(0,100,'easy'), 0));
  test('erros reduzem score', () => assert.ok(speedScore(5,5,'easy') < speedScore(5,0,'easy')));
});

describe('SequenceEngine', () => {
  test('sequência exata retorna true', () => assert.equal(seqValidate(['🌸','⭐'],['🌸','⭐']), true));
  test('ordem errada retorna false', () => assert.equal(seqValidate(['⭐','🌸'],['🌸','⭐']), false));
  test('comprimento diferente retorna false', () => assert.equal(seqValidate(['🌸'],['🌸','⭐']), false));
  test('arrays vazios correspondem', () => assert.equal(seqValidate([],[]), true));
  test('score aumenta com round', () => assert.ok(seqScore(true,'easy',5) > seqScore(true,'easy',0)));
  test('score 0 para incorreto', () => assert.equal(seqScore(false,'hard',3), 0));
});

describe('MathEngine', () => {
  test('score hard > easy', () => assert.ok(mathScore('hard') > mathScore('easy')));
  test('score > 0', () => assert.ok(mathScore('medium') > 0));
});

describe('WordEngine', () => {
  const mk = (word, max=6) => ({ word, guessed:[], wrong:[], maxGuesses:max });

  test('letra correta → correct', () => {
    assert.equal(wordGuess(mk('GATO'), 'G').result, 'correct');
  });
  test('letra errada → wrong', () => {
    assert.equal(wordGuess(mk('GATO'), 'Z').result, 'wrong');
  });
  test('última letra → won', () => {
    let s = mk('AB');
    s = wordGuess(s, 'A');
    s = wordGuess(s, 'B');
    assert.equal(s.result, 'won');
  });
  test('máximo de erros → lost', () => {
    let s = mk('ABC', 2);
    s = wordGuess(s, 'Z');
    s = wordGuess(s, 'X');
    assert.equal(s.result, 'lost');
  });
  test('letra repetida → already', () => {
    let s = wordGuess(mk('GATO'), 'G');
    s = wordGuess(s, 'G');
    assert.equal(s.result, 'already');
  });
  test('display mostra blanks', () => {
    assert.equal(wordDisplay('GATO', ['G']), 'G _ _ _');
  });
  test('display completo quando tudo adivinhado', () => {
    assert.equal(wordDisplay('GATO', ['G','A','T','O']), 'G A T O');
  });
});

describe('WordSearch grid builder', () => {
  test('grade tem tamanho correto', () => {
    const { grid } = buildGrid(10, ['GATO', 'AMOR']);
    assert.equal(grid.length, 10);
    assert.equal(grid[0].length, 10);
  });
  test('grade sem células vazias', () => {
    const { grid } = buildGrid(8, ['MAE']);
    const empty = grid.flat().filter(c => c === '');
    assert.equal(empty.length, 0);
  });
  test('grade é array de arrays', () => {
    const { grid } = buildGrid(6, ['SOL']);
    assert.ok(Array.isArray(grid));
    assert.ok(Array.isArray(grid[0]));
  });
  test('shuffle preserva elementos', () => {
    const arr = [1,2,3,4,5];
    const shuffled = shuffle(arr);
    assert.deepEqual([...shuffled].sort((a,b)=>a-b), arr);
  });
  test('shuffle não muta original', () => {
    const arr = [1,2,3];
    shuffle(arr);
    assert.deepEqual(arr, [1,2,3]);
  });
});
