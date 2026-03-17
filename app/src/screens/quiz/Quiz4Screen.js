// src/screens/quiz/Quiz4Screen.js — Estado
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import QuizLayout from '../../components/QuizLayout';
import { useQuiz } from '../../context/QuizContext';
import { ESTADOS_MEXICO } from '../../constants/data';
import { COLORS } from '../../constants/colors';

export default function Quiz4Screen({ navigation }) {
  const { answers, setAnswer } = useQuiz();
  const [selected, setSelected] = useState(answers.estado || null);

  return (
    <QuizLayout progress={46} stepLabel="Paso 4 de 7"
      onNext={() => { setAnswer('estado', selected); navigation.navigate('Quiz5'); }}
      onBack={() => navigation.goBack()} nextDisabled={!selected}>

      <View style={styles.q}>
        <Text style={styles.emoji}>📍</Text>
        <Text style={styles.titulo}>¿En qué estado te encuentras?</Text>
        <Text style={styles.hint}>Buscaremos plazas disponibles cerca de ti</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.lista}>
        <View style={styles.grid}>
          {ESTADOS_MEXICO.map(est => {
            const sel = selected === est.uf;
            return (
              <TouchableOpacity
                key={est.uf}
                style={[styles.estadoBtn, sel && styles.estadoBtnSel]}
                onPress={() => setSelected(est.uf)}
                activeOpacity={0.8}
              >
                <Text style={[styles.estadoUf, sel && styles.estadoUfSel]}>{est.uf}</Text>
                <Text style={[styles.estadoNome, sel && styles.estadoNomeSel]} numberOfLines={2}>
                  {est.nome}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </QuizLayout>
  );
}

const styles = StyleSheet.create({
  q:           { marginBottom: 16 },
  emoji:       { fontSize: 40, marginBottom: 12 },
  titulo:      { fontSize: 24, fontWeight: '900', color: '#111827', lineHeight: 32, marginBottom: 8 },
  hint:        { fontSize: 15, color: '#6b7280', lineHeight: 22 },
  lista:       { flex: 1 },
  grid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 20 },
  estadoBtn:   { width: '30%', backgroundColor: '#fff', borderRadius: 10, padding: 10,
                 alignItems: 'center', borderWidth: 1.5, borderColor: '#e5e7eb' },
  estadoBtnSel:{ borderColor: COLORS.primary, backgroundColor: '#eff6ff' },
  estadoUf:    { fontSize: 11, fontWeight: '800', color: '#6b7280', marginBottom: 3 },
  estadoUfSel: { color: COLORS.primary },
  estadoNome:  { fontSize: 10, color: '#9ca3af', textAlign: 'center', lineHeight: 13 },
  estadoNomeSel:{ color: COLORS.primary },
});
