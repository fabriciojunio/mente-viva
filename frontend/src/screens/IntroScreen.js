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
    <LinearGradient colors={['#2D1B69', COLORS.lavDark, COLORS.rose]} style={styles.fill}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.fill}>
        <View style={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }]}>

          <Text style={styles.logo}>🧠</Text>
          <Text style={styles.appName}>Mente Viva</Text>
          <Text style={styles.tagline}>Exercícios diários para o seu cérebro! 🌸</Text>

          <View style={styles.scienceCard}>
            <Text style={styles.scienceTitle}>📚 Por que jogar?</Text>
            <Text style={styles.scienceText}>
              Exercícios cognitivos diários podem reduzir o risco de Alzheimer em até 25% ao longo de 20 anos!
            </Text>
            <Text style={styles.scienceSource}>— Estudo ACTIVE, Alzheimer's & Dementia, 2026</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Qual é o seu nome, querida? 💕</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu nome aqui..."
              placeholderTextColor="rgba(255,255,255,0.55)"
              value={name}
              onChangeText={setName}
              maxLength={50}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleStart}
            />
          </View>

          <TouchableOpacity
            style={[styles.startBtn, loading && styles.startBtnDisabled]}
            onPress={handleStart}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.startBtnText}>{loading ? 'Um momento... ⏳' : 'Começar! 🌟'}</Text>
          </TouchableOpacity>

          <View style={styles.notesRow}>
            <Text style={styles.note}>✅ Sem internet</Text>
            <Text style={styles.note}>🔒 Dados no celular</Text>
          </View>

        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill:         { flex:1 },
  content:      { flex:1, alignItems:'center', paddingHorizontal:28, justifyContent:'center', gap:16 },
  logo:         { fontSize:72 },
  appName:      { fontSize:46, fontWeight:'900', color:'white', textShadowColor:'rgba(0,0,0,0.2)', textShadowOffset:{width:0,height:2}, textShadowRadius:8, marginTop:-8 },
  tagline:      { fontSize:16, color:'rgba(255,255,255,0.9)', fontWeight:'700', textAlign:'center' },
  scienceCard:  { backgroundColor:'rgba(255,255,255,0.15)', borderRadius:RADIUS.lg, padding:16, width:'100%', borderWidth:1, borderColor:'rgba(255,255,255,0.25)' },
  scienceTitle: { color:'white', fontWeight:'900', fontSize:14, marginBottom:6 },
  scienceText:  { color:'rgba(255,255,255,0.92)', fontSize:13, lineHeight:20 },
  scienceSource:{ color:'rgba(255,255,255,0.55)', fontSize:11, marginTop:6, fontStyle:'italic' },
  inputGroup:   { width:'100%', gap:8 },
  inputLabel:   { color:'rgba(255,255,255,0.9)', fontWeight:'800', fontSize:15 },
  input:        { backgroundColor:'rgba(255,255,255,0.2)', borderRadius:RADIUS.full, paddingHorizontal:24, paddingVertical:14, fontSize:20, fontWeight:'900', color:'white', textAlign:'center', borderWidth:2, borderColor:'rgba(255,255,255,0.35)' },
  startBtn:     { backgroundColor:'white', borderRadius:RADIUS.full, paddingVertical:16, width:'100%', alignItems:'center', ...SHADOW.strong },
  startBtnDisabled: { opacity:0.7 },
  startBtnText: { fontSize:20, fontWeight:'900', color:COLORS.lavDark },
  notesRow:     { flexDirection:'row', gap:20 },
  note:         { color:'rgba(255,255,255,0.7)', fontSize:13, fontWeight:'600' },
});
