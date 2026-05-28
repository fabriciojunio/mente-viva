/**
 * WordSearchGame.js — Caça-Palavras 🔍
 * 
 * Base científica: Pesquisa em 19.000 adultos mostrou que quem faz
 * puzzles de palavras regularmente tem função cerebral equivalente 
 * a pessoas 10 anos mais jovens. (University of Exeter & King's College London)
 * 
 * UX: Interface de toque com seleção de células, destaque das palavras
 * encontradas, temas afetivos (família, natureza, Brasil).
 */
import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Vibration, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../shared/theme';
import { WordSearchEngine } from '../shared/utils/gameEngine';
import useGameTimer from '../shared/hooks/useGameTimer';

const CELL_SIZE = 32; // px por célula

export default function WordSearchGame({ route, navigation }) {
  const { level }    = route.params;
  const insets       = useSafeAreaInsets();
  const [gs, setGs]  = useState(() => WordSearchEngine.setup(level));
  const [score, setScore] = useState(0);
  const [selecting, setSelecting] = useState(false);
  const lastFound    = useRef(null);
  const startAt      = useRef(Date.now());
  const flashAnim    = useRef(new Animated.Value(0)).current;

  const timer = useGameTimer(level, () => finish(score));

  function finish(s) {
    timer.stop();
    navigation.replace('Result', { game:'wordsearch', level, score:s, durationMs:Date.now()-startAt.current });
  }

  function flash() {
    Animated.sequence([
      Animated.timing(flashAnim, { toValue:1, duration:150, useNativeDriver:true }),
      Animated.timing(flashAnim, { toValue:0, duration:300, useNativeDriver:true }),
    ]).start();
  }

  function tapCell(row, col) {
    setGs(prev => {
      const next = WordSearchEngine.toggleCell(prev, row, col);
      // Auto-confirm when selection length equals any word length
      const wordLengths = Object.keys(next.wordPositions).map(w => w.length);
      if (wordLengths.includes(next.selection.length)) {
        const confirmed = WordSearchEngine.confirmSelection(next);
        if (confirmed.lastFound) {
          Vibration.vibrate(60);
          flash();
          lastFound.current = confirmed.lastFound;
          const pts = WordSearchEngine.calcScore(confirmed.found.length, confirmed.words.length, timer.secs, level);
          setScore(pts);
          if (WordSearchEngine.isComplete(confirmed)) {
            setTimeout(() => finish(pts), 800);
          }
          return confirmed;
        }
        // No match with exact length — keep selecting
        return next;
      }
      // Max selection exceeded — reset
      if (next.selection.length > Math.max(...wordLengths)) {
        return { ...next, selection: [{ row, col }] };
      }
      return next;
    });
  }

  function clearSelection() {
    setGs(prev => ({ ...prev, selection: [] }));
  }

  function confirmNow() {
    setGs(prev => {
      const confirmed = WordSearchEngine.confirmSelection(prev);
      if (confirmed.lastFound) {
        Vibration.vibrate(60);
        flash();
        lastFound.current = confirmed.lastFound;
        const pts = WordSearchEngine.calcScore(confirmed.found.length, confirmed.words.length, timer.secs, level);
        setScore(pts);
        if (WordSearchEngine.isComplete(confirmed)) setTimeout(()=>finish(pts), 800);
      }
      return confirmed;
    });
  }

  // Determine cell state
  function getCellState(row, col) {
    const isSelected = gs.selection.some(c => c.row===row && c.col===col);
    const foundWord  = gs.found.find(word =>
      gs.wordPositions[word]?.some(c => c.row===row && c.col===col)
    );
    return { isSelected, foundWord: foundWord || null };
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>finish(score)} style={styles.backBtn}>
          <Text style={styles.backIcon}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🔍 Caça-Palavras</Text>
          <Text style={styles.headerTheme}>{gs.title}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.timerText}>{timer.secs}s</Text>
          <View style={styles.scoreBadge}><Text style={styles.scoreText}>⭐ {score}</Text></View>
        </View>
      </View>

      {/* Timer bar */}
      <View style={styles.timerBar}>
        <View style={[styles.timerFill, {
          width: `${timer.percent*100}%`,
          backgroundColor: timer.percent>0.5?COLORS.mint:timer.percent>0.25?COLORS.amber:COLORS.error,
        }]}/>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Progress */}
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            Encontradas: <Text style={styles.progressBold}>{gs.found.length}/{gs.words.length}</Text>
          </Text>
          {lastFound.current && (
            <Animated.View style={[styles.lastFoundBadge, { opacity: flashAnim }]}>
              <Text style={styles.lastFoundText}>✅ {lastFound.current}</Text>
            </Animated.View>
          )}
        </View>

        {/* Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.grid}>
            {gs.grid.map((row, ri) => (
              <View key={ri} style={styles.row}>
                {row.map((letter, ci) => {
                  const { isSelected, foundWord } = getCellState(ri, ci);
                  return (
                    <TouchableOpacity
                      key={ci}
                      onPress={() => tapCell(ri, ci)}
                      activeOpacity={0.7}
                      style={[
                        styles.cell,
                        isSelected && styles.cellSelected,
                        foundWord  && styles.cellFound,
                      ]}
                    >
                      <Text style={[
                        styles.cellText,
                        isSelected && styles.cellTextSelected,
                        foundWord  && styles.cellTextFound,
                      ]}>
                        {letter}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

        {/* Selection controls */}
        {gs.selection.length > 0 && (
          <View style={styles.selectionRow}>
            <Text style={styles.selectionText}>
              Selecionado: <Text style={styles.selectionWord}>{gs.selection.map(c=>gs.grid[c.row][c.col]).join('')}</Text>
            </Text>
            <TouchableOpacity onPress={confirmNow} style={styles.confirmBtn}>
              <Text style={styles.confirmText}>✓ Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearSelection} style={styles.clearBtn}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Word list */}
        <View style={styles.wordList}>
          <Text style={styles.wordListTitle}>Palavras para encontrar:</Text>
          <View style={styles.wordChips}>
            {gs.words.map(word => (
              <View key={word} style={[styles.wordChip, gs.found.includes(word) && styles.wordChipFound]}>
                <Text style={[styles.wordChipText, gs.found.includes(word) && styles.wordChipTextFound]}>
                  {gs.found.includes(word) ? '✅ ' : ''}{word}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Scientific note */}
        <View style={styles.scienceNote}>
          <Text style={styles.scienceText}>
            💡 Pesquisas mostram que caça-palavras mantém o cérebro 8-10 anos mais jovem!
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:COLORS.bg },

  header:    { flexDirection:'row', alignItems:'center', backgroundColor:COLORS.tealDark, paddingHorizontal:14, paddingVertical:12, gap:10 },
  backBtn:   { width:36, height:36, borderRadius:18, backgroundColor:'rgba(255,255,255,0.2)', alignItems:'center', justifyContent:'center' },
  backIcon:  { color:'white', fontSize:16, fontWeight:'900' },
  headerCenter: { flex:1 },
  headerTitle:  { color:'white', fontWeight:'900', fontSize:17 },
  headerTheme:  { color:'rgba(255,255,255,0.8)', fontSize:12, marginTop:2 },
  headerRight:  { alignItems:'flex-end', gap:4 },
  timerText:    { color:'rgba(255,255,255,0.9)', fontSize:20, fontWeight:'900' },
  scoreBadge:   { backgroundColor:'rgba(255,255,255,0.25)', borderRadius:12, paddingHorizontal:8, paddingVertical:3 },
  scoreText:    { color:'white', fontWeight:'800', fontSize:13 },

  timerBar:  { height:5, backgroundColor:'rgba(0,0,0,0.1)' },
  timerFill: { height:'100%' },

  progressRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:10 },
  progressText:{ fontSize:14, color:COLORS.gray700, fontWeight:'600' },
  progressBold:{ fontWeight:'900', color:COLORS.tealDark },
  lastFoundBadge:{ backgroundColor:COLORS.mint, borderRadius:RADIUS.full, paddingHorizontal:12, paddingVertical:4 },
  lastFoundText: { color:'white', fontWeight:'900', fontSize:13 },

  gridContainer: { alignItems:'center', paddingHorizontal:8, paddingVertical:4 },
  grid:      { borderRadius:RADIUS.md, overflow:'hidden', borderWidth:1, borderColor:COLORS.gray200 },
  row:       { flexDirection:'row' },

  cell:      { width:CELL_SIZE, height:CELL_SIZE, alignItems:'center', justifyContent:'center', borderWidth:0.5, borderColor:COLORS.gray200, backgroundColor:COLORS.white },
  cellSelected:  { backgroundColor:'#DBEAFE' },
  cellFound:     { backgroundColor:'#D1FAE5' },
  cellText:      { fontSize:14, fontWeight:'700', color:COLORS.gray700 },
  cellTextSelected:{ color:COLORS.skyDark, fontWeight:'900' },
  cellTextFound:   { color:COLORS.mintDark, fontWeight:'900' },

  selectionRow:  { flexDirection:'row', alignItems:'center', gap:10, paddingHorizontal:16, paddingVertical:8, backgroundColor:COLORS.white, marginHorizontal:14, borderRadius:RADIUS.md, ...SHADOW.card },
  selectionText: { flex:1, fontSize:14, color:COLORS.gray700, fontWeight:'600' },
  selectionWord: { fontWeight:'900', color:COLORS.tealDark, fontSize:16 },
  confirmBtn:    { backgroundColor:COLORS.tealDark, borderRadius:RADIUS.full, paddingHorizontal:14, paddingVertical:7 },
  confirmText:   { color:'white', fontWeight:'900', fontSize:13 },
  clearBtn:      { backgroundColor:COLORS.gray200, borderRadius:RADIUS.full, width:30, height:30, alignItems:'center', justifyContent:'center' },
  clearText:     { color:COLORS.gray700, fontWeight:'900' },

  wordList:      { padding:14, paddingTop:10 },
  wordListTitle: { fontSize:15, fontWeight:'800', color:COLORS.gray700, marginBottom:10 },
  wordChips:     { flexDirection:'row', flexWrap:'wrap', gap:8 },
  wordChip:      { backgroundColor:COLORS.white, borderRadius:RADIUS.full, paddingHorizontal:14, paddingVertical:7, borderWidth:2, borderColor:COLORS.gray300, ...SHADOW.card },
  wordChipFound: { backgroundColor:'#14532D', borderColor:COLORS.mint },
  wordChipText:  { fontSize:14, fontWeight:'700', color:COLORS.gray700 },
  wordChipTextFound: { color:COLORS.mintDark },

  scienceNote:   { margin:14, marginTop:4, backgroundColor:'#0F2420', borderRadius:RADIUS.lg, padding:14, borderLeftWidth:4, borderLeftColor:COLORS.teal },
  scienceText:   { fontSize:13, color:COLORS.gray700, lineHeight:20 },
});
