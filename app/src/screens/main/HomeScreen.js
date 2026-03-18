// src/screens/main/HomeScreen.js
// Branding PlazaYa — verde #1a5c2a, vermelho #c0392b, dourado #f0a500

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

function Disclaimer() {
  const [open, setOpen] = useState(false);
  return (
    <TouchableOpacity style={s.disclaimer} onPress={() => setOpen(v => !v)} activeOpacity={0.9}>
      <View style={s.disclaimerRow}>
        <Text style={s.disclaimerTxt}>ℹ️  App independiente — no oficial</Text>
        <Text style={s.disclaimerChev}>{open ? '▲' : '▼'}</Text>
      </View>
      {open && <Text style={s.disclaimerBody}>Esta app recopila información de fuentes públicas (DOF, TrabajaEn). Confirma siempre los datos en los sitios oficiales antes de inscribirte.</Text>}
    </TouchableOpacity>
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
        <Text style={{ fontSize: 18 }}>🇲🇽</Text>
      </View>
      <View style={s.cardBody}>
        {fechaStr && <View style={s.dataRow}><Text style={s.dataLabel}>📅 Inscripciones hasta </Text><Text style={s.dataVal}>{fechaStr}</Text></View>}
        {item.escolaridad && <Text style={s.nivel}>Nivel {item.escolaridad}</Text>}
        {salario && <View style={{ flexDirection:'row', alignItems:'center', gap: 6 }}><Text style={{ fontSize:16 }}>💰</Text><Text style={s.salario}>{salario}</Text></View>}
        {item.num_plazas && <Text style={s.plazas}>👥 {Number(item.num_plazas).toLocaleString()} plazas disponibles</Text>}
      </View>
      {urgente && <View style={s.urgente}><Text style={s.urgenteTxt}>⚠️ Cierra en {dias === 0 ? 'hoy' : `${dias} días`}</Text></View>}
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { answers } = useQuiz();
  const { user } = useAuth();
  const navigation = useNavigation();
  const [areaFiltro, setAreaFiltro] = useState(answers.area ?? null);
  const [soloAbiertas, setSoloAbiertas] = useState(true);
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const estadoFiltro = answers.estado ?? null;
  const estadoNome = ESTADOS_MEXICO?.find(e => e.uf === estadoFiltro)?.nome ?? 'Todo México';

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
          ListFooterComponent={<Text style={s.footer}>Datos de DOF · TrabajaEn · Confirma en sitios oficiales</Text>}
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
  disclaimer:   { marginHorizontal: 12, marginBottom: 8, backgroundColor: '#FFF8E1', borderRadius: 10, padding: 10, borderLeftWidth: 4, borderLeftColor: C.gold },
  disclaimerRow:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  disclaimerTxt:{ fontSize: 12, fontWeight: '700', color: '#92400e', flex: 1 },
  disclaimerChev:{ fontSize: 11, color: '#92400e' },
  disclaimerBody:{ fontSize: 12, color: '#78350f', marginTop: 6, lineHeight: 18 },
  lista:        { paddingHorizontal: 12, paddingBottom: 140 },
  loadingTxt:   { color: C.textMuted, marginTop: 12, fontSize: 14 },
  emptyTitle:   { fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 8 },
  emptyTxt:     { fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  btnLimpar:    { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  btnLimparTxt: { color: C.white, fontWeight: '700', fontSize: 15 },
  footer:       { fontSize: 11, color: '#9ca3af', textAlign: 'center', paddingVertical: 20 },
  card:         { backgroundColor: C.white, borderRadius: 16, marginBottom: 12, overflow: 'hidden',
                  shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  cardHead:     { backgroundColor: C.primary, padding: 14, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardHeadLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardEmoji:    { fontSize: 22, marginTop: 2 },
  cardTitulo:   { fontSize: 15, fontWeight: '900', color: C.white, lineHeight: 20 },
  cardDep:      { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  cardBody:     { padding: 14, gap: 6 },
  dataRow:      { flexDirection: 'row', alignItems: 'center' },
  dataLabel:    { fontSize: 13, color: C.textMuted },
  dataVal:      { fontSize: 13, fontWeight: '800', color: C.primary },
  nivel:        { fontSize: 12, color: C.textMuted, backgroundColor: '#f0f7f1', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  salario:      { fontSize: 15, fontWeight: '900', color: C.primary },
  plazas:       { fontSize: 12, color: C.textMuted },
  urgente:      { backgroundColor: '#fee2e2', paddingHorizontal: 14, paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#fecaca' },
  urgenteTxt:   { fontSize: 12, fontWeight: '800', color: C.red },
});
