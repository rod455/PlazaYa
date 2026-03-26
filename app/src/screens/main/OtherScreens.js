// src/screens/main/OtherScreens.js
// ✅ FIX v1.1: Todo el texto en español mexicano (sin portugués)

import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { signOut } from '../../services/authService';
import { COLORS } from '../../constants/colors';
import AdBanner from '../../components/AdBanner';

// ─── Novedades (placeholder) ──────────────────────────────────────────────────
export function NovedadesScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <AdBanner />
        <Text style={styles.titulo}>📋 Novedades</Text>
        <Text style={styles.sub}>Últimas convocatorias publicadas</Text>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🔜</Text>
          <Text style={styles.emptyTxt}>Próximamente: notificaciones{'\n'}de nuevas convocatorias</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Estado ───────────────────────────────────────────────────────────────────
export function EstadoScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <AdBanner />
        <Text style={styles.titulo}>🗺️ Por Estado</Text>
        <Text style={styles.sub}>Convocatorias por entidad federativa</Text>
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🏗️</Text>
          <Text style={styles.emptyTxt}>Próximamente: convocatorias{'\n'}filtradas por estado</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Perfil ───────────────────────────────────────────────────────────────────
export function PerfilScreen({ navigation }) {
  const { user } = useAuth();

  async function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <AdBanner />
        <Text style={styles.titulo}>👤 Mi Perfil</Text>

        {user ? (
          <>
            <View style={styles.card}>
              <Text style={styles.cardOrg}>✅ Cuenta activa</Text>
              <Text style={styles.cardPlaza}>{user.email}</Text>
            </View>

            <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
              <Text style={styles.btnLogoutTxt}>Cerrar sesión</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.ctaBox}>
            <Text style={styles.ctaTitulo}>🔒 Crea tu cuenta gratuita</Text>
            <Text style={styles.ctaSub}>
              Accede a simulacros, ejercicios por tema y seguimiento de tu progreso.
            </Text>
            <TouchableOpacity
              style={styles.btnCta}
              onPress={() => navigation?.navigate('Auth')}
            >
              <Text style={styles.btnCtaTxt}>Crear cuenta →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ✅ FIX: Disclaimer en español */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTxt}>
            ⚠️ PlazaYa es una aplicación independiente, no oficial. No está afiliada con el gobierno de México ni con ninguna dependencia gubernamental. La información se recopila de fuentes gubernamentales públicas como dof.gob.mx, trabajaen.gob.mx y gob.mx/spc.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#f9fafb' },
  container:  { padding: 20 },

  titulo:     { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 4 },
  sub:        { fontSize: 14, color: '#6b7280', marginBottom: 20 },

  card:       { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
                borderWidth: 1, borderColor: '#e5e7eb',
                shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardOrg:    { fontSize: 12, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase' },
  cardPrazo:  { fontSize: 12, color: '#374151' },
  cardPrevisto:{ fontSize: 12, color: '#6b7280', fontStyle: 'italic' },
  cardPlaza:  { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  cardVagas:  { fontSize: 13, color: '#6b7280' },
  cardSalario:{ fontSize: 13, fontWeight: '700', color: '#16a34a' },

  emptyBox:   { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTxt:   { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22 },

  ctaBox:     { backgroundColor: '#eff6ff', borderRadius: 16, padding: 24, marginTop: 20,
                borderWidth: 1.5, borderColor: '#bfdbfe' },
  ctaTitulo:  { fontSize: 18, fontWeight: '900', color: '#1e40af', marginBottom: 8 },
  ctaSub:     { fontSize: 14, color: '#1e40af', lineHeight: 20, marginBottom: 20 },
  btnCta:     { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnCtaTxt:  { color: '#fff', fontWeight: '800', fontSize: 15 },

  btnLogout:  { borderWidth: 1.5, borderColor: '#ef4444', borderRadius: 12, paddingVertical: 14,
                alignItems: 'center', marginTop: 20 },
  btnLogoutTxt:{ color: '#ef4444', fontWeight: '700', fontSize: 15 },

  // ✅ FIX: Disclaimer en español
  disclaimerBox: { marginTop: 24, backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12,
                   borderLeftWidth: 4, borderLeftColor: '#f0a500' },
  disclaimerTxt: { fontSize: 11, color: '#78350f', lineHeight: 17 },
});
