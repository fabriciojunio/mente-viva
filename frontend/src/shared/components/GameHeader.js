import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../theme';

export default function GameHeader({ title, score, onBack, timerPercent = 1, timeLeft }) {
  const insets    = useSafeAreaInsets();
  const barColor  = timerPercent > 0.5 ? COLORS.mint : timerPercent > 0.25 ? COLORS.amber : COLORS.error;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <View style={styles.row}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backIcon}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>⭐</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        {timeLeft !== undefined && (
          <View style={[styles.timerBox, { borderColor: barColor }]}>
            <Text style={[styles.timerText, { color: barColor }]}>{timeLeft}s</Text>
          </View>
        )}
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${Math.max(0, timerPercent * 100)}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingBottom: 10,
    shadowColor: '#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:8, elevation:4,
  },
  row:        { flexDirection:'row', alignItems:'center', gap:10, marginBottom:10 },
  backBtn:    { width:38, height:38, borderRadius:19, backgroundColor:COLORS.gray200, alignItems:'center', justifyContent:'center' },
  backIcon:   { fontSize:16, color:COLORS.gray700, fontWeight:'700' },
  title:      { flex:1, fontSize:18, ...FONTS.black, color:COLORS.text },
  scoreBox:   { flexDirection:'row', alignItems:'center', backgroundColor:COLORS.rose, borderRadius:20, paddingHorizontal:12, paddingVertical:5, gap:4 },
  scoreLabel: { fontSize:14 },
  scoreValue: { color:'white', ...FONTS.black, fontSize:15 },
  timerBox:   { borderWidth:2, borderRadius:12, paddingHorizontal:8, paddingVertical:4 },
  timerText:  { fontSize:14, fontWeight:'800' },
  barBg:      { height:6, backgroundColor:COLORS.gray200, borderRadius:6, overflow:'hidden' },
  barFill:    { height:'100%', borderRadius:6 },
});
