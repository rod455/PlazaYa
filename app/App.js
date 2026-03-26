// App.js — raiz do app PlazaYa
// QuizProvider + AuthProvider + Ads + Notifications
// Mesma dinâmica do ConcursoBrasil adaptada para México
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Modal, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import AppNavigator from './src/navigation/index';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuizProvider } from './src/context/QuizContext';
import { AuthProvider } from './src/context/AuthContext';
import { ADMOB_IDS } from './src/constants/data';
import { initAds } from './src/services/adService';
import { trackScreen } from './src/services/analyticsService';

const APP_VERSION = '2.0.0';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.plazaya.mexico';

// Open App Ad — ad unit EXCLUSIVO para abertura do app e retorno do background
// APP_OPEN tem seu próprio ID, separado do INTERSTITIAL do adService
const appOpenAd = InterstitialAd.createForAdRequest(ADMOB_IDS.APP_OPEN, {
  keywords: ['empleo gobierno mexico', 'convocatoria publica', 'curso preparacion', 'servidor publico'],
  requestNonPersonalizedAdsOnly: false,
});

function UpdateModal({ visible, mensagem, forcar, onDismiss }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalEmoji}>🚀</Text>
          <Text style={styles.modalTitle}>Actualización disponible</Text>
          <Text style={styles.modalMsg}>{mensagem}</Text>
          <TouchableOpacity style={styles.modalBtn} onPress={() => Linking.openURL(PLAY_STORE_URL)}>
            <Text style={styles.modalBtnText}>Actualizar ahora</Text>
          </TouchableOpacity>
          {!forcar && (
            <TouchableOpacity style={styles.modalSkip} onPress={onDismiss}>
              <Text style={styles.modalSkipText}>Más tarde</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function App() {
  const navigationRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const routeNameRef = useRef(null);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showUpdate, setShowUpdate] = useState(false);
  const appOpenReady = useRef(false);
  const isFirstOpen = useRef(true);
  const firstAdShown = useRef(false);

  useEffect(() => {
    // Inicializa interstitial centralizado (adService)
    initAds();

    // Ad de abertura
    const unsubOpenLoaded = appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
      appOpenReady.current = true;
      if (!firstAdShown.current) {
        firstAdShown.current = true;
        try { appOpenAd.show(); } catch (_) {}
      }
    });
    const unsubOpenClosed = appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
      appOpenReady.current = false;
      appOpenAd.load();
    });
    const unsubOpenError = appOpenAd.addAdEventListener(AdEventType.ERROR, () => {
      appOpenReady.current = false;
      firstAdShown.current = true;
      appOpenAd.load();
    });
    appOpenAd.load();

    // Mostra ad quando volta do background
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (!isFirstOpen.current && appOpenReady.current) {
          try { appOpenAd.show(); } catch (_) {}
        }
        isFirstOpen.current = false;
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      unsubOpenLoaded(); unsubOpenClosed(); unsubOpenError();
    };
  }, []);

  function onNavigationReady() {
    routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
  }

  function onNavigationStateChange() {
    const current = navigationRef.current?.getCurrentRoute()?.name;
    if (current && current !== routeNameRef.current) trackScreen(current);
    routeNameRef.current = current;
  }

  return (
    <AuthProvider>
    <QuizProvider>
      <NavigationContainer ref={navigationRef} onReady={onNavigationReady} onStateChange={onNavigationStateChange}>
        <AppNavigator />
      </NavigationContainer>
      {updateInfo && (
        <UpdateModal visible={showUpdate} mensagem={updateInfo.mensagem} forcar={updateInfo.forcar} onDismiss={() => setShowUpdate(false)} />
      )}
    </QuizProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalBox: { backgroundColor: '#fff', borderRadius: 20, padding: 28, alignItems: 'center', width: '100%', elevation: 10 },
  modalEmoji: { fontSize: 48, marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1A2332', marginBottom: 10, textAlign: 'center' },
  modalMsg: { fontSize: 14, color: '#4B5563', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  modalBtn: { backgroundColor: '#1a5c2a', borderRadius: 32, paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center', marginBottom: 10 },
  modalBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  modalSkip: { paddingVertical: 8 },
  modalSkipText: { color: '#9CA3AF', fontSize: 13 },
});
