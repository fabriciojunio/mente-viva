'use strict';
/**
 * gameEngine.test.js — Testes da lógica pura de todos os jogos.
 * Roda com: node --test
 * Zero dependências de UI ou React Native.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// ── Replica lógica pura dos jogos (sem import/export) ─────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i=a.length-1; i>0; i--) {
    const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

// Memory
const MEM_EMOJIS=['🌸','🌺','🍎','🐶','🦋','🌈','⭐','🎵','🍓','🌙'];
const MemEng={
  setup(level){ const n={easy:6,medium:8,hard:10}[level]||6; const e=MEM_EMOJIS.slice(0,n); const cards=shuffle([...e,...e]).map((emoji,i)=>({id:i,emoji,flipped:false,matched:false})); return{cards,pairsFound:0,totalPairs:n,flipped:[]}; },
  flip(state,id){ const{cards,flipped,pairsFound}=state; if(flipped.length>=2)return state; const card=cards.find(c=>c.id===id); if(!card||card.flipped||card.matched)return state; const nc=cards.map(c=>c.id===id?{...c,flipped:true}:c); const nf=[...flipped,id]; if(nf.length===2){ const[a,b]=nf.map(x=>nc.find(c=>c.id===x)); if(a.emoji===b.emoji){ const m=nc.map(c=>nf.includes(c.id)?{...c,matched:true}:c); return{cards:m,flipped:[],pairsFound:pairsFound+1,totalPairs:state.totalPairs,lastResult:'match'}; } return{cards:nc,flipped:nf,pairsFound,totalPairs:state.totalPairs,lastResult:'mismatch'}; } return{cards:nc,flipped:nf,pairsFound,totalPairs:state.totalPairs}; },
  calcScore:(pairs,time,level)=>pairs*({easy:10,medium:15,hard:20}[level]||10)+Math.max(0,Math.floor(time/10)*5),
  isComplete:(s)=>s.pairsFound>=s.totalPairs,
};

// Speed
const SpdEng={
  calcScore:(c,w,l)=>Math.max(0,c*({easy:5,medium:8,hard:12}[l]||5)-w*2),
};

// Sequence
const SeqEng={
  validate:(inp,cor)=>inp.length===cor.length&&inp.every((v,i)=>v===cor[i]),
  calcScore:(ok,l,r)=>ok?({easy:15,medium:25,hard:35}[l]||15)+r*5:0,
};

// Math
const MthEng={
  calcScore:(l)=>({easy:8,medium:12,hard:16}[l]||8),
  next(level){
    const ops={easy:['+','-'],medium:['+','-','×'],hard:['+','-','×','÷']}[level]||['+'];
    const op=ops[Math.floor(Math.random()*ops.length)];
    let a=Math.floor(Math.random()*10)+1,b=Math.floor(Math.random()*10)+1;
    if(op==='-'&&b>a)[a,b]=[b,a];
    if(op==='÷'){b=2;a=b*Math.floor(Math.random()*8+2);}
    const answer=op==='+'?a+b:op==='-'?a-b:op==='×'?a*b:a/b;
    return{display:`${a} ${op} ${b} = ?`,answer,options:shuffle([answer,answer+1,answer+2,answer+3])};
  },
};

// Word
const WrdEng={
  guess(state,letter){
    if(state.guessed.includes(letter)||state.wrong.includes(letter))return{...state,lastResult:'already'};
    if(state.word.includes(letter)){const g=[...state.guessed,letter];return{...state,guessed:g,lastResult:g.length&&state.word.split('').every(l=>g.includes(l))?'won':'correct'};}
    const w=[...state.wrong,letter];return{...state,wrong:w,lastResult:w.length>=state.maxGuesses?'lost':'wrong'};
  },
  getDisplay:(s)=>s.word.split('').map(l=>s.guessed.includes(l)?l:'_').join(' '),
  calcScore:(s,l)=>({easy:20,medium:30,hard:50}[l]||20)+Math.max(0,(s.maxGuesses-s.wrong.length)*5),
};

// WordSearch
const DIRECTIONS=[[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1]];
const WsEng={
  buildGrid(words,size=10){
    const grid=Array.from({length:size},()=>Array(size).fill(''));
    const pos={};
    for(const w of words){
      const word=w.toUpperCase().replace(/[^A-Z]/g,'');
      if(!word.length)continue;
      const dirs=shuffle(DIRECTIONS);
      let placed=false;
      outer: for(let att=0;att<40;att++){
        const[dr,dc]=dirs[att%dirs.length];
        const row=Math.floor(Math.random()*size),col=Math.floor(Math.random()*size);
        const cells=[];
        for(let i=0;i<word.length;i++){
          const r=row+dr*i,c=col+dc*i;
          if(r<0||r>=size||c<0||c>=size)continue outer;
          if(grid[r][c]!==''&&grid[r][c]!==word[i])continue outer;
          cells.push({row:r,col:c});
        }
        cells.forEach(({row:r,col:c},i)=>grid[r][c]=word[i]);
        pos[word]=cells; placed=true; break;
      }
    }
    const A='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for(let r=0;r<size;r++)for(let c=0;c<size;c++)if(!grid[r][c])grid[r][c]=A[Math.floor(Math.random()*A.length)];
    return{grid,wordPositions:pos,placedWords:Object.keys(pos)};
  },
  checkSelection(selection,wordPositions){
    for(const[word,cells]of Object.entries(wordPositions)){
      if(cells.length!==selection.length)continue;
      const match=cells.every((c,i)=>c.row===selection[i].row&&c.col===selection[i].col);
      const rev=cells.every((c,i)=>c.row===selection[selection.length-1-i].row&&c.col===selection[selection.length-1-i].col);
      if(match||rev)return word;
    }
    return null;
  },
  calcScore:(found,total,time,level)=>found*({easy:10,medium:15,hard:25}[level]||10)+(found===total?Math.max(0,Math.floor(time/10)*3):0),
};

// Achievements
const ACHS=[
  {id:'first_game',  check:s=>s.totalGames>=1},
  {id:'five_games',  check:s=>s.totalGames>=5},
  {id:'streak_2',    check:s=>s.streakDays>=2},
  {id:'points_100',  check:s=>s.totalPoints>=100},
  {id:'word_hunter', check:s=>(s.wordSearchCount||0)>=5},
  {id:'all_games',   check:s=>(s.uniqueGames||0)>=7},
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MemoryEngine', ()=>{
  test('easy = 12 cartas, 6 pares',   ()=>{ const s=MemEng.setup('easy'); assert.equal(s.cards.length,12); assert.equal(s.totalPairs,6); });
  test('medium = 16 cartas',          ()=>assert.equal(MemEng.setup('medium').cards.length,16));
  test('hard = 20 cartas',            ()=>assert.equal(MemEng.setup('hard').cards.length,20));
  test('cada emoji aparece 2x',()=>{
    const s=MemEng.setup('easy'); const cnt={};
    s.cards.forEach(c=>{cnt[c.emoji]=(cnt[c.emoji]||0)+1;});
    Object.values(cnt).forEach(v=>assert.equal(v,2));
  });
  test('isComplete false no início',  ()=>assert.equal(MemEng.isComplete(MemEng.setup('easy')),false));
  test('isComplete true quando completo',()=>assert.equal(MemEng.isComplete({pairsFound:6,totalPairs:6}),true));
  test('score hard > medium > easy',  ()=>{
    assert.ok(MemEng.calcScore(6,0,'hard')>MemEng.calcScore(6,0,'medium'));
    assert.ok(MemEng.calcScore(6,0,'medium')>MemEng.calcScore(6,0,'easy'));
  });
  test('score cresce com pares',      ()=>assert.ok(MemEng.calcScore(6,0,'easy')>MemEng.calcScore(3,0,'easy')));
  test('score cresce com tempo',      ()=>assert.ok(MemEng.calcScore(6,60,'easy')>MemEng.calcScore(6,0,'easy')));
  test('flip uma carta',()=>{
    const s=MemEng.setup('easy');
    const next=MemEng.flip(s,0);
    assert.equal(next.cards[0].flipped,true);
  });
  test('flip carta já virada não altera',()=>{
    let s=MemEng.setup('easy');
    s=MemEng.flip(s,0); const afterFirst=s.flipped.length;
    s=MemEng.flip(s,0); // mesma carta
    assert.equal(s.flipped.length,afterFirst);
  });
});

describe('SpeedEngine',()=>{
  test('10 corretos easy = 50',()=>assert.equal(SpdEng.calcScore(10,0,'easy'),50));
  test('10 corretos hard = 120',()=>assert.equal(SpdEng.calcScore(10,0,'hard'),120));
  test('score mínimo = 0',()=>assert.equal(SpdEng.calcScore(0,100,'easy'),0));
  test('erros reduzem score',()=>assert.ok(SpdEng.calcScore(5,5,'easy')<SpdEng.calcScore(5,0,'easy')));
  test('medium entre easy e hard',()=>{
    assert.ok(SpdEng.calcScore(10,0,'medium')>SpdEng.calcScore(10,0,'easy'));
    assert.ok(SpdEng.calcScore(10,0,'hard')>SpdEng.calcScore(10,0,'medium'));
  });
});

describe('SequenceEngine',()=>{
  test('sequência exata = true',  ()=>assert.equal(SeqEng.validate(['🌸','⭐'],['🌸','⭐']),true));
  test('ordem errada = false',    ()=>assert.equal(SeqEng.validate(['⭐','🌸'],['🌸','⭐']),false));
  test('comprimento menor = false',()=>assert.equal(SeqEng.validate(['🌸'],['🌸','⭐']),false));
  test('arrays vazios = true',    ()=>assert.equal(SeqEng.validate([],[]),true));
  test('score correto cresce por round',()=>assert.ok(SeqEng.calcScore(true,'easy',5)>SeqEng.calcScore(true,'easy',0)));
  test('score incorreto = 0',     ()=>assert.equal(SeqEng.calcScore(false,'hard',10),0));
  test('hard > medium > easy',    ()=>{
    assert.ok(SeqEng.calcScore(true,'hard',0)>SeqEng.calcScore(true,'medium',0));
    assert.ok(SeqEng.calcScore(true,'medium',0)>SeqEng.calcScore(true,'easy',0));
  });
});

describe('MathEngine',()=>{
  test('calcScore hard > easy',()=>assert.ok(MthEng.calcScore('hard')>MthEng.calcScore('easy')));
  test('calcScore > 0',()=>assert.ok(MthEng.calcScore('medium')>0));
  test('resposta é número',()=>{
    for(let i=0;i<20;i++){
      const p=MthEng.next('medium');
      assert.equal(typeof p.answer,'number');
      assert.ok(!isNaN(p.answer));
    }
  });
  test('resposta está nas opções',()=>{
    for(let i=0;i<10;i++){
      const p=MthEng.next('easy');
      assert.ok(p.options.includes(p.answer),`${p.display}: ${p.answer} não está em ${p.options}`);
    }
  });
  test('display tem formato correto',()=>{
    const p=MthEng.next('easy');
    assert.ok(p.display.includes('='));
    assert.ok(p.display.includes('?'));
  });
});

describe('WordEngine',()=>{
  const mk=(word,max=6)=>({word,guessed:[],wrong:[],maxGuesses:max});
  test('letra correta → correct',()=>assert.equal(WrdEng.guess(mk('GATO'),'G').lastResult,'correct'));
  test('letra errada → wrong',   ()=>assert.equal(WrdEng.guess(mk('GATO'),'Z').lastResult,'wrong'));
  test('completar palavra → won',()=>{ let s=mk('AB'); s=WrdEng.guess(s,'A'); s=WrdEng.guess(s,'B'); assert.equal(s.lastResult,'won'); });
  test('max erros → lost',()=>{ let s=mk('ABC',2); s=WrdEng.guess(s,'Z'); s=WrdEng.guess(s,'X'); assert.equal(s.lastResult,'lost'); });
  test('letra repetida → already',()=>{ let s=WrdEng.guess(mk('GATO'),'G'); s=WrdEng.guess(s,'G'); assert.equal(s.lastResult,'already'); });
  test('getDisplay com blanks',  ()=>assert.equal(WrdEng.getDisplay({word:'GATO',guessed:['G']}),'G _ _ _'));
  test('getDisplay completo',    ()=>assert.equal(WrdEng.getDisplay({word:'GATO',guessed:['G','A','T','O']}),'G A T O'));
  test('score cresce sem erros', ()=>{ const few=mk('GATO',8); few.wrong=[]; const many=mk('GATO',8); many.wrong=['Z','X','Y','W']; assert.ok(WrdEng.calcScore(few,'easy')>WrdEng.calcScore(many,'easy')); });
  test('score hard > easy',      ()=>{ const s={...mk('GATO',5),wrong:[]}; assert.ok(WrdEng.calcScore(s,'hard')>WrdEng.calcScore(s,'easy')); });
});

describe('WordSearchEngine',()=>{
  test('grade tem tamanho correto',()=>{ const{grid}=WsEng.buildGrid(['GATO','AMOR'],10); assert.equal(grid.length,10); assert.equal(grid[0].length,10); });
  test('grade sem células vazias', ()=>{ const{grid}=WsEng.buildGrid(['MAE'],8); assert.equal(grid.flat().filter(c=>c==='').length,0); });
  test('palavra na grade pode ser encontrada',()=>{
    const{grid,wordPositions}=WsEng.buildGrid(['GATO'],10);
    if(wordPositions['GATO']){
      const selection=wordPositions['GATO'];
      assert.equal(WsEng.checkSelection(selection,wordPositions),'GATO');
    }
  });
  test('seleção incorreta retorna null',()=>{ const{wordPositions}=WsEng.buildGrid(['GATO'],10); assert.equal(WsEng.checkSelection([{row:0,col:0}],wordPositions),null); });
  test('calcScore aumenta com palavras encontradas',()=>assert.ok(WsEng.calcScore(5,8,60,'easy')>WsEng.calcScore(2,8,60,'easy')));
  test('calcScore bônus por completar tudo',()=>assert.ok(WsEng.calcScore(8,8,60,'easy')>WsEng.calcScore(7,8,60,'easy')));
  test('temas easy têm palavras curtas suficientes',()=>{
    const{grid,placedWords}=WsEng.buildGrid(['MAE','PAI','SOL'],10);
    assert.ok(placedWords.length>=1);
  });
  test('grade 14x14 para hard',()=>{ const{grid}=WsEng.buildGrid(['CORAGEM'],14); assert.equal(grid.length,14); });
});

describe('Achievements',()=>{
  const base={totalGames:0,totalPoints:0,streakDays:0,uniqueGames:0,wordSearchCount:0};
  test('first_game com 1 jogo',   ()=>assert.ok(ACHS.find(a=>a.id==='first_game').check({...base,totalGames:1})));
  test('five_games com 5 jogos',  ()=>assert.ok(ACHS.find(a=>a.id==='five_games').check({...base,totalGames:5})));
  test('streak_2 com 2 dias',     ()=>assert.ok(ACHS.find(a=>a.id==='streak_2').check({...base,streakDays:2})));
  test('points_100 com 100 pts',  ()=>assert.ok(ACHS.find(a=>a.id==='points_100').check({...base,totalPoints:100})));
  test('word_hunter com 5 caças', ()=>assert.ok(ACHS.find(a=>a.id==='word_hunter').check({...base,wordSearchCount:5})));
  test('first_game não dispara com 0',()=>assert.ok(!ACHS.find(a=>a.id==='first_game').check(base)));
  test('all_games com 7 tipos',   ()=>assert.ok(ACHS.find(a=>a.id==='all_games').check({...base,uniqueGames:7})));
});

describe('Shuffle utility',()=>{
  test('preserva todos os elementos',()=>{ const a=[1,2,3,4,5]; const s=shuffle(a); assert.deepEqual([...s].sort((a,b)=>a-b),a); });
  test('não muta o original',()=>{ const a=[1,2,3]; shuffle(a); assert.deepEqual(a,[1,2,3]); });
  test('array vazio',()=>assert.deepEqual(shuffle([]),[]));
  test('único elemento',()=>assert.deepEqual(shuffle([99]),[99]));
});
