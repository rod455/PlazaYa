// src/screens/main/HomeScreen.js
// Pantalla principal - 10 tarjetas con funcionalidades del app
// Branding: orange #FF8C40, pink #FF4F8E, purple #7A5CFF, blue #3B82F6
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import AdBanner from '../../components/AdBanner';
import GovSourcesBanner from '../../components/GovSourcesBanner';
import NPSModal, { incrementNPSSession } from '../../components/NPSModal';
import { useAuth } from '../../context/AuthContext';

const MENU_ITEMS = [
  {
    id: 'encontrar',
    screen: 'EncontrarConvocatoria',
    emoji: '🎯',
    title: 'Encontrar la convocatoria ideal',
    subtitle: 'Responde algunas preguntas y descubre las mejores plazas para ti',
    color: '#FF8C40',
    bgColor: '#FFF7ED',
  },
  {
    id: 'todas',
    screen: 'TodasConvocatorias',
    emoji: '📋',
    title: 'Ver todas las convocatorias',
    subtitle: 'Cientos de plazas abiertas en todo México con filtros',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  {
    id: 'simulador',
    screen: 'SimuladorSalario',
    emoji: '💰',
    title: 'Simulador de Salario',
    subtitle: 'Descubre cuánto ganarías como servidor público',
    color: '#FF8C40',
    bgColor: '#FFF7ED',
  },
  {
    id: 'calendario',
    screen: 'CalendarioExamenes',
    emoji: '📅',
    title: 'Calendario de Exámenes',
    subtitle: 'Fechas de inscripción, exámenes y resultados organizados',
    color: '#7A5CFF',
    bgColor: '#F5F3FF',
  },
  {
    id: 'quiz_diario',
    screen: 'QuizDiario',
    emoji: '🔥',
    title: 'Quiz del Día',
    subtitle: '1 pregunta por día, mantén tu racha y evoluciona diariamente',
    color: '#FF4F8E',
    bgColor: '#FFF1F5',
  },
  {
    id: 'quiz',
    screen: 'QuizGame',
    emoji: '🧠',
    title: 'Probar mis conocimientos',
    subtitle: 'Quiz con 5 preguntas reales y competencia contra la IA',
    color: '#7A5CFF',
    bgColor: '#F5F3FF',
  },
  {
    id: 'materiales',
    screen: 'MaterialesExamenes',
    emoji: '📚',
    title: 'Exámenes y Respuestas',
    subtitle: 'PDFs de exámenes anteriores de las principales instituciones',
    color: '#3B82F6',
    bgColor: '#EFF6FF',
  },
  {
    id: 'progreso',
    screen: 'MiProgreso',
    emoji: '📊',
    title: 'Mi progreso',
    subtitle: 'Acompaña tu evolución, tasa de acierto y convocatorias guardadas',
    color: '#7A5CFF',
    bgColor: '#F5F3FF',
  },
  {
    id: 'compartir',
    screen: 'Compartir',
    emoji: '🔗',
    title: 'Compartir con Amigos',
    subtitle: 'Recomienda a un amigo y gana desbloqueos gratis',
    color: '#10B981',
    bgColor: '#ECFDF5',
  },
  {
    id: 'preguntas',
    screen: 'PreguntasFrecuentes',
    emoji: '❓',
    title: 'Preguntas Frecuentes',
    subtitle: 'Cómo funciona el servicio público, convocatorias, tips para principiantes',
    color: '#64748B',
    bgColor: '#F8FAFC',
  },
];

function MenuCard({ item, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: item.bgColor, borderLeftColor: item.color }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.cardContent}>
        <Text style={styles.cardEmoji}>{item.emoji}</Text>
        <View style={styles.cardTextArea}>
          <Text style={[styles.cardTitle, { color: item.color }]}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
        </View>
        <Text style={[styles.cardArrow, { color: item.color }]}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const [npsVisible, setNpsVisible] = useState(false);

  useEffect(() => { incrementNPSSession(); }, []);

  useEffect(() => {
    if (route.params?.triggerNPS) {
      const timer = setTimeout(() => setNpsVisible(true), 600);
      navigation.setParams({ triggerNPS: undefined });
      return () => clearTimeout(timer);
    }
  }, [route.params?.triggerNPS]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <AdBanner />
      <GovSourcesBanner />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.headerTitleP}>Plaza</Text>
              <Text style={styles.headerTitleYa}>Ya</Text>
            </View>
            <Text style={styles.headerSub}>¿Qué quieres hacer hoy?</Text>
          </View>
          <TouchableOpacity style={styles.userBtn} onPress={() => navigation.navigate('Cuenta')} activeOpacity={0.8}>
            {user ? (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{(user.email || '?')[0].toUpperCase()}</Text>
              </View>
            ) : (
              <View style={styles.loginBtn}>
                <Text style={styles.loginIcon}>👤</Text>
                <Text style={styles.loginText}>Entrar</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {MENU_ITEMS.map(item => (
          <MenuCard key={item.id} item={item} onPress={() => navigation.navigate(item.screen)} />
        ))}

        <View style={styles.footerDisclaimer}>
          <Text style={styles.footerDisclaimerText}>
            App informativa e independiente. Confirma siempre en los sitios oficiales.
          </Text>
        </View>
        <View style={{ height: 24 }} />
      </ScrollView>
      <NPSModal visible={npsVisible} onDismiss={() => setNpsVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 8 },
  header: { marginTop: 12, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flex: 1 },
  headerTitleP: { fontSize: 28, fontWeight: '700', color: '#0F172A' },
  headerTitleYa: { fontSize: 28, fontWeight: '700', color: '#FF4F8E' },
  headerSub: { fontSize: 15, color: '#64748B', fontWeight: '400', marginTop: 2 },
  userBtn: {},
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF8C40',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF7ED', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: '#FF8C40',
  },
  loginIcon: { fontSize: 16 },
  loginText: { fontSize: 13, fontWeight: '600', color: '#FF8C40' },
  card: {
    borderRadius: 14, padding: 16, marginBottom: 12, borderLeftWidth: 4,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 }, shadowRadius: 8,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardEmoji: { fontSize: 32 },
  cardTextArea: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 3, lineHeight: 20 },
  cardSubtitle: { fontSize: 12, color: '#64748B', lineHeight: 17, fontWeight: '400' },
  cardArrow: { fontSize: 28, fontWeight: '300' },
  footerDisclaimer: { paddingVertical: 12 },
  footerDisclaimerText: { fontSize: 11, color: '#94A3B8', textAlign: 'center', lineHeight: 16 },
});
