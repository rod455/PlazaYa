// src/screens/ResultadoPerfilScreen.js
// Exibe os concursos que batem com o perfil do usuário após o rewarded ad

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuiz } from '../context/QuizContext';
import { supabase } from '../services/supabase';
import { ESTADOS_MEXICO, AREA_OPTIONS } from '../constants/data';
import { COLORS } from '../constants/colors';

const AREA_EMOJI = {
  policia: '👮', juridico: '⚖️', saude: '🏥', fiscal: '📋',
  ti: '💻', administrativo: '🏛️', educacion: '📚',
};

// ─── Card de concurso ─────────────────────────────────────────────────────────
function ConvocatoriaCard({ item, onPress, delay }) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 400,
        delay, useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0, duration: 400,
        delay, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const salario = item.salario_min
    ? `$${Number(item.salario_min).toLocaleString('es-MX')} MXN`
    : 'Salario a convenir';

  const dias = item.dias_restantes;

  return (
    <Animated.View style={{
      opacity: fadeAnim,
      transform: [{ translateY: slideAnim }],
    }}>
      <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.85}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardEmoji}>{AREA_EMOJI[item.area] ?? '🏛️'}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitulo} numberOfLines={2}>{item.titulo}</Text>
          <Text style={styles.cardDep} numberOfLines={1}>
            🏛️ {item.dependencia ?? 'Gobierno'}
            {item.estado && item.estado !== 'FEDERAL' ? `  ·  📍 ${item.estado}` : '  ·  🇲🇽 Federal'}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardSalario}>💰 {salario}</Text>
            {dias !== null && dias <= 15 && (
              <View style={[styles.cardBadge, dias <= 7 && styles.cardBadgeUrgente]}>
                <Text style={styles.cardBadgeTxt}>{dias}d</Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.cardArrow}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── ResultadoPerfilScreen ────────────────────────────────────────────────────
export default function ResultadoPerfilScreen({ navigation }) {
  const { answers } = useQuiz();
  const [concursos, setConcursos] = useState([]);
  const [loading, setLoading] = useState(true);

  const areaLabel = AREA_OPTIONS.find(a => a.id === answers.area)?.label ?? answers.area ?? 'tu área';
  const estadoNome = ESTADOS_MEXICO.find(e => e.uf === answers.estado)?.nome ?? 'México';

  useEffect(() => { buscarConcursos(); }, []);

  async function buscarConcursos() {
    try {
      let query = supabase
        .from('convocatorias_activas')
        .select('*')
        .neq('status_cierre', 'cerrada')
        .order('fecha_publicacion', { ascending: false })
        .limit(20);

      // Filtra pela área do perfil
      if (answers.area) {
        query = query.eq('area', answers.area);
      }

      // Filtra pelo estado ou federal
      if (answers.estado) {
        query = query.or(`estado.eq.${answers.estado},estado.eq.FEDERAL`);
      }

      const { data } = await query;

      // Se não encontrou com filtros, busca qualquer coisa
      if (!data || data.length === 0) {
        const { data: fallback } = await supabase
          .from('convocatorias_activas')
          .select('*')
          .neq('status_cierre', 'cerrada')
          .order('fecha_publicacion', { ascending: false })
          .limit(10);
        setConcursos(fallback ?? []);
      } else {
        setConcursos(data);
      }
    } catch (e) {
      console.error('Erro ao buscar concursos do perfil:', e);
    } finally {
      setLoading(false);
    }
  }

  function irParaConvocatoria(item) {
    navigation.navigate('MainApp');
    // Pequeno delay para o MainApp carregar antes de navegar para a vaga
    setTimeout(() => {
      navigation.navigate('Convocatoria', { convocatoria: item });
    }, 300);
  }

  function irParaMainApp() {
    navigation.replace('MainApp');
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Header gradiente ────────────────────────────────────────────── */}
      <LinearGradient
        colors={['#01497a', '#0177b5']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.headerEmoji}>🎯</Text>
        <Text style={styles.headerTitulo}>
          {loading
            ? 'Buscando plazas...'
            : `${concursos.length} plazas encontradas`}
        </Text>
        <Text style={styles.headerSub}>
          Basadas en tu perfil: {areaLabel} · {estadoNome}
        </Text>
      </LinearGradient>

      {/* ── Lista de concursos ──────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingTxt}>Analizando tu perfil...</Text>
        </View>
      ) : (
        <FlatList
          data={concursos}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <ConvocatoriaCard
              item={item}
              onPress={irParaConvocatoria}
              delay={index * 80}
            />
          )}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyTxt}>
                No encontramos plazas abiertas{'\n'}para tu perfil en este momento.{'\n'}
                Activa las notificaciones para{'\n'}saber cuando haya nuevas.
              </Text>
            </View>
          }
          ListFooterComponent={<View style={{ height: 100 }} />}
        />
      )}

      {/* ── Botão fixo para continuar ───────────────────────────────────── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.btnContinuar} onPress={irParaMainApp}>
          <Text style={styles.btnContinuarTxt}>Ver todas las plazas →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#f9fafb' },

  // Header
  header:         { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28, alignItems: 'center' },
  headerEmoji:    { fontSize: 44, marginBottom: 10 },
  headerTitulo:   { fontSize: 26, fontWeight: '900', color: '#fff', textAlign: 'center', marginBottom: 6 },
  headerSub:      { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },

  // Loading
  loadingBox:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingTxt:     { marginTop: 16, color: '#6b7280', fontSize: 15 },

  // Lista
  lista:          { padding: 16 },

  // Card
  card:           { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
                    flexDirection: 'row', alignItems: 'center',
                    borderWidth: 1, borderColor: '#e5e7eb',
                    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardLeft:       { width: 44, height: 44, borderRadius: 12, backgroundColor: '#eff6ff',
                    alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardEmoji:      { fontSize: 22 },
  cardBody:       { flex: 1 },
  cardTitulo:     { fontSize: 14, fontWeight: '800', color: '#111827', lineHeight: 20, marginBottom: 3 },
  cardDep:        { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  cardFooter:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardSalario:    { fontSize: 13, fontWeight: '700', color: '#16a34a' },
  cardBadge:      { backgroundColor: '#dcfce7', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  cardBadgeUrgente:{ backgroundColor: '#fee2e2' },
  cardBadgeTxt:   { fontSize: 11, fontWeight: '700', color: '#166534' },
  cardArrow:      { fontSize: 22, color: '#d1d5db', marginLeft: 8 },

  // Empty
  emptyBox:       { alignItems: 'center', paddingTop: 60 },
  emptyEmoji:     { fontSize: 48, marginBottom: 16 },
  emptyTxt:       { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 24 },

  // Bottom bar
  bottomBar:      { position: 'absolute', bottom: 0, left: 0, right: 0,
                    backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 24, paddingTop: 12,
                    borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  btnContinuar:   { backgroundColor: COLORS.primary, borderRadius: 14,
                    paddingVertical: 16, alignItems: 'center' },
  btnContinuarTxt:{ color: '#fff', fontSize: 16, fontWeight: '800' },
});
