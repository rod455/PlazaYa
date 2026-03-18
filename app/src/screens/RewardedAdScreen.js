// src/screens/RewardedAdScreen.js
// Branding PlazaYa — SEM botão pular

import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Animated, StatusBar, Image,
} from 'react-native';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ADMOB_IDS } from '../constants/data';

const C = {
  primary: '#1a5c2a', primaryMid: '#2d8a3e',
  gold: '#f0a500', red: '#c0392b', white: '#ffffff',
};

const REWARDED_ID = __DEV__
  ? 'ca-app-pub-3940256099942544/5224354917'
  : ADMOB_IDS.REWARDED;

const rewarded = RewardedAd.createForAdRequest(REWARDED_ID, {
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
        <Image source={require('../assets/icon.png')} style={s.logo} resizeMode="contain" />
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
                ? <ActivityIndicator color={C.primary} />
                : <View style={s.btnInner}><Text style={{ fontSize: 20 }}>▶️</Text><Text style={s.btnTxt}>Ver anuncio y continuar</Text></View>}
            </TouchableOpacity>
          </Animated.View>
        ) : (
          <View style={s.btnLoading}>
            <ActivityIndicator color={C.primary} size="small" />
            <Text style={s.btnLoadingTxt}>Preparando anuncio...</Text>
          </View>
        )}
        <Text style={s.aviso}>🔒 Debes ver el anuncio completo para continuar</Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bgTop:     { position: 'absolute', top: 0, left: 0, right: 0, height: '55%', backgroundColor: '#f0a500' },
  bgBottom:  { position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', backgroundColor: '#1a5c2a' },
  content:   { alignItems: 'center', paddingHorizontal: 32, width: '100%' },
  logo:      { width: 110, height: 110, borderRadius: 24, marginBottom: 12,
               shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 10 },
  nameRow:   { flexDirection: 'row', marginBottom: 24 },
  nameP:     { fontSize: 32, fontWeight: '900', color: '#fff', textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  nameYa:    { fontSize: 32, fontWeight: '900', color: '#c0392b', textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
  titulo:    { fontSize: 24, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 10 },
  sub:       { fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 21, marginBottom: 32 },
  dotsRow:   { flexDirection: 'row', gap: 10, marginBottom: 32 },
  dot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  btn:       { backgroundColor: '#fff', borderRadius: 16, paddingVertical: 18, width: '100%', alignItems: 'center',
               shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  btnInner:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnTxt:    { color: '#1a5c2a', fontSize: 16, fontWeight: '900' },
  btnLoading:    { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, paddingVertical: 18, width: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  btnLoadingTxt: { color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: '700' },
  aviso:     { marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontWeight: '600' },
});
