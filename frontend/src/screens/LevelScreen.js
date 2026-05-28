// ────────────────────────────────────────────────────────────────────────────
// LevelScreen.js
// ────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW, GAME_INFO, GAME_COLORS } from '../shared/theme';

const LEVELS = [
  { key:'easy',   label:'Fácil',   emoji:'🌱', desc:'Mais tempo e mais simples',  gradient:['#34D399','#059669'] },
  { key:'medium', label:'Normal',  emoji:'⭐', desc:'Equilíbrio certo',           gradient:['#60A5FA','#2563EB'] },
  { key:'hard',   label:'Difícil', emoji:'🔥', desc:'Desafio máximo!',            gradient:['#F87171','#DC2626'] },
];

const GAME_SCREEN = {
  memory:'MemoryGame', speed:'SpeedGame', sequence:'SequenceGame',
  stroop:'StroopGame', math:'MathGame', word:'WordGame', wordsearch:'WordSearchGame',
};

export function LevelScreen({ route, navigation }) {
  const { game }   = route.params;
  const info       = GAME_INFO[game] || {};
  const colors     = GAME_COLORS[game] || { from:COLORS.rose, to:COLORS.lavender };
  const insets     = useSafeAreaInsets();

  return (
    <View style={[lvl.container, { paddingTop: insets.top }]}>
      <View style={lvl.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={lvl.back}>
          <Text style={lvl.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={lvl.headerTitle}>{info.icon} {info.name}</Text>
      </View>
      <ScrollView contentContainerStyle={lvl.content}>
        <LinearGradient colors={[colors.from, colors.to]} style={lvl.hero}>
          <Text style={lvl.heroIcon}>{info.icon}</Text>
          <Text style={lvl.heroName}>{info.name}</Text>
          <Text style={lvl.heroDesc}>{info.desc}</Text>
        </LinearGradient>
        <Text style={lvl.question}>Como quer jogar hoje? 🎮</Text>
        {LEVELS.map(level => (
          <TouchableOpacity key={level.key} activeOpacity={0.85}
            onPress={() => navigation.navigate(GAME_SCREEN[game], { level: level.key })}>
            <LinearGradient colors={level.gradient} style={lvl.levelBtn}>
              <Text style={lvl.levelEmoji}>{level.emoji}</Text>
              <View style={lvl.levelInfo}>
                <Text style={lvl.levelLabel}>{level.label}</Text>
                <Text style={lvl.levelDesc}>{level.desc}</Text>
              </View>
              <Text style={lvl.arrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const lvl = StyleSheet.create({
  container:{ flex:1, backgroundColor:COLORS.bg },
  header:   { flexDirection:'row', alignItems:'center', gap:12, padding:16, backgroundColor:COLORS.white, borderBottomWidth:1, borderBottomColor:COLORS.gray200 },
  back:     { width:40, height:40, borderRadius:20, backgroundColor:COLORS.gray200, alignItems:'center', justifyContent:'center' },
  backIcon: { fontSize:20 },
  headerTitle:{ fontSize:20, fontWeight:'900', color:COLORS.text },
  content:  { padding:20, gap:14 },
  hero:     { borderRadius:RADIUS.xl, padding:28, alignItems:'center', marginBottom:6, ...SHADOW.strong },
  heroIcon: { fontSize:60, marginBottom:8 },
  heroName: { fontSize:28, fontWeight:'900', color:'white' },
  heroDesc: { fontSize:15, color:'rgba(255,255,255,0.9)', marginTop:4, fontWeight:'600' },
  question: { fontSize:20, fontWeight:'900', color:COLORS.text, textAlign:'center' },
  levelBtn: { borderRadius:RADIUS.lg, padding:20, flexDirection:'row', alignItems:'center', gap:16, ...SHADOW.strong },
  levelEmoji:{ fontSize:36 },
  levelInfo: { flex:1 },
  levelLabel:{ fontSize:22, fontWeight:'900', color:'white' },
  levelDesc: { fontSize:13, color:'rgba(255,255,255,0.9)', marginTop:2, fontWeight:'600' },
  arrow:    { fontSize:24, color:'white', fontWeight:'900' },
});

export default LevelScreen;
