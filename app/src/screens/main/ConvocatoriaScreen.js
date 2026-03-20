// src/screens/main/ConvocatoriaScreen.js
// Detalhe da convocatória — WebView para abrir o link da vaga

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { COLORS } from '../../constants/colors';

export default function ConvocatoriaScreen({ navigation, route }) {
  const { convocatoria } = route.params;
  const [loading, setLoading] = useState(true);

  const url = convocatoria?.url_vaga || convocatoria?.link || convocatoria?.url;

  async function handleShare() {
    try {
      await Share.share({
        message: `${convocatoria.titulo}\n\n${url}\n\nVía PlazaYa`,
      });
    } catch (e) {}
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>← Volver</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={handleShare} style={s.shareBtn}>
          <Text style={s.shareTxt}>📤</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => url && Linking.openURL(url)} style={s.externalBtn}>
          <Text style={s.externalTxt}>🌐</Text>
        </TouchableOpacity>
      </View>

      {/* Info card */}
      <View style={s.infoCard}>
        <Text style={s.titulo} numberOfLines={2}>{convocatoria.titulo}</Text>
        {convocatoria.dependencia && (
          <Text style={s.dep}>🏛 {convocatoria.dependencia}</Text>
        )}
        <View style={s.infoRow}>
          {convocatoria.salario_min && (
            <Text style={s.infoBadge}>💰 ${Number(convocatoria.salario_min).toLocaleString('es-MX')} MXN</Text>
          )}
          {convocatoria.num_plazas && (
            <Text style={s.infoBadge}>👥 {convocatoria.num_plazas} plazas</Text>
          )}
          {convocatoria.estado && (
            <Text style={s.infoBadge}>📍 {convocatoria.estado}</Text>
          )}
        </View>
      </View>

      {/* WebView */}
      {url ? (
        <View style={{ flex: 1 }}>
          {loading && (
            <View style={s.loadingOverlay}>
              <ActivityIndicator color={COLORS.primary} size="large" />
              <Text style={s.loadingTxt}>Cargando convocatoria...</Text>
            </View>
          )}
          <WebView
            source={{ uri: url }}
            onLoadEnd={() => setLoading(false)}
            style={{ flex: 1 }}
            startInLoadingState
          />
        </View>
      ) : (
        <View style={s.noUrl}>
          <Text style={s.noUrlEmoji}>📄</Text>
          <Text style={s.noUrlTxt}>No hay enlace disponible para esta convocatoria.</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, backgroundColor: COLORS.primary,
  },
  backBtn: { padding: 6 },
  backTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  shareBtn: { padding: 8 },
  shareTxt: { fontSize: 20 },
  externalBtn: { padding: 8 },
  externalTxt: { fontSize: 20 },
  infoCard: {
    backgroundColor: '#fff', padding: 14, borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  titulo: { fontSize: 16, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  dep: { fontSize: 13, color: COLORS.textMuted, marginBottom: 8 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoBadge: { fontSize: 12, color: COLORS.primary, fontWeight: '600', backgroundColor: COLORS.primary + '10', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg, zIndex: 10 },
  loadingTxt: { color: COLORS.textMuted, fontSize: 14, marginTop: 10 },
  noUrl: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  noUrlEmoji: { fontSize: 48, marginBottom: 12 },
  noUrlTxt: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center' },
});
