import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW, GAME_INFO, BRAIN_AREAS } from '../shared/theme';
import { storage } from '../services/storage';
import { submitSession } from '../services/api';
import { checkAndUnlock } from '../shared/utils/gameEngine';

const GAME_SCREEN = {
  memory:'MemoryGame', speed:'SpeedGame', sequence:'SequenceGame',
  stroop:'StroopGame', math:'MathGame', word:'WordGame', wordsearch:'WordSearchGame',
};

export default function ResultScreen({ route, navigation }) {
  const { game, level, score, durationMs } = route.params;
  const insets  = useSafeAreaInsets();
  const info    = GAME_INFO[game] || {};
  const [newAchs, setNewAchs] = useState([]);
  const scale   = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue:1, friction:4, useNativeDriver:true }).start();
    save();
  }, []);

  async function save() {
    const player = await storage.getPlayer();
    if (!player) return;
    await storage.addSession({ playerId:player.id, game, level, score, durationMs });
    await storage.updateBrainScore(info.brain, score);
    await storage.updateLastPlayed();
    const stats    = await storage.getStats();
    const sessions = await storage.getSessions();
    const wordSearchCount = sessions.filter(s => s.game === 'wordsearch').length;
    const uniqueGames     = new Set(sessions.map(s => s.game)).size;
    const enriched = { ...stats, wordSearchCount, uniqueGames };
    const unlocked = await checkAndUnlock(enriched, storage);
    if (unlocked.length) setNewAchs(unlocked);
    // Sync to backend (non-blocking)
    submitSession({ playerId:player.id, game, level, score, durationMs }).catch(()=>{});
  }

  const isGreat = score >= 80;
  const isGood  = score >= 40;
  const emoji   = isGreat ? '🏆' : isGood ? '🌟' : score > 0 ? '💪' : '😊';
  const title   = isGreat ? 'Incrível! Parabéns!' : isGood ? 'Muito bem!' : score > 0 ? 'Boa tentativa!' : 'Continue assim!';
  const msg     = isGreat ? 'Seu cérebro agradece! Você está arrasando! 🧠✨' : isGood ? 'Ótimo trabalho! A prática leva à perfeição!' : 'Cada partida fortalece seu cérebro! Não desista! 💪';

  return (
    <LinearGradient colors={[COLORS.bg, '#F0F4FF', COLORS.bg]} style={[styles.container, { paddingTop:insets.top }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ transform:[{ scale }] }}>
          <Text style={styles.emoji}>{emoji}</Text>
        </Animated.View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.scoreLabel}>Pontuação</Text>
        <Text style={styles.score}>{score}</Text>
        <Text style={styles.msg}>{msg}</Text>

        <View style={styles.detailCard}>
          <Row label="🧠 Área Treinada" value={`${BRAIN_AREAS[info.brain]?.icon||''} ${BRAIN_AREAS[info.brain]?.label||''}`} />
          <View style={styles.divider} />
          <Row label="🎮 Jogo"  value={`${info.icon||''} ${info.name||''}`} />
          <View style={styles.divider} />
          <Row label="⚡ Nível" value={level==='easy'?'Fácil 🌱':level==='medium'?'Normal ⭐':'Difícil 🔥'} />
        </View>

        {newAchs.length > 0 && (
          <View style={styles.achSection}>
            <Text style={styles.achTitle}>🎉 Conquistas desbloqueadas!</Text>
            {newAchs.map(a => (
              <View key={a.id} style={styles.achCard}>
                <Text style={styles.achText}>{a.label}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.85}
          onPress={() => navigation.navigate(GAME_SCREEN[game], { level })}>
          <LinearGradient colors={[COLORS.rose, COLORS.lavender]} style={styles.primaryGrad}>
            <Text style={styles.primaryText}>Jogar de Novo 🎮</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.8}
          onPress={() => navigation.navigate('Home')}>
          <Text style={styles.secondaryText}>🏠 Ir para o Início</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1 },
  content:   { alignItems:'center', padding:28, gap:14 },
  emoji:     { fontSize:90, marginBottom:4 },
  title:     { fontSize:32, fontWeight:'900', color:COLORS.text, textAlign:'center' },
  scoreLabel:{ fontSize:16, color:COLORS.gray500, fontWeight:'700' },
  score:     { fontSize:80, fontWeight:'900', color:COLORS.rose, lineHeight:90 },
  msg:       { fontSize:16, color:COLORS.gray700, textAlign:'center', lineHeight:24 },
  detailCard:{ width:'100%', backgroundColor:COLORS.white, borderRadius:RADIUS.lg, padding:20, ...SHADOW.card, gap:4 },
  row:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingVertical:4 },
  rowLabel:  { fontSize:13, color:COLORS.gray500, fontWeight:'700' },
  rowValue:  { fontSize:15, fontWeight:'800', color:COLORS.text },
  divider:   { height:1, backgroundColor:COLORS.gray200 },
  achSection:{ width:'100%', gap:8 },
  achTitle:  { fontSize:18, fontWeight:'900', color:COLORS.text, textAlign:'center' },
  achCard:   { backgroundColor:'#FFFBEB', borderRadius:RADIUS.md, padding:14, borderWidth:2, borderColor:COLORS.amber, alignItems:'center' },
  achText:   { fontSize:15, fontWeight:'800', color:COLORS.amberDark },
  primaryBtn:{ width:'100%' },
  primaryGrad:{ borderRadius:RADIUS.full, padding:18, alignItems:'center', ...SHADOW.strong },
  primaryText:{ fontSize:20, fontWeight:'900', color:'white' },
  secondaryBtn:{ width:'100%', backgroundColor:COLORS.white, borderRadius:RADIUS.full, padding:16, alignItems:'center', ...SHADOW.card },
  secondaryText:{ fontSize:17, fontWeight:'800', color:COLORS.gray700 },
});
