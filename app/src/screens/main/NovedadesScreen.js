// src/screens/main/NovedadesScreen.js
// Paywall: deslogado vê conteúdo borrado + botão assistir vídeo rewarded (1x/dia)
// Após vídeo: conteúdo liberado 24h + CTA para criar conta

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Modal, RefreshControl, Alert, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';

const COLORS = {
  primary: '#0177b5', primaryDark: '#01497a',
  bg: '#f4f6f9', card: '#ffffff',
  text: '#1a2332', textMuted: '#6b7280',
  border: '#e5e7eb', success: '#16a34a',
};

const REWARDED_AD_ID = __DEV__
  ? TestIds.REWARDED
  : 'ca-app-pub-9316035916536420/3401306180';

const UNLOCK_KEY      = 'novedades_unlock_ts';
const UNLOCK_DURATION = 24 * 60 * 60 * 1000; // 24h em ms

// ── Card de convocatória ──────────────────────────────────────────────────────
function ConvCard({ item }) {
  const nav = useNavigation();
  const dias = item.fecha_cierre
    ? Math.max(0, Math.ceil((new Date(item.fecha_cierre) - new Date()) / 86400000))
    : null;
  const ICONS = { policia:'👮', juridico:'⚖️', saude:'🏥', fiscal:'📋', ti:'💻', educacion:'📚', administrativo:'🏛️' };
  return (
    <TouchableOpacity style={s.card} onPress={() => nav.navigate('Convocatoria', { convocatoria: item })} activeOpacity={0.8}>
      <View style={s.cardHeader}>
        <View style={s.areaTag}>
          <Text style={s.areaTagTxt}>{ICONS[item.area] ?? '🏛️'} {(item.area ?? 'admin').toUpperCase()}</Text>
        </View>
        {dias !== null
          ? <View style={[s.diasBadge, dias <= 7 && s.diasUrgente]}><Text style={s.diasTxt}>{dias === 0 ? 'Hoy' : `${dias}d`}</Text></View>
          : <Text style={s.previsto}>📅 Previsto</Text>}
      </View>
      <Text style={s.titulo} numberOfLines={2}>{item.titulo}</Text>
      <Text style={s.dep} numberOfLines={1}>🏛 {item.dependencia ?? 'Gobierno Federal'}</Text>
      <View style={s.cardFooter}>
        {item.num_plazas ? <Text style={s.info}>👥 {item.num_plazas.toLocaleString()} plazas</Text> : null}
        {item.salario_min ? <Text style={s.salario}>💰 ${item.salario_min.toLocaleString()} MXN</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

// ── Overlay paywall ───────────────────────────────────────────────────────────
function Paywall({ onVideo, onCadastro, adLoading }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.04, duration: 800, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1,    duration: 800, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={s.paywall}>
      <View style={s.paywallIcon}><Text style={{ fontSize: 36 }}>🔒</Text></View>
      <Text style={s.paywallTitle}>Contenido exclusivo</Text>
      <Text style={s.paywallSub}>Accede a las últimas convocatorias del gobierno. ¡Gratis!</Text>
      <Animated.View style={[{ width: '100%' }, { transform: [{ scale: pulse }] }]}>
        <TouchableOpacity style={s.btnVideo} onPress={onVideo} disabled={adLoading} activeOpacity={0.85}>
          {adLoading
            ? <ActivityIndicator color="#fff" />
            : <><Text style={{ fontSize: 20 }}>▶️</Text><Text style={s.btnVideoTxt}>Ver un video y desbloquear</Text></>}
        </TouchableOpacity>
      </Animated.View>
      <Text style={s.ou}>— o —</Text>
      <TouchableOpacity style={s.btnCadastro} onPress={onCadastro} activeOpacity={0.85}>
        <Text style={s.btnCadastroTxt}>📧 Crear cuenta gratis y recibir alertas</Text>
      </TouchableOpacity>
      <Text style={s.hint}>Con cuenta, acceso ilimitado + notificaciones de nuevas plazas</Text>
    </View>
  );
}

// ── Tela principal ────────────────────────────────────────────────────────────
export default function NovedadesScreen() {
  const { user }              = useAuth();
  const nav                   = useNavigation();
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [desbloqueado, setDesbloqueado] = useState(false);
  const [adLoading, setAdLoading]       = useState(false);
  const [showCTA, setShowCTA]           = useState(false);
  const [horasRestantes, setHorasRestantes] = useState(0);
  const rewarded = useRef(null);

  // Verifica desbloqueio
  const checkUnlock = useCallback(async () => {
    if (user) { setDesbloqueado(true); return; }
    try {
      const ts = await AsyncStorage.getItem(UNLOCK_KEY);
      if (ts) {
        const diff = Date.now() - parseInt(ts);
        if (diff < UNLOCK_DURATION) {
          setDesbloqueado(true);
          setHorasRestantes(Math.ceil((UNLOCK_DURATION - diff) / 3600000));
          return;
        }
      }
    } catch {}
    setDesbloqueado(false);
  }, [user]);

  const carregar = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('convocatorias_activas')
        .select('*')
        .order('fecha_publicacion', { ascending: false })
        .limit(50);
      if (data) setItems(data);
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([checkUnlock(), carregar()]);
      setLoading(false);
    })();
  }, [user]);

  // Rewarded Ad
  useEffect(() => {
    const ad = RewardedAd.createForAdRequest(REWARDED_AD_ID, { requestNonPersonalizedAdsOnly: true });
    rewarded.current = ad;
    const u1 = ad.addAdEventListener(RewardedAdEventType.LOADED, () => setAdLoading(false));
    const u2 = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, async () => {
      await AsyncStorage.setItem(UNLOCK_KEY, Date.now().toString());
      setDesbloqueado(true);
      setHorasRestantes(24);
      setTimeout(() => setShowCTA(true), 800);
    });
    ad.load();
    return () => { u1(); u2(); };
  }, []);

  const assistirVideo = useCallback(async () => {
    if (!rewarded.current) return;
    setAdLoading(true);
    try {
      await rewarded.current.show();
    } catch {
      setAdLoading(false);
      Alert.alert('Anuncio no disponible', 'Intenta de nuevo en un momento.');
      rewarded.current?.load();
    }
  }, []);

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>📋 Novedades</Text>
        <Text style={s.headerSub}>Últimas convocatorias publicadas</Text>
        {desbloqueado && !user && (
          <View style={s.unlockedBadge}>
            <Text style={s.unlockedTxt}>🔓 Desbloqueado · {horasRestantes}h restantes</Text>
          </View>
        )}
      </View>

      {/* Lista borrada se não desbloqueado */}
      <View style={{ flex: 1 }}>
        <ScrollView
          style={[s.lista, !desbloqueado && { opacity: 0.15 }]}
          contentContainerStyle={s.listaContent}
          scrollEnabled={desbloqueado}
          pointerEvents={desbloqueado ? 'auto' : 'none'}
          refreshControl={
            desbloqueado
              ? <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await carregar(); setRefreshing(false); }} colors={[COLORS.primary]} />
              : undefined
          }
        >
          {items.length === 0
            ? <Text style={s.empty}>Sin convocatorias disponibles</Text>
            : items.map(item => <ConvCard key={item.id} item={item} />)}
        </ScrollView>

        {!desbloqueado && (
          <Paywall
            onVideo={assistirVideo}
            onCadastro={() => nav.navigate('Cadastro')}
            adLoading={adLoading}
          />
        )}
      </View>

      {/* Modal CTA pós-desbloqueio */}
      <Modal visible={showCTA} transparent animationType="slide">
        <View style={s.modalBg}>
          <View style={s.modalCard}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🎉</Text>
            <Text style={s.modalTitle}>¡Contenido desbloqueado!</Text>
            <Text style={s.modalSub}>
              Tienes acceso por 24 horas. Crea una cuenta gratis para acceso ilimitado y alertas de nuevas plazas.
            </Text>
            <TouchableOpacity style={s.modalBtnP} onPress={() => { setShowCTA(false); nav.navigate('Cadastro'); }}>
              <Text style={s.modalBtnPTxt}>📧 Crear cuenta gratis</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalBtnS} onPress={() => setShowCTA(false)}>
              <Text style={s.modalBtnSTxt}>Ahora no</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header:    { backgroundColor: '#fff', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
               borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  headerSub:   { fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  unlockedBadge: { marginTop: 8, backgroundColor: '#dcfce7', borderRadius: 8, paddingHorizontal: 10,
                   paddingVertical: 4, alignSelf: 'flex-start' },
  unlockedTxt: { fontSize: 12, color: '#16a34a', fontWeight: '700' },
  lista:       { flex: 1 },
  listaContent:{ padding: 16, paddingBottom: 140 },
  empty:       { textAlign: 'center', color: COLORS.textMuted, marginTop: 40 },
  card:        { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12,
                 shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8,
                 shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  areaTag:     { backgroundColor: COLORS.primary + '15', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  areaTagTxt:  { fontSize: 10, fontWeight: '800', color: COLORS.primary },
  diasBadge:   { backgroundColor: '#dbeafe', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  diasUrgente: { backgroundColor: '#fee2e2' },
  diasTxt:     { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  previsto:    { fontSize: 11, color: COLORS.textMuted },
  titulo:      { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  dep:         { fontSize: 13, color: COLORS.textMuted, marginBottom: 8 },
  cardFooter:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info:        { fontSize: 13, color: COLORS.textMuted },
  salario:     { fontSize: 14, fontWeight: '800', color: COLORS.success },
  // Paywall
  paywall:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                 justifyContent: 'center', alignItems: 'center',
                 backgroundColor: 'rgba(255,255,255,0.93)', padding: 28 },
  paywallIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary + '15',
                 justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  paywallTitle:{ fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 8, textAlign: 'center' },
  paywallSub:  { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginBottom: 28, lineHeight: 20 },
  btnVideo:    { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, width: '100%',
                 flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                 shadowColor: COLORS.primaryDark, shadowOpacity: 0.4, shadowRadius: 12,
                 shadowOffset: { width: 0, height: 4 }, elevation: 8 },
  btnVideoTxt: { color: '#fff', fontWeight: '900', fontSize: 16 },
  ou:          { color: COLORS.textMuted, fontSize: 13, marginVertical: 16 },
  btnCadastro: { borderWidth: 2, borderColor: COLORS.primary, borderRadius: 14,
                 paddingVertical: 14, width: '100%', alignItems: 'center' },
  btnCadastroTxt: { color: COLORS.primary, fontWeight: '800', fontSize: 14 },
  hint:        { fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 18 },
  // Modal
  modalBg:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard:   { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
                 padding: 28, paddingBottom: 40, alignItems: 'center' },
  modalTitle:  { fontSize: 22, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  modalSub:    { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalBtnP:   { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16,
                 width: '100%', alignItems: 'center', marginBottom: 12 },
  modalBtnPTxt:{ color: '#fff', fontWeight: '900', fontSize: 16 },
  modalBtnS:   { paddingVertical: 12, width: '100%', alignItems: 'center' },
  modalBtnSTxt:{ color: COLORS.textMuted, fontSize: 14 },
});
