// src/services/notificationService.js
// PlazaYa — Push notifications via Expo Notifications + Supabase
// ✅ SEM Firebase — usa apenas Expo Push Tokens

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from './supabase';

// Configura como a notificação aparece quando o app está aberto (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ─── REGISTRAR PUSH TOKEN ─────────────────────────────────────────────────────
export async function registerForPushNotifications() {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications requerem dispositivo físico');
      return null;
    }

    // Pede permissão
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permissão de notificação negada');
      return null;
    }

    // Configura canal no Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'PlazaYa',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1a5c2a',
      });
    }

    // Pega o Expo Push Token
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    console.log('Expo Push Token:', token?.slice(0, 30) + '...');
    return token;
  } catch (error) {
    console.error('Erro ao registrar push:', error);
    return null;
  }
}

// ─── SALVAR TOKEN NO SUPABASE ─────────────────────────────────────────────────
export async function salvarPushToken({ token, area, estado }) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !token) return;

    await supabase
      .from('push_tokens')
      .upsert({
        user_id:    user.id,
        token:      token,
        plataforma: Platform.OS,
        area:       area || null,
        estado:     estado || null,
        ativo:      true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'token' });

    console.log('Push token salvo no Supabase');
  } catch (error) {
    console.error('Erro ao salvar push token:', error);
  }
}

// ─── LISTENERS DE NOTIFICAÇÃO ─────────────────────────────────────────────────
export function setupNotificationListeners(navigation) {
  // Notificação recebida com app aberto
  const receivedSub = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notificação recebida:', notification.request.content.title);
  });

  // Usuário clicou na notificação
  const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;
    if (data?.screen === 'Convocatoria' && data?.conv_id && navigation) {
      try {
        navigation.navigate('Convocatoria', { convocatoria: { id: data.conv_id } });
      } catch (e) {
        console.log('Erro ao navegar por notificação:', e);
      }
    }
  });

  return {
    remove: () => {
      receivedSub.remove();
      responseSub.remove();
    },
  };
}
