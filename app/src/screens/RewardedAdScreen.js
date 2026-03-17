// src/screens/RewardedAdScreen.js
// Após o ad, navega para o KnowledgeQuiz (em vez de direto para MainApp)

import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMOB_IDS } from '../constants/data';
import { useQuiz } from '../context/QuizContext';

const REWARDED_ID = __DEV__
  ? 'ca-app-pub-3940256099942544/5224354917'   // ID de teste Google
  : ADMOB_IDS.REWARDED;

const rewarded = RewardedAd.createForAdRequest(REWARDED_ID, {
  keywords: ['oposicion mexico', 'curso preparacion', 'servidor publico'],
  requestNonPersonalizedAdsOnly: false,
});

export default function RewardedAdScreen({ navigation }) {
  const { answers } = useQuiz();
  const [adReady,  setAdReady]  = useState(false);
  const [showing,  setShowing]  = useState(false);

  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animDots = () => {
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(dot1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ]),
      ]).start(() => animDots());
    };
    animDots();
  }, []);

  useEffect(() => {
    const unsubLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => setAdReady(true));

    const unsubEarned = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, async () => {
      // Marca onboarding completo
      await AsyncStorage.setItem('@concurseiro:onboarding_completo', 'true');
      // 🆕 Vai para o Quiz de Conhecimentos (não direto para MainApp)
      navigation.replace('ResultadoPerfil');
    });

    const unsubClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      setAdReady(false);
      setShowing(false);
      rewarded.load();
    });

    const unsubError = rewarded.addAdEventListener(AdEventType.ERROR, () => {
      setShowing(false);
      setAdReady(false);
      // Se falhar o ad, vai de qualquer forma
      AsyncStorage.setItem('@concurseiro:onboarding_completo', 'true').then(() => {
        navigation.replace('ResultadoPerfil');
      });
    });

    rewarded.load();

    return () => { unsubLoaded(); unsubEarned(); unsubClosed(); unsubError(); };
  }, []);

  function mostrarAd() {
    if (!adReady) return;
    setShowing(true);
    rewarded.show();
  }

  function pularAd() {
    AsyncStorage.setItem('@concurseiro:onboarding_completo', 'true').then(() => {
      navigation.replace('ResultadoPerfil');
    });
  }

  return (
    <LinearGradient
      colors={['#01497a', '#0177b5', '#01497a']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.emoji}>🏛️</Text>
      <Text style={styles.titulo}>¡Tu perfil está listo!</Text>
      <Text style={styles.sub}>
        Ve un breve anuncio y accede al quiz de conocimientos para descubrir tu nivel.
      </Text>

      <View style={styles.dotsRow}>
        {[dot1, dot2, dot3].map((d, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: d }]} />
        ))}
      </View>

      {adReady ? (
        <TouchableOpacity style={styles.btn} onPress={mostrarAd} disabled={showing}>
          {showing
            ? <ActivityIndicator color="#01497a" />
            : <Text style={styles.btnTxt}>Ver anuncio y continuar →</Text>
          }
        </TouchableOpacity>
      ) : (
        <View style={styles.btn}>
          <ActivityIndicator color="#01497a" />
          <Text style={[styles.btnTxt, { marginTop: 8 }]}>Preparando...</Text>
        </View>
      )}

      <TouchableOpacity onPress={pularAd} style={styles.pular}>
        <Text style={styles.pularTxt}>Saltar →</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji:     { fontSize: 60, marginBottom: 20 },
  titulo:    { fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 12 },
  sub:       { fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  dotsRow:   { flexDirection: 'row', gap: 10, marginBottom: 40 },
  dot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  btn:       { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 18,
               paddingHorizontal: 32, alignItems: 'center', minWidth: 260 },
  btnTxt:    { color: '#01497a', fontSize: 16, fontWeight: '800' },
  pular:     { marginTop: 24 },
  pularTxt:  { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
});
