import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW, GAME_INFO, GAME_COLORS } from '../shared/theme';
import { storage } from '../services/storage';

const GAMES_GRID  = ['memory','speed','sequence','stroop','math','word'];
const GAME_FEATURED = 'wordsearch';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [player, setPlayer] = useState(null);
  const [stats,  setStats]  = useState({ totalGames:0, totalPoints:0, streakDays:0, bestScore:0 });

  async function load() {
    const [p, s] = await Promise.all([storage.getPlayer(), storage.getStats()]);
    setPlayer(p);
    setStats(s);
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  const hour   = new Date().getHours();
  const greet  = hour < 12 ? 'Bom dia ☀️' : hour < 18 ? 'Boa tarde 🌤️' : 'Boa noite 🌙';
  const today  = new Date();
  const isBday = today.getMonth() === 5 && today.getDate() === 20;

  function goGame(game) { navigation.navigate('Level', { game }); }

  function GameCard({ game, full }) {
    const info = GAME_INFO[game];
    const gc   = GAME_COLORS[game];
    return (
      <TouchableOpacity
        style={full ? styles.gameCardFull : styles.gameCard}
        activeOpacity={0.82}
        onPress={() => goGame(game)}
      >
        <LinearGradient colors={[gc.from, gc.to]} style={full ? styles.gameGradFull : styles.gameGrad}>
          {full && (
            <View style={styles.newBadge}>
              <Text style={styles.newText}>NOVO</Text>
            </View>
          )}
          <Text style={full ? styles.gameIconLg : styles.gameIcon}>{info.icon}</Text>
          <Text style={full ? styles.gameNameLg : styles.gameName}>{info.name}</Text>
          {full && <Text style={styles.gameDesc}>{info.desc}</Text>}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <LinearGradient colors={[COLORS.lavDark, COLORS.rose]} style={styles.header}>
        <Text style={styles.headerTitle}>🧠 Mente Viva</Text>
        <Text style={styles.headerSub}>Exercícios para o seu cérebro</Text>
      </LinearGradient>

      {/* Saudação */}
      <View style={styles.greetRow}>
        <View style={styles.greetLeft}>
          <Text style={styles.greetName}>{greet}, {player?.name || ''}! 💕</Text>
          {isBday && <Text style={styles.bday}>🎂 Feliz Aniversário!</Text>}
        </View>
        {stats.streakDays > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>🔥 {stats.streakDays}d</Text>
          </View>
        )}
      </View>

      {/* Estatísticas */}
      <View style={styles.statsRow}>
        {[
          { val: stats.totalGames,  lbl:'Jogos',   emoji:'🎮' },
          { val: stats.totalPoints, lbl:'Pontos',  emoji:'⭐' },
          { val: stats.bestScore,   lbl:'Recorde', emoji:'🏆' },
        ].map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Text style={styles.statEmoji}>{s.emoji}</Text>
            <Text style={styles.statVal}>{s.val}</Text>
            <Text style={styles.statLbl}>{s.lbl}</Text>
          </View>
        ))}
      </View>

      {/* Grade de jogos */}
      <Text style={styles.sectionTitle}>🎮 Escolha um Jogo</Text>
      <View style={styles.gamesGrid}>
        {GAMES_GRID.map(game => <GameCard key={game} game={game} />)}
        <GameCard game={GAME_FEATURED} full />
      </View>

      {/* Perfil */}
      <TouchableOpacity
        style={[styles.profileBtn, { marginBottom: insets.bottom + 14 }]}
        onPress={() => navigation.navigate('Profile')}
        activeOpacity={0.8}
      >
        <Text style={styles.profileBtnText}>👤 Perfil & Conquistas</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex:1, backgroundColor:COLORS.bg },

  header:       { paddingVertical:18, paddingHorizontal:20, alignItems:'center' },
  headerTitle:  { fontSize:28, fontWeight:'900', color:'white', textShadowColor:'rgba(0,0,0,0.25)', textShadowOffset:{width:0,height:2}, textShadowRadius:6 },
  headerSub:    { color:'rgba(255,255,255,0.85)', fontSize:13, fontWeight:'700', marginTop:2 },

  greetRow:     { flexDirection:'row', alignItems:'center', paddingHorizontal:14, paddingVertical:10, gap:8 },
  greetLeft:    { flex:1 },
  greetName:    { fontSize:15, fontWeight:'800', color:COLORS.text },
  bday:         { fontSize:13, color:COLORS.amber, fontWeight:'700', marginTop:2 },
  streakBadge:  { backgroundColor:COLORS.amber, borderRadius:RADIUS.full, paddingHorizontal:12, paddingVertical:4 },
  streakText:   { color:'white', fontWeight:'900', fontSize:13 },

  statsRow:     { flexDirection:'row', gap:8, paddingHorizontal:14, marginBottom:4 },
  statCard:     { flex:1, backgroundColor:COLORS.white, borderRadius:RADIUS.md, paddingVertical:10, alignItems:'center', ...SHADOW.card },
  statEmoji:    { fontSize:20 },
  statVal:      { fontSize:18, fontWeight:'900', color:COLORS.rose, marginTop:2 },
  statLbl:      { fontSize:10, color:COLORS.gray500, fontWeight:'700' },

  sectionTitle: { fontSize:16, fontWeight:'900', color:COLORS.gray700, paddingHorizontal:14, paddingBottom:8 },

  gamesGrid:    { flexDirection:'row', flexWrap:'wrap', paddingHorizontal:14, gap:8 },
  gameCard:     { width:'47.5%', borderRadius:RADIUS.lg, overflow:'hidden', ...SHADOW.card },
  gameGrad:     { padding:14, alignItems:'center', gap:5, minHeight:80, justifyContent:'center' },
  gameIcon:     { fontSize:30 },
  gameName:     { fontSize:13, fontWeight:'900', color:'white', textAlign:'center' },

  gameCardFull: { width:'100%', borderRadius:RADIUS.lg, overflow:'hidden', ...SHADOW.card },
  gameGradFull: { padding:16, flexDirection:'row', alignItems:'center', gap:14, position:'relative' },
  gameIconLg:   { fontSize:38 },
  gameNameLg:   { fontSize:17, fontWeight:'900', color:'white' },
  gameDesc:     { fontSize:12, color:'rgba(255,255,255,0.85)', fontWeight:'600', marginTop:2 },
  newBadge:     { position:'absolute', top:8, right:10, backgroundColor:'rgba(0,0,0,0.3)', borderRadius:6, paddingHorizontal:8, paddingVertical:3 },
  newText:      { color:'white', fontSize:10, fontWeight:'900' },

  profileBtn:    { marginHorizontal:14, marginTop:10, backgroundColor:COLORS.white, borderRadius:RADIUS.full, padding:14, alignItems:'center', ...SHADOW.card },
  profileBtnText:{ fontSize:15, fontWeight:'800', color:COLORS.rose },
});
