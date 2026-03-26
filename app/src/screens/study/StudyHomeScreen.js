// src/screens/study/StudyHomeScreen.js
// Hub de estudo — escolher tema ou iniciar simulado

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useQuiz } from '../../context/QuizContext';
import { fetchTemasDisponiveis, fetchHistoricoEstudo } from '../../services/questionsService';
import AdBanner from '../../components/AdBanner';
import { COLORS } from '../../constants/colors';

const AREA_EMOJI = {
  policia:'👮', juridico:'⚖️', saude:'🏥', fiscal:'📋',
  ti:'💻', administrativo:'🏛️', educacion:'📚',
};

export default function StudyHomeScreen() {
  const nav = useNavigation();
  const { user } = useAuth();
  const { answers } = useQuiz();
  const [temas, setTemas] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const areaUser = answers.area || null;

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [t, h] = await Promise.all([
        fetchTemasDisponiveis(areaUser),
        user ? fetchHistoricoEstudo(user.id, 5) : [],
      ]);
      setTemas(t);
      setHistorico(h);
    } catch (e) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <AdBanner />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}
      >
        <Text style={s.header}>📖 Estudiar</Text>
        <Text style={s.sub}>Practica con preguntas reales de oposiciones y exámenes de servicio público</Text>

        {/* Simulado */}
        <TouchableOpacity
          style={s.simuladoCard}
          onPress={() => nav.navigate('StudyQuiz', { tipo: 'simulado', area: areaUser })}
          activeOpacity={0.85}
        >
          <Text style={s.simuladoEmoji}>🎯</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.simuladoTitle}>Simulado completo</Text>
            <Text style={s.simuladoSub}>20 preguntas • Todas las áreas • Con tiempo</Text>
          </View>
          <Text style={s.arrow}>→</Text>
        </TouchableOpacity>

        {/* Temas */}
        <Text style={s.sectionTitle}>📚 Temas disponibles</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 20 }} />
        ) : temas.length > 0 ? (
          temas.map((t, i) => (
            <TouchableOpacity
              key={i}
              style={s.temaCard}
              onPress={() => nav.navigate('StudyQuiz', { tipo: 'tema', area: t.area, tema: t.tema })}
              activeOpacity={0.85}
            >
              <Text style={s.temaEmoji}>{AREA_EMOJI[t.area] || '📋'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.temaNome}>{t.tema}</Text>
                <Text style={s.temaCount}>{t.count} preguntas</Text>
              </View>
              <Text style={s.arrow}>→</Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={s.emptyBox}>
            <Text style={s.emptyEmoji}>📝</Text>
            <Text style={s.emptyTxt}>Todavía no hay preguntas disponibles. Pronto agregaremos contenido.</Text>
          </View>
        )}

        {/* Histórico */}
        {historico.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { marginTop: 24 }]}>📊 Tus últimas sesiones</Text>
            {historico.map((h, i) => (
              <View key={i} style={s.histCard}>
                <Text style={s.histTema}>{h.tema || h.area || 'Simulado'}</Text>
                <Text style={s.histScore}>{h.acertos}/{h.total} ({h.pontuacao}%)</Text>
              </View>
            ))}
          </>
        )}

        {/* CTA login */}
        {!user && (
          <TouchableOpacity style={s.ctaLogin} onPress={() => nav.navigate('Auth')} activeOpacity={0.85}>
            <Text style={s.ctaLoginTxt}>🔒 Inicia sesión para guardar tu progreso</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content: { padding: 16 },
  header: { fontSize: 24, fontWeight: '900', color: COLORS.primary, marginBottom: 4 },
  sub: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20, marginBottom: 20 },
  simuladoCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary,
    borderRadius: 16, padding: 18, marginBottom: 24, elevation: 4,
  },
  simuladoEmoji: { fontSize: 32, marginRight: 14 },
  simuladoTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  simuladoSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  arrow: { fontSize: 20, color: '#fff', fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 12 },
  temaCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 14, marginBottom: 8, elevation: 1,
    borderLeftWidth: 4, borderLeftColor: COLORS.gold,
  },
  temaEmoji: { fontSize: 24, marginRight: 12 },
  temaNome: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  temaCount: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  emptyBox: { alignItems: 'center', padding: 30 },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyTxt: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  histCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 6,
  },
  histTema: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  histScore: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  ctaLogin: {
    backgroundColor: COLORS.gold + '20', borderRadius: 12, padding: 16,
    marginTop: 20, alignItems: 'center', borderWidth: 1, borderColor: COLORS.gold,
  },
  ctaLoginTxt: { fontSize: 14, fontWeight: '700', color: COLORS.gold },
});
