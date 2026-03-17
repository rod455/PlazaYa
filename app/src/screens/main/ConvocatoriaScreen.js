// src/screens/main/ConvocatoriaScreen.js
// Abre a vaga em WebView dentro do app + botão DOF para confirmação oficial

import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
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

  // ── Abrir DOF externo ────────────────────────────────────────────────────
  function abrirDOF() {
    const urlDof = convocatoria.url_dof || 'https://www.dof.gob.mx/vacantes.php';
    Alert.alert(
      '📋 Confirmar en DOF',
      'Serás redirigido al Diario Oficial de la Federación para verificar la información oficial de esta convocatoria.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir DOF', onPress: () => Linking.openURL(urlDof) },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.btnBack} onPress={() => navigation.goBack()}>
          <Text style={styles.btnBackTxt}>← Volver</Text>
        </TouchableOpacity>

        {canGoBack && (
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

        {/* Botão DOF */}
        <TouchableOpacity style={styles.btnDOF} onPress={abrirDOF}>
          <Text style={styles.btnDOFTxt}>📋 Confirmar información en DOF oficial</Text>
        </TouchableOpacity>
      </View>

      {/* ── WebView — abre a vaga diretamente ──────────────────────────── */}
      <View style={styles.webviewWrap}>
        {loading && !erro && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingTxt}>Cargando convocatoria...</Text>
          </View>
        )}

        {erro ? (
          <View style={styles.erroBox}>
            <Text style={styles.erroEmoji}>😕</Text>
            <Text style={styles.erroTxt}>No se pudo cargar la convocatoria</Text>
            <TouchableOpacity
              style={styles.btnAbrirExterno}
              onPress={() => Linking.openURL(convocatoria.url_vaga)}
            >
              <Text style={styles.btnAbrirExternoTxt}>Abrir en navegador →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={webviewRef}
            source={{ uri: convocatoria.url_vaga }}
            style={styles.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => { setLoading(false); setErro(true); }}
            onNavigationStateChange={state => setCanGoBack(state.canGoBack)}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
            // Bloqueia popups externos
            onShouldStartLoadWithRequest={request => {
              // Permite navegação dentro do mesmo domínio
              const origem = new URL(convocatoria.url_vaga).hostname;
              try {
                const destino = new URL(request.url).hostname;
                if (destino === origem || destino.endsWith('.gob.mx')) return true;
                // Abre links externos no navegador
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

  btnDOF:       { marginTop: 10, backgroundColor: '#fef9c3', borderRadius: 10,
                  padding: 10, alignItems: 'center',
                  borderWidth: 1, borderColor: '#fde047' },
  btnDOFTxt:    { fontSize: 13, color: '#854d0e', fontWeight: '700' },

  // WebView
  webviewWrap:  { flex: 1 },
  webview:      { flex: 1 },
  loadingOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor: '#f9fafb',
                   alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  loadingTxt:   { marginTop: 12, color: '#6b7280', fontSize: 14 },

  erroBox:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  erroEmoji:    { fontSize: 48, marginBottom: 12 },
  erroTxt:      { fontSize: 16, color: '#374151', textAlign: 'center', marginBottom: 24 },
  btnAbrirExterno:{ backgroundColor: COLORS.primary, borderRadius: 12,
                    paddingVertical: 14, paddingHorizontal: 28 },
  btnAbrirExternoTxt:{ color: '#fff', fontWeight: '800', fontSize: 15 },
});
