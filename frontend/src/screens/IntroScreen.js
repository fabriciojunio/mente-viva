import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
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
    <LinearGradient colors={[COLORS.rose, COLORS.lavender, COLORS.sky]} style={styles.fill}>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={styles.fill}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top+20, paddingBottom: insets.bottom+30 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.logo}>🧠</Text>
          <Text style={styles.appName}>Mente Viva</Text>
          <Text style={styles.tagline}>Exercícios divertidos{'\n'}para o seu cérebro! 🌸</Text>

          <View style={styles.scienceCard}>
            <Text style={styles.scienceTitle}>📚 Por que jogar?</Text>
            <Text style={styles.scienceText}>
              Estudos científicos mostram que exercícios cognitivos diários — como caça-palavras e jogos de memória — podem reduzir o risco de Alzheimer em até 25% ao longo de 20 anos!
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

          <Text style={styles.offlineNote}>✅ Funciona sem internet</Text>
          <Text style={styles.offlineNote}>🔒 Seus dados ficam no celular</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill:       { flex:1 },
  content:    { alignItems:'center', paddingHorizontal:28 },
  logo:       { fontSize:88, marginBottom:10 },
  appName:    { fontSize:52, fontWeight:'900', color:'white', textShadowColor:'rgba(0,0,0,0.15)', textShadowOffset:{width:0,height:2}, textShadowRadius:8 },
  tagline:    { fontSize:19, color:'rgba(255,255,255,0.92)', fontWeight:'700', textAlign:'center', marginTop:6, marginBottom:28, lineHeight:28 },
  scienceCard:{ backgroundColor:'rgba(255,255,255,0.18)', borderRadius:RADIUS.lg, padding:20, marginBottom:28, width:'100%', borderWidth:1, borderColor:'rgba(255,255,255,0.3)' },
  scienceTitle:{ color:'white', fontWeight:'900', fontSize:15, marginBottom:8 },
  scienceText: { color:'rgba(255,255,255,0.93)', fontSize:14, lineHeight:22 },
  scienceSource:{ color:'rgba(255,255,255,0.6)', fontSize:11, marginTop:8, fontStyle:'italic' },
  inputGroup: { width:'100%', marginBottom:18 },
  inputLabel: { color:'rgba(255,255,255,0.9)', fontWeight:'800', fontSize:16, marginBottom:10 },
  input:      { backgroundColor:'rgba(255,255,255,0.22)', borderRadius:RADIUS.full, paddingHorizontal:24, paddingVertical:16, fontSize:22, fontWeight:'900', color:'white', textAlign:'center', borderWidth:2, borderColor:'rgba(255,255,255,0.4)' },
  startBtn:   { backgroundColor:'white', borderRadius:RADIUS.full, paddingVertical:18, width:'100%', alignItems:'center', ...SHADOW.strong, marginBottom:16 },
  startBtnDisabled: { opacity:0.7 },
  startBtnText:{ fontSize:22, fontWeight:'900', color:COLORS.roseDark },
  offlineNote:{ color:'rgba(255,255,255,0.7)', fontSize:13, fontWeight:'600', marginTop:4 },
});
