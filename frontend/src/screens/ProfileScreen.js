import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW, BRAIN_AREAS, GAME_INFO } from '../shared/theme';
import { storage } from '../services/storage';
import { ACHIEVEMENTS } from '../shared/utils/gameEngine';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [player,  setPlayer]  = useState(null);
  const [stats,   setStats]   = useState({});
  const [brain,   setBrain]   = useState({});
  const [achs,    setAchs]    = useState([]);
  const [history, setHistory] = useState([]);

  async function load() {
    const [p, s, b, a, h] = await Promise.all([
      storage.getPlayer(), storage.getStats(), storage.getBrainScores(),
      storage.getAchievements(), storage.getSessions(),
    ]);
    setPlayer(p); setStats(s); setBrain(b?.scores||{}); setAchs(a); setHistory(h.slice(0,15));
  }

  useFocusEffect(useCallback(()=>{ load(); }, []));

  async function handleLogout() {
    Alert.alert(
      'Sair da conta?',
      'Isso vai apagar todos os dados salvos. Tem certeza?',
      [
        { text:'Cancelar', style:'cancel' },
        { text:'Sim, sair', style:'destructive', onPress: async () => {
          await storage.clearAll();
          navigation.replace('Intro');
        }},
      ]
    );
  }

  const unlockedIds = achs.map(a => a.id);

  return (
    <View style={[styles.container, { paddingTop:insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👤 Meu Perfil</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <LinearGradient colors={[COLORS.rose, COLORS.lavender]} style={styles.hero}>
          <Text style={styles.heroEmoji}>🧠</Text>
          <Text style={styles.heroName}>{player?.name||'Jogadora'}</Text>
          <Text style={styles.heroSub}>Campeã do Mente Viva! 🏆</Text>
        </LinearGradient>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { val:stats.totalGames||0,  lbl:'Jogos',   emoji:'🎮' },
            { val:stats.totalPoints||0, lbl:'Pontos',  emoji:'⭐' },
            { val:stats.bestScore||0,   lbl:'Recorde', emoji:'🏅' },
            { val:`${stats.streakDays||0}d`, lbl:'Sequência',emoji:'🔥' },
          ].map((s,i)=>(
            <View key={i} style={styles.statCard}>
              <Text style={styles.statEmoji}>{s.emoji}</Text>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.lbl}</Text>
            </View>
          ))}
        </View>

        {/* Brain */}
        <Text style={styles.sectionTitle}>🧠 Áreas do Cérebro</Text>
        <View style={styles.card}>
          {Object.entries(BRAIN_AREAS).map(([key,area])=>{
            const sc  = brain[key]||0;
            const pct = Math.min(100, Math.round(sc/10));
            return (
              <View key={key} style={styles.brainRow}>
                <Text style={styles.brainLabel}>{area.icon} {area.label}</Text>
                <View style={styles.barBg}>
                  <View style={[styles.barFill,{width:`${pct}%`,backgroundColor:area.color}]}/>
                </View>
                <Text style={[styles.brainPct,{color:area.color}]}>{pct}%</Text>
              </View>
            );
          })}
        </View>

        {/* Achievements */}
        <Text style={styles.sectionTitle}>🏅 Conquistas ({achs.length}/{ACHIEVEMENTS.length})</Text>
        <View style={styles.achGrid}>
          {ACHIEVEMENTS.map(ach=>{
            const done = unlockedIds.includes(ach.id);
            return (
              <View key={ach.id} style={[styles.achCard, done?styles.achDone:styles.achLocked]}>
                <Text style={styles.achLabel}>{done ? ach.label : '🔒 ???'}</Text>
              </View>
            );
          })}
        </View>

        {/* History */}
        {history.length > 0 && <>
          <Text style={styles.sectionTitle}>📋 Últimas Partidas</Text>
          <View style={styles.card}>
            {history.map((s,i)=>(
              <View key={i} style={[styles.histRow, i<history.length-1&&styles.histBorder]}>
                <Text style={styles.histIcon}>{GAME_INFO[s.game]?.icon||'🎮'}</Text>
                <Text style={styles.histGame}>{GAME_INFO[s.game]?.name||s.game}</Text>
                <Text style={styles.histLevel}>{s.level==='easy'?'🌱':s.level==='medium'?'⭐':'🔥'}</Text>
                <Text style={styles.histScore}>{s.score} pts</Text>
              </View>
            ))}
          </View>
        </>}

        {/* Privacy info */}
        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>🔒 Seus Dados</Text>
          <Text style={styles.privacyText}>
            Todos os seus dados ficam guardados no seu celular. Funciona 100% sem internet. Suas informações nunca são vendidas ou compartilhadas.
          </Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutText}>🚪 Sair da Conta</Text>
        </TouchableOpacity>

        <View style={{height:50}}/>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex:1, backgroundColor:COLORS.bg },
  header:      { flexDirection:'row', alignItems:'center', gap:12, padding:16, backgroundColor:COLORS.white, borderBottomWidth:1, borderBottomColor:COLORS.gray200 },
  backBtn:     { width:40, height:40, borderRadius:20, backgroundColor:COLORS.gray200, alignItems:'center', justifyContent:'center' },
  backIcon:    { fontSize:20 },
  headerTitle: { fontSize:20, fontWeight:'900', color:COLORS.text },
  hero:        { padding:32, alignItems:'center' },
  heroEmoji:   { fontSize:60 },
  heroName:    { fontSize:28, fontWeight:'900', color:'white', marginTop:8 },
  heroSub:     { fontSize:15, color:'rgba(255,255,255,0.9)', fontWeight:'700' },
  statsGrid:   { flexDirection:'row', flexWrap:'wrap', gap:10, padding:14 },
  statCard:    { flex:1, minWidth:'44%', backgroundColor:COLORS.white, borderRadius:RADIUS.lg, padding:14, alignItems:'center', ...SHADOW.card },
  statEmoji:   { fontSize:26 },
  statVal:     { fontSize:24, fontWeight:'900', color:COLORS.rose, marginTop:4 },
  statLbl:     { fontSize:12, color:COLORS.gray500, fontWeight:'700' },
  sectionTitle:{ fontSize:18, fontWeight:'900', color:COLORS.gray700, paddingHorizontal:14, paddingTop:12, paddingBottom:8 },
  card:        { margin:14, marginTop:0, backgroundColor:COLORS.white, borderRadius:RADIUS.lg, padding:18, ...SHADOW.card },
  brainRow:    { flexDirection:'row', alignItems:'center', gap:10, marginBottom:12 },
  brainLabel:  { fontSize:13, fontWeight:'700', color:COLORS.gray700, width:110 },
  barBg:       { flex:1, height:10, backgroundColor:COLORS.gray200, borderRadius:10, overflow:'hidden' },
  barFill:     { height:'100%', borderRadius:10 },
  brainPct:    { fontSize:13, fontWeight:'800', width:36, textAlign:'right' },
  achGrid:     { flexDirection:'row', flexWrap:'wrap', gap:10, paddingHorizontal:14 },
  achCard:     { borderRadius:RADIUS.md, padding:12, flex:1, minWidth:'44%', alignItems:'center' },
  achDone:     { backgroundColor:'#FFFBEB', borderWidth:2, borderColor:COLORS.amber },
  achLocked:   { backgroundColor:COLORS.gray100, borderWidth:2, borderColor:COLORS.gray200 },
  achLabel:    { fontSize:12, fontWeight:'700', color:COLORS.text, textAlign:'center' },
  histRow:     { flexDirection:'row', alignItems:'center', paddingVertical:10, gap:8 },
  histBorder:  { borderBottomWidth:1, borderBottomColor:COLORS.gray200 },
  histIcon:    { fontSize:20 },
  histGame:    { flex:1, fontWeight:'700', color:COLORS.text },
  histLevel:   { fontSize:16 },
  histScore:   { fontWeight:'900', color:COLORS.rose, fontSize:15 },
  privacyCard: { margin:14, marginTop:4, backgroundColor:'#F0FFF4', borderRadius:RADIUS.lg, padding:16, borderLeftWidth:4, borderLeftColor:COLORS.mintDark },
  privacyTitle:{ fontSize:14, fontWeight:'900', color:COLORS.mintDark, marginBottom:6 },
  privacyText: { fontSize:13, color:COLORS.gray700, lineHeight:20 },
  logoutBtn:   { margin:14, backgroundColor:COLORS.white, borderRadius:RADIUS.full, padding:16, alignItems:'center', ...SHADOW.card },
  logoutText:  { fontSize:16, fontWeight:'800', color:COLORS.error },
});
