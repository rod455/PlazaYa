// src/screens/quiz/Quiz7Screen.js — Preparação (última etapa)
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import QuizLayout from '../../components/QuizLayout';
import OptionButton from '../../components/OptionButton';
import { useQuiz } from '../../context/QuizContext';
import { PREPARACAO_OPTIONS } from '../../constants/data';

export default function Quiz7Screen({ navigation }) {
  const { answers, setAnswer } = useQuiz();
  const [selected, setSelected] = useState(answers.preparacao || null);

  function handleNext() {
    setAnswer('preparacao', selected);
    navigation.navigate('RewardedAd');
  }

  return (
    <QuizLayout progress={86} stepLabel="Paso 7 de 7"
      onNext={handleNext}
      onBack={() => navigation.goBack()}
      nextDisabled={!selected}
      nextLabel="¡Encontrar mi plaza! 🎯">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.q}>
          <Text style={styles.emoji}>🚀</Text>
          <Text style={styles.titulo}>¿Cuándo quieres comenzar a prepararte?</Text>
          <Text style={styles.hint}>¡Última pregunta! Ya casi terminamos 🎉</Text>
        </View>
        {PREPARACAO_OPTIONS.map(opt => (
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
