// src/screens/main/HomeScreen.js
// Tela principal — lista convocatórias do México filtradas por perfil

import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator, RefreshControl,
  ScrollView, TouchableOpacity, Linking, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import { useQuiz } from '../../context/QuizContext';
import { useAuth } from '../../context/AuthContext';
import { SALARIO_OPTIONS, ESTADOS_MEXICO, ADMOB_IDS } from '../../constants/data';
import { COLORS } from '../../constants/colors';

// ─── Ad Rewarded para abrir links ────────────────────────────────────────────
const rewardedAd = RewardedAd.createForAdRequest(ADMOB_IDS.REWARDED, {
  keywords: ['oposicion mexico', 'gobierno', 'servidor publico'],
});

// ─── Dados mock de convocatórias por estado ──────────────────────────────────
// Substitua por API real quando disponível
const MOCK_MX = {
  CMX: [
    { titulo: 'CDMX — Oficial de Policía', vagas: '1500', salario: 15000, fim: '20/04/2026', previsto: false, link: 'https://www.ssp.cdmx.gob.mx' },
    { titulo: 'Poder Judicial CDMX — Oficial Judicial', vagas: '80', salario: 18000, fim: '10/05/2026', previsto: false, link: null },
    { titulo: 'Secretaría de Salud CDMX — Médico General', vagas: '200', salario: 32000, fim: null, previsto: true, link: null },
    { titulo: 'SAT — Auditor Fiscal Federal', vagas: '120', salario: 28000, fim: '30/04/2026', previsto: false, link: 'https://www.sat.gob.mx' },
  ],
  JAL: [
    { titulo: 'Guardia Nacional — Elemento Operativo Jalisco', vagas: '400', salario: 15000, fim: '25/04/2026', previsto: false, link: null },
    { titulo: 'IMSS Jalisco — Enfermero General', vagas: '150', salario: 22000, fim: '15/05/2026', previsto: false, link: null },
    { titulo: 'Poder Judicial de Jalisco — Actuario', vagas: '40', salario: 20000, fim: null, previsto: true, link: null },
  ],
  NLE: [
    { titulo: 'Fuerza Civil NL — Agente', vagas: '500', salario: 14000, fim: '18/04/2026', previsto: false, link: null },
    { titulo: 'IMSS NL — Médico Especialista', vagas: '80', salario: 45000, fim: '05/05/2026', previsto: false, link: null },
    { titulo: 'SAT Monterrey — Inspector Fiscal', vagas: '60', salario: 25000, fim: null, previsto: true, link: null },
  ],
  MEX: [
    { titulo: 'Edomex — Agente de Tránsito', vagas: '300', salario: 12000, fim: '22/04/2026', previsto: false, link: null },
    { titulo: 'ISSEMYM — Trabajador Social', vagas: '90', salario: 18000, fim: '12/05/2026', previsto: false, link: null },
    { titulo: 'Poder Judicial Edomex — Oficial Judicial', vagas: '60', salario: 19000, fim: null, previsto: true, link: null },
  ],
  PUE: [
    { titulo: 'Secretaría de Seguridad Puebla — Policía', vagas: '600', salario: 13000, fim: '20/04/2026', previsto: false, link: null },
    { titulo: 'IMSS Puebla — Médico General', vagas: '100', salario: 30000, fim: '08/05/2026', previsto: false, link: null },
  ],
  // Fallback para outros estados
  DEFAULT: [
    { titulo: 'SAT — Administrador Local de Servicios al Contribuyente', vagas: '200', salario: 25000, fim: '30/04/2026', previsto: false, link: 'https://www.sat.gob.mx' },
    { titulo: 'IMSS — Médico General (Nacional)', vagas: '1000', salario: 32000, fim: '15/05/2026', previsto: false, link: 'https://www.imss.gob.mx' },
    { titulo: 'Guardia Nacional — Elemento Operativo', vagas: '2000', salario: 15000, fim: '20/04/2026', previsto: false, link: null },
    { titulo: 'Poder Judicial de la Federación — Actuario', vagas: '150', salario: 22000, fim: null, previsto: true, link: null },
    { titulo: 'SRE — Oficial de Cancillería', vagas: '80', salario: 35000, fim: null, previsto: true, link: null },
    { titulo: 'SEP — Docente Frente a Grupo', vagas: '3000', salario: 12000, fim: null, previsto: true, link: null },
  ],
};

function getConvocatorias(estado) {
  const data = MOCK_MX[estado] ?? MOCK_MX.DEFAULT;
  return [...data].sort((a, b) => (b.salario || 0) - (a.salario || 0));
}

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
        <Text style={styles.disclaimerIcon}>ℹ️</Text>
        <Text style={styles.disclaimerTitle}>App independiente — no oficial</Text>
        <Text style={styles.disclaimerChevron}>{expanded ? '▲' : '▼'}</Text>
      </View>
      {expanded && (
        <Text style={styles.disclaimerBody}>
          Esta aplicación es independiente y{' '}
          <Text style={styles.bold}>no tiene ningún vínculo con el gobierno de México ni con organismos oficiales</Text>.
          La información es recopilada de fuentes públicas. Confirma siempre los datos en los sitios oficiales antes de inscribirte.
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Card de convocatória ────────────────────────────────────────────────────
function ConvocatoriaCard({ item, onPress }) {
  const salarioFmt = item.salario
    ? `$${item.salario.toLocaleString('es-MX')} MXN`
    : null;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.8}>
      <View style={styles.cardTop}>
        <Text style={styles.cardTitulo} numberOfLines={2}>{item.titulo}</Text>
        {item.previsto
          ? <View style={styles.badgePrevisto}><Text style={styles.badgePrevistoTxt}>Previsto</Text></View>
          : item.fim
            ? <View style={styles.badgePrazo}><Text style={styles.badgePrazoTxt}>📅 {item.fim}</Text></View>
            : null
        }
      </View>
      <View style={styles.cardBottom}>
        {item.vagas && <Text style={styles.cardVagas}>👥 {item.vagas} plazas</Text>}
        {salarioFmt && <Text style={styles.cardSalario}>💰 {salarioFmt}</Text>}
      </View>
    </TouchableOpacity>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { answers } = useQuiz();
  const { user } = useAuth();
  const navigation = useNavigation();

  const estadoSel   = answers.estado || 'CMX';
  const salarioOpt  = SALARIO_OPTIONS?.find(s => s.id === answers.salario);
  const estadoNome  = ESTADOS_MEXICO?.find(e => e.uf === estadoSel)?.nome || estadoSel;

  const [lista,      setLista]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adReady,    setAdReady]    = useState(false);
  const pendingLink  = useRef(null);

  // ── Ad Rewarded ──────────────────────────────────────────────────────────
  useEffect(() => {
    const unsubLoaded = rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => setAdReady(true));
    const unsubEarned = rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      if (pendingLink.current) {
        Linking.openURL(pendingLink.current).catch(() => {});
        pendingLink.current = null;
      }
    });
    const unsubClosed = rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      setAdReady(false);
      rewardedAd.load();
    });
    const unsubError = rewardedAd.addAdEventListener(AdEventType.ERROR, () => {
      if (pendingLink.current) {
        Linking.openURL(pendingLink.current).catch(() => {});
        pendingLink.current = null;
      }
      setAdReady(false);
      rewardedAd.load();
    });
    rewardedAd.load();
    return () => { unsubLoaded(); unsubEarned(); unsubClosed(); unsubError(); };
  }, []);

  // ── Carrega convocatórias ──────────────────────────────────────────────────
  useEffect(() => { carregar(); }, [estadoSel, answers.salario]);

  function carregar() {
    setLoading(true);
    const dados = getConvocatorias(estadoSel);
    const salMin = salarioOpt?.min ?? 0;
    const filtrado = salMin > 0 ? dados.filter(c => !c.salario || c.salario >= salMin) : dados;
    setLista(filtrado);
    setLoading(false);
  }

  function onRefresh() {
    setRefreshing(true);
    carregar();
    setRefreshing(false);
  }

  function handlePressCard(item) {
    if (!item.link) return;
    pendingLink.current = item.link;
    if (adReady) {
      rewardedAd.show();
    } else {
      Linking.openURL(item.link).catch(() => {});
      pendingLink.current = null;
    }
  }

  const abertasHoje  = lista.filter(c => !c.previsto);
  const previstasHoje = lista.filter(c => c.previsto);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitulo}>🏛️ Concursos México</Text>
            <Text style={styles.headerSub}>
              📍 {estadoNome}
              {salarioOpt ? `  ·  💰 ${salarioOpt.label}` : ''}
            </Text>
          </View>
          {user && (
            <View style={styles.badgeUser}>
              <Text style={styles.badgeUserTxt}>✅ Pro</Text>
            </View>
          )}
        </View>

        <DisclaimerBanner />

        {/* CTA Estudar (se não logado) */}
        {!user && (
          <TouchableOpacity
            style={styles.ctaEstudar}
            onPress={() => navigation.navigate('Auth')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaEstudarTxt}>📚 Crea tu cuenta para estudiar gratis →</Text>
          </TouchableOpacity>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 60 }} />
        ) : (
          <>
            {/* Convocatórias abertas */}
            {abertasHoje.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  🟢 Convocatorias abiertas ({abertasHoje.length})
                </Text>
                {abertasHoje.map((item, i) => (
                  <ConvocatoriaCard key={i} item={item} onPress={handlePressCard} />
                ))}
              </>
            )}

            {/* Previstas */}
            {previstasHoje.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>
                  🔜 Previstas ({previstasHoje.length})
                </Text>
                {previstasHoje.map((item, i) => (
                  <ConvocatoriaCard key={i} item={item} onPress={handlePressCard} />
                ))}
              </>
            )}

            {lista.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTxt}>No encontramos convocatorias{'\n'}con estos filtros</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#f9fafb' },

  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  padding: 20, paddingBottom: 12 },
  headerTitulo: { fontSize: 20, fontWeight: '900', color: '#111827' },
  headerSub:    { fontSize: 13, color: '#6b7280', marginTop: 2 },
  badgeUser:    { backgroundColor: '#d1fae5', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeUserTxt: { fontSize: 12, color: '#065f46', fontWeight: '700' },

  disclaimer:     { backgroundColor: '#FFF8E1', margin: 12, borderRadius: 12, padding: 12,
                    borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  disclaimerRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  disclaimerIcon: { fontSize: 16 },
  disclaimerTitle:{ flex: 1, fontSize: 13, fontWeight: '700', color: '#92400e' },
  disclaimerChevron:{ fontSize: 12, color: '#92400e' },
  disclaimerBody: { fontSize: 13, color: '#78350f', marginTop: 8, lineHeight: 19 },
  bold:           { fontWeight: '800' },

  ctaEstudar:     { backgroundColor: COLORS.primary, marginHorizontal: 12, borderRadius: 12,
                    padding: 14, alignItems: 'center', marginBottom: 4 },
  ctaEstudarTxt:  { color: '#fff', fontWeight: '700', fontSize: 14 },

  sectionTitle:   { fontSize: 15, fontWeight: '800', color: '#111827',
                    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },

  card:           { backgroundColor: '#fff', marginHorizontal: 12, borderRadius: 14,
                    padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e5e7eb',
                    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardTop:        { marginBottom: 10 },
  cardTitulo:     { fontSize: 15, fontWeight: '800', color: '#111827', lineHeight: 21, marginBottom: 6 },
  badgePrevisto:  { alignSelf: 'flex-start', backgroundColor: '#fef9c3', borderRadius: 6,
                    paddingHorizontal: 8, paddingVertical: 3 },
  badgePrevistoTxt:{ fontSize: 11, color: '#854d0e', fontWeight: '700' },
  badgePrazo:     { alignSelf: 'flex-start', backgroundColor: '#dcfce7', borderRadius: 6,
                    paddingHorizontal: 8, paddingVertical: 3 },
  badgePrazoTxt:  { fontSize: 11, color: '#166534', fontWeight: '700' },
  cardBottom:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardVagas:      { fontSize: 13, color: '#6b7280' },
  cardSalario:    { fontSize: 13, fontWeight: '800', color: '#16a34a' },

  emptyBox:       { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji:     { fontSize: 48, marginBottom: 12 },
  emptyTxt:       { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
});
