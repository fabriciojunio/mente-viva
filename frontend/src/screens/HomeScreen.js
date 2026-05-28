import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW, GAME_INFO, GAME_COLORS, BRAIN_AREAS } from '../shared/theme';
import { storage } from '../services/storage';
import { fetchTips } from '../services/api';

const GAMES = ['memory','speed','sequence','stroop','math','word','wordsearch'];

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [player, setPlayer]   = useState(null);
  const [stats,  setStats]    = useState({ totalGames:0, totalPoints:0, streakDays:0, bestScore:0 });
  const [brain,  setBrain]    = useState({});
  const [tip,    setTip]      = useState('');
  const [refresh,setRefresh]  = useState(false);

  async function load() {
    const [p, s, b, t] = await Promise.all([
      storage.getPlayer(), storage.getStats(), storage.getBrainScores(), storage.getTipOfDay(),
    ]);
    setPlayer(p); setStats(s); setBrain(b?.scores||{}); setTip(t?.text||'');
    // Tenta buscar dica atualizada em background
    fetchTips().catch(()=>{});
  }

  useFocusEffect(useCallback(()=>{ load(); }, []));

  async function onRefresh() { setRefresh(true); await load(); setRefresh(false); }

  const hour  = new Date().getHours();
  const greet = hour<12?'Bom dia ☀️':hour<18?'Boa tarde 🌤️':'Boa noite 🌙';

  // Verifica aniversário (20/06)
  const today  = new Date();
  const isBday = today.getMonth()===5 && today.getDate()===20;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refresh} onRefresh={onRefresh} tintColor={COLORS.rose} />}
      >
        {/* Birthday banner */}
        {isBday && (
          <LinearGradient colors={[COLORS.amber, COLORS.coral]} style={styles.bdayBanner}>
            <Text style={styles.bdayText}>🎂 Feliz Aniversário! Que dia especial para treinar o cérebro! 🎉</Text>
          </LinearGradient>
        )}

        {/* Header */}
        <LinearGradient colors={[COLORS.rose, COLORS.lavender]} style={styles.header}>
          <Text style={styles.headerEmojis}>🌸🧠🌸</Text>
          <Text style={styles.headerTitle}>Mente Viva</Text>
          <Text style={styles.headerSub}>Exercícios para o seu cérebro</Text>
        </LinearGradient>

        {/* Greeting */}
        <View style={styles.greetCard}>
          <Text style={styles.greetEmoji}>{hour<12?'☀️':hour<18?'🌤️':'🌙'}</Text>
          <View style={styles.greetText}>
            <Text style={styles.greetName}>{greet}, {player?.name||''}! 💕</Text>
            <Text style={styles.greetSub}>Pronta para o desafio de hoje?</Text>
          </View>
          {stats.streakDays > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {stats.streakDays}d</Text>
            </View>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { val: stats.totalGames,  lbl:'Jogos',  emoji:'🎮' },
            { val: stats.totalPoints, lbl:'Pontos', emoji:'⭐' },
            { val: stats.bestScore,   lbl:'Recorde',emoji:'🏆' },
          ].map((s,i)=>(
            <View key={i} style={styles.statCard}>
              <Text style={styles.statEmoji}>{s.emoji}</Text>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>

        {/* Games */}
        <Text style={styles.sectionTitle}>🎮 Escolha um Jogo</Text>
        <View style={styles.gamesGrid}>
          {GAMES.map(game => {
            const info   = GAME_INFO[game];
            const colors = GAME_COLORS[game];
            const isNew  = game === 'wordsearch';
            return (
              <TouchableOpacity
                key={game}
                style={styles.gameCard}
                activeOpacity={0.82}
                onPress={() => navigation.navigate('Level', { game })}
              >
                <LinearGradient colors={[colors.from, colors.to]} style={styles.gameCardBar} />
                {isNew && <View style={styles.newBadge}><Text style={styles.newBadgeText}>NOVO</Text></View>}
                <Text style={styles.gameIcon}>{info.icon}</Text>
                <Text style={styles.gameName}>{info.name}</Text>
                <Text style={styles.gameDesc}>{info.desc}</Text>
                <Text style={styles.gameBrainLabel}>{BRAIN_AREAS[info.brain]?.icon} {BRAIN_AREAS[info.brain]?.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Brain progress */}
        <Text style={styles.sectionTitle}>📊 Seu Progresso</Text>
        <View style={styles.brainCard}>
          {Object.entries(BRAIN_AREAS).map(([key, area]) => {
            const sc  = brain[key] || 0;
            const pct = Math.min(100, Math.round(sc / 10));
            return (
              <View key={key} style={styles.brainRow}>
                <Text style={styles.brainLabel}>{area.icon} {area.label}</Text>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width:`${pct}%`, backgroundColor:area.color }]} />
                </View>
                <Text style={[styles.brainPct, { color:area.color }]}>{pct}%</Text>
              </View>
            );
          })}
        </View>

        {/* Tip */}
        {!!tip && (
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>💡 Sabia que…</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        )}

        {/* Profile button */}
        <TouchableOpacity style={styles.profileBtn} onPress={()=>navigation.navigate('Profile')} activeOpacity={0.8}>
          <Text style={styles.profileBtnText}>👤 Ver Perfil & Conquistas</Text>
        </TouchableOpacity>

        <View style={{ height:40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex:1, backgroundColor:COLORS.bg },
  bdayBanner:   { padding:14, alignItems:'center' },
  bdayText:     { color:'white', fontWeight:'900', fontSize:15, textAlign:'center' },
  header:       { padding:24, paddingBottom:32, borderBottomLeftRadius:32, borderBottomRightRadius:32, alignItems:'center' },
  headerEmojis: { fontSize:32, letterSpacing:8, marginBottom:6 },
  headerTitle:  { fontSize:40, fontWeight:'900', color:'white', textShadowColor:'rgba(0,0,0,0.15)', textShadowOffset:{width:0,height:2}, textShadowRadius:6 },
  headerSub:    { color:'rgba(255,255,255,0.88)', fontSize:15, fontWeight:'700', marginTop:4 },
  greetCard:    { margin:14, backgroundColor:COLORS.white, borderRadius:RADIUS.lg, padding:16, flexDirection:'row', alignItems:'center', gap:12, ...SHADOW.card },
  greetEmoji:   { fontSize:38 },
  greetText:    { flex:1 },
  greetName:    { fontSize:17, fontWeight:'800', color:COLORS.text },
  greetSub:     { fontSize:13, color:COLORS.gray500, marginTop:2 },
  streakBadge:  { backgroundColor:COLORS.amber, borderRadius:RADIUS.full, paddingHorizontal:12, paddingVertical:6 },
  streakText:   { color:'white', fontWeight:'900', fontSize:13 },
  statsRow:     { flexDirection:'row', gap:10, paddingHorizontal:14, marginBottom:4 },
  statCard:     { flex:1, backgroundColor:COLORS.white, borderRadius:RADIUS.md, padding:14, alignItems:'center', ...SHADOW.card },
  statEmoji:    { fontSize:26 },
  statVal:      { fontSize:22, fontWeight:'900', color:COLORS.rose, marginTop:4 },
  statLbl:      { fontSize:11, color:COLORS.gray500, fontWeight:'700', marginTop:2 },
  sectionTitle: { fontSize:20, fontWeight:'900', color:COLORS.gray700, paddingHorizontal:14, paddingTop:18, paddingBottom:10 },
  gamesGrid:    { flexDirection:'row', flexWrap:'wrap', paddingHorizontal:10, gap:10 },
  gameCard:     { width:'46.5%', backgroundColor:COLORS.white, borderRadius:RADIUS.lg, padding:14, alignItems:'center', gap:5, ...SHADOW.card, overflow:'hidden', position:'relative' },
  gameCardBar:  { position:'absolute', top:0, left:0, right:0, height:4 },
  newBadge:     { position:'absolute', top:8, right:8, backgroundColor:COLORS.mint, borderRadius:6, paddingHorizontal:6, paddingVertical:2 },
  newBadgeText: { color:'white', fontSize:10, fontWeight:'900' },
  gameIcon:     { fontSize:36 },
  gameName:     { fontSize:15, fontWeight:'900', color:COLORS.text, textAlign:'center' },
  gameDesc:     { fontSize:11, color:COLORS.gray500, textAlign:'center' },
  gameBrainLabel:{ fontSize:11, fontWeight:'700', color:COLORS.gray700, marginTop:2 },
  brainCard:    { margin:14, marginTop:0, backgroundColor:COLORS.white, borderRadius:RADIUS.lg, padding:18, ...SHADOW.card },
  brainRow:     { flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 },
  brainLabel:   { fontSize:13, fontWeight:'700', color:COLORS.gray700, width:110 },
  barBg:        { flex:1, height:10, backgroundColor:COLORS.gray200, borderRadius:10, overflow:'hidden' },
  barFill:      { height:'100%', borderRadius:10 },
  brainPct:     { fontSize:13, fontWeight:'800', width:36, textAlign:'right' },
  tipCard:      { margin:14, marginTop:0, backgroundColor:'#EFF6FF', borderRadius:RADIUS.lg, padding:16, borderLeftWidth:4, borderLeftColor:COLORS.sky },
  tipTitle:     { fontSize:14, fontWeight:'900', color:COLORS.skyDark, marginBottom:6 },
  tipText:      { fontSize:13, color:COLORS.gray700, lineHeight:20 },
  profileBtn:   { margin:14, marginTop:4, backgroundColor:COLORS.white, borderRadius:RADIUS.full, padding:16, alignItems:'center', ...SHADOW.card },
  profileBtnText:{ fontSize:16, fontWeight:'800', color:COLORS.roseDark },
});
