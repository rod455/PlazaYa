// src/screens/main/NovedadesScreen.js
// Paywall: deslogado vê conteúdo borrado + botão assistir vídeo rewarded (1x/dia)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert, Animated,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { ADMOB_IDS } from '../../constants/data';
import { COLORS } from '../../constants/colors';
import AdBanner from '../../components/AdBanner';

const REWARDED_AD_ID = ADMOB_IDS.REWARDED;
const UNLOCK_KEY      = 'novedades_unlock_ts';
const UNLOCK_DURATION = 24 * 60 * 60 * 1000;

const AREA_EMOJI = {
  policia:'👮', juridico:'⚖️', saude:'🏥', fiscal:'📋',
  ti:'💻', administrativo:'🏛️', educacion:'📚',
};

function ConvCard({ item, blurred }) {
  const nav = useNavigation();
  const dias = item.fecha_cierre
    ? Math.max(0, Math.ceil((new Date(item.fecha_cierre) - new Date()) / 86400000))
    : null;
  return (
    <TouchableOpacity
      style={[s.card, blurred && s.cardBlurred]}
      onPress={() => !blurred && nav.navigate('Convocatoria', { convocatoria: item })}
      activeOpacity={blurred ? 1 : 0.8}
    >
      <View style={s.cardHeader}>
        <View style={s.areaTag}>
          <Text style={s.areaTagTxt}>{AREA_EMOJI[item.area] ?? '🏛️'} {(item.area ?? 'admin').toUpperCase()}</Text>
        </View>
        {dias !== null
          ? <View style={[s.diasBadge, dias <= 7 && s.diasUrgente]}>
              <Text style={s.diasTxt}>{dias === 0 ? 'Hoy' : `${dias}d`}</Text>
            </View>
          : <Text style={s.previsto}>📅 Próxima</Text>}
      </View>
      <Text style={s.titulo} numberOfLines={2}>{item.titulo}</Text>
      <Text style={s.dep} numberOfLines={1}>🏛 {item.dependencia ?? 'Gobierno Federal'}</Text>
      <View style={s.cardFooter}>
        {item.num_plazas ? <Text style={s.info}>👥 {item.num_plazas} plazas</Text> : null}
        {item.salario_min ? <Text style={s.info}>💰 ${Number(item.salario_min).toLocaleString('es-MX')}</Text> : null}
        {item.estado ? <Text style={s.info}>📍 {item.estado}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

export default function NovedadesScreen() {
  const { user } = useAuth();
  const [convs, setConvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [adReady, setAdReady] = useState(false);
  const [showingAd, setShowingAd] = useState(false);
  const rewardGanhoRef = useRef(false);

  const rewardedAd = useRef(
    RewardedAd.createForAdRequest(REWARDED_AD_ID, {
      keywords: ['empleo gobierno', 'convocatoria', 'plaza gobierno', 'servicio profesional'],
      requestNonPersonalizedAdsOnly: false,
    })
  ).current;

  useEffect(() => { checkUnlock(); loadConvocatorias(); setupAd(); }, []);

  async function checkUnlock() {
    if (user) { setUnlocked(true); return; }
    const ts = await AsyncStorage.getItem(UNLOCK_KEY);
    if (ts && Date.now() - parseInt(ts) < UNLOCK_DURATION) setUnlocked(true);
  }

  async function loadConvocatorias() {
    try {
      const { data, error } = await supabase
        .from('convocatorias_activas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) setConvs(data);
    } catch (e) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function setupAd() {
    const unsubLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => setAdReady(true));
    const unsubEarned = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      rewardGanhoRef.current = true;
    });
    const unsubClosed = rewardedAd.addAdEventListener('closed', async () => {
      setShowingAd(false);
      if (rewardGanhoRef.current) {
        await AsyncStorage.setItem(UNLOCK_KEY, Date.now().toString());
        setUnlocked(true);
        rewardGanhoRef.current = false;
      }
      setAdReady(false);
      rewardedAd.load();
    });
    rewardedAd.load();
    return () => { unsubLoaded(); unsubEarned(); unsubClosed(); };
  }

  async function handleWatchAd() {
    if (!adReady) return;
    setShowingAd(true);
    rewardGanhoRef.current = false;
    try { await rewardedAd.show(); } catch (e) { setShowingAd(false); Alert.alert('Error', 'No se pudo mostrar el anuncio.'); }
  }

  const isLocked = !unlocked && !user;

  return (
    <View style={s.safe}>
      <AdBanner />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadConvocatorias(); }} />}
      >
        <Text style={s.header}>📋 Novedades</Text>
        <Text style={s.sub}>Últimas convocatorias publicadas</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="large" style={{ marginTop: 30 }} />
        ) : convs.length === 0 ? (
          <Text style={s.empty}>No hay novedades por ahora. Jala para actualizar.</Text>
        ) : (
          convs.map((c, i) => (
            <ConvCard key={c.id || i} item={c} blurred={isLocked && i >= 3} />
          ))
        )}

        {/* Paywall */}
        {isLocked && convs.length > 3 && (
          <View style={s.paywall}>
            <Text style={s.paywallEmoji}>🔒</Text>
            <Text style={s.paywallTitle}>Desbloquea todas las convocatorias</Text>
            <Text style={s.paywallSub}>Mira un video corto para ver todas las novedades por 24 horas</Text>
            <TouchableOpacity
              style={[s.paywallBtn, !adReady && { opacity: 0.5 }]}
              onPress={handleWatchAd}
              disabled={!adReady || showingAd}
              activeOpacity={0.85}
            >
              <Text style={s.paywallBtnTxt}>{adReady ? '▶ Ver video y desbloquear' : 'Cargando anuncio...'}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1 },
  content: { padding: 16 },
  header: { fontSize: 24, fontWeight: '900', color: COLORS.primary, marginBottom: 4 },
  sub: { fontSize: 14, color: COLORS.textMuted, marginBottom: 16 },
  empty: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', marginTop: 30 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, elevation: 1 },
  cardBlurred: { opacity: 0.4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  areaTag: { backgroundColor: COLORS.primary + '15', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  areaTagTxt: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  diasBadge: { backgroundColor: COLORS.gold, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  diasUrgente: { backgroundColor: COLORS.danger },
  diasTxt: { fontSize: 11, fontWeight: '800', color: '#fff' },
  previsto: { fontSize: 12, color: COLORS.textMuted },
  titulo: { fontSize: 15, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  dep: { fontSize: 13, color: COLORS.textMuted, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  info: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  paywall: { alignItems: 'center', padding: 24, backgroundColor: '#fff', borderRadius: 16, marginTop: 8, elevation: 2 },
  paywallEmoji: { fontSize: 40, marginBottom: 8 },
  paywallTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, textAlign: 'center', marginBottom: 6 },
  paywallSub: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginBottom: 16, lineHeight: 19 },
  paywallBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28, elevation: 3 },
  paywallBtnTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
