// ─────────────────────────────────────────────────────────────
// MemoryGame.js
// ─────────────────────────────────────────────────────────────
import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Vibration } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../shared/theme';
import { MemoryEngine } from '../shared/utils/gameEngine';
import GameHeader from '../shared/components/GameHeader';
import useGameTimer from '../shared/hooks/useGameTimer';

export function MemoryGame({ route, navigation }) {
  const { level } = route.params;
  const insets    = useSafeAreaInsets();
  const [state, setState]   = useState(() => MemoryEngine.setup(level));
  const [score, setScore]   = useState(0);
  const lock    = useRef(false);
  const startAt = useRef(Date.now());

  const timer = useGameTimer(level, () => finish(score));

  function finish(s) {
    timer.stop();
    navigation.replace('Result', { game:'memory', level, score:s, durationMs:Date.now()-startAt.current });
  }

  function tap(cardId) {
    if (lock.current) return;
    const next = MemoryEngine.flip(state, cardId);
    setState(next);
    if (next.lastResult === 'match') {
      const pts = MemoryEngine.calcScore(next.pairsFound, timer.secs, level);
      setScore(pts);
      if (MemoryEngine.isComplete(next)) setTimeout(() => finish(pts), 400);
    }
    if (next.lastResult === 'mismatch') {
      lock.current = true;
      Vibration.vibrate(80);
      setTimeout(() => { setState(s => MemoryEngine.unflip(s)); lock.current = false; }, 900);
    }
  }

  const cardSize = level==='easy'?86:level==='medium'?70:60;

  return (
    <View style={[mem.container, { paddingTop:insets.top }]}>
      <GameHeader title="🎴 Memória" score={score} onBack={()=>finish(score)} timerPercent={timer.percent} timeLeft={timer.secs} />
      <View style={mem.info}>
        <Text style={mem.infoText}>Pares encontrados: {state.pairsFound}/{state.totalPairs}</Text>
      </View>
      <View style={mem.grid}>
        {state.cards.map(card => (
          <TouchableOpacity key={card.id} onPress={()=>tap(card.id)} activeOpacity={0.85}
            style={[mem.card, {width:cardSize,height:cardSize}, card.matched&&mem.cardMatched, card.flipped&&!card.matched&&mem.cardFlipped]}>
            <Text style={mem.cardText}>{card.flipped||card.matched ? card.emoji : '🌸'}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const mem = StyleSheet.create({
  container:{ flex:1, backgroundColor:COLORS.bg },
  info:     { paddingHorizontal:20, paddingVertical:10 },
  infoText: { fontSize:15, fontWeight:'700', color:COLORS.gray700 },
  grid:     { flex:1, flexDirection:'row', flexWrap:'wrap', justifyContent:'center', alignItems:'center', padding:12, gap:8 },
  card:     { borderRadius:14, alignItems:'center', justifyContent:'center', backgroundColor:COLORS.rose, ...SHADOW.card },
  cardMatched:{ backgroundColor:'#D1FAE5' },
  cardFlipped:{ backgroundColor:COLORS.white },
  cardText: { fontSize:28 },
});

// ─────────────────────────────────────────────────────────────
// SpeedGame.js
// ─────────────────────────────────────────────────────────────
import { LinearGradient } from 'expo-linear-gradient';
import { SpeedEngine } from '../shared/utils/gameEngine';

export function SpeedGame({ route, navigation }) {
  const { level } = route.params;
  const insets    = useSafeAreaInsets();
  const [gs, setGs]     = useState(() => SpeedEngine.next(SpeedEngine.init()));
  const [score, setScore]= useState(0);
  const [fb, setFb]     = useState(null);
  const startAt = useRef(Date.now());
  const timer   = useGameTimer(level, () => finish(score));

  function finish(s) { timer.stop(); navigation.replace('Result', { game:'speed', level, score:s, durationMs:Date.now()-startAt.current }); }

  function answer(yes) {
    const next = SpeedEngine.answer(gs, yes, level);
    const newScore = SpeedEngine.calcScore(next.correct, next.wrong, level);
    setScore(newScore);
    setFb(next.lastResult);
    if (next.lastResult==='wrong') Vibration.vibrate(80);
    setTimeout(() => { setFb(null); setGs(SpeedEngine.next(next)); }, 300);
  }

  return (
    <View style={[spd.container, { paddingTop:insets.top }]}>
      <GameHeader title="⚡ Rapidez" score={score} onBack={()=>finish(score)} timerPercent={timer.percent} timeLeft={timer.secs} />
      <View style={spd.content}>
        <View style={spd.box}>
          <Text style={spd.question}>Este emoji é IGUAL ao anterior?</Text>
          <Text style={spd.current}>{gs.current||'🎮'}</Text>
          <Text style={spd.prev}>Anterior: <Text style={spd.prevEmoji}>{gs.prev||'—'}</Text></Text>
          {fb && <Text style={spd.fb}>{fb==='correct'?'✅':'❌'}</Text>}
        </View>
        <View style={spd.btnRow}>
          <TouchableOpacity onPress={()=>answer(true)} activeOpacity={0.85} style={spd.btnWrap}>
            <LinearGradient colors={[COLORS.mintDark,COLORS.mint]} style={spd.btn}>
              <Text style={spd.btnText}>✅ SIM</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>answer(false)} activeOpacity={0.85} style={spd.btnWrap}>
            <LinearGradient colors={['#DC2626','#F87171']} style={spd.btn}>
              <Text style={spd.btnText}>❌ NÃO</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const spd = StyleSheet.create({
  container:{ flex:1, backgroundColor:COLORS.bg },
  content:  { flex:1, alignItems:'center', justifyContent:'center', gap:20, padding:20 },
  box:      { width:'100%', backgroundColor:COLORS.white, borderRadius:RADIUS.xl, padding:28, alignItems:'center', gap:12, ...SHADOW.card },
  question: { fontSize:16, fontWeight:'700', color:COLORS.gray500, textAlign:'center' },
  current:  { fontSize:90, lineHeight:100 },
  prev:     { fontSize:15, color:COLORS.gray500, fontWeight:'600' },
  prevEmoji:{ fontSize:24 },
  fb:       { fontSize:48, position:'absolute', top:8, right:16 },
  btnRow:   { flexDirection:'row', gap:14, width:'100%' },
  btnWrap:  { flex:1 },
  btn:      { borderRadius:RADIUS.lg, padding:22, alignItems:'center', ...SHADOW.strong },
  btnText:  { fontSize:20, fontWeight:'900', color:'white' },
});

// ─────────────────────────────────────────────────────────────
// SequenceGame.js
// ─────────────────────────────────────────────────────────────
import { SequenceEngine } from '../shared/utils/gameEngine';

export function SequenceGame({ route, navigation }) {
  const { level } = route.params;
  const insets    = useSafeAreaInsets();
  const cfg       = SequenceEngine.setup(level);
  const [seq, setSeq]   = useState(() => SequenceEngine.generate(cfg.length));
  const [input, setInput]= useState([]);
  const [phase, setPhase]= useState('show');
  const [msg, setMsg]    = useState('👀 Memorize a sequência!');
  const [score, setScore]= useState(0);
  const [round, setRound]= useState(0);
  const startAt   = useRef(Date.now());
  const timeRef   = useRef(null);
  const [secs, setSecs] = useState(LEVEL_CONFIG[level]?.timeLimit||60);
  const total = LEVEL_CONFIG[level]?.timeLimit||60;

  useEffect(() => {
    timeRef.current = setInterval(() => {
      setSecs(t => { if(t<=1){clearInterval(timeRef.current); finish(score); return 0;} return t-1; });
    }, 1000);
    return () => clearInterval(timeRef.current);
  }, []);

  useEffect(() => {
    if (phase==='show') {
      const t = setTimeout(() => { setPhase('input'); setMsg('✏️ Repita a sequência!'); }, level==='easy'?3000:2200);
      return () => clearTimeout(t);
    }
  }, [phase, seq]);

  function finish(s) {
    clearInterval(timeRef.current);
    navigation.replace('Result', { game:'sequence', level, score:s, durationMs:Date.now()-startAt.current });
  }

  function select(e) {
    if (phase!=='input') return;
    const ni = [...input, e];
    setInput(ni);
    if (ni.length===seq.length) {
      const ok = SequenceEngine.validate(ni, seq);
      const pts = SequenceEngine.calcScore(ok, level, round);
      const newScore = score + pts;
      setScore(newScore);
      setMsg(ok ? `✅ Correto! +${pts}` : `❌ Era: ${seq.join(' ')}`);
      setPhase('feedback');
      setTimeout(() => {
        const ns = SequenceEngine.generate(cfg.length);
        setSeq(ns); setInput([]); setRound(r=>r+1); setPhase('show');
        setMsg('👀 Memorize a sequência!');
      }, 1600);
    }
  }

  return (
    <View style={[seq_s.container, { paddingTop:insets.top }]}>
      <GameHeader title="🔢 Sequência" score={score} onBack={()=>finish(score)} timerPercent={secs/total} timeLeft={secs} />
      <View style={seq_s.content}>
        <View style={seq_s.msgBox}><Text style={seq_s.msg}>{msg}</Text></View>
        <View style={seq_s.seqBox}>
          <Text style={seq_s.seqDisplay}>{phase==='show' ? seq.join('  ') : '❓'.repeat(seq.length).split('').join(' ')}</Text>
        </View>
        <View style={seq_s.slots}>
          {Array.from({length:seq.length}).map((_,i) => (
            <View key={i} style={[seq_s.slot, input[i]&&seq_s.slotFilled]}>
              <Text style={seq_s.slotText}>{input[i]||''}</Text>
            </View>
          ))}
        </View>
        {phase==='input' && <>
          <View style={seq_s.optGrid}>
            {SequenceEngine.OPTIONS.map(e => (
              <TouchableOpacity key={e} onPress={()=>select(e)} style={seq_s.opt} activeOpacity={0.8}>
                <Text style={seq_s.optText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={()=>setInput(i=>i.slice(0,-1))} style={seq_s.undoBtn}>
            <Text style={seq_s.undoText}>↩️ Apagar</Text>
          </TouchableOpacity>
        </>}
      </View>
    </View>
  );
}

import { useEffect } from 'react';
import { LEVEL_CONFIG } from '../shared/utils/gameEngine';

const seq_s = StyleSheet.create({
  container:{ flex:1, backgroundColor:COLORS.bg },
  content:  { flex:1, alignItems:'center', gap:14, padding:18 },
  msgBox:   { backgroundColor:COLORS.white, borderRadius:RADIUS.lg, padding:14, width:'100%', alignItems:'center', ...SHADOW.card },
  msg:      { fontSize:17, fontWeight:'700', color:COLORS.text, textAlign:'center' },
  seqBox:   { backgroundColor:COLORS.white, borderRadius:RADIUS.xl, padding:24, width:'100%', alignItems:'center', ...SHADOW.card },
  seqDisplay:{ fontSize:44, letterSpacing:6 },
  slots:    { flexDirection:'row', gap:10, flexWrap:'wrap', justifyContent:'center' },
  slot:     { width:56, height:56, borderRadius:14, backgroundColor:COLORS.gray200, alignItems:'center', justifyContent:'center', borderWidth:2, borderColor:COLORS.gray300 },
  slotFilled:{ borderColor:COLORS.rose, backgroundColor:'#FFF0F5' },
  slotText: { fontSize:28 },
  optGrid:  { flexDirection:'row', flexWrap:'wrap', gap:10, justifyContent:'center' },
  opt:      { width:62, height:62, borderRadius:16, backgroundColor:COLORS.white, alignItems:'center', justifyContent:'center', ...SHADOW.card },
  optText:  { fontSize:34 },
  undoBtn:  { backgroundColor:COLORS.gray200, borderRadius:RADIUS.full, paddingHorizontal:22, paddingVertical:10 },
  undoText: { fontSize:15, fontWeight:'700', color:COLORS.gray700 },
});

// ─────────────────────────────────────────────────────────────
// StroopGame.js
// ─────────────────────────────────────────────────────────────
import { StroopEngine } from '../shared/utils/gameEngine';

export function StroopGame({ route, navigation }) {
  const { level } = route.params;
  const insets    = useSafeAreaInsets();
  const [cur, setCur]   = useState(() => StroopEngine.next(level));
  const [score, setScore]= useState(0);
  const [fb, setFb]     = useState(null);
  const startAt = useRef(Date.now());
  const timer   = useGameTimer(level, () => finish(score));

  function finish(s) { timer.stop(); navigation.replace('Result', { game:'stroop', level, score:s, durationMs:Date.now()-startAt.current }); }

  function answer(name) {
    const ok = name === cur.correct;
    setScore(s => s + StroopEngine.calcScore(ok, level));
    setFb(ok?'✅':'❌');
    if (!ok) Vibration.vibrate(80);
    setTimeout(() => { setFb(null); setCur(StroopEngine.next(level)); }, 350);
  }

  return (
    <View style={[str.container, { paddingTop:insets.top }]}>
      <GameHeader title="🎨 Cores" score={score} onBack={()=>finish(score)} timerPercent={timer.percent} timeLeft={timer.secs} />
      <View style={str.content}>
        <View style={str.box}>
          <Text style={str.question}>{cur.question}</Text>
          <Text style={[str.word, { color:cur.inkHex }]}>{cur.word}</Text>
          {fb && <Text style={str.fb}>{fb}</Text>}
        </View>
        <View style={str.grid}>
          {cur.options.map(opt => (
            <TouchableOpacity key={opt.name} onPress={()=>answer(opt.name)} activeOpacity={0.85}
              style={[str.opt, { backgroundColor:opt.hex }]}>
              <Text style={str.optText}>{opt.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const str = StyleSheet.create({
  container:{ flex:1, backgroundColor:COLORS.bg },
  content:  { flex:1, alignItems:'center', justifyContent:'center', gap:20, padding:20 },
  box:      { width:'100%', backgroundColor:COLORS.white, borderRadius:RADIUS.xl, padding:28, alignItems:'center', gap:10, ...SHADOW.card },
  question: { fontSize:18, fontWeight:'700', color:COLORS.gray700, textAlign:'center' },
  word:     { fontSize:54, fontWeight:'900', letterSpacing:-1 },
  fb:       { fontSize:44, position:'absolute', top:8, right:16 },
  grid:     { flexDirection:'row', flexWrap:'wrap', gap:12, justifyContent:'center', width:'100%' },
  opt:      { width:'46%', borderRadius:RADIUS.lg, padding:20, alignItems:'center', ...SHADOW.strong },
  optText:  { fontSize:17, fontWeight:'900', color:'white' },
});

// ─────────────────────────────────────────────────────────────
// MathGame.js
// ─────────────────────────────────────────────────────────────
import { MathEngine } from '../shared/utils/gameEngine';

export function MathGame({ route, navigation }) {
  const { level } = route.params;
  const insets    = useSafeAreaInsets();
  const [prob, setProb]     = useState(() => MathEngine.next(level));
  const [score, setScore]   = useState(0);
  const [correct, setCorrect]= useState(0);
  const [chosen, setChosen] = useState(null);
  const [answered, setAnswered]= useState(false);
  const startAt = useRef(Date.now());
  const timer   = useGameTimer(level, () => finish(score));

  function finish(s) { timer.stop(); navigation.replace('Result', { game:'math', level, score:s, durationMs:Date.now()-startAt.current }); }

  function answer(val) {
    if (answered) return;
    setChosen(val);
    setAnswered(true);
    const ok = val === prob.answer;
    if (ok) { setScore(s=>s+MathEngine.calcScore(level)); setCorrect(c=>c+1); }
    else Vibration.vibrate(80);
    setTimeout(()=>{ setProb(MathEngine.next(level)); setAnswered(false); setChosen(null); }, 800);
  }

  return (
    <View style={[math.container, { paddingTop:insets.top }]}>
      <GameHeader title="🧮 Contas" score={score} onBack={()=>finish(score)} timerPercent={timer.percent} timeLeft={timer.secs} />
      <View style={math.content}>
        <View style={math.probBox}>
          <Text style={math.prob}>{prob.display}</Text>
          <Text style={math.correct}>✅ {correct} corretas</Text>
        </View>
        <View style={math.grid}>
          {prob.options.map((opt,i) => {
            let bg = COLORS.white;
            if (answered && chosen===opt) bg = opt===prob.answer?'#D1FAE5':'#FEE2E2';
            if (answered && opt===prob.answer && chosen!==opt) bg='#D1FAE5';
            return (
              <TouchableOpacity key={i} onPress={()=>answer(opt)} style={[math.opt,{backgroundColor:bg}]} activeOpacity={0.85}>
                <Text style={math.optText}>{opt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const math = StyleSheet.create({
  container:{ flex:1, backgroundColor:COLORS.bg },
  content:  { flex:1, alignItems:'center', justifyContent:'center', gap:22, padding:20 },
  probBox:  { width:'100%', backgroundColor:COLORS.white, borderRadius:RADIUS.xl, padding:32, alignItems:'center', ...SHADOW.card },
  prob:     { fontSize:50, fontWeight:'900', color:COLORS.text },
  correct:  { fontSize:15, color:COLORS.gray500, fontWeight:'700', marginTop:8 },
  grid:     { flexDirection:'row', flexWrap:'wrap', gap:14, justifyContent:'center', width:'100%' },
  opt:      { width:'44%', borderRadius:RADIUS.lg, padding:22, alignItems:'center', ...SHADOW.card, borderWidth:2, borderColor:COLORS.gray200 },
  optText:  { fontSize:32, fontWeight:'900', color:COLORS.text },
});

// ─────────────────────────────────────────────────────────────
// WordGame.js (forca)
// ─────────────────────────────────────────────────────────────
import { WordEngine } from '../shared/utils/gameEngine';

export function WordGame({ route, navigation }) {
  const { level } = route.params;
  const insets    = useSafeAreaInsets();
  const [state, setState] = useState(() => WordEngine.setup(level));
  const [score, setScore]  = useState(0);
  const [done, setDone]    = useState(false);
  const startAt = useRef(Date.now());

  function finish(s) { navigation.replace('Result', { game:'word', level, score:s, durationMs:Date.now()-startAt.current }); }

  function guess(letter) {
    if (done) return;
    const next = WordEngine.guess(state, letter);
    setState(next);
    if (next.lastResult==='won') {
      const pts = WordEngine.calcScore(next, level);
      setScore(pts); setDone(true);
      setTimeout(()=>finish(pts), 900);
    } else if (next.lastResult==='lost') {
      setDone(true); Vibration.vibrate(200);
      setTimeout(()=>finish(0), 1400);
    } else if (next.lastResult==='wrong') Vibration.vibrate(80);
  }

  return (
    <View style={[wrd.container, { paddingTop:insets.top }]}>
      <GameHeader title="📝 Palavras" score={score} onBack={()=>finish(score)} timerPercent={1} />
      <ScrollView contentContainerStyle={wrd.content} showsVerticalScrollIndicator={false}>
        <View style={wrd.attemptsRow}>
          {Array.from({length:state.maxGuesses}).map((_,i)=>(
            <View key={i} style={[wrd.dot, i<state.wrong.length&&wrd.dotUsed]}/>
          ))}
        </View>
        <View style={wrd.wordBox}>
          <Text style={wrd.display}>{WordEngine.getDisplay(state)}</Text>
        </View>
        <View style={wrd.clueBox}>
          <Text style={wrd.clueLabel}>💡 Dica</Text>
          <Text style={wrd.clueText}>{state.clue}</Text>
        </View>
        {state.wrong.length>0 && <Text style={wrd.wrong}>Erradas: {state.wrong.join(' ')}</Text>}
        <View style={wrd.keyboard}>
          {WordEngine.LETTERS.map(l=>{
            const isG = state.guessed.includes(l);
            const isW = state.wrong.includes(l);
            return (
              <TouchableOpacity key={l} onPress={()=>guess(l)} disabled={isG||isW||done}
                style={[wrd.key, isG&&wrd.keyOk, isW&&wrd.keyWrong, (isG||isW||done)&&wrd.keyDis]} activeOpacity={0.75}>
                <Text style={[wrd.keyText,(isG||isW)&&{color:'white'}]}>{l}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const wrd = StyleSheet.create({
  container: { flex:1, backgroundColor:COLORS.bg },
  content:   { alignItems:'center', padding:14, gap:12 },
  attemptsRow:{ flexDirection:'row', gap:8 },
  dot:       { width:16, height:16, borderRadius:8, backgroundColor:COLORS.gray300 },
  dotUsed:   { backgroundColor:COLORS.rose },
  wordBox:   { backgroundColor:COLORS.white, borderRadius:RADIUS.lg, padding:18, width:'100%', alignItems:'center', ...SHADOW.card },
  display:   { fontSize:34, fontWeight:'900', letterSpacing:12, color:COLORS.text },
  clueBox:   { backgroundColor:'#EFF6FF', borderRadius:RADIUS.lg, padding:14, width:'100%', borderLeftWidth:4, borderLeftColor:COLORS.sky },
  clueLabel: { fontSize:14, fontWeight:'900', color:COLORS.skyDark },
  clueText:  { fontSize:15, color:COLORS.gray700, lineHeight:22, marginTop:4 },
  wrong:     { fontSize:14, color:COLORS.error, fontWeight:'700' },
  keyboard:  { flexDirection:'row', flexWrap:'wrap', gap:7, justifyContent:'center', width:'100%' },
  key:       { width:46, height:46, borderRadius:12, backgroundColor:COLORS.white, alignItems:'center', justifyContent:'center', ...SHADOW.card },
  keyOk:     { backgroundColor:COLORS.mintDark },
  keyWrong:  { backgroundColor:COLORS.error },
  keyDis:    { opacity:0.65 },
  keyText:   { fontSize:17, fontWeight:'900', color:COLORS.text },
});
