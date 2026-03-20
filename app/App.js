// App.js — raiz do app PlazaYa
// QuizProvider + AuthProvider + Firebase + FCM + Interstitial + Update Modal

import React, { useEffect, useRef, useState } from 'react';
import { AppState, Modal, View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/index';
import {
  registerForPushNotifications,
  saveUserToFirestore,
  updateLastOpen,
  setupNotificationListeners,
  onTokenRefresh,
} from './src/services/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuizProvider } from './src/context/QuizContext';
import { AuthProvider } from './src/context/AuthContext';
import { checkAppVersion, updateUltimoAcesso } from './src/services/supabaseService';
import { captureInstallReferrer } from './src/services/utmService';
import { trackScreen, setAnalyticsUserId } from './src/services/analyticsService';
import { usePersistentInterstitial } from './src/hooks/useInterstitial';

const APP_VERSION = '2.0.0';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.mycompany.concursosmx';

// ── Modal de atualização ──────────────────────────────────────────────────────
function UpdateModal({ visible, mensagem, forcar, onDismiss }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <Text style={styles.modalEmoji}>🚀</Text>
          <Text style={styles.modalTitle}>Actualización disponible</Text>
          <Text style={styles.modalMsg}>{mensagem}</Text>
          <TouchableOpacity
            style={styles.modalBtn}
            onPress={() => Linking.openURL(PLAY_STORE_URL)}
          >
            <Text style={styles.modalBtnTxt}>Actualizar ahora</Text>
          </TouchableOpacity>
          {!forcar && (
            <TouchableOpacity style={styles.modalSkip} onPress={onDismiss}>
              <Text style={styles.modalSkipTxt}>Después</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── Wrapper com interstitial ──────────────────────────────────────────────────
function AppContent() {
  usePersistentInterstitial();
  return <AppNavigator />;
}

export default function App() {
  const navigationRef = useRef(null);
  const routeNameRef = useRef(null);
  const notifSubscription = useRef(null);
  const tokenRefreshSub = useRef(null);

  const [showUpdate, setShowUpdate] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);

  useEffect(() => {
    checkVersion();
    initNotifications();
    trackAppOpen();
    captureInstallReferrer();

    // Listener de refresh de token FCM
    tokenRefreshSub.current = onTokenRefresh();

    // Listener de AppState para atualizar último acesso
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        updateUltimoAcesso();
      }
    });

    return () => {
      sub.remove();
      if (notifSubscription.current) notifSubscription.current.remove();
      if (tokenRefreshSub.current) tokenRefreshSub.current();
    };
  }, []);

  async function checkVersion() {
    const info = await checkAppVersion(APP_VERSION);
    if (info) {
      setUpdateInfo(info);
      setShowUpdate(true);
    }
  }

  async function initNotifications() {
    try {
      const token = await registerForPushNotifications();
      if (!token) return;

      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        await saveUserToFirestore({ token, onboardingCompleto: false });
      } else {
        const { default: firestore } = await import('@react-native-firebase/firestore');
        await firestore().collection('usuarios').doc(userId).update({
          fcmToken: token,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error al inicializar notificaciones:', error);
    }
  }

  async function trackAppOpen() {
    const userId = await AsyncStorage.getItem('userId');
    if (userId) {
      updateLastOpen();
      updateUltimoAcesso();
      await setAnalyticsUserId(userId);
    }
  }

  function onNavigationReady() {
    notifSubscription.current = setupNotificationListeners(navigationRef.current);
    routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
  }

  function onNavigationStateChange() {
    const current = navigationRef.current?.getCurrentRoute()?.name;
    if (current && current !== routeNameRef.current) {
      trackScreen(current);
      routeNameRef.current = current;
    }
  }

  return (
    <QuizProvider>
      <AuthProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={onNavigationReady}
          onStateChange={onNavigationStateChange}
        >
          <AppContent />
        </NavigationContainer>
        {updateInfo && (
          <UpdateModal
            visible={showUpdate}
            mensagem={updateInfo.mensagem}
            forcar={updateInfo.forcar}
            onDismiss={() => setShowUpdate(false)}
          />
        )}
      </AuthProvider>
    </QuizProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalBox: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28,
    width: '100%', alignItems: 'center', elevation: 10,
  },
  modalEmoji: { fontSize: 48, marginBottom: 12 },
  modalTitle: { fontSize: 22, fontWeight: '900', color: '#1a5c2a', marginBottom: 8 },
  modalMsg: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  modalBtn: {
    backgroundColor: '#1a5c2a', borderRadius: 12, paddingVertical: 14,
    paddingHorizontal: 32, width: '100%', alignItems: 'center',
  },
  modalBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  modalSkip: { marginTop: 12, padding: 8 },
  modalSkipTxt: { color: '#999', fontSize: 14 },
});
