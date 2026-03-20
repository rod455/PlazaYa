// src/screens/main/PerfilScreen.js
// Perfil do usuário — conta, notificações, configurações

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../context/AuthContext';
import { useQuiz } from '../../context/QuizContext';
import { signOut } from '../../services/authService';
import { inscreverTopicosArea } from '../../services/notificationService';
import AdBanner from '../../components/AdBanner';
import { COLORS } from '../../constants/colors';
import { AREA_OPTIONS, ESTADOS_MEXICO } from '../../constants/data';

export default function PerfilScreen() {
  const nav = useNavigation();
  const { user } = useAuth();
  const { answers } = useQuiz();
  const [notifEnabled, setNotifEnabled] = useState(true);

  const estadoNome = ESTADOS_MEXICO.find(e => e.uf === answers.estado)?.nome || answers.estado || 'No seleccionado';
  const areaNome = AREA_OPTIONS.find(a => a.id === answers.area)?.label || answers.area || 'No seleccionada';

  useEffect(() => {
    AsyncStorage.getItem('notif_enabled').then(v => {
      if (v === 'false') setNotifEnabled(false);
    });
  }, []);

  async function toggleNotif(val) {
    setNotifEnabled(val);
    await AsyncStorage.setItem('notif_enabled', val.toString());
    if (val && answers.area) {
      await inscreverTopicosArea([answers.area]);
    }
  }

  async function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión', style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            nav.reset({ index: 0, routes: [{ name: 'Splash' }] });
          } catch (e) {
            Alert.alert('Error', 'No se pudo cerrar sesión.');
          }
        },
      },
    ]);
  }

  function Section({ title, children }) {
    return (
      <View style={s.section}>
        <Text style={s.sectionTitle}>{title}</Text>
        {children}
      </View>
    );
  }

  function Row({ icon, label, value, onPress }) {
    return (
      <TouchableOpacity style={s.row} onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}>
        <Text style={s.rowIcon}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.rowLabel}>{label}</Text>
          {value && <Text style={s.rowValue}>{value}</Text>}
        </View>
        {onPress && <Text style={s.rowArrow}>→</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <AdBanner />
      <ScrollView style={s.scroll} contentContainerStyle={s.content}>
        <Text style={s.header}>👤 Mi perfil</Text>

        {/* Conta */}
        <Section title="Cuenta">
          {user ? (
            <>
              <Row icon="✉️" label="Email" value={user.email} />
              <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
                <Text style={s.logoutTxt}>Cerrar sesión</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.guestTxt}>No has iniciado sesión</Text>
              <TouchableOpacity style={s.loginBtn} onPress={() => nav.navigate('Auth')} activeOpacity={0.85}>
                <Text style={s.loginTxt}>Iniciar sesión / Crear cuenta</Text>
              </TouchableOpacity>
            </>
          )}
        </Section>

        {/* Preferências */}
        <Section title="Mis preferencias">
          <Row icon="📍" label="Estado" value={estadoNome} />
          <Row icon="🎯" label="Área de interés" value={areaNome} />
          <Row icon="📚" label="Escolaridad" value={answers.escolaridade || 'No seleccionada'} />
        </Section>

        {/* Notificações */}
        <Section title="Notificaciones">
          <View style={s.switchRow}>
            <Text style={s.switchLabel}>🔔 Recibir notificaciones</Text>
            <Switch
              value={notifEnabled}
              onValueChange={toggleNotif}
              trackColor={{ true: COLORS.primary, false: '#ccc' }}
              thumbColor="#fff"
            />
          </View>
        </Section>

        {/* Legal */}
        <Section title="Legal">
          <Row icon="📄" label="Aviso de privacidad"
            onPress={() => Linking.openURL('https://plazaya.vercel.app/privacidad')} />
          <Row icon="🗑️" label="Eliminación de datos"
            onPress={() => Linking.openURL('https://plazaya.vercel.app/eliminacion-de-datos')} />
          <Row icon="✉️" label="Contacto"
            onPress={() => Linking.openURL('mailto:appfactory.rlm@gmail.com')} />
        </Section>

        <Text style={s.version}>PlazaYa v2.0.0</Text>
        <Text style={s.disclaimer}>App independiente — no oficial. No afiliado al gobierno de México.</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content: { padding: 16 },
  header: { fontSize: 24, fontWeight: '900', color: COLORS.primary, marginBottom: 16 },
  section: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 16, elevation: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  rowIcon: { fontSize: 18, marginRight: 10 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  rowValue: { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  rowArrow: { fontSize: 16, color: COLORS.textMuted },
  guestTxt: { fontSize: 14, color: COLORS.textMuted, marginBottom: 12 },
  loginBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  loginTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  logoutBtn: { backgroundColor: COLORS.danger + '15', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  logoutTxt: { color: COLORS.danger, fontSize: 14, fontWeight: '700' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  version: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 16 },
  disclaimer: { fontSize: 11, color: '#bbb', textAlign: 'center', marginTop: 4 },
});
