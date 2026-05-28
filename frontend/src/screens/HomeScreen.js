import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, RADIUS, SHADOW, GAME_INFO, GAME_COLORS } from '../shared/theme';
import { storage } from '../services/storage';

const GAMES = ['memory','speed','sequence','stroop','math','word','wordsearch'];

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

      {/* Jogos — rolagem horizontal */}
      <Text style={styles.sectionTitle}>🎮 Escolha um Jogo</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.gamesScrollView}
        contentContainerStyle={styles.gamesScroll}
      >
        {GAMES.map(game => {
          const info  = GAME_INFO[game];
          const gc    = GAME_COLORS[game];
          const isNew = game === 'wordsearch';
          return (
            <TouchableOpacity
              key={game}
              style={styles.gameCard}
              activeOpacity={0.82}
              onPress={() => navigation.navigate('Level', { game })}
            >
              <LinearGradient colors={[gc.from, gc.to]} style={styles.gameCardInner}>
                {isNew && (
                  <View style={styles.newBadge}>
                    <Text style={styles.newText}>NOVO</Text>
                  </View>
                )}
                <Text style={styles.gameIcon}>{info.icon}</Text>
                <Text style={styles.gameName}>{info.name}</Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Espaço flexível */}
      <View style={{ flex: 1 }} />

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
  container:     { flex:1, backgroundColor:COLORS.bg },
  header:        { paddingVertical:20, paddingHorizontal:20, alignItems:'center' },
  headerTitle:   { fontSize:30, fontWeight:'900', color:'white', textShadowColor:'rgba(0,0,0,0.25)', textShadowOffset:{width:0,height:2}, textShadowRadius:6 },
  headerSub:     { color:'rgba(255,255,255,0.85)', fontSize:13, fontWeight:'700', marginTop:3 },
  greetRow:      { flexDirection:'row', alignItems:'center', paddingHorizontal:14, paddingVertical:12, gap:8 },
  greetLeft:     { flex:1 },
  greetName:     { fontSize:16, fontWeight:'800', color:COLORS.text },
  bday:          { fontSize:13, color:COLORS.amber, fontWeight:'700', marginTop:2 },
  streakBadge:   { backgroundColor:COLORS.amber, borderRadius:RADIUS.full, paddingHorizontal:12, paddingVertical:5 },
  streakText:    { color:'white', fontWeight:'900', fontSize:13 },
  statsRow:      { flexDirection:'row', gap:10, paddingHorizontal:14, marginBottom:6 },
  statCard:      { flex:1, backgroundColor:COLORS.white, borderRadius:RADIUS.md, padding:12, alignItems:'center', ...SHADOW.card },
  statEmoji:     { fontSize:22 },
  statVal:       { fontSize:20, fontWeight:'900', color:COLORS.rose, marginTop:2 },
  statLbl:       { fontSize:11, color:COLORS.gray500, fontWeight:'700' },
  sectionTitle:  { fontSize:17, fontWeight:'900', color:COLORS.gray700, paddingHorizontal:14, paddingBottom:8 },
  gamesScrollView:{ height:112 },
  gamesScroll:   { paddingHorizontal:14, gap:10, alignItems:'flex-start' },
  gameCard:      { width:106, height:106, borderRadius:RADIUS.lg, overflow:'hidden', ...SHADOW.card },
  gameCardInner: { width:106, height:106, padding:10, alignItems:'center', justifyContent:'center', gap:6 },
  newBadge:      { position:'absolute', top:5, right:5, backgroundColor:'rgba(0,0,0,0.35)', borderRadius:6, paddingHorizontal:5, paddingVertical:2 },
  newText:       { color:'white', fontSize:9, fontWeight:'900' },
  gameIcon:      { fontSize:34 },
  gameName:      { fontSize:12, fontWeight:'900', color:'white', textAlign:'center' },
  profileBtn:    { marginHorizontal:14, backgroundColor:COLORS.white, borderRadius:RADIUS.full, padding:14, alignItems:'center', ...SHADOW.card },
  profileBtnText:{ fontSize:15, fontWeight:'800', color:COLORS.rose },
});
