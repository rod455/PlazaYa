// src/screens/quiz/Quiz1Screen.js — Escolaridade
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import QuizLayout from '../../components/QuizLayout';
import OptionButton from '../../components/OptionButton';
import { useQuiz } from '../../context/QuizContext';
import { ESCOLARIDADE_OPTIONS } from '../../constants/data';

export default function Quiz1Screen({ navigation }) {
  const { answers, setAnswer } = useQuiz();
  const [selected, setSelected] = useState(answers.escolaridade || null);

  return (
    <QuizLayout
      progress={5}
      stepLabel="Paso 1 de 7"
      onNext={() => { setAnswer('escolaridade', selected); navigation.navigate('Quiz2'); }}
      nextDisabled={!selected}
      nextLabel="Siguiente →"
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.q}>
          <Text style={styles.emoji}>🎓</Text>
          <Text style={styles.titulo}>¿Cuál es tu nivel de estudios?</Text>
          <Text style={styles.hint}>Selecciona tu formación actual</Text>
        </View>
        {ESCOLARIDADE_OPTIONS.map(opt => (
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
