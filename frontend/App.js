import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';

// Screens
import IntroScreen    from './src/screens/IntroScreen';
import HomeScreen     from './src/screens/HomeScreen';
import LevelScreen    from './src/screens/LevelScreen';
import ResultScreen   from './src/screens/ResultScreen';
import ProfileScreen  from './src/screens/ProfileScreen';
import WordSearchGame from './src/screens/WordSearchGame';
import { MemoryGame, SpeedGame, SequenceGame, StroopGame, MathGame, WordGame } from './src/screens/GameScreens';

import { storage }  from './src/services/storage';
import { COLORS }   from './src/shared/theme';

const Stack = createStackNavigator();

export default function App() {
  const [ready, setReady]       = useState(false);
  const [hasPlayer, setHasPlayer]= useState(false);

  useEffect(() => {
    storage.getPlayer()
      .then(p => setHasPlayer(!!p))
      .catch(() => setHasPlayer(false))
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashEmoji}>🧠</Text>
        <Text style={styles.splashTitle}>Mente Viva</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={hasPlayer ? 'Home' : 'Intro'}
          screenOptions={{ headerShown: false, gestureEnabled: false, animationEnabled: true }}
        >
          <Stack.Screen name="Intro"          component={IntroScreen} />
          <Stack.Screen name="Home"           component={HomeScreen} />
          <Stack.Screen name="Level"          component={LevelScreen} />
          <Stack.Screen name="Result"         component={ResultScreen} />
          <Stack.Screen name="Profile"        component={ProfileScreen} />
          <Stack.Screen name="MemoryGame"     component={MemoryGame} />
          <Stack.Screen name="SpeedGame"      component={SpeedGame} />
          <Stack.Screen name="SequenceGame"   component={SequenceGame} />
          <Stack.Screen name="StroopGame"     component={StroopGame} />
          <Stack.Screen name="MathGame"       component={MathGame} />
          <Stack.Screen name="WordGame"       component={WordGame} />
          <Stack.Screen name="WordSearchGame" component={WordSearchGame} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash:      { flex:1, backgroundColor:COLORS.rose, alignItems:'center', justifyContent:'center' },
  splashEmoji: { fontSize:90 },
  splashTitle: { fontSize:40, fontWeight:'900', color:'white', marginTop:16 },
});
