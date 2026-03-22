// src/screens/main/HomeScreen.js
// Branding PlazaYa — verde #1a5c2a, vermelho #c0392b, dourado #f0a500
// ✅ FIX v1.1: Disclaimer em espanhol, sem menção a fontes específicas, sempre visível

import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  RefreshControl, ScrollView, TouchableOpacity, FlatList, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { useQuiz } from '../../context/QuizContext';
import { useAuth } from '../../context/AuthContext';
import { ESTADOS_MEXICO } from '../../constants/data';
import AdBanner from '../../components/AdBanner';

const C = {
  primary:     '#1a5c2a',
  primaryMid:  '#2d8a3e',
  red:         '#c0392b',
  gold:        '#f0a500',
  bg:          '#f2f4f0',
  white:       '#ffffff',
  text:        '#1a1a1a',
  textMuted:   '#666666',
  border:      '#e0e0e0',
};

const AREA_EMOJI = {
  policia:'👮', juridico:'⚖️', saude:'🏥', fiscal:'📋',
  ti:'💻', administrativo:'🏛️', educacion:'📚',
};

function Chip({ label, selected, onPress }) {
  return (
    <TouchableOpacity style={[s.chip, selected && s.chipOn]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[s.chipTxt, selected && s.chipTxtOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ✅ FIX: Disclaimer sempre visível, em espanhol mexicano, sem mencionar fontes específicas
function Disclaimer() {
  return (
    <View style={s.disclaimer}>
      <Text style={s.disclaimerTxt}>
        ⚠️  <Text style={{ fontWeight: '800' }}>App independiente — no oficial.</Text>{' '}
        Esta aplicación NO está afiliada con el gobierno de México ni con ninguna dependencia gubernamental.
        La información se recopila de fuentes públicas. Confirma siempre en los sitios oficiales antes de postularte.
      </Text>
    </View>
  );
}

function ConvCard({ item, onPress }) {
  const salario = item.salario_min
    ? `$${Number(item.salario_min).toLocaleString('es-MX')}${item.salario_max ? ` — $${Number(item.salario_max).toLocaleString('es-MX')}` : ''} MXN`
    : null;
  const dias = item.dias_restantes;
  const urgente = dias !== null && dias <= 7;
  let fechaStr = null;
  if (item.fecha_cierre) {
    const d = new Date(item.fecha_cierre);
    fechaStr = d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  return (
    <TouchableOpacity style={s.card} onPress={() => onPress(item)} activeOpacity={0.88}>
      <View style={s.cardHead}>
        <View style={s.cardHeadLeft}>
          <Text style={s.cardEmoji}>{AREA_EMOJI[item.area] ?? '🏛️'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.cardTitulo} numberOfLines={2}>{item.titulo}</Text>
            <Text style={s.cardDep} numberOfLines={1}>{item.dependencia ?? 'Gobierno Federal'}</Text>
          </View>
        </View>
        {item.estado && item.estado !== 'FEDERAL' && (
          <View style={s.estadoBadge}><Text style={s.estadoTxt}>{item.estado}</Text></View>
        )}
        {item.estado === 'FEDERAL' && (
          <View style={[s.estadoBadge, { backgroundColor: '#dcfce7' }]}><Text style={[s.estadoTxt, { color: C.primary }]}>FEDERAL</Text></View>
        )}
      </View>

      <View style={s.cardBody}>
        {salario && <Text style={s.cardSalario}>💰 {salario}</Text>}
        {item.escolaridad && <Text style={s.cardEsc}>🎓 {item.escolaridad}</Text>}
      </View>

      <View style={s.cardFooter}>
        {dias !== null && (
          <View style={[s.dateBadge, urgente && s.dateBadgeUrgente]}>
            <Text style={[s.dateTxt, urgente && { color: '#dc2626' }]}>
              {dias === 0 ? '⚠️ Cierra hoy' : `📅 ${dias} días · Cierra ${fechaStr}`}
            </Text>
          </View>
        )}
        {!item.fecha_cierre && (
          <Text style={s.sinFechaTxt}>📅 Sin fecha definida</Text>
        )}
        {item.num_plazas && <Text style={s.plazasTxt}>👥 {item.num_plazas} plazas</Text>}
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { answers } = useQuiz();
  const navigation = useNavigation();
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [areaFiltro, setAreaFiltro] = useState(answers?.area || null);
  const [estadoFiltro] = useState(answers?.estado || null);
  const [soloAbiertas, setSoloAbiertas] = useState(true);

  const estadoNome = estadoFiltro
    ? ESTADOS_MEXICO.find(e => e.uf === estadoFiltro)?.nome ?? estadoFiltro
    : 'Todo México';

  const buscar = useCallback(async () => {
    try {
      let q = supabase.from('convocatorias_activas').select('*').order('fecha_publicacion', { ascending: false }).limit(50);
      if (areaFiltro) q = q.eq('area', areaFiltro);
      if (estadoFiltro) q = q.or(`estado.eq.${estadoFiltro},estado.eq.FEDERAL`);
      if (soloAbiertas) q = q.neq('status_cierre', 'cerrada');
      const { data, error } = await q;
      if (error) throw error;
      setLista(data ?? []);
      setTotal(data?.length ?? 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [areaFiltro, estadoFiltro, soloAbiertas]);

  useEffect(() => { setLoading(true); buscar(); }, [buscar]);

  useEffect(() => {
    const canal = supabase.channel('conv_live').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'convocatorias' }, (p) => {
      if (!areaFiltro || p.new.area === areaFiltro) setLista(prev => [{ ...p.new, dias_restantes: null, status_cierre: 'abierta' }, ...prev]);
    }).subscribe();
    return () => supabase.removeChannel(canal);
  }, [areaFiltro]);

  const areas = [
    { id: null, label: 'Todas' },
    { id: 'policia', label: '👮 Seguridad' },
    { id: 'juridico', label: '⚖️ Jurídico' },
    { id: 'saude', label: '🏥 Salud' },
    { id: 'fiscal', label: '📋 Fiscal' },
    { id: 'ti', label: '💻 TI' },
    { id: 'educacion', label: '📚 Educación' },
    { id: 'administrativo', label: '🏛️ Admin' },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar backgroundColor={C.primary} barStyle="light-content" />
      <AdBanner />

      {/* Header */}
      <View style={s.header}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={s.logoP}>Plaza</Text><Text style={s.logoYa}>Ya</Text>
          </View>
          <Text style={s.headerSub}>{total > 0 ? `${total} convocatorias` : 'Buscando...'} · {estadoNome}</Text>
        </View>
        <TouchableOpacity style={s.searchBtn}><Text style={{ fontSize: 18 }}>🔍</Text></TouchableOpacity>
      </View>

      {/* Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {areas.map(a => <Chip key={String(a.id)} label={a.label} selected={areaFiltro === a.id} onPress={() => setAreaFiltro(a.id)} />)}
      </ScrollView>

      {/* Filtro */}
      <View style={s.filtroRow}>
        <TouchableOpacity style={[s.toggleBtn, soloAbiertas && s.toggleBtnOn]} onPress={() => setSoloAbiertas(v => !v)}>
          <Text style={[s.toggleTxt, soloAbiertas && s.toggleTxtOn]}>{soloAbiertas ? '✅ Solo abiertas' : '📋 Todas'}</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ FIX: Disclaimer sempre visível */}
      <Disclaimer />

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color={C.primary} /><Text style={s.loadingTxt}>Buscando convocatorias...</Text></View>
      ) : lista.length === 0 ? (
        <View style={s.center}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>🔍</Text>
          <Text style={s.emptyTitle}>Sin resultados</Text>
          <Text style={s.emptyTxt}>No encontramos convocatorias con estos filtros. Intenta cambiar el área o estado.</Text>
          <TouchableOpacity style={s.btnLimpar} onPress={() => { setAreaFiltro(null); setSoloAbiertas(true); }}>
            <Text style={s.btnLimparTxt}>Limpiar filtros</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={lista}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ConvCard item={item} onPress={c => navigation.navigate('Convocatoria', { convocatoria: c })} />}
          contentContainerStyle={s.lista}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); buscar(); }} colors={[C.primary]} />}
          ListFooterComponent={
            <Text style={s.footer}>Información recopilada de fuentes públicas. Confirma siempre en los sitios oficiales.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: C.bg },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: C.white, paddingHorizontal: 16, paddingVertical: 10,
                  borderBottomWidth: 1, borderBottomColor: C.border },
  logoP:        { fontSize: 22, fontWeight: '900', color: C.primary },
  logoYa:       { fontSize: 22, fontWeight: '900', color: C.red },
  headerSub:    { fontSize: 12, color: C.textMuted },
  searchBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  chips:        { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#d0d0d0' },
  chipOn:       { backgroundColor: '#1a5c2a', borderColor: '#1a5c2a' },
  chipTxt:      { fontSize: 13, color: '#1a1a1a', fontWeight: '600' },
  chipTxtOn:    { color: '#ffffff', fontWeight: '700' },
  filtroRow:    { paddingHorizontal: 12, paddingBottom: 6 },
  toggleBtn:    { backgroundColor: '#f3f4f6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  toggleBtnOn:  { backgroundColor: '#dcfce7' },
  toggleTxt:    { fontSize: 13, color: C.textMuted, fontWeight: '600' },
  toggleTxtOn:  { color: C.primary },

  // ✅ FIX: Disclaimer sempre visível, sem toggle
  disclaimer:   { marginHorizontal: 12, marginBottom: 8, backgroundColor: '#FFF8E1', borderRadius: 10, padding: 10, borderLeftWidth: 4, borderLeftColor: C.gold },
  disclaimerTxt:{ fontSize: 11, color: '#78350f', lineHeight: 17 },

  lista:        { paddingHorizontal: 12, paddingBottom: 140 },
  loadingTxt:   { color: C.textMuted, marginTop: 12, fontSize: 14 },
  emptyTitle:   { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8 },
  emptyTxt:     { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  btnLimpar:    { backgroundColor: C.primary, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 28 },
  btnLimparTxt: { color: C.white, fontWeight: '700' },
  footer:       { fontSize: 11, color: '#9ca3af', textAlign: 'center', paddingVertical: 20, lineHeight: 17 },

  // Cards
  card:         { backgroundColor: C.white, borderRadius: 14, padding: 14, marginBottom: 10,
                  borderWidth: 1, borderColor: C.border, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardHead:     { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 },
  cardHeadLeft: { flexDirection: 'row', flex: 1, gap: 10 },
  cardEmoji:    { fontSize: 24 },
  cardTitulo:   { fontSize: 14, fontWeight: '800', color: C.text, lineHeight: 20 },
  cardDep:      { fontSize: 12, color: C.textMuted, marginTop: 2 },
  estadoBadge:  { backgroundColor: '#eff6ff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  estadoTxt:    { fontSize: 11, fontWeight: '700', color: '#1d4ed8' },
  cardBody:     { flexDirection: 'row', gap: 12, marginBottom: 8, flexWrap: 'wrap' },
  cardSalario:  { fontSize: 13, fontWeight: '800', color: '#16a34a' },
  cardEsc:      { fontSize: 12, color: C.textMuted },
  cardFooter:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  dateBadge:    { backgroundColor: '#f3f4f6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  dateBadgeUrgente: { backgroundColor: '#fee2e2' },
  dateTxt:      { fontSize: 11, fontWeight: '600', color: '#374151' },
  sinFechaTxt:  { fontSize: 11, color: '#9ca3af' },
  plazasTxt:    { fontSize: 11, color: C.textMuted },
});
