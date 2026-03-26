// src/screens/main/ConvocatoriaScreen.js
// Abre a vaga em WebView dentro do app + botão DOF para confirmação oficial
// ✅ FIX v1.1: Fallback robusto — quando o WebView falha, mostra os dados da vaga inline

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Linking, SafeAreaView,
  Share, Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { COLORS } from '../../constants/colors';

export default function ConvocatoriaScreen({ route, navigation }) {
  const { convocatoria } = route.params;
  const webviewRef = useRef(null);

  const [loading,   setLoading]   = useState(true);
  const [erro,      setErro]      = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);

  // ── Formata salário ──────────────────────────────────────────────────────
  function formatSalario() {
    if (!convocatoria.salario_min && !convocatoria.salario_max) return 'Salario a convenir';
    if (convocatoria.salario_min && convocatoria.salario_max) {
      return `$${Number(convocatoria.salario_min).toLocaleString('es-MX')} — $${Number(convocatoria.salario_max).toLocaleString('es-MX')} MXN`;
    }
    return `$${Number(convocatoria.salario_min || convocatoria.salario_max).toLocaleString('es-MX')} MXN`;
  }

  // ── Dias restantes ───────────────────────────────────────────────────────
  function diasRestantes() {
    if (!convocatoria.fecha_cierre) return null;
    const dias = Math.max(0, Math.floor(
      (new Date(convocatoria.fecha_cierre).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ));
    return dias;
  }

  const dias = diasRestantes();

  // ── Compartilhar ─────────────────────────────────────────────────────────
  async function compartilhar() {
    await Share.share({
      message: `🏛️ ${convocatoria.titulo}\n${convocatoria.dependencia ?? ''}\n💰 ${formatSalario()}\n\nVer convocatoria: ${convocatoria.url_vaga}`,
      url: convocatoria.url_vaga,
    });
  }

  // ── Abrir en navegador externo ───────────────────────────────────────────
  function abrirExterno() {
    Linking.openURL(convocatoria.url_vaga).catch(() => {
      Alert.alert('Error', 'No se pudo abrir el enlace.');
    });
  }

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.btnBack} onPress={() => navigation.goBack()}>
          <Text style={styles.btnBackTxt}>← Volver</Text>
        </TouchableOpacity>

        {canGoBack && !erro && (
          <TouchableOpacity
            style={styles.btnNavBack}
            onPress={() => webviewRef.current?.goBack()}
          >
            <Text style={styles.btnNavBackTxt}>◀</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.btnShare} onPress={compartilhar}>
          <Text style={styles.btnShareTxt}>⬆️</Text>
        </TouchableOpacity>
      </View>

      {/* ── Info card ──────────────────────────────────────────────────── */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitulo} numberOfLines={2}>{convocatoria.titulo}</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoDep}>🏛️ {convocatoria.dependencia ?? 'Gobierno'}</Text>
          {convocatoria.estado && convocatoria.estado !== 'FEDERAL' && (
            <Text style={styles.infoEstado}>📍 {convocatoria.estado}</Text>
          )}
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoSalario}>💰 {formatSalario()}</Text>
        </View>

        <View style={styles.infoRow}>
          {dias !== null && (
            <View style={[styles.badge, dias <= 7 ? styles.badgeUrgente : styles.badgeNormal]}>
              <Text style={styles.badgeTxt}>
                {dias === 0 ? '⚠️ Cierra hoy' : `📅 ${dias} días restantes`}
              </Text>
            </View>
          )}
          {!convocatoria.fecha_cierre && (
            <View style={styles.badgeSinFecha}>
              <Text style={styles.badgeTxt}>📅 Sin fecha definida</Text>
            </View>
          )}
          {convocatoria.num_plazas && (
            <View style={styles.badgePlazas}>
              <Text style={styles.badgeTxt}>👥 {convocatoria.num_plazas} plazas</Text>
            </View>
          )}
        </View>
      </View>

      {/* ── WebView ou Fallback ──────────────────────────────────────── */}
      <View style={styles.webviewWrap}>
        {loading && !erro && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingTxt}>Cargando convocatoria...</Text>
          </View>
        )}

        {erro ? (
          /* ✅ FIX: Fallback robusto — mostra dados da vaga quando WebView falha */
          <ScrollView style={styles.fallbackScroll} contentContainerStyle={styles.fallbackContent}>
            <View style={styles.fallbackNotice}>
              <Text style={styles.fallbackNoticeIcon}>ℹ️</Text>
              <Text style={styles.fallbackNoticeTxt}>
                No fue posible cargar la página oficial. A continuación se muestra la información recopilada de esta convocatoria.
              </Text>
            </View>

            {/* Descripción completa */}
            {convocatoria.descripcion ? (
              <View style={styles.fallbackSection}>
                <Text style={styles.fallbackLabel}>Descripción</Text>
                <Text style={styles.fallbackText}>{convocatoria.descripcion}</Text>
              </View>
            ) : null}

            {/* Detalles */}
            <View style={styles.fallbackSection}>
              <Text style={styles.fallbackLabel}>Detalles</Text>
              {convocatoria.dependencia && (
                <Text style={styles.fallbackDetail}>🏛️ Dependencia: {convocatoria.dependencia}</Text>
              )}
              {convocatoria.area && (
                <Text style={styles.fallbackDetail}>📋 Área: {convocatoria.area}</Text>
              )}
              {convocatoria.nivel_puesto && (
                <Text style={styles.fallbackDetail}>📊 Nivel: {convocatoria.nivel_puesto}</Text>
              )}
              {convocatoria.escolaridad && (
                <Text style={styles.fallbackDetail}>🎓 Escolaridad: {convocatoria.escolaridad}</Text>
              )}
              {convocatoria.estado && (
                <Text style={styles.fallbackDetail}>📍 Ubicación: {convocatoria.estado === 'FEDERAL' ? 'Federal' : convocatoria.estado}</Text>
              )}
              {convocatoria.fecha_publicacion && (
                <Text style={styles.fallbackDetail}>
                  📅 Publicación: {new Date(convocatoria.fecha_publicacion).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              )}
              {convocatoria.fecha_cierre && (
                <Text style={styles.fallbackDetail}>
                  🔴 Cierre: {new Date(convocatoria.fecha_cierre).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              )}
            </View>

            {/* Botón para abrir en navegador */}
            <TouchableOpacity style={styles.btnAbrirExterno} onPress={abrirExterno}>
              <Text style={styles.btnAbrirExternoTxt}>🌐 Abrir en navegador externo</Text>
            </TouchableOpacity>

            {/* Aviso */}
            <Text style={styles.fallbackAviso}>
              La información proviene de fuentes gubernamentales públicas (dof.gob.mx, trabajaen.gob.mx, gob.mx/spc). Confirma siempre los datos en el sitio oficial de la dependencia convocante.
            </Text>
          </ScrollView>
        ) : (
          <WebView
            ref={webviewRef}
            source={{ uri: convocatoria.url_vaga }}
            style={styles.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => { setLoading(false); setErro(true); }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              // Se retornar 4xx ou 5xx, mostrar fallback
              if (nativeEvent.statusCode >= 400) {
                setLoading(false);
                setErro(true);
              }
            }}
            onNavigationStateChange={state => setCanGoBack(state.canGoBack)}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
            onShouldStartLoadWithRequest={request => {
              const origem = new URL(convocatoria.url_vaga).hostname;
              try {
                const destino = new URL(request.url).hostname;
                if (destino === origem || destino.endsWith('.gob.mx')) return true;
                Linking.openURL(request.url);
                return false;
              } catch {
                return true;
              }
            }}
          />
        )}
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#f9fafb' },

  // Header
  header:       { flexDirection: 'row', alignItems: 'center', padding: 12,
                  backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  btnBack:      { paddingVertical: 6, paddingRight: 12 },
  btnBackTxt:   { color: COLORS.primary, fontWeight: '700', fontSize: 15 },
  btnNavBack:   { paddingHorizontal: 10, paddingVertical: 6 },
  btnNavBackTxt:{ color: COLORS.gray, fontSize: 18 },
  btnShare:     { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 6 },
  btnShareTxt:  { fontSize: 20 },

  // Info card
  infoCard:     { backgroundColor: '#fff', padding: 16,
                  borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  infoTitulo:   { fontSize: 16, fontWeight: '900', color: '#111827', marginBottom: 8 },
  infoRow:      { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  infoDep:      { fontSize: 13, color: '#374151', fontWeight: '600' },
  infoEstado:   { fontSize: 13, color: '#374151' },
  infoSalario:  { fontSize: 14, fontWeight: '800', color: '#16a34a' },

  badge:        { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeNormal:  { backgroundColor: '#dcfce7' },
  badgeUrgente: { backgroundColor: '#fee2e2' },
  badgeSinFecha:{ backgroundColor: '#f3f4f6', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgePlazas:  { backgroundColor: '#eff6ff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeTxt:     { fontSize: 12, fontWeight: '700', color: '#374151' },

  // WebView
  webviewWrap:  { flex: 1 },
  webview:      { flex: 1 },
  loadingOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor: '#f9fafb',
                   alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  loadingTxt:   { marginTop: 12, color: '#6b7280', fontSize: 14 },

  // ✅ FIX: Fallback robusto com dados da vaga
  fallbackScroll:  { flex: 1, backgroundColor: '#f9fafb' },
  fallbackContent: { padding: 20 },
  fallbackNotice:  { flexDirection: 'row', backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12,
                     borderLeftWidth: 4, borderLeftColor: '#f0a500', marginBottom: 20, gap: 8 },
  fallbackNoticeIcon: { fontSize: 16 },
  fallbackNoticeTxt:  { flex: 1, fontSize: 13, color: '#78350f', lineHeight: 19 },
  fallbackSection: { marginBottom: 20 },
  fallbackLabel:   { fontSize: 14, fontWeight: '800', color: '#111827', marginBottom: 8 },
  fallbackText:    { fontSize: 14, color: '#374151', lineHeight: 22 },
  fallbackDetail:  { fontSize: 13, color: '#374151', lineHeight: 22, marginBottom: 4 },
  btnAbrirExterno: { backgroundColor: COLORS.primary, borderRadius: 12,
                     paddingVertical: 14, alignItems: 'center', marginBottom: 20 },
  btnAbrirExternoTxt:{ color: '#fff', fontWeight: '800', fontSize: 15 },
  fallbackAviso:   { fontSize: 11, color: '#9ca3af', textAlign: 'center', lineHeight: 17 },
});
