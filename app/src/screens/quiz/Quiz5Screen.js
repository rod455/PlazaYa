// src/screens/quiz/Quiz5Screen.js — Salário
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import QuizLayout from '../../components/QuizLayout';
import OptionButton from '../../components/OptionButton';
import { useQuiz } from '../../context/QuizContext';
import { SALARIO_OPTIONS } from '../../constants/data';

export default function Quiz5Screen({ navigation }) {
  const { answers, setAnswer } = useQuiz();
  const [selected, setSelected] = useState(answers.salario || null);

  return (
    <QuizLayout progress={58} stepLabel="Paso 5 de 7"
      onNext={() => { setAnswer('salario', selected); navigation.navigate('Quiz6'); }}
      onBack={() => navigation.goBack()} nextDisabled={!selected}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.q}>
          <Text style={styles.emoji}>💰</Text>
          <Text style={styles.titulo}>¿Cuánto esperas ganar?</Text>
          <Text style={styles.hint}>Filtraremos las plazas que se ajustan a tu expectativa</Text>
        </View>
        {SALARIO_OPTIONS.map(opt => (
          <OptionButton key={opt.id} label={opt.label}
            selected={selected === opt.id} onPress={() => setSelected(opt.id)} />
        ))}
      </ScrollView>
    </QuizLayout>
  );
}
const styles = StyleSheet.create({
  q:     { marginBottom: 24 },
  emoji: { fontSize: 40, marginBottom: 12 },
  titulo:{ fontSize: 24, fontWeight: '900', color: '#111827', lineHeight: 32, marginBottom: 8 },
  hint:  { fontSize: 15, color: '#6b7280', lineHeight: 22 },
});
