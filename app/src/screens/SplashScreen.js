// src/screens/SplashScreen.js
// Splash animada — logo vibra (swing left/right) + pulsa + fade in
// Navega para o fluxo principal após 2.5s

import React, { useEffect, useRef } from 'react';
import {
  View, Text, Animated, StyleSheet, StatusBar, Easing, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const C = {
  bgTop:    '#f0a500',  // dourado/laranja topo (igual ao ícone)
  bgBottom: '#1a5c2a',  // verde escuro base
  white:    '#ffffff',
  red:      '#c0392b',
};

export default function SplashScreen() {
  const navigation = useNavigation();

  // Animações
  const swing    = useRef(new Animated.Value(0)).current;  // vibração lateral
  const scale    = useRef(new Animated.Value(0.7)).current; // zoom inicial
  const opacity  = useRef(new Animated.Value(0)).current;  // fade in geral
  const txtOpacity = useRef(new Animated.Value(0)).current; // fade in texto
  const dotAnim  = useRef(new Animated.Value(0)).current;  // loading dots

  useEffect(() => {
    // 1. Fade in + zoom de entrada
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1, friction: 5, tension: 80, useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Vibração swing (left/right) — 4 ciclos
      Animated.sequence([
        // Swing rápido
        Animated.timing(swing, { toValue: 1,  duration: 80,  easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(swing, { toValue: -1, duration: 80,  easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(swing, { toValue: 1,  duration: 80,  easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(swing, { toValue: -1, duration: 80,  easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(swing, { toValue: 1,  duration: 80,  easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(swing, { toValue: -1, duration: 80,  easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(swing, { toValue: 0.5, duration: 60, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(swing, { toValue: -0.5, duration: 60, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(swing, { toValue: 0,  duration: 60,  easing: Easing.linear, useNativeDriver: true }),
      ]).start();
    });

    // 3. Texto aparece após 500ms
    setTimeout(() => {
      Animated.timing(txtOpacity, {
        toValue: 1, duration: 500, useNativeDriver: true,
      }).start();
    }, 500);

    // 4. Animação dos dots de loading
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(dotAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    // 5. Navega após 2.8s
    const timer = setTimeout(async () => {
      try {
        const onboardingFeito = await AsyncStorage.getItem('onboarding_completo');
        if (onboardingFeito === 'true') {
          navigation.replace('MainApp');
        } else {
          navigation.replace('Quiz1');
        }
      } catch {
        navigation.replace('Quiz1');
      }
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  // Converte swing (−1 a 1) em rotação em graus
  const rotate = swing.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  // Dots opacity pulsante
  const dot1 = dotAnim.interpolate({ inputRange: [0, 0.33, 1], outputRange: [0.3, 1, 0.3] });
  const dot2 = dotAnim.interpolate({ inputRange: [0, 0.33, 0.66, 1], outputRange: [0.3, 0.3, 1, 0.3] });
  const dot3 = dotAnim.interpolate({ inputRange: [0, 0.66, 1], outputRange: [0.3, 0.3, 1] });

  return (
    <View style={s.container}>
      <StatusBar backgroundColor={C.bgTop} barStyle="light-content" />

      {/* Fundo degradê simulado com dois blocos */}
      <View style={s.bgTop} />
      <View style={s.bgBottom} />

      {/* Conteúdo centralizado */}
      <Animated.View style={[s.content, { opacity }]}>

        {/* Logo animada */}
        <Animated.View style={[s.logoWrap, {
          transform: [
            { rotate },
            { scale },
          ],
        }]}>
          <Image
            source={require('../assets/icon.png')}
            style={s.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Nome do app */}
        <Animated.View style={[s.nameWrap, { opacity: txtOpacity }]}>
          <Text style={s.nameP}>Plaza</Text>
          <Text style={s.nameYa}>Ya</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[s.tagline, { opacity: txtOpacity }]}>
          Tu guía para el servicio público
        </Animated.Text>

        {/* Dots de loading */}
        <Animated.View style={[s.dotsWrap, { opacity: txtOpacity }]}>
          <Animated.View style={[s.dot, { opacity: dot1 }]} />
          <Animated.View style={[s.dot, { opacity: dot2 }]} />
          <Animated.View style={[s.dot, { opacity: dot3 }]} />
        </Animated.View>

      </Animated.View>

      {/* Versão */}
      <Animated.Text style={[s.version, { opacity: txtOpacity }]}>
        v1.0.0
      </Animated.Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Fundo bicolor
  bgTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: '55%', backgroundColor: C.bgTop,
  },
  bgBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: '45%', backgroundColor: C.bgBottom,
  },

  // Conteúdo
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Logo
  logoWrap: {
    width: 160, height: 160,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  logo: {
    width: 160, height: 160,
    borderRadius: 36,
  },

  // Nome
  nameWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameP: {
    fontSize: 42,
    fontWeight: '900',
    color: C.white,
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  nameYa: {
    fontSize: 42,
    fontWeight: '900',
    color: C.red,
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // Tagline
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginBottom: 40,
    letterSpacing: 0.3,
  },

  // Dots
  dotsWrap: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: C.white,
  },

  // Versão
  version: {
    position: 'absolute',
    bottom: 32,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
});
