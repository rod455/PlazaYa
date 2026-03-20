// src/screens/study/StudyQuizScreen.js
// Quiz de estudo — questões por tema OU simulado completo

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { fetchQuestoesTema, fetchSimulado, salvarSessaoEstudo } from '../../services/questionsService';
import { COLORS } from '../../constants/colors';

const OPCOES      = ['a', 'b', 'c', 'd'];
const LABEL_OPCAO = { a: 'A', b: 'B', c: 'C', d: 'D' };
const TEMPO_QUESTAO = 30;

export default function StudyQuizScreen({ navigation, route }) {
  const { tipo, area, tema } = route.params;
  const { user } = useAuth();

  const [fase,       setFase]       = useState('loading');
  const [questoes,   setQuestoes]   = useState([]);
  const [respostas,  setRespostas]  = useState([]);
  const [indice,     setIndice]     = useState(0);
  const [tempo,      setTempo]      = useState(TEMPO_QUESTAO);
  const [mostrarExpl, setMostrarExpl] = useState(false);
  const [respondida,  setRespondida]  = useState(null);

  const timerRef  = useRef(null);
  const inicioRef = useRef(Date.now());

  useEffect(() => {
    async function carregar() {
      try {
        const qs = tipo === 'simulado'
          ? await fetchSimulado({ area, quantidade: 20 })
          : await fetchQuestoesTema({ area, tema, quantidade: 10 });

        if (!qs || qs.length === 0) {
          Alert.alert('Sin preguntas', 'No hay preguntas disponibles para este tema todavía.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
          return;
        }
        setQuestoes(qs);
        setRespostas(new Array(qs.length).fill(null));
        setFase('questao');
      } catch (e) {
        Alert.alert('Error', 'No se pudieron cargar las preguntas.');
        navigation.goBack();
      }
    }
    carregar();
  }, []);

  // Timer
  useEffect(() => {
    if (fase !== 'questao' || mostrarExpl) return;
    setTempo(TEMPO_QUESTAO);
    timerRef.current = setInterval(() => {
      setTempo(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleResponder(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [indice, fase, mostrarExpl]);

  function handleResponder(opcao) {
    clearInterval(timerRef.current);
    const novas = [...respostas];
    novas[indice] = opcao;
    setRespostas(novas);
    setRespondida(opcao);
    setMostrarExpl(true);
  }

  function handleProxima() {
    setMostrarExpl(false);
    setRespondida(null);
    if (indice + 1 < questoes.length) {
      setIndice(indice + 1);
    } else {
      finalizarQuiz();
    }
  }

  async function finalizarQuiz() {
    const acertos = questoes.reduce((acc, q, i) => acc + (respostas[i] === q.resposta_correta ? 1 : 0), 0);
    const tempoTotal = Math.round((Date.now() - inicioRef.current) / 1000);

    if (user) {
      await salvarSessaoEstudo({
        userId: user.id, area, tema, tipo,
        acertos, total: questoes.length, tempoTotal,
      });
    }

    setFase('resultado');
  }

  // ── LOADING ─────────────────────────────────────────────────────────────────
  if (fase === 'loading') {
    return (
      <SafeAreaView style={s.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={s.loadTxt}>Cargando preguntas...</Text>
      </SafeAreaView>
    );
  }

  // ── RESULTADO ───────────────────────────────────────────────────────────────
  if (fase === 'resultado') {
    const acertos = questoes.reduce((acc, q, i) => acc + (respostas[i] === q.resposta_correta ? 1 : 0), 0);
    const pct = Math.round((acertos / questoes.length) * 100);
    const emoji = pct >= 70 ? '🏆' : pct >= 50 ? '👍' : '📚';

    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.resultContent}>
          <Text style={s.resultEmoji}>{emoji}</Text>
          <Text style={s.resultTitle}>{pct >= 70 ? '¡Excelente!' : pct >= 50 ? '¡Buen trabajo!' : 'Sigue practicando'}</Text>
          <Text style={s.resultScore}>{acertos}/{questoes.length} correctas ({pct}%)</Text>

          <Text style={s.gabTitle}>Respuestas</Text>
          {questoes.map((q, i) => {
            const correto = respostas[i] === q.resposta_correta;
            return (
              <View key={q.id} style={[s.gabCard, { borderLeftColor: correto ? COLORS.success : COLORS.danger }]}>
                <Text style={s.gabNum}>Q{i + 1} {correto ? '✅' : '❌'}</Text>
                <Text style={s.gabEnun} numberOfLines={2}>{q.enunciado}</Text>
                <Text style={s.gabResp}>Correcta: {LABEL_OPCAO[q.resposta_correta]}) {q[`opcao_${q.resposta_correta}`]}</Text>
                {!correto && respostas[i] && (
                  <Text style={s.gabErro}>Tu respuesta: {LABEL_OPCAO[respostas[i]]}) {q[`opcao_${respostas[i]}`]}</Text>
                )}
                {!respostas[i] && <Text style={s.gabErro}>Tiempo agotado</Text>}
              </View>
            );
          })}

          <TouchableOpacity style={s.btnRetry} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={s.btnRetryTxt}>← Volver a Estudiar</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── QUESTÃO ─────────────────────────────────────────────────────────────────
  const q = questoes[indice];
  const correta = q.resposta_correta;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.topBar}>
        <Text style={s.progresso}>{indice + 1}/{questoes.length}</Text>
        <View style={[s.timerBadge, tempo <= 5 && { backgroundColor: COLORS.danger }]}>
          <Text style={s.timerTxt}>⏱ {tempo}s</Text>
        </View>
      </View>

      <View style={s.progressBar}>
        <View style={[s.progressFill, { width: `${((indice + 1) / questoes.length) * 100}%` }]} />
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.qContent}>
        <Text style={s.enunciado}>{q.enunciado}</Text>

        {OPCOES.map(opt => {
          const texto = q[`opcao_${opt}`];
          if (!texto) return null;

          let bgColor = '#fff';
          let borderColor = COLORS.border;
          if (mostrarExpl) {
            if (opt === correta) { bgColor = '#dcfce7'; borderColor = COLORS.success; }
            else if (opt === respondida && opt !== correta) { bgColor = '#fee2e2'; borderColor = COLORS.danger; }
          }

          return (
            <TouchableOpacity
              key={opt}
              style={[s.opcao, { backgroundColor: bgColor, borderColor }]}
              onPress={() => !mostrarExpl && handleResponder(opt)}
              disabled={mostrarExpl}
              activeOpacity={0.8}
            >
              <Text style={s.opcaoLetra}>{LABEL_OPCAO[opt]}</Text>
              <Text style={s.opcaoTxt}>{texto}</Text>
            </TouchableOpacity>
          );
        })}

        {mostrarExpl && (
          <View style={s.explBox}>
            <Text style={s.explTitle}>{respondida === correta ? '✅ ¡Correcto!' : respondida ? '❌ Incorrecto' : '⏱ Tiempo agotado'}</Text>
            {q.explicacao && <Text style={s.explTxt}>{q.explicacao}</Text>}
            <TouchableOpacity style={s.btnNext} onPress={handleProxima} activeOpacity={0.85}>
              <Text style={s.btnNextTxt}>{indice + 1 < questoes.length ? 'Siguiente →' : 'Ver resultado'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg },
  loadTxt: { color: COLORS.textMuted, fontSize: 14, marginTop: 12 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 8 },
  progresso: { fontSize: 16, fontWeight: '800', color: COLORS.text },
  timerBadge: { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  timerTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  progressBar: { height: 4, backgroundColor: '#e0e0e0', marginHorizontal: 16, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: COLORS.primary, borderRadius: 2 },
  scroll: { flex: 1 },
  qContent: { padding: 16 },
  enunciado: { fontSize: 16, fontWeight: '600', color: COLORS.text, lineHeight: 24, marginBottom: 20 },
  opcao: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 2,
  },
  opcaoLetra: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginRight: 12, width: 24 },
  opcaoTxt: { fontSize: 14, color: COLORS.text, flex: 1, lineHeight: 20 },
  explBox: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 12, elevation: 2 },
  explTitle: { fontSize: 16, fontWeight: '800', marginBottom: 8 },
  explTxt: { fontSize: 13, color: COLORS.textMuted, lineHeight: 20, marginBottom: 12 },
  btnNext: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnNextTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  resultContent: { padding: 20, alignItems: 'center' },
  resultEmoji: { fontSize: 64, marginTop: 20, marginBottom: 8 },
  resultTitle: { fontSize: 24, fontWeight: '900', color: COLORS.text, marginBottom: 8 },
  resultScore: { fontSize: 18, color: COLORS.primary, fontWeight: '700', marginBottom: 24 },
  gabTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, alignSelf: 'flex-start', marginBottom: 12, width: '100%' },
  gabCard: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 4, width: '100%' },
  gabNum: { fontWeight: '800', fontSize: 14, marginBottom: 4 },
  gabEnun: { fontSize: 13, color: '#555', marginBottom: 4 },
  gabResp: { fontSize: 12, color: COLORS.success },
  gabErro: { fontSize: 12, color: COLORS.danger, marginTop: 2 },
  btnRetry: { backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginTop: 20 },
  btnRetryTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
