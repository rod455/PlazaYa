// src/screens/SplashScreen.js
// Verifica onboarding e redireciona corretamente

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const scaleAnim     = useRef(new Animated.Value(1)).current;
  const translateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkOnboarding();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scaleAnim,     { toValue: 1.08, duration: 600, useNativeDriver: true }),
          Animated.timing(translateAnim, { toValue: -6,   duration: 600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim,     { toValue: 0.96, duration: 500, useNativeDriver: true }),
          Animated.timing(translateAnim, { toValue: 4,    duration: 500, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scaleAnim,     { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(translateAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  async function checkOnboarding() {
    try {
      const onboardingOk = await AsyncStorage.getItem('@concurseiro:onboarding_completo');
      if (onboardingOk === 'true') {
        // Já fez o onboarding → vai direto para o MainApp
        navigation.replace('MainApp');
      }
      // Senão, fica na Splash aguardando o toque do usuário
    } catch {
      // erro silencioso
    }
  }

  return (
    <LinearGradient
      colors={['#01497a', '#0177b5', '#01497a']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Animated.View style={[
        styles.logoContainer,
        { transform: [{ scale: scaleAnim }, { translateY: translateAnim }] },
      ]}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Text style={styles.title}>¡Aprueba tu oposición!</Text>
      <Text style={styles.subtitle}>
        Haz el quiz y descubre{'\n'}
        las plazas más fáciles{'\n'}
        para ti
      </Text>
      <Text style={styles.social}>
        Miles de opositores ya{'\n'}encontraron su plaza ideal 🏛️
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Quiz1')}
        activeOpacity={0.85}
      >
        <Text style={styles.buttonText}>Comenzar →</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  logoContainer: { marginBottom: 32 },
  logo:          { width: 120, height: 120 },
  title:         { fontSize: 30, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 12 },
  subtitle:      { fontSize: 17, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 26, marginBottom: 20 },
  social:        { fontSize: 14, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 22, marginBottom: 48 },
  button:        { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 18,
                   paddingHorizontal: 56, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, elevation: 6 },
  buttonText:    { color: '#01497a', fontSize: 18, fontWeight: '900' },
});
