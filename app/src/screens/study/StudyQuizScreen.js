// src/screens/study/StudyQuizScreen.js
// Quiz de estudo — questões por tema OU simulado completo (usuário logado)

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import {
  fetchQuestoesTema,
  fetchSimulado,
  salvarSessaoEstudo,
} from '../../services/questionsService';

const OPCOES      = ['a', 'b', 'c', 'd'];
const LABEL_OPCAO = { a: 'A', b: 'B', c: 'C', d: 'D' };
const TEMPO_QUESTAO = 30; // mais tempo no módulo de estudo

export default function StudyQuizScreen({ navigation, route }) {
  const { tipo, area, tema } = route.params;
  const { user } = useAuth();

  const [fase,      setFase]      = useState('loading');
  const [questoes,  setQuestoes]  = useState([]);
  const [respostas, setRespostas] = useState([]);        // string | null
  const [indice,    setIndice]    = useState(0);
  const [tempo,     setTempo]     = useState(TEMPO_QUESTAO);
  const [mostrarExpl, setMostrarExpl] = useState(false); // mostra explicação após responder
  const [respondida, setRespondida]   = useState(null);  // resposta dada nesta questão

  const timerRef   = useRef(null);
  const inicioRef  = useRef(Date.now());
  const tempoQRef  = useRef(Date.now());

  // ── Carrega questões ──
  useEffect(() => {
    async function carregar() {
      try {
        const qs = tipo === 'simulado'
          ? await fetchSimulado({ area, quantidade: 20 })
          : await fetchQuestoesTema({ area, tema, quantidade: 10 });

        if (!qs || qs.length === 0) {
          Alert.alert('Sin preguntas', 'No hay preguntas disponibles para este tema aún.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
          return;
        }
        setQuestoes(qs);
        setFase('questao');
      } catch (e) {
        console.error(e);
        Alert.alert('Error', 'No se pudieron cargar las preguntas.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    }
    carregar();
  }, []);

  // ── Timer ──
  useEffect(() => {
    if (fase !== 'questao') return;
    limparTimer();
    setTempo(TEMPO_QUESTAO);
    setRespondida(null);
    setMostrarExpl(false);
    tempoQRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTempo(t => {
        if (t <= 1) { limparTimer(); registrarResposta(null); return TEMPO_QUESTAO; }
        return t - 1;
      });
    }, 1000);

    return limparTimer;
  }, [fase, indice]);

  function limparTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function registrarResposta(opcao) {
    limparTimer();
    setRespondida(opcao);
    setMostrarExpl(true);
  }

  function avancar() {
    const tempoGasto = Math.round((Date.now() - tempoQRef.current) / 1000);
    const questao    = questoes[indice];
    const correta    = respondida === questao.resposta_correta;

    const novaResp = [
      ...respostas,
      {
        questionId: questao.id,
        resposta:   respondida,
        correta,
        tempoSeg:   tempoGasto,
      },
    ];
    setRespostas(novaResp);
    setMostrarExpl(false);
    setRespondida(null);

    if (indice + 1 >= questoes.length) {
      finalizarSessao(novaResp);
    } else {
      setIndice(i => i + 1);
    }
  }

  async function finalizarSessao(todasRespostas) {
    setFase('resultado');
    if (!user) return;

    try {
      const tempoTotal = Math.round((Date.now() - inicioRef.current) / 1000);
      const acertos    = todasRespostas.filter(r => r.correta).length;
      await salvarSessaoEstudo({
        userId:    user.id,
        tipo,
        area,
        tema:      tema || null,
        total:     questoes.length,
        acertos,
        tempoSeg:  tempoTotal,
        respostas: todasRespostas,
      });
    } catch (e) {
      console.warn('Não salvou sessão:', e.message);
    }
  }

  // ─── Render: Loading ───────────────────────────────────────────────────
  if (fase === 'loading') {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color="#01497a" style={{ marginTop: 80 }} />
        <Text style={styles.loadingTxt}>Cargando {tipo === 'simulado' ? 'simulacro' : 'ejercicios'}...</Text>
      </SafeAreaView>
    );
  }

  // ─── Render: Resultado ────────────────────────────────────────────────
  if (fase === 'resultado') {
    const acertos = respostas.filter(r => r.correta).length;
    const pct     = Math.round((acertos / questoes.length) * 100);
    const emoji   = pct >= 80 ? '🏆' : pct >= 60 ? '👍' : pct >= 40 ? '📚' : '💪';

    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.resultadoWrap}>
          <Text style={styles.resultadoEmoji}>{emoji}</Text>
          <Text style={styles.resultadoTitulo}>{acertos}/{questoes.length} correctas</Text>
          <Text style={styles.resultadoPct}>{pct}%</Text>
          <Text style={styles.resultadoMsg}>{mensagem(pct)}</Text>

          {/* Gabarito detalhado */}
          {questoes.map((q, i) => {
            const r = respostas[i];
            return (
              <View key={i} style={[styles.gabItem, r?.correta ? styles.gabCerto : styles.gabErrado]}>
                <View style={styles.gabHeader}>
                  <Text style={styles.gabNum}>Q{i + 1}</Text>
                  <Text>{r?.correta ? '✅' : '❌'}</Text>
                  <Text style={{ color: '#6b7280', fontSize: 12 }}>{nivelEmoji(q.dificuldade)} {q.dificuldade}</Text>
                </View>
                <Text style={styles.gabEnunciado}>{q.enunciado}</Text>
                <Text style={styles.gabCorreta}>
                  ✅ Correcta: <Text style={{ fontWeight: '800' }}>
                    {LABEL_OPCAO[q.resposta_correta]}) {q[`opcao_${q.resposta_correta}`]}
                  </Text>
                </Text>
                {!r?.correta && r?.resposta && (
                  <Text style={styles.gabErro}>
                    ❌ Tu respuesta: {LABEL_OPCAO[r.resposta]}) {q[`opcao_${r.resposta}`]}
                  </Text>
                )}
                {!r?.resposta && <Text style={styles.gabErro}>⏱ Tiempo agotado</Text>}
                {q.explicacao && (
                  <Text style={styles.gabExplicacao}>💡 {q.explicacao}</Text>
                )}
              </View>
            );
          })}

          <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.goBack()}>
            <Text style={styles.btnVoltarTxt}>← Volver a estudiar</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Render: Questão ──────────────────────────────────────────────────
  const questao = questoes[indice];
  if (!questao) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.questaoWrap} showsVerticalScrollIndicator={false}>

        {/* Header de progresso */}
        <View style={styles.progressRow}>
          <Text style={styles.progressTxt}>{indice + 1}/{questoes.length}</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${((indice + 1) / questoes.length) * 100}%` }]} />
          </View>
          <Text style={[styles.tempoTxt, tempo <= 10 && { color: '#ef4444' }]}>⏱ {tempo}s</Text>
        </View>

        {/* Nível */}
        <Text style={[styles.nivelTag, { color: nivelCor(questao.dificuldade) }]}>
          {nivelEmoji(questao.dificuldade)} {questao.dificuldade}
          {questao.tema ? `  ·  ${questao.tema}` : ''}
        </Text>

        {/* Enunciado */}
        <Text style={styles.enunciado}>{questao.enunciado}</Text>

        {/* Opções */}
        {OPCOES.map(op => {
          const isCorreta  = op === questao.resposta_correta;
          const isSel      = respondida === op;
          let bgColor      = '#fff';
          let borderColor  = '#e5e7eb';

          if (mostrarExpl) {
            if (isCorreta)       { bgColor = '#d1fae5'; borderColor = '#10b981'; }
            else if (isSel)      { bgColor = '#fee2e2'; borderColor = '#ef4444'; }
          } else if (isSel) {
            bgColor = '#eff6ff'; borderColor = '#01497a';
          }

          return (
            <TouchableOpacity
              key={op}
              style={[styles.opcao, { backgroundColor: bgColor, borderColor }]}
              onPress={() => !respondida && registrarResposta(op)}
              activeOpacity={0.8}
              disabled={!!respondida}
            >
              <View style={[styles.opcaoLetra, isSel && !mostrarExpl && styles.opcaoLetraSel,
                mostrarExpl && isCorreta && { backgroundColor: '#10b981' },
                mostrarExpl && isSel && !isCorreta && { backgroundColor: '#ef4444' },
              ]}>
                <Text style={[styles.opcaoLetraTxt, (isSel || (mostrarExpl && isCorreta)) && { color: '#fff' }]}>
                  {LABEL_OPCAO[op]}
                </Text>
              </View>
              <Text style={[styles.opcaoTxt, (isSel && !mostrarExpl) && { color: '#01497a', fontWeight: '700' }]}>
                {questao[`opcao_${op}`]}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Explicação (após responder) */}
        {mostrarExpl && questao.explicacao && (
          <View style={styles.explBox}>
            <Text style={styles.explTitulo}>💡 Explicación</Text>
            <Text style={styles.explTxt}>{questao.explicacao}</Text>
          </View>
        )}

        {/* Botão avançar */}
        {mostrarExpl && (
          <TouchableOpacity style={styles.btnAvancar} onPress={avancar}>
            <Text style={styles.btnAvancarTxt}>
              {indice + 1 >= questoes.length ? 'Ver resultado →' : 'Siguiente pregunta →'}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function nivelEmoji(d) { return d === 'facil' ? '🟢' : d === 'medio' ? '🟡' : '🔴'; }
function nivelCor(d)   { return d === 'facil' ? '#16a34a' : d === 'medio' ? '#d97706' : '#dc2626'; }
function mensagem(pct) {
  if (pct >= 80) return '¡Excelente desempeño! Estás listo para el examen.';
  if (pct >= 60) return 'Buen resultado. Sigue practicando los temas más difíciles.';
  if (pct >= 40) return 'Vas por buen camino. Repasa los temas donde fallaste.';
  return 'No te rindas. Estudia la teoría y vuelve a intentarlo.';
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: '#f9fafb' },
  loadingTxt:   { textAlign: 'center', color: '#6b7280', marginTop: 16 },

  questaoWrap:  { padding: 20 },
  progressRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  progressTxt:  { fontSize: 13, color: '#6b7280', width: 36 },
  progressBarBg:{ flex: 1, height: 6, backgroundColor: '#e5e7eb', borderRadius: 4 },
  progressBarFill:{ height: 6, backgroundColor: '#01497a', borderRadius: 4 },
  tempoTxt:     { fontSize: 13, color: '#6b7280', width: 40, textAlign: 'right' },

  nivelTag:     { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 10 },
  enunciado:    { fontSize: 18, fontWeight: '800', color: '#111827', lineHeight: 27, marginBottom: 24 },

  opcao:        { borderRadius: 12, flexDirection: 'row', alignItems: 'center',
                  padding: 14, marginBottom: 12, borderWidth: 1.5,
                  shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  opcaoLetra:   { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f3f4f6',
                  alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  opcaoLetraSel:{ backgroundColor: '#01497a' },
  opcaoLetraTxt:{ fontWeight: '800', fontSize: 14, color: '#374151' },
  opcaoTxt:     { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },

  explBox:      { backgroundColor: '#fefce8', borderRadius: 12, padding: 16, marginTop: 4,
                  borderLeftWidth: 4, borderLeftColor: '#f59e0b' },
  explTitulo:   { fontWeight: '800', fontSize: 14, color: '#92400e', marginBottom: 6 },
  explTxt:      { fontSize: 14, color: '#78350f', lineHeight: 20 },

  btnAvancar:   { backgroundColor: '#01497a', borderRadius: 14, paddingVertical: 16,
                  alignItems: 'center', marginTop: 16 },
  btnAvancarTxt:{ color: '#fff', fontSize: 16, fontWeight: '800' },

  // Resultado
  resultadoWrap:  { padding: 20 },
  resultadoEmoji: { fontSize: 60, textAlign: 'center', marginTop: 20, marginBottom: 8 },
  resultadoTitulo:{ fontSize: 26, fontWeight: '900', textAlign: 'center', color: '#111827' },
  resultadoPct:   { fontSize: 40, fontWeight: '900', textAlign: 'center', color: '#01497a', marginBottom: 8 },
  resultadoMsg:   { fontSize: 15, color: '#4b5563', textAlign: 'center', lineHeight: 22, marginBottom: 28 },

  gabItem:       { borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  gabCerto:      { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  gabErrado:     { borderColor: '#ef4444', backgroundColor: '#fef2f2' },
  gabHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  gabNum:        { fontWeight: '800', fontSize: 13, color: '#6b7280' },
  gabEnunciado:  { fontSize: 13, color: '#374151', marginBottom: 6 },
  gabCorreta:    { fontSize: 13, color: '#16a34a' },
  gabErro:       { fontSize: 13, color: '#dc2626', marginTop: 4 },
  gabExplicacao: { fontSize: 12, color: '#6b7280', marginTop: 6, fontStyle: 'italic' },

  btnVoltar:     { borderWidth: 1.5, borderColor: '#01497a', borderRadius: 12,
                   paddingVertical: 14, alignItems: 'center', marginTop: 24 },
  btnVoltarTxt:  { color: '#01497a', fontWeight: '700', fontSize: 15 },
});
