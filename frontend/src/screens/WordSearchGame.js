import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Vibration,
         Animated, PanResponder, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../shared/theme';
import { WordSearchEngine } from '../shared/utils/gameEngine';
import useGameTimer from '../shared/hooks/useGameTimer';

const { width: SCREEN_W } = Dimensions.get('window');

export default function WordSearchGame({ route, navigation }) {
  const { level }    = route.params;
  const insets       = useSafeAreaInsets();
  const [gs, setGs]      = useState(() => WordSearchEngine.setup(level));
  const [score, setScore]  = useState(0);
  const [revealing, setRevealing] = useState(false);
  const lastFound    = useRef(null);
  const startAt      = useRef(Date.now());
  const flashAnim    = useRef(new Animated.Value(0)).current;
  const scoreRef     = useRef(0);

  // Grid position para converter toque em (row, col)
  const gridRef  = useRef(null);
  const gridPos  = useRef({ x: 0, y: 0, cellSize: 32 });

  // Refs atualizados a cada render — evitam closure stale no PanResponder
  const gsRef    = useRef(gs);         gsRef.current = gs;
  const timerRef = useRef(null);
  const releaseRef = useRef(null);

  const timer = useGameTimer(level, () => {
    // Confirma seleção pendente
    setGs(prev => {
      if (prev.selection.length === 0) return prev;
      const confirmed = WordSearchEngine.confirmSelection(prev);
      if (confirmed.lastFound) {
        flash();
        lastFound.current = confirmed.lastFound;
        const pts = WordSearchEngine.calcScore(confirmed.found.length, confirmed.words.length, 0, level);
        setScore(pts);
        scoreRef.current = pts;
        return confirmed;
      }
      return { ...prev, selection: [] };
    });
    // Revela as palavras não encontradas por 2s
    setRevealing(true);
    setTimeout(() => finish(scoreRef.current), 2000);
  });
  timerRef.current = timer;

  function finish(s) {
    timerRef.current?.stop();
    navigation.replace('Result', { game:'wordsearch', level, score:s, durationMs:Date.now()-startAt.current });
  }

  function flash() {
    Animated.sequence([
      Animated.timing(flashAnim, { toValue:1, duration:150, useNativeDriver:true }),
      Animated.timing(flashAnim, { toValue:0, duration:350, useNativeDriver:true }),
    ]).start();
  }

  // Atualizado a cada render com os valores frescos
  releaseRef.current = function handleRelease() {
    setGs(prev => {
      if (prev.selection.length === 0) return prev;
      const confirmed = WordSearchEngine.confirmSelection(prev);
      if (confirmed.lastFound) {
        Vibration.vibrate(60);
        flash();
        lastFound.current = confirmed.lastFound;
        const pts = WordSearchEngine.calcScore(
          confirmed.found.length, confirmed.words.length,
          timerRef.current?.secs ?? 30, level
        );
        setScore(pts);
        scoreRef.current = pts;
        if (WordSearchEngine.isComplete(confirmed)) {
          setTimeout(() => finish(pts), 800);
        }
        return confirmed;
      }
      return { ...prev, selection: [] };
    });
  };

  function cellFromTouch(pageX, pageY) {
    const { x, y, cellSize } = gridPos.current;
    const col = Math.floor((pageX - x) / cellSize);
    const row = Math.floor((pageY - y) / cellSize);
    const size = gsRef.current.size;
    if (row >= 0 && row < size && col >= 0 && col < size) return { row, col };
    return null;
  }

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder:        () => true,
      onMoveShouldSetPanResponder:         () => true,
      onStartShouldSetPanResponderCapture: () => true,

      onPanResponderGrant: (evt) => {
        const pageX = evt.nativeEvent.pageX;
        const pageY = evt.nativeEvent.pageY;
        // Re-mede a posição da grade a cada gesto para corrigir offset acumulado
        if (gridRef.current) {
          gridRef.current.measureInWindow((x, y, width) => {
            const cellSize = Math.floor(width / gsRef.current.size);
            gridPos.current = { x, y, cellSize };
            const col = Math.floor((pageX - x) / cellSize);
            const row = Math.floor((pageY - y) / cellSize);
            const size = gsRef.current.size;
            if (row >= 0 && row < size && col >= 0 && col < size) {
              setGs(prev => ({ ...prev, selection: [{ row, col }] }));
            }
          });
        }
      },

      onPanResponderMove: (evt) => {
        const cell = cellFromTouch(evt.nativeEvent.pageX, evt.nativeEvent.pageY);
        if (!cell) return;
        setGs(prev => {
          if (prev.selection.length === 0) return { ...prev, selection: [cell] };

          // Permitir retroceder: se arrastou de volta para a penúltima célula, remove a última
          const len = prev.selection.length;
          if (len >= 2) {
            const penultimate = prev.selection[len - 2];
            if (penultimate.row === cell.row && penultimate.col === cell.col) {
              return { ...prev, selection: prev.selection.slice(0, len - 1) };
            }
          }

          const already = prev.selection.some(c => c.row === cell.row && c.col === cell.col);
          if (already) return prev;

          // Restringir à linha reta (horizontal ou vertical)
          const first    = prev.selection[0];
          const isHoriz  = cell.row === first.row;
          const isVert   = cell.col === first.col;
          if (!isHoriz && !isVert) return prev;

          // Manter a direção já estabelecida
          if (len > 1) {
            const wasHoriz = prev.selection[1].row === first.row;
            if (wasHoriz && !isHoriz) return prev;
            if (!wasHoriz && !isVert) return prev;
          }

          return { ...prev, selection: [...prev.selection, cell] };
        });
      },

      onPanResponderRelease:   () => releaseRef.current?.(),
      onPanResponderTerminate: () => setGs(prev => ({ ...prev, selection: [] })),
    })
  ).current;

  function onGridLayout() {
    if (!gridRef.current) return;
    gridRef.current.measureInWindow((x, y, width) => {
      const cellSize = Math.floor(width / gsRef.current.size);
      gridPos.current = { x, y, cellSize };
    });
  }

  function getCellState(row, col) {
    const isSelected  = gs.selection.some(c => c.row === row && c.col === col);
    const foundWord   = gs.found.find(w => gs.wordPositions[w]?.some(c => c.row === row && c.col === col));
    const unfoundWord = revealing && !foundWord
      ? gs.words.filter(w => !gs.found.includes(w))
          .find(w => gs.wordPositions[w]?.some(c => c.row === row && c.col === col))
      : null;
    return { isSelected, foundWord: foundWord || null, unfoundWord: unfoundWord || null };
  }

  // Tamanho de célula dinâmico para caber na tela
  const cellSize = Math.floor((SCREEN_W - 16) / gs.size);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => finish(score)} style={styles.backBtn}>
          <Text style={styles.backIcon}>✕</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🔍 Caça-Palavras</Text>
          <Text style={styles.headerTheme}>{gs.title}</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.timerText}>{timer.secs}s</Text>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>⭐ {score}</Text>
          </View>
        </View>
      </View>

      {/* Barra de tempo */}
      <View style={styles.timerBar}>
        <View style={[styles.timerFill, {
          width: `${timer.percent * 100}%`,
          backgroundColor: timer.percent > 0.5 ? COLORS.mint : timer.percent > 0.25 ? COLORS.amber : COLORS.error,
        }]} />
      </View>

      {/* Progresso */}
      <View style={styles.progressRow}>
        <Text style={styles.progressText}>
          Encontradas: <Text style={styles.progressBold}>{gs.found.length}/{gs.words.length}</Text>
        </Text>
        <Animated.View style={[styles.lastFoundBadge, { opacity: flashAnim }]}>
          {lastFound.current ? (
            <Text style={styles.lastFoundText}>✅ {lastFound.current}</Text>
          ) : null}
        </Animated.View>
      </View>

      {/* Grade — fora do ScrollView para não conflitar com o gesto de arrastar */}
      <View
        ref={gridRef}
        onLayout={onGridLayout}
        style={styles.gridContainer}
        {...pan.panHandlers}
      >
        {gs.grid.map((rowArr, ri) => (
          <View key={ri} style={styles.gridRow}>
            {rowArr.map((letter, ci) => {
              const { isSelected, foundWord, unfoundWord } = getCellState(ri, ci);
              return (
                <View
                  key={ci}
                  style={[
                    styles.cell,
                    { width: cellSize, height: cellSize },
                    isSelected   && styles.cellSelected,
                    foundWord    && styles.cellFound,
                    unfoundWord  && styles.cellUnfound,
                  ]}
                >
                  <Text style={[
                    styles.cellText,
                    { fontSize: cellSize < 28 ? 11 : 13 },
                    isSelected   && styles.cellTextSelected,
                    foundWord    && styles.cellTextFound,
                    unfoundWord  && styles.cellTextUnfound,
                  ]}>
                    {letter}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* Dica de uso (só aparece quando nenhuma palavra foi encontrada ainda) */}
      {gs.found.length === 0 && (
        <Text style={styles.hint}>👆 Arraste o dedo sobre as letras para selecionar</Text>
      )}

      {/* Lista de palavras — scroll só aqui, não interfere na grade */}
      <ScrollView style={styles.listScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.wordChips}>
          {gs.words.map(word => (
            <View key={word} style={[styles.wordChip, gs.found.includes(word) && styles.wordChipFound]}>
              <Text style={[styles.wordChipText, gs.found.includes(word) && styles.wordChipTextFound]}>
                {gs.found.includes(word) ? '✅ ' : ''}{word}
              </Text>
            </View>
          ))}
        </View>
        <View style={styles.scienceNote}>
          <Text style={styles.scienceText}>
            💡 Pesquisas mostram que caça-palavras mantém o cérebro 8–10 anos mais jovem!
          </Text>
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:COLORS.bg },

  header:       { flexDirection:'row', alignItems:'center', backgroundColor:COLORS.tealDark, paddingHorizontal:14, paddingVertical:12, gap:10 },
  backBtn:      { width:36, height:36, borderRadius:18, backgroundColor:'rgba(255,255,255,0.2)', alignItems:'center', justifyContent:'center' },
  backIcon:     { color:'white', fontSize:16, fontWeight:'900' },
  headerCenter: { flex:1 },
  headerTitle:  { color:'white', fontWeight:'900', fontSize:17 },
  headerTheme:  { color:'rgba(255,255,255,0.8)', fontSize:12, marginTop:2 },
  headerRight:  { alignItems:'flex-end', gap:4 },
  timerText:    { color:'rgba(255,255,255,0.9)', fontSize:20, fontWeight:'900' },
  scoreBadge:   { backgroundColor:'rgba(255,255,255,0.25)', borderRadius:12, paddingHorizontal:8, paddingVertical:3 },
  scoreText:    { color:'white', fontWeight:'800', fontSize:13 },

  timerBar:  { height:5, backgroundColor:'rgba(0,0,0,0.2)' },
  timerFill: { height:'100%' },

  progressRow:    { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:14, paddingVertical:8 },
  progressText:   { fontSize:14, color:COLORS.gray700, fontWeight:'600' },
  progressBold:   { fontWeight:'900', color:COLORS.teal },
  lastFoundBadge: { backgroundColor:COLORS.tealDark, borderRadius:RADIUS.full, paddingHorizontal:12, paddingVertical:4 },
  lastFoundText:  { color:'white', fontWeight:'900', fontSize:13 },

  gridContainer: { alignSelf:'center', marginHorizontal:8, borderRadius:RADIUS.md, overflow:'hidden', borderWidth:1, borderColor:COLORS.gray300 },
  gridRow:       { flexDirection:'row' },
  cell:          { alignItems:'center', justifyContent:'center', borderWidth:0.5, borderColor:COLORS.gray200, backgroundColor:COLORS.white },
  cellSelected:  { backgroundColor:'#1E3A5F' },
  cellFound:     { backgroundColor:'#14532D' },
  cellUnfound:   { backgroundColor:'#7F1D1D' },
  cellText:      { fontWeight:'700', color:COLORS.gray700 },
  cellTextSelected:  { color:'#93C5FD', fontWeight:'900' },
  cellTextFound:     { color:COLORS.mint, fontWeight:'900' },
  cellTextUnfound:   { color:'#FCA5A5', fontWeight:'900' },

  hint:      { textAlign:'center', color:COLORS.gray500, fontSize:13, fontWeight:'600', paddingVertical:6 },

  listScroll: { flex:1, paddingHorizontal:14, paddingTop:8 },
  wordChips:  { flexDirection:'row', flexWrap:'wrap', gap:8, paddingBottom:8 },
  wordChip:      { backgroundColor:COLORS.white, borderRadius:RADIUS.full, paddingHorizontal:14, paddingVertical:7, borderWidth:2, borderColor:COLORS.gray300, ...SHADOW.card },
  wordChipFound: { backgroundColor:'#14532D', borderColor:COLORS.mint },
  wordChipText:      { fontSize:14, fontWeight:'700', color:COLORS.gray700 },
  wordChipTextFound: { color:COLORS.mint },

  scienceNote: { backgroundColor:'#0F2420', borderRadius:RADIUS.lg, padding:14, borderLeftWidth:4, borderLeftColor:COLORS.teal, marginBottom:8 },
  scienceText: { fontSize:13, color:COLORS.gray700, lineHeight:20 },
});
