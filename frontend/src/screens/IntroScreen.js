import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, RADIUS, SHADOW } from '../shared/theme';
import { storage } from '../services/storage';
import { createPlayer } from '../services/api';

export default function IntroScreen({ navigation }) {
  const [name, setName]       = useState('');
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  async function handleStart() {
    const n = name.trim();
    if (n.length < 2) { Alert.alert('Ops! 💕', 'Por favor escreva seu nome (pelo menos 2 letras)'); return; }
    if (n.length > 50){ Alert.alert('Ops!', 'Nome muito longo. Use até 50 letras.'); return; }
    setLoading(true);
    try {
      const { data } = await createPlayer(n);
      await storage.savePlayer(data);
      await storage.updateLastPlayed();
      navigation.replace('Home');
    } catch { Alert.alert('Erro', 'Não foi possível criar o perfil. Tente novamente.'); }
    finally   { setLoading(false); }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Cabeçalho com gradiente igual ao HomeScreen */}
      <LinearGradient colors={[COLORS.lavDark, COLORS.rose]} style={styles.header}>
        <Text style={styles.logo}>🧠</Text>
        <Text style={styles.appName}>Mente Viva</Text>
        <Text style={styles.tagline}>Exercícios divertidos para o seu cérebro! 🌸</Text>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.body}>

        {/* Card de ciência */}
        <View style={styles.scienceCard}>
          <Text style={styles.scienceTitle}>📚 Por que jogar?</Text>
          <Text style={styles.scienceText}>
            Exercícios cognitivos diários podem reduzir o risco de Alzheimer em até 25% ao longo de 20 anos!
          </Text>
          <Text style={styles.scienceSource}>— Estudo ACTIVE, Alzheimer's & Dementia, 2026</Text>
        </View>

        {/* Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Qual é o seu nome, querida? 💕</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu nome aqui..."
            placeholderTextColor={COLORS.gray500}
            value={name}
            onChangeText={setName}
            maxLength={50}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleStart}
          />
        </View>

        {/* Botão */}
        <TouchableOpacity
          style={[styles.startBtnWrap, loading && { opacity:0.7 }]}
          onPress={handleStart}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient colors={[COLORS.lavDark, COLORS.rose]} style={styles.startBtn}>
            <Text style={styles.startBtnText}>{loading ? 'Um momento... ⏳' : 'Começar! 🌟'}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Notas */}
        <View style={styles.notesRow}>
          <View style={styles.note}>
            <Text style={styles.noteText}>✅ Sem internet</Text>
          </View>
          <View style={styles.note}>
            <Text style={styles.noteText}>🔒 Dados no celular</Text>
          </View>
        </View>

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex:1, backgroundColor:COLORS.bg },

  header:       { paddingTop:20, paddingBottom:28, paddingHorizontal:24, alignItems:'center', gap:6 },
  logo:         { fontSize:64 },
  appName:      { fontSize:40, fontWeight:'900', color:'white', textShadowColor:'rgba(0,0,0,0.25)', textShadowOffset:{width:0,height:2}, textShadowRadius:6 },
  tagline:      { fontSize:15, color:'rgba(255,255,255,0.88)', fontWeight:'700', textAlign:'center' },

  body:         { flex:1, padding:20, justifyContent:'center', gap:18 },

  scienceCard:  { backgroundColor:COLORS.white, borderRadius:RADIUS.lg, padding:18, ...SHADOW.card },
  scienceTitle: { color:COLORS.text, fontWeight:'900', fontSize:14, marginBottom:8 },
  scienceText:  { color:COLORS.gray700, fontSize:13, lineHeight:20 },
  scienceSource:{ color:COLORS.gray500, fontSize:11, marginTop:6, fontStyle:'italic' },

  inputGroup:   { gap:8 },
  inputLabel:   { color:COLORS.gray700, fontWeight:'800', fontSize:15 },
  input:        { backgroundColor:COLORS.white, borderRadius:RADIUS.full, paddingHorizontal:22, paddingVertical:14, fontSize:18, fontWeight:'800', color:COLORS.text, borderWidth:2, borderColor:COLORS.gray300, ...SHADOW.card },

  startBtnWrap: { borderRadius:RADIUS.full, overflow:'hidden', ...SHADOW.strong },
  startBtn:     { paddingVertical:16, alignItems:'center' },
  startBtnText: { fontSize:20, fontWeight:'900', color:'white' },

  notesRow:     { flexDirection:'row', gap:10 },
  note:         { flex:1, backgroundColor:COLORS.white, borderRadius:RADIUS.md, padding:10, alignItems:'center', ...SHADOW.card },
  noteText:     { color:COLORS.gray700, fontSize:13, fontWeight:'700' },
});
