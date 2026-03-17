// src/screens/main/HomeScreen.js
// Lista convocatórias em tempo real do Supabase + filtros + navega para WebView

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  RefreshControl, ScrollView, TouchableOpacity, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { useQuiz } from '../../context/QuizContext';
import { useAuth } from '../../context/AuthContext';
import { ESTADOS_MEXICO, AREA_OPTIONS } from '../../constants/data';
import { COLORS } from '../../constants/colors';
import AdBanner from '../../components/AdBanner';

// ─── Mapeamento de área → emoji ───────────────────────────────────────────────
const AREA_EMOJI = {
  policia: '👮', juridico: '⚖️', saude: '🏥', fiscal: '📋',
  ti: '💻', administrativo: '🏛️', educacion: '📚',
};

// ─── DisclaimerBanner ─────────────────────────────────────────────────────────
function DisclaimerBanner() {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity
      style={styles.disclaimer}
      onPress={() => setExpanded(e => !e)}
      activeOpacity={0.85}
    >
      <View style={styles.disclaimerRow}>
        <Text>ℹ️</Text>
        <Text style={styles.disclaimerTitle}>App independiente — no oficial</Text>
        <Text style={styles.disclaimerChevron}>{expanded ? '▲' : '▼'}</Text>
      </View>
      {expanded && (
        <Text style={styles.disclaimerBody}>
          Esta app recopila información de fuentes públicas (DOF, TrabajaEn).
          Confirma siempre los datos directamente en los sitios oficiales antes de inscribirte.
          No tenemos vínculo con el gobierno de México.
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Card de convocatória ─────────────────────────────────────────────────────
function ConvocatoriaCard({ item, onPress }) {
  const salario = item.salario_min
    ? `$${Number(item.salario_min).toLocaleString('es-MX')}${item.salario_max ? ` — $${Number(item.salario_max).toLocaleString('es-MX')}` : ''} MXN`
    : 'Salario a convenir';

  const dias = item.dias_restantes;
  const esUrgente = dias !== null && dias <= 7;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.8}>
      {/* Topo: área + dependência */}
      <View style={styles.cardTop}>
        <View style={styles.cardAreaBadge}>
          <Text style={styles.cardAreaEmoji}>{AREA_EMOJI[item.area] ?? '🏛️'}</Text>
          <Text style={styles.cardArea}>{item.area}</Text>
        </View>
        {item.estado && item.estado !== 'FEDERAL' && (
          <Text style={styles.cardEstado}>📍 {item.estado}</Text>
        )}
        {item.estado === 'FEDERAL' && (
          <Text style={styles.cardEstado}>🇲🇽 Federal</Text>
        )}
      </View>

      {/* Título */}
      <Text style={styles.cardTitulo} numberOfLines={2}>{item.titulo}</Text>
      <Text style={styles.cardDep} numberOfLines={1}>🏛️ {item.dependencia ?? 'Gobierno'}</Text>

      {/* Rodapé: salário + prazo */}
      <View style={styles.cardBottom}>
        <Text style={styles.cardSalario}>💰 {salario}</Text>
        {dias !== null ? (
          <View style={[styles.cardPrazoBadge, esUrgente && styles.cardPrazoUrgente]}>
            <Text style={[styles.cardPrazoTxt, esUrgente && styles.cardPrazoTxtUrgente]}>
              {dias === 0 ? '⚠️ Hoy' : `📅 ${dias}d`}
            </Text>
          </View>
        ) : (
          <View style={styles.cardPrazoBadge}>
            <Text style={styles.cardPrazoTxt}>🔜 Previsto</Text>
          </View>
        )}
      </View>

      {item.num_plazas && (
        <Text style={styles.cardPlazas}>👥 {item.num_plazas} plazas disponibles</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Chips de filtro ──────────────────────────────────────────────────────────
function FilterChip({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipTxt, selected && styles.chipTxtSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── HomeScreen principal ─────────────────────────────────────────────────────
export default function HomeScreen() {
  const { answers } = useQuiz();
  const { user } = useAuth();
  const navigation = useNavigation();

  // Estado dos filtros — inicia com o perfil do usuário
  const [areaFiltro,   setAreaFiltro]   = useState(answers.area ?? null);
  const [estadoFiltro, setEstadoFiltro] = useState(answers.estado ?? null);
  const [soloAbiertas, setSoloAbiertas] = useState(true);

  const [lista,      setLista]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total,      setTotal]      = useState(0);

  // ── Busca dados do Supabase ────────────────────────────────────────────────
  const buscarConvocatorias = useCallback(async () => {
    try {
      let query = supabase
        .from('convocatorias_activas')  // usa a view com dias_restantes
        .select('*')
        .order('fecha_publicacion', { ascending: false })
        .limit(50);

      if (areaFiltro)   query = query.eq('area', areaFiltro);
      if (estadoFiltro) query = query.or(`estado.eq.${estadoFiltro},estado.eq.FEDERAL`);
      if (soloAbiertas) query = query.neq('status_cierre', 'cerrada');

      const { data, error, count } = await query;

      if (error) throw error;
      setLista(data ?? []);
      setTotal(count ?? data?.length ?? 0);
    } catch (e) {
      console.error('Erro ao buscar convocatórias:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [areaFiltro, estadoFiltro, soloAbiertas]);

  // Carga inicial e quando filtros mudam
  useEffect(() => {
    setLoading(true);
    buscarConvocatorias();
  }, [buscarConvocatorias]);

  // ── Realtime — recebe novas vagas sem precisar dar pull ───────────────────
  useEffect(() => {
    const canal = supabase
      .channel('convocatorias_novas')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'convocatorias' },
        (payload) => {
          console.log('🆕 Nova convocatória recebida em tempo real:', payload.new.titulo);
          // Adiciona no topo da lista se passar nos filtros ativos
          const nova = payload.new;
          const passaArea   = !areaFiltro || nova.area === areaFiltro;
          const passaEstado = !estadoFiltro || nova.estado === estadoFiltro || nova.estado === 'FEDERAL';
          if (passaArea && passaEstado) {
            setLista(prev => [{ ...nova, dias_restantes: null, status_cierre: 'abierta' }, ...prev]);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  }, [areaFiltro, estadoFiltro]);

  // ── Navega para a tela de WebView da vaga ────────────────────────────────
  function abrirConvocatoria(item) {
    navigation.navigate('Convocatoria', { convocatoria: item });
  }

  // ── Áreas para os chips de filtro ────────────────────────────────────────
  const areasChips = [
    { id: null, label: 'Todas' },
    { id: 'policia',       label: '👮 Seguridad' },
    { id: 'juridico',      label: '⚖️ Jurídico' },
    { id: 'saude',         label: '🏥 Salud' },
    { id: 'fiscal',        label: '📋 Fiscal' },
    { id: 'ti',            label: '💻 TI' },
    { id: 'educacion',     label: '📚 Educación' },
    { id: 'administrativo',label: '🏛️ Admin' },
  ];

  const estadoNome = ESTADOS_MEXICO.find(e => e.uf === estadoFiltro)?.nome ?? 'Todo México';

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>

      <AdBanner />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitulo}>🏛️ PlazaYa</Text>
          <Text style={styles.headerSub}>
            {total > 0 ? `${total} convocatorias` : 'Buscando...'} · {estadoNome}
          </Text>
        </View>
        {user && (
          <View style={styles.badgeUser}>
            <Text style={styles.badgeUserTxt}>✅ Pro</Text>
          </View>
        )}
      </View>

      {/* Filtros de área — scroll horizontal */}
      <View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsWrap}
        >
          {areasChips.map(a => (
            <FilterChip
              key={String(a.id)}
              label={a.label}
              selected={areaFiltro === a.id}
              onPress={() => setAreaFiltro(a.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Filtro rápido: só abertas */}
      <View style={styles.filtrosRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, soloAbiertas && styles.toggleBtnOn]}
          onPress={() => setSoloAbiertas(v => !v)}
        >
          <Text style={[styles.toggleTxt, soloAbiertas && styles.toggleTxtOn]}>
            {soloAbiertas ? '✅ Solo abiertas' : '📋 Todas (incl. previstas)'}
          </Text>
        </TouchableOpacity>

        {estadoFiltro && (
          <TouchableOpacity
            style={styles.clearEstado}
            onPress={() => setEstadoFiltro(null)}
          >
            <Text style={styles.clearEstadoTxt}>📍 {estadoFiltro} ✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <DisclaimerBanner />

      {/* Lista */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingTxt}>Buscando convocatorias...</Text>
        </View>
      ) : lista.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitulo}>Sin resultados</Text>
          <Text style={styles.emptyTxt}>
            No encontramos convocatorias con estos filtros.{'\n'}
            Intenta cambiar el área o estado.
          </Text>
          <TouchableOpacity
            style={styles.btnLimpar}
            onPress={() => { setAreaFiltro(null); setEstadoFiltro(null); setSoloAbiertas(true); }}
          >
            <Text style={styles.btnLimparTxt}>Limpiar filtros</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={lista}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ConvocatoriaCard item={item} onPress={abrirConvocatoria} />
          )}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); buscarConvocatorias(); }}
              colors={[COLORS.primary]}
            />
          }
          ListFooterComponent={
            <View style={styles.footer}>
              <Text style={styles.footerTxt}>
                Datos recopilados de DOF y TrabajaEn.{'\n'}
                Confirma siempre en los sitios oficiales.
              </Text>
            </View>
          }
        />
      )}

    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:           { flex: 1, backgroundColor: '#f9fafb' },

  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 16, paddingVertical: 12 },
  headerTitulo:   { fontSize: 20, fontWeight: '900', color: '#111827' },
  headerSub:      { fontSize: 12, color: '#6b7280', marginTop: 2 },
  badgeUser:      { backgroundColor: '#d1fae5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeUserTxt:   { fontSize: 12, color: '#065f46', fontWeight: '700' },

  // Chips de área
  chipsWrap:      { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip:           { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e5e7eb' },
  chipSelected:   { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipTxt:        { fontSize: 13, color: '#374151', fontWeight: '600' },
  chipTxtSelected:{ color: '#fff', fontWeight: '700' },

  // Filtros rápidos
  filtrosRow:     { flexDirection: 'row', alignItems: 'center', gap: 8,
                    paddingHorizontal: 12, paddingBottom: 8, flexWrap: 'wrap' },
  toggleBtn:      { backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  toggleBtnOn:    { backgroundColor: '#dcfce7' },
  toggleTxt:      { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  toggleTxtOn:    { color: '#166534' },
  clearEstado:    { backgroundColor: '#eff6ff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  clearEstadoTxt: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },

  // Disclaimer
  disclaimer:     { marginHorizontal: 12, marginBottom: 8, backgroundColor: '#FFF8E1',
                    borderRadius: 10, padding: 10, borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  disclaimerRow:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  disclaimerTitle:{ flex: 1, fontSize: 12, fontWeight: '700', color: '#92400e' },
  disclaimerChevron:{ fontSize: 11, color: '#92400e' },
  disclaimerBody: { fontSize: 12, color: '#78350f', marginTop: 6, lineHeight: 18 },

  // Loading / empty
  loadingBox:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingTxt:     { color: '#6b7280', marginTop: 12, fontSize: 14 },
  emptyBox:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji:     { fontSize: 48, marginBottom: 12 },
  emptyTitulo:    { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptyTxt:       { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  btnLimpar:      { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  btnLimparTxt:   { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Cards
  lista:          { paddingHorizontal: 12, paddingBottom: 20 },
  card:           { backgroundColor: '#fff', borderRadius: 14, padding: 16,
                    marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb',
                    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardTop:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cardAreaBadge:  { flexDirection: 'row', alignItems: 'center', gap: 4,
                    backgroundColor: '#eff6ff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  cardAreaEmoji:  { fontSize: 13 },
  cardArea:       { fontSize: 11, color: COLORS.primary, fontWeight: '700', textTransform: 'uppercase' },
  cardEstado:     { fontSize: 12, color: '#6b7280' },
  cardTitulo:     { fontSize: 15, fontWeight: '800', color: '#111827', lineHeight: 21, marginBottom: 4 },
  cardDep:        { fontSize: 13, color: '#6b7280', marginBottom: 10 },
  cardBottom:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardSalario:    { fontSize: 13, fontWeight: '800', color: '#16a34a', flex: 1 },
  cardPrazoBadge: { backgroundColor: '#dcfce7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  cardPrazoUrgente:{ backgroundColor: '#fee2e2' },
  cardPrazoTxt:   { fontSize: 12, color: '#166534', fontWeight: '700' },
  cardPrazoTxtUrgente:{ color: '#991b1b' },
  cardPlazas:     { fontSize: 12, color: '#6b7280', marginTop: 6 },

  // Footer da lista
  footer:         { alignItems: 'center', paddingVertical: 20 },
  footerTxt:      { fontSize: 12, color: '#9ca3af', textAlign: 'center', lineHeight: 18 },
});
