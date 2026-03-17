// src/screens/quiz/Quiz2Screen.js — Área
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import QuizLayout from '../../components/QuizLayout';
import OptionButton from '../../components/OptionButton';
import { useQuiz } from '../../context/QuizContext';
import { AREA_OPTIONS } from '../../constants/data';

export default function Quiz2Screen({ navigation }) {
  const { answers, setAnswer } = useQuiz();
  const [selected, setSelected] = useState(answers.area || null);

  return (
    <QuizLayout
      progress={18}
      stepLabel="Paso 2 de 7"
      onNext={() => { setAnswer('area', selected); navigation.navigate('Quiz3'); }}
      onBack={() => navigation.goBack()}
      nextDisabled={!selected}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.q}>
          <Text style={styles.emoji}>🏛️</Text>
          <Text style={styles.titulo}>¿En qué área te gustaría trabajar?</Text>
          <Text style={styles.hint}>Elige la que más te interesa</Text>
        </View>
        {AREA_OPTIONS.map(opt => (
          <OptionButton key={opt.id} label={opt.label} icon={opt.icon}
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
