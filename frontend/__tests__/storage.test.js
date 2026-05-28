'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// Mock AsyncStorage para rodar em Node puro
class MockAS {
  constructor() { this._store = {}; }
  async getItem(k) { return this._store[k] ?? null; }
  async setItem(k,v){ this._store[k]=String(v); }
  async removeItem(k){ delete this._store[k]; }
  async multiRemove(ks){ ks.forEach(k=>delete this._store[k]); }
  async clear(){ this._store={}; }
}

function buildStorage(as) {
  const K = { P:'mv:player', S:'mv:sessions', B:'mv:brain', A:'mv:achievements', Q:'mv:offline_queue', LAST:'mv:last_played' };
  const get = async k => { const r=await as.getItem(k); return r?JSON.parse(r):null; };
  const set = async (k,v) => as.setItem(k,JSON.stringify(v));

  const getPlayer    = () => get(K.P);
  const savePlayer   = p  => set(K.P,p);
  const getSessions  = () => get(K.S).then(r=>r||[]);
  async function addSession(s) { const ss=await getSessions(); const e={...s,createdAt:new Date().toISOString()}; await set(K.S,[e,...ss].slice(0,500)); return e; }
  async function getStats() {
    const ss=await getSessions();
    if(!ss.length)return{totalGames:0,totalPoints:0,avgScore:0,bestScore:0,streakDays:0};
    const tp=ss.reduce((a,s)=>a+(s.score||0),0);
    return{totalGames:ss.length,totalPoints:tp,avgScore:Math.round(tp/ss.length),bestScore:Math.max(...ss.map(s=>s.score||0)),streakDays:1};
  }
  async function getBrainScores() { const r=await get(K.B); return r||{scores:{memory:0,speed:0,attention:0,reasoning:0,language:0},counts:{memory:0,speed:0,attention:0,reasoning:0,language:0}}; }
  async function updateBrainScore(area,pts) { const d=await getBrainScores(); d.scores[area]=(d.scores[area]||0)+pts; d.counts[area]=(d.counts[area]||0)+1; await set(K.B,d); }
  const getAchievements = () => get(K.A).then(r=>r||[]);
  async function unlockAchievement(id,label) { const a=await getAchievements(); if(a.find(x=>x.id===id))return null; const n={id,label,unlockedAt:new Date().toISOString()}; await set(K.A,[...a,n]); return n; }
  async function enqueue(action) { const q=await get(K.Q)||[]; q.push({...action,queuedAt:new Date().toISOString()}); await set(K.Q,q); }
  async function flushQueue(fn) { const q=await get(K.Q)||[]; if(!q.length)return 0; const done=[]; for(const a of q){try{await fn(a);done.push(a);}catch{break;}} await set(K.Q,q.filter(x=>!done.includes(x))); return done.length; }
  const clearAll = () => as.clear();
  const updateLastPlayed = () => set(K.LAST,new Date().toISOString());
  const getLastPlayed    = () => get(K.LAST);
  return{getPlayer,savePlayer,getSessions,addSession,getStats,getBrainScores,updateBrainScore,getAchievements,unlockAchievement,enqueue,flushQueue,clearAll,updateLastPlayed,getLastPlayed};
}

describe('Storage — Player',()=>{
  test('getPlayer null quando vazio',async()=>{ const s=buildStorage(new MockAS()); assert.equal(await s.getPlayer(),null); });
  test('savePlayer/getPlayer roundtrip',async()=>{ const s=buildStorage(new MockAS()); await s.savePlayer({id:'1',name:'Mãe'}); const p=await s.getPlayer(); assert.equal(p.name,'Mãe'); });
  test('savePlayer sobrescreve',async()=>{ const s=buildStorage(new MockAS()); await s.savePlayer({id:'1',name:'A'}); await s.savePlayer({id:'2',name:'B'}); assert.equal((await s.getPlayer()).name,'B'); });
  test('getPlayer preserva todos os campos',async()=>{ const s=buildStorage(new MockAS()); await s.savePlayer({id:'42',name:'Maria',local:true}); const p=await s.getPlayer(); assert.equal(p.id,'42'); assert.equal(p.local,true); });
});

describe('Storage — Sessions',()=>{
  test('getSessions vazio inicialmente',async()=>{ const s=buildStorage(new MockAS()); assert.deepEqual(await s.getSessions(),[]); });
  test('addSession armazena',async()=>{ const s=buildStorage(new MockAS()); await s.addSession({game:'memory',score:50}); const ss=await s.getSessions(); assert.equal(ss.length,1); assert.equal(ss[0].score,50); });
  test('sessões em ordem decrescente',async()=>{ const s=buildStorage(new MockAS()); await s.addSession({game:'memory',score:10}); await s.addSession({game:'speed',score:20}); const ss=await s.getSessions(); assert.equal(ss[0].game,'speed'); });
  test('addSession adiciona createdAt',async()=>{ const s=buildStorage(new MockAS()); await s.addSession({game:'word',score:30}); const ss=await s.getSessions(); assert.ok(ss[0].createdAt); });
  test('getStats com zero sessões',async()=>{ const s=buildStorage(new MockAS()); const st=await s.getStats(); assert.equal(st.totalGames,0); assert.equal(st.totalPoints,0); });
  test('getStats totalPoints correto',async()=>{ const s=buildStorage(new MockAS()); await s.addSession({score:30}); await s.addSession({score:70}); const st=await s.getStats(); assert.equal(st.totalGames,2); assert.equal(st.totalPoints,100); assert.equal(st.avgScore,50); assert.equal(st.bestScore,70); });
});

describe('Storage — Brain Scores',()=>{
  test('retorna 5 áreas inicialmente',async()=>{ const s=buildStorage(new MockAS()); const b=await s.getBrainScores(); assert.ok('memory'in b.scores&&'speed'in b.scores&&'attention'in b.scores&&'reasoning'in b.scores&&'language'in b.scores); });
  test('updateBrainScore acumula',async()=>{ const s=buildStorage(new MockAS()); await s.updateBrainScore('memory',50); await s.updateBrainScore('memory',30); const b=await s.getBrainScores(); assert.equal(b.scores.memory,80); assert.equal(b.counts.memory,2); });
  test('áreas independentes',async()=>{ const s=buildStorage(new MockAS()); await s.updateBrainScore('speed',100); const b=await s.getBrainScores(); assert.equal(b.scores.memory,0); assert.equal(b.scores.speed,100); });
  test('play count incrementa',async()=>{ const s=buildStorage(new MockAS()); await s.updateBrainScore('language',10); await s.updateBrainScore('language',20); const b=await s.getBrainScores(); assert.equal(b.counts.language,2); });
});

describe('Storage — Achievements',()=>{
  test('lista vazia inicialmente',async()=>{ const s=buildStorage(new MockAS()); assert.deepEqual(await s.getAchievements(),[]); });
  test('unlockAchievement armazena',async()=>{ const s=buildStorage(new MockAS()); const a=await s.unlockAchievement('first_game','Primeiro Jogo!'); assert.equal(a.id,'first_game'); assert.ok(a.unlockedAt); });
  test('unlockAchievement idempotente',async()=>{ const s=buildStorage(new MockAS()); await s.unlockAchievement('first_game','Primeiro!'); const dup=await s.unlockAchievement('first_game','Primeiro!'); assert.equal(dup,null); const list=await s.getAchievements(); assert.equal(list.filter(a=>a.id==='first_game').length,1); });
  test('múltiplas conquistas',async()=>{ const s=buildStorage(new MockAS()); await s.unlockAchievement('a1','A1'); await s.unlockAchievement('a2','A2'); assert.equal((await s.getAchievements()).length,2); });
});

describe('Storage — Offline Queue',()=>{
  test('enqueue armazena ação',async()=>{ const mock=new MockAS(); const s=buildStorage(mock); await s.enqueue({type:'SUBMIT_SESSION',payload:{score:10}}); const q=JSON.parse(await mock.getItem('mv:offline_queue')); assert.equal(q.length,1); assert.equal(q[0].type,'SUBMIT_SESSION'); });
  test('flushQueue chama syncFn',async()=>{ const s=buildStorage(new MockAS()); await s.enqueue({type:'TEST',payload:{}}); let called=0; await s.flushQueue(async()=>{called++;}); assert.equal(called,1); });
  test('flushQueue limpa fila após sucesso',async()=>{ const mock=new MockAS(); const s=buildStorage(mock); await s.enqueue({type:'A',payload:{}}); await s.flushQueue(async()=>{}); const q=JSON.parse(await mock.getItem('mv:offline_queue')||'[]'); assert.equal(q.length,0); });
});

describe('Storage — Last Played',()=>{
  test('null quando nunca jogou',async()=>{ const s=buildStorage(new MockAS()); assert.equal(await s.getLastPlayed(),null); });
  test('armazena após update',async()=>{ const s=buildStorage(new MockAS()); await s.updateLastPlayed(); const lp=await s.getLastPlayed(); assert.ok(lp); assert.ok(!isNaN(new Date(lp).getTime())); });
});

describe('Storage — clearAll',()=>{
  test('apaga todos os dados',async()=>{ const mock=new MockAS(); const s=buildStorage(mock); await s.savePlayer({id:'1',name:'Test'}); await s.addSession({score:10}); await s.clearAll(); assert.equal(await s.getPlayer(),null); assert.deepEqual(await s.getSessions(),[]); });
});
