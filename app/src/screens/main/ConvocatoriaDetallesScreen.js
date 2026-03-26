// src/screens/main/ConvocatoriaDetallesScreen.js
// Pantalla de detalles de la convocatoria
import React, { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import AdBanner from '../../components/AdBanner';
import { ADMOB_IDS } from '../../constants/data';
import { corrigirSalario, formatarSalario } from '../../utils/salarioUtils';

const inscricaoInterstitial = InterstitialAd.createForAdRequest(ADMOB_IDS.INTERSTITIAL, {
  keywords: ['empleo gobierno', 'convocatoria publica', 'curso preparacion', 'oposiciones'],
});

export default function ConvocatoriaDetallesScreen({ route, navigation }) {
  const concurso = route.params?.concurso;
  const [adReady, setAdReady] = useState(false);

  useEffect(() => {
    if (!concurso) return;
    (async () => {
      try {
        const prev = parseInt(await AsyncStorage.getItem('@plazaya:concursos_viewed')) || 0;
        await AsyncStorage.setItem('@plazaya:concursos_viewed', String(prev + 1));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const unsubLoaded = inscricaoInterstitial.addAdEventListener(AdEventType.LOADED, () => setAdReady(true));
    const unsubClosed = inscricaoInterstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setAdReady(false); abrirLinkExterno(); inscricaoInterstitial.load();
    });
    const unsubError = inscricaoInterstitial.addAdEventListener(AdEventType.ERROR, () => {
      setAdReady(false); abrirLinkExterno();
    });
    inscricaoInterstitial.load();
    return () => { unsubLoaded(); unsubClosed(); unsubError(); };
  }, []);

  function abrirLinkExterno() {
    const url = concurso.url || concurso.link;
    if (url) {
      const finalUrl = url.startsWith('http') ? url : `https://${url}`;
      Linking.openURL(finalUrl).catch(() => Alert.alert('Error', 'No fue posible abrir el enlace.'));
    } else {
      Alert.alert('Enlace no disponible', 'El enlace de inscripción aún no está disponible para esta convocatoria.');
    }
  }

  async function handleInscribir() {
    if (adReady) {
      try { await inscricaoInterstitial.show(); } catch { abrirLinkExterno(); }
    } else { abrirLinkExterno(); }
  }

  if (!concurso) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F4F6F9' }}>
        <Text style={{ fontSize: 16, color: '#6B7280' }}>Convocatoria no encontrada.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16, padding: 12 }}>
          <Text style={{ color: '#FF8C40', fontWeight: '700', fontSize: 15 }}>← Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const salarioInfo = corrigirSalario(concurso.salario, concurso.titulo, concurso.area, concurso.nivel);
  const salarioFormatado = formatarSalario(salarioInfo);
  const orgao = concurso.orgao || concurso.titulo?.split(' - ')[0] || 'Dependencia no informada';
  const resumo = gerarResumo(concurso);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Detalles de la convocatoria</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>
            {concurso.fimInscricoes ? 'Inscripciones abiertas' : concurso.previsto ? 'Prevista' : 'Disponible'}
          </Text>
        </View>
        <Text style={styles.titulo}>{concurso.titulo}</Text>
        <Text style={styles.orgao}>{orgao}</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoEmoji}>💰</Text>
            <Text style={styles.infoLabel}>Salario</Text>
            <Text style={styles.infoValue}>{salarioFormatado}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoEmoji}>👥</Text>
            <Text style={styles.infoLabel}>Plazas</Text>
            <Text style={styles.infoValue}>{concurso.vagas || 'Varias'}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoEmoji}>📍</Text>
            <Text style={styles.infoLabel}>Estado</Text>
            <Text style={styles.infoValue}>{concurso.uf || 'Federal'}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoEmoji}>📅</Text>
            <Text style={styles.infoLabel}>Cierre</Text>
            <Text style={styles.infoValue}>{concurso.fimInscricoes || 'Por definir'}</Text>
          </View>
        </View>
        <View style={styles.resumoBox}>
          <Text style={styles.resumoTitulo}>Sobre la convocatoria</Text>
          <Text style={styles.resumoTexto}>{resumo}</Text>
        </View>
        {concurso.area && (
          <View style={styles.tagRow}>
            <View style={styles.tag}><Text style={styles.tagText}>🏛️ {formatarArea(concurso.area)}</Text></View>
            {concurso.nivel && <View style={styles.tag}><Text style={styles.tagText}>📚 {concurso.nivel}</Text></View>}
          </View>
        )}
        {concurso.fonte && <Text style={styles.fonteText}>📡 Fuente: {concurso.fonte}</Text>}
        <View style={{ marginVertical: 16 }}><AdBanner /></View>
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerTitle}>⚠️ Aviso importante</Text>
          <Text style={styles.disclaimer}>Esta aplicación es independiente y NO está afiliada con el gobierno de México ni con ninguna dependencia gubernamental. La información se recopila de fuentes públicas y puede contener imprecisiones. Confirma siempre los datos, requisitos y fechas en el sitio oficial de la dependencia convocante antes de postularte.</Text>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.inscreverBtn} onPress={handleInscribir} activeOpacity={0.85}>
          <Text style={styles.inscreverText}>Postularme a la convocatoria →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function formatarArea(area) {
  const map = { policia: 'Seguridad Pública', fiscal: 'Fiscal / SAT', juridico: 'Poder Judicial', saude: 'Salud', educacion: 'Educación', ti: 'Tecnología', administrativo: 'Administrativo', geral: 'General' };
  return map[area] || area;
}

function gerarResumo(c) {
  const orgao = c.orgao || c.titulo?.split(' - ')[0] || 'La dependencia';
  const partes = [`${orgao} tiene una convocatoria abierta.`];
  if (c.vagas) partes.push(`Son ${c.vagas} plazas disponibles.`);
  if (c.salario) partes.push(`Los salarios llegan a $${Number(c.salario).toLocaleString('es-MX')} MXN.`);
  if (c.fimInscricoes) partes.push(`Las inscripciones cierran el ${c.fimInscricoes}.`);
  else if (c.previsto) partes.push('La convocatoria aún no se ha publicado — prevista.');
  partes.push('¡No pierdas esta oportunidad! Revisa los requisitos en el sitio oficial y asegura tu postulación.');
  return partes.join(' ');
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6F9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { paddingVertical: 4, paddingRight: 8 },
  backText: { fontSize: 15, color: '#FF8C40', fontWeight: '700' },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#111827', flex: 1, textAlign: 'center' },
  scroll: { flex: 1 },
  content: { padding: 16 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  statusText: { fontSize: 12, fontWeight: '700', color: '#065F46' },
  titulo: { fontSize: 22, fontWeight: '900', color: '#111827', marginBottom: 4, lineHeight: 28 },
  orgao: { fontSize: 15, color: '#6B7280', marginBottom: 20, fontWeight: '600' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  infoCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, width: '47%', borderWidth: 1, borderColor: '#E5E7EB', elevation: 1 },
  infoEmoji: { fontSize: 24, marginBottom: 6 },
  infoLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 2 },
  resumoBox: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
  resumoTitulo: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 8 },
  resumoTexto: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  tag: { backgroundColor: '#ECFDF5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tagText: { fontSize: 12, color: '#FF8C40', fontWeight: '600' },
  fonteText: { fontSize: 12, color: '#9CA3AF', marginBottom: 8 },
  disclaimerBox: { backgroundColor: '#FFF8E1', borderRadius: 12, padding: 14, borderLeftWidth: 4, borderLeftColor: '#FF8C40', marginBottom: 8 },
  disclaimerTitle: { fontSize: 13, fontWeight: '800', color: '#92400E', marginBottom: 6 },
  disclaimer: { fontSize: 11, color: '#78350F', lineHeight: 17 },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#EAECF0' },
  inscreverBtn: { backgroundColor: '#10B981', paddingVertical: 16, borderRadius: 14, alignItems: 'center', elevation: 4 },
  inscreverText: { color: '#FFF', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },
});
