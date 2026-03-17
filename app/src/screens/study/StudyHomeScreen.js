// src/screens/study/StudyHomeScreen.js
// Hub de estudos — escolhe tema ou simulado

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useQuiz } from '../../context/QuizContext';
import { fetchHistorico } from '../../services/questionsService';
import { getProfile } from '../../services/supabase';
import AdBanner from '../../components/AdBanner';

// Temas por área — ajuste conforme crescer o banco
const TEMAS_POR_AREA = {
  policia:       ['Derecho Penal', 'Derecho Constitucional', 'Seguridad Pública', 'Derechos Humanos'],
  juridico:      ['Derecho Civil', 'Derecho Laboral', 'Amparo', 'Derecho Administrativo'],
  saude:         ['Salud Pública', 'Epidemiología', 'Legislación Sanitaria', 'Primeros Auxilios'],
  fiscal:        ['IVA y ISR', 'Código Fiscal', 'SAT', 'Contabilidad Gubernamental'],
  ti:            ['Redes', 'Seguridad Informática', 'Bases de Datos', 'Programación'],
  administrativo:['Administración Pública', 'Ética Pública', 'LGSMA', 'Planeación Nacional'],
};

const AREA_ICON = {
  policia: '👮', juridico: '⚖️', saude: '🏥',
  fiscal: '📋', ti: '💻', administrativo: '🏛️',
};

export default function StudyHomeScreen({ navigation }) {
  const { user } = useAuth();
  const { answers } = useQuiz();
  const area  = answers.area || 'administrativo';
  const temas = TEMAS_POR_AREA[area] || [];

  const [historico, setHistorico] = useState([]);
  const [perfil,    setPerfil]    = useState(null);

  useEffect(() => {
    if (user) {
      fetchHistorico(user.id, 5).then(setHistorico).catch(() => {});
      getProfile(user.id).then(setPerfil).catch(() => {});
    }
  }, [user]);

  function irParaQuizTema(tema) {
    if (!user) {
      Alert.alert(
        'Cuenta requerida',
        'Crea una cuenta gratuita para acceder a los ejercicios por tema.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Crear cuenta', onPress: () => navigation.navigate('Auth') },
        ]
      );
      return;
    }
    navigation.navigate('StudyQuiz', { tipo: 'quiz_tema', area, tema });
  }

  function irParaSimulado() {
    if (!user) {
      Alert.alert(
        'Cuenta requerida',
        'Los simulacros completos están disponibles para usuarios registrados.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Crear cuenta', onPress: () => navigation.navigate('Auth') },
        ]
      );
      return;
    }
    navigation.navigate('StudyQuiz', { tipo: 'simulado', area, tema: null });
  }

  const totalAcertos = historico.reduce((s, h) => s + (h.acertos || 0), 0);
  const totalQuestoes = historico.reduce((s, h) => s + (h.total || 0), 0);
  const pctGeral = totalQuestoes > 0 ? Math.round((totalAcertos / totalQuestoes) * 100) : null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <AdBanner />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>{AREA_ICON[area] || '📚'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitulo}>Módulo de Estudio</Text>
            <Text style={styles.headerSub}>{areaLabel(area)}</Text>
          </View>
          {user && (
            <View style={styles.badgeUser}>
              <Text style={styles.badgeUserTxt}>✅ Conta ativa</Text>
            </View>
          )}
        </View>

        {/* Stats (se logado e tem histórico) */}
        {user && totalQuestoes > 0 && (
          <View style={styles.statsRow}>
            <StatCard emoji="📝" valor={totalQuestoes} label="Questões" />
            <StatCard emoji="✅" valor={totalAcertos}  label="Acertos"  />
            <StatCard emoji="📊" valor={pctGeral != null ? `${pctGeral}%` : '--'} label="Taxa" />
          </View>
        )}

        {/* Simulado — destaque */}
        <Text style={styles.sectionTitle}>🎯 Simulacro Completo</Text>
        <TouchableOpacity style={styles.cardSimulado} onPress={irParaSimulado} activeOpacity={0.85}>
          <View>
            <Text style={styles.simTitulo}>Simulacro de Oposición</Text>
            <Text style={styles.simSub}>20 preguntas · distribución real · cronometrado</Text>
          </View>
          <Text style={styles.simSeta}>→</Text>
        </TouchableOpacity>

        {/* Temas */}
        <Text style={styles.sectionTitle}>📚 Ejercicios por Tema</Text>
        {temas.map(tema => (
          <TouchableOpacity
            key={tema}
            style={styles.cardTema}
            onPress={() => irParaQuizTema(tema)}
            activeOpacity={0.8}
          >
            <Text style={styles.temaTitulo}>{tema}</Text>
            <Text style={styles.temaMeta}>10 preguntas →</Text>
          </TouchableOpacity>
        ))}

        {/* CTA se não logado */}
        {!user && (
          <View style={styles.ctaBox}>
            <Text style={styles.ctaTitulo}>🔒 Acceso completo gratis</Text>
            <Text style={styles.ctaSub}>
              Crea tu cuenta para desbloquear todos los temas, simulacros y seguir tu progreso.
            </Text>
            <TouchableOpacity style={styles.btnCta} onPress={() => navigation.navigate('Auth')}>
              <Text style={styles.btnCtaTxt}>Crear cuenta gratis →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Histórico */}
        {user && historico.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>🕒 Últimas sesiones</Text>
            {historico.map(s => (
              <View key={s.id} style={styles.histItem}>
                <Text style={styles.histTipo}>{s.tipo === 'simulado' ? '🎯 Simulacro' : `📚 ${s.tema || s.area}`}</Text>
                <Text style={styles.histScore}>{s.acertos}/{s.total} — {Math.round((s.acertos/s.total)*100)}%</Text>
              </View>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ emoji, valor, label }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValor}>{valor}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function areaLabel(area) {
  const m = {
    policia:'Seguridad Pública', juridico:'Derecho',
    saude:'Salud', fiscal:'Tributario / SAT',
    ti:'Tecnología', administrativo:'Adm. Pública',
  };
  return m[area] || area;
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#f9fafb' },
  container:  { padding: 20 },

  header:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  headerEmoji:{ fontSize: 36 },
  headerTitulo:{ fontSize: 20, fontWeight: '900', color: '#111827' },
  headerSub:  { fontSize: 13, color: '#6b7280' },
  badgeUser:  { backgroundColor: '#d1fae5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeUserTxt:{ fontSize: 12, color: '#065f46', fontWeight: '700' },

  statsRow:   { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard:   { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14,
                alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  statEmoji:  { fontSize: 22, marginBottom: 4 },
  statValor:  { fontSize: 20, fontWeight: '900', color: '#01497a' },
  statLabel:  { fontSize: 11, color: '#6b7280', marginTop: 2 },

  sectionTitle:{ fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 12 },

  cardSimulado:{ backgroundColor: '#01497a', borderRadius: 16, padding: 20,
                 flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  simTitulo:  { fontSize: 17, fontWeight: '900', color: '#fff', marginBottom: 4 },
  simSub:     { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  simSeta:    { fontSize: 24, color: '#fff' },

  cardTema:   { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                borderWidth: 1.5, borderColor: '#e5e7eb',
                shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  temaTitulo: { fontSize: 15, fontWeight: '700', color: '#111827' },
  temaMeta:   { fontSize: 13, color: '#01497a', fontWeight: '600' },

  ctaBox:     { backgroundColor: '#eff6ff', borderRadius: 16, padding: 20, marginTop: 28,
                borderWidth: 1.5, borderColor: '#bfdbfe' },
  ctaTitulo:  { fontSize: 18, fontWeight: '900', color: '#1e40af', marginBottom: 8 },
  ctaSub:     { fontSize: 14, color: '#1e40af', lineHeight: 20, marginBottom: 16 },
  btnCta:     { backgroundColor: '#01497a', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnCtaTxt:  { color: '#fff', fontWeight: '800', fontSize: 15 },

  histItem:   { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8,
                flexDirection: 'row', justifyContent: 'space-between',
                borderWidth: 1, borderColor: '#e5e7eb' },
  histTipo:   { fontSize: 14, color: '#374151' },
  histScore:  { fontSize: 14, fontWeight: '700', color: '#01497a' },
});
