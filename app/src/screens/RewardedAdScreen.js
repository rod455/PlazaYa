// src/screens/RewardedAdScreen.js
// Branding PlazaYa — SEM botão pular
// ✅ FIX: Removido ID de teste (ca-app-pub-3940256099942544) — agora usa ID real sempre

import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Animated, StatusBar, Image,
} from 'react-native';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMOB_IDS } from '../constants/data';

const C = {
  primary: '#FF8C40', primaryMid: '#2d8a3e',
  gold: '#FF8C40', red: '#FF4F8E', white: '#ffffff',
};

// ✅ FIX: Sempre usa o ID real — sem fallback para ID de teste
const rewarded = RewardedAd.createForAdRequest(ADMOB_IDS.REWARDED, {
  keywords: ['oposicion mexico', 'servidor publico'],
  requestNonPersonalizedAdsOnly: false,
});

export default function RewardedAdScreen({ navigation }) {
  const [adReady, setAdReady] = useState(false);
  const [showing, setShowing] = useState(false);
  const pulse  = useRef(new Animated.Value(1)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const dot1   = useRef(new Animated.Value(0.3)).current;
  const dot2   = useRef(new Animated.Value(0.3)).current;
  const dot3   = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 600, useNativeDriver: true }).start();
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
    const animPulse = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.04, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,    duration: 700, useNativeDriver: true }),
    ]));
    const u1 = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => { setAdReady(true); animPulse.start(); });
    const u2 = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, async () => {
      await AsyncStorage.setItem('onboarding_completo', 'true');
      navigation.replace('ResultadoPerfil');
    });
    const u3 = rewarded.addAdEventListener(AdEventType.CLOSED, () => { setAdReady(false); setShowing(false); rewarded.load(); });
    const u4 = rewarded.addAdEventListener(AdEventType.ERROR, () => {
      setShowing(false); setAdReady(false);
      AsyncStorage.setItem('onboarding_completo', 'true').then(() => navigation.replace('ResultadoPerfil'));
    });
    rewarded.load();
    return () => { u1(); u2(); u3(); u4(); animPulse.stop(); };
  }, []);

  return (
    <View style={s.container}>
      <StatusBar backgroundColor={C.gold} barStyle="dark-content" />
      <View style={s.bgTop} />
      <View style={s.bgBottom} />
      <Animated.View style={[s.content, { opacity: fadeIn }]}>
        <Image source={require('../../assets/icon.png')} style={s.logo} resizeMode="contain" />
        <View style={s.nameRow}>
          <Text style={s.nameP}>Plaza</Text>
          <Text style={s.nameYa}>Ya</Text>
        </View>
        <Text style={s.titulo}>¡Tu perfil está listo!</Text>
        <Text style={s.sub}>Ve un breve anuncio para acceder a tus plazas recomendadas y descubrir tu nivel.</Text>
        <View style={s.dotsRow}>
          {[dot1, dot2, dot3].map((d, i) => (
            <Animated.View key={i} style={[s.dot, { opacity: d }]} />
          ))}
        </View>
        {adReady ? (
          <Animated.View style={[{ width: '100%' }, { transform: [{ scale: pulse }] }]}>
            <TouchableOpacity style={s.btn} onPress={() => { if (!showing) { setShowing(true); rewarded.show(); } }} disabled={showing} activeOpacity={0.85}>
              {showing
                ? <ActivityIndicator color={C.white} />
                : <Text style={s.btnText}>▶  Ver anuncio y continuar</Text>
              }
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={s.loadingBox}>
            <ActivityIndicator color={C.primary} size="small" />
            <Text style={s.loadingText}>Preparando anuncio…</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.gold },
  bgTop:    { position: 'absolute', top: 0, left: 0, right: 0, height: '50%', backgroundColor: C.gold },
  bgBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', backgroundColor: C.primary },
  content:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  logo:     { width: 90, height: 90, borderRadius: 20, marginBottom: 12 },
  nameRow:  { flexDirection: 'row', marginBottom: 24 },
  nameP:    { fontSize: 28, fontWeight: '900', color: C.primary },
  nameYa:   { fontSize: 28, fontWeight: '900', color: C.gold },
  titulo:   { fontSize: 22, fontWeight: '800', color: C.white, textAlign: 'center', marginBottom: 8 },
  sub:      { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  dotsRow:  { flexDirection: 'row', gap: 6, marginBottom: 28 },
  dot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: C.white },
  btn:      { backgroundColor: C.gold, borderRadius: 28, paddingVertical: 16, alignItems: 'center' },
  btnText:  { color: C.primary, fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
  loadingBox:  { alignItems: 'center', gap: 8 },
  loadingText: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
});
