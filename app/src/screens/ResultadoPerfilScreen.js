// src/screens/ResultadoPerfilScreen.js
// Tela de resultado do perfil após onboarding

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuiz } from '../context/QuizContext';
import { COLORS } from '../constants/colors';
import { AREA_OPTIONS, ESTADOS_MEXICO, ESCOLARIDADE_OPTIONS, SALARIO_OPTIONS } from '../constants/data';

export default function ResultadoPerfilScreen({ navigation }) {
  const { answers } = useQuiz();

  const area = AREA_OPTIONS.find(a => a.id === answers.area);
  const estado = ESTADOS_MEXICO.find(e => e.uf === answers.estado);
  const escolaridade = ESCOLARIDADE_OPTIONS.find(e => e.id === answers.escolaridade);
  const salario = SALARIO_OPTIONS.find(s => s.id === answers.salario);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.emoji}>🎯</Text>
        <Text style={s.title}>¡Tu perfil está listo!</Text>
        <Text style={s.sub}>Vamos a buscar las mejores convocatorias para ti</Text>

        <View style={s.profileCard}>
          {area && <ProfileRow icon={area.icon} label="Área" value={area.label} />}
          {estado && <ProfileRow icon="📍" label="Estado" value={estado.nome} />}
          {escolaridade && <ProfileRow icon="🎓" label="Escolaridad" value={escolaridade.label} />}
          {salario && <ProfileRow icon="💰" label="Rango salarial" value={salario.label} />}
        </View>

        <TouchableOpacity
          style={s.btn}
          onPress={() => navigation.replace('MainApp')}
          activeOpacity={0.85}
        >
          <Text style={s.btnTxt}>Ver convocatorias →</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.authBtn}
          onPress={() => navigation.navigate('Auth')}
          activeOpacity={0.85}
        >
          <Text style={s.authBtnTxt}>Crear cuenta para guardar progreso</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileRow({ icon, label, value }) {
  return (
    <View style={s.row}>
      <Text style={s.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={s.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  content: { padding: 24, alignItems: 'center' },
  emoji: { fontSize: 56, marginTop: 30, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.primary, textAlign: 'center', marginBottom: 6 },
  sub: { fontSize: 15, color: COLORS.textMuted, textAlign: 'center', marginBottom: 28 },
  profileCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, width: '100%', elevation: 2, marginBottom: 28 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#f0f0f0' },
  rowIcon: { fontSize: 22, marginRight: 12 },
  rowLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  rowValue: { fontSize: 15, color: COLORS.text, fontWeight: '700', marginTop: 2 },
  btn: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40, elevation: 4 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
  authBtn: { marginTop: 16, padding: 12 },
  authBtnTxt: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
});
