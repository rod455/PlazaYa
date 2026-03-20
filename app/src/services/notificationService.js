// src/services/notificationService.js
// FCM nativo — tokens registrados direto no Firebase
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── REGISTRAR TOKEN FCM ─────────────────────────────────────────────────────
export async function registerForPushNotifications() {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('Permiso de notificación denegado');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'PlazaYa',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1a5c2a',
      });
    }

    const fcmToken = await messaging().getToken();
    if (!fcmToken) {
      console.log('No se pudo obtener el token FCM');
      return null;
    }

    console.log('Token FCM registrado:', fcmToken.slice(0, 20) + '...');

    await messaging().subscribeToTopic('todos_usuarios');
    await messaging().subscribeToTopic('nuevas_convocatorias');

    return fcmToken;
  } catch (error) {
    console.error('Error al registrar push:', error);
    return null;
  }
}

// ─── INSCREVER EM TÓPICOS POR ÁREA ───────────────────────────────────────────
export async function inscreverTopicosArea(areas) {
  try {
    for (const area of areas) {
      await messaging().subscribeToTopic(`convocatoria_${area}`);
    }
  } catch (error) {
    console.error('Error al suscribir a tópicos:', error);
  }
}

// ─── LISTENER DE REFRESH DE TOKEN ─────────────────────────────────────────────
export function onTokenRefresh(callback) {
  return messaging().onTokenRefresh(async (newToken) => {
    console.log('Token FCM actualizado:', newToken.slice(0, 20) + '...');
    if (callback) callback(newToken);

    try {
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        await firestore().collection('usuarios').doc(userId).update({
          fcmToken: newToken,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (e) {
      console.error('Error al actualizar token:', e.message);
    }
  });
}

// ─── SALVAR USUÁRIO NO FIRESTORE ──────────────────────────────────────────────
export async function saveUserToFirestore({ token, onboardingCompleto, areas, estado }) {
  try {
    let userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      await AsyncStorage.setItem('userId', userId);
    }

    await firestore().collection('usuarios').doc(userId).set({
      fcmToken: token,
      onboardingCompleto: onboardingCompleto || false,
      areas: areas || [],
      estado: estado || null,
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
      ultimoAcesso: firestore.FieldValue.serverTimestamp(),
      plataforma: Platform.OS,
      app: 'plazaya',
    }, { merge: true });

    return userId;
  } catch (e) {
    console.error('Error saveUserToFirestore:', e);
    return null;
  }
}

// ─── MARCAR ONBOARDING COMPLETO ───────────────────────────────────────────────
export async function markOnboardingComplete(profile) {
  try {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) return;

    await firestore().collection('usuarios').doc(userId).update({
      onboardingCompleto: true,
      area: profile.area || null,
      estado: profile.estado || null,
      escolaridade: profile.escolaridade || null,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });

    // Inscreve nos tópicos de área
    if (profile.area) {
      await inscreverTopicosArea([profile.area]);
    }
  } catch (e) {
    console.error('Error markOnboardingComplete:', e);
  }
}

// ─── ATUALIZAR ÚLTIMO ACESSO ──────────────────────────────────────────────────
export async function updateLastOpen() {
  try {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) return;
    await firestore().collection('usuarios').doc(userId).update({
      ultimoAcesso: firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {}
}

// ─── NAVEGAÇÃO POR NOTIFICAÇÃO ────────────────────────────────────────────────
function navegarPorNotificacao(navigation, data) {
  if (!navigation || !data) return;

  const irParaNovedades = () => {
    try {
      navigation.navigate('MainApp', { screen: 'Novedades' });
    } catch (_) {
      try { navigation.navigate('MainApp'); } catch (__) {}
    }
  };

  if (data.screen === 'Novedades') { irParaNovedades(); return; }
  if (data.screen === 'MainApp') {
    try { navigation.navigate('MainApp'); } catch (_) {}
    return;
  }
  if (data.tipo === 'nueva_convocatoria') { irParaNovedades(); return; }

  try { navigation.navigate('MainApp'); } catch (_) {}
}

// ─── LISTENERS DE NOTIFICAÇÕES ────────────────────────────────────────────────
export function setupNotificationListeners(navigation) {
  const unsubOpen = messaging().onNotificationOpenedApp(remoteMessage => {
    navegarPorNotificacao(navigation, remoteMessage.data);
  });

  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage) {
        setTimeout(() => {
          navegarPorNotificacao(navigation, remoteMessage.data);
        }, 500);
      }
    });

  const unsubForeground = messaging().onMessage(async remoteMessage => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: remoteMessage.notification?.title || 'PlazaYa',
        body: remoteMessage.notification?.body || '',
        data: remoteMessage.data || {},
      },
      trigger: null,
    });
  });

  return {
    remove: () => { unsubOpen(); unsubForeground(); },
  };
}
