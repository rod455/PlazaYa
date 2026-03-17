// src/components/QuizLayout.js
// Layout padrão das telas de quiz de onboarding

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, StatusBar,
} from 'react-native';
import { COLORS } from '../constants/colors';

export default function QuizLayout({
  children,
  progress = 0,
  stepLabel,
  onNext,
  onBack,
  nextDisabled = false,
  nextLabel = 'Siguiente →',
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Barra de progresso */}
      <View style={styles.progressWrap}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        {stepLabel && <Text style={styles.stepLabel}>{stepLabel}</Text>}
      </View>

      {/* Conteúdo */}
      <View style={styles.content}>{children}</View>

      {/* Botões de navegação */}
      <View style={styles.footer}>
        {onBack ? (
          <TouchableOpacity style={styles.btnBack} onPress={onBack}>
            <Text style={styles.btnBackTxt}>← Atrás</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        <TouchableOpacity
          style={[styles.btnNext, nextDisabled && styles.btnNextDisabled]}
          onPress={onNext}
          disabled={nextDisabled}
          activeOpacity={0.85}
        >
          <Text style={styles.btnNextTxt}>{nextLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#fff' },

  progressWrap: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  progressBg:   { height: 6, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 6 },
  progressFill: { height: 6, backgroundColor: COLORS.primary, borderRadius: 4 },
  stepLabel:    { fontSize: 12, color: COLORS.gray, fontWeight: '600' },

  content:      { flex: 1, paddingHorizontal: 20, paddingTop: 8 },

  footer:       { flexDirection: 'row', alignItems: 'center', gap: 12,
                  paddingHorizontal: 20, paddingBottom: 24, paddingTop: 12,
                  borderTopWidth: 1, borderTopColor: '#f3f4f6' },

  btnBack:      { flex: 1, paddingVertical: 14, alignItems: 'center',
                  borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12 },
  btnBackTxt:   { color: COLORS.gray, fontSize: 15, fontWeight: '700' },

  btnNext:      { flex: 2, backgroundColor: COLORS.primary, borderRadius: 12,
                  paddingVertical: 14, alignItems: 'center' },
  btnNextDisabled: { backgroundColor: '#d1d5db' },
  btnNextTxt:   { color: '#fff', fontSize: 15, fontWeight: '800' },
});
