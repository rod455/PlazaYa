// src/screens/knowledge/KnowledgeQuizScreen.js
// Quiz de conhecimentos ANTES do cadastro — híbrido banco + IA

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, SafeAreaView, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchQuestoesMistas } from '../../services/questionsService';
import { useQuiz } from '../../context/QuizContext';

const OPCOES         = ['a', 'b', 'c', 'd'];
const LABEL_OPCAO    = { a: 'A', b: 'B', c: 'C', d: 'D' };
const TEMPO_QUESTAO  = 20;

// ─── Intro ─────────────────────────────────────────────────────────────────
function TelaIntro({ area, onStart }) {
  return (
    <View style={styles.introWrap}>
      <Text style={styles.introEmoji}>🧠</Text>
      <Text style={styles.introTitulo}>¡Prueba tus conocimientos!</Text>
      <Text style={styles.introSub}>
        Responde <Text style={styles.bold}>5 preguntas</Text> sobre{' '}
        <Text style={styles.bold}>{areaLabel(area)}</Text> y descubre tu nivel.
      </Text>

      <View style={styles.introBox}>
        <InfoRow emoji="🟢" texto="1 pregunta fácil" />
        <InfoRow emoji="🟡" texto="1 pregunta media" />
        <InfoRow emoji="🔴" texto="3 preguntas difíciles" />
        <InfoRow emoji="⏱️" texto={`${TEMPO_QUESTAO} segundos por pregunta`} />
      </View>

      <TouchableOpacity style={styles.btnIniciar} onPress={onStart}>
        <Text style={styles.btnIniciarTxt}>Comenzar →</Text>
      </TouchableOpacity>
    </View>
  );
}

function InfoRow({ emoji, texto }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoEmoji}>{emoji}</Text>
      <Text style={styles.infoTxt}>{texto}</Text>
    </View>
  );
}

// ─── Questão individual ────────────────────────────────────────────────────
function TelaQuestao({ questao, numero, total, tempo, onResponder }) {
  const [selecionada, setSelecionada] = useState(null);
  const progresso = tempo / TEMPO_QUESTAO;
  const corBarra  = tempo > 10 ? '#00c9a7' : tempo > 5 ? '#f59e0b' : '#ef4444';

  function confirmar(opcao) {
    if (selecionada) return;
    setSelecionada(opcao);
    setTimeout(() => onResponder(opcao), 700);
  }

  return (
    <ScrollView contentContainerStyle={styles.questaoWrap} showsVerticalScrollIndicator={false}>
      {/* Barra de progresso de tempo */}
      <View style={styles.baraBg}>
        <View style={[styles.baraFill, { width: `${progresso * 100}%`, backgroundColor: corBarra }]} />
      </View>

      <Text style={styles.questaoNum}>{numero}/{total}</Text>
      <Text style={styles.questaoTempo}>⏱ {tempo}s</Text>
      <Text style={[styles.questaoNivel, nivelStyle(questao.dificuldade)]}>
        {nivelEmoji(questao.dificuldade)} {questao.dificuldade}
      </Text>
      <Text style={styles.questaoEnunciado}>{questao.enunciado}</Text>

      {OPCOES.map(op => {
        const isSelected = selecionada === op;
        return (
          <TouchableOpacity
            key={op}
            style={[styles.opcao, isSelected && styles.opcaoSel]}
            onPress={() => confirmar(op)}
            activeOpacity={0.8}
          >
            <View style={[styles.opcaoLetra, isSelected && styles.opcaoLetraSel]}>
              <Text style={[styles.opcaoLetraTxt, isSelected && { color: '#fff' }]}>
                {LABEL_OPCAO[op]}
              </Text>
            </View>
            <Text style={[styles.opcaoTxt, isSelected && styles.opcaoTxtSel]}>
              {questao[`opcao_${op}`]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Resultado ────────────────────────────────────────────────────────────
function TelaResultado({ questoes, respostas, onCadastrar, onRepetir }) {
  const acertos = questoes.filter((q, i) => respostas[i] === q.resposta_correta).length;
  const pct     = Math.round((acertos / questoes.length) * 100);
  const emoji   = pct >= 80 ? '🏆' : pct >= 60 ? '👍' : pct >= 40 ? '📚' : '💪';

  return (
    <ScrollView contentContainerStyle={styles.resultadoWrap}>
      <Text style={styles.resultadoEmoji}>{emoji}</Text>
      <Text style={styles.resultadoTitulo}>
        {acertos}/{questoes.length} acertos
      </Text>
      <Text style={styles.resultadoPct}>{pct}%</Text>
      <Text style={styles.resultadoMsg}>{mensagemResultado(pct)}</Text>

      {/* Gabarito */}
      {questoes.map((q, i) => {
        const certo = respostas[i] === q.resposta_correta;
        return (
          <View key={i} style={styles.gabItem}>
            <View style={styles.gabHeader}>
              <Text style={styles.gabNum}>Q{i + 1}</Text>
              <Text>{certo ? '✅' : '❌'}</Text>
              <Text style={styles.gabNivel}>{nivelEmoji(q.dificuldade)}</Text>
            </View>
            <Text style={styles.gabEnunciado} numberOfLines={2}>{q.enunciado}</Text>
            <Text style={styles.gabCorreta}>
              Correcta: <Text style={styles.bold}>
                {LABEL_OPCAO[q.resposta_correta]}) {q[`opcao_${q.resposta_correta}`]}
              </Text>
            </Text>
            {!certo && respostas[i] && (
              <Text style={styles.gabErro}>
                Tu respuesta: {LABEL_OPCAO[respostas[i]]}) {q[`opcao_${respostas[i]}`]}
              </Text>
            )}
            {!respostas[i] && <Text style={styles.gabErro}>Tiempo agotado</Text>}
            {q.explicacao && (
              <Text style={styles.gabExplicacao}>💡 {q.explicacao}</Text>
            )}
          </View>
        );
      })}

      {/* CTA — criar conta */}
      <View style={styles.ctaBox}>
        <Text style={styles.ctaTitulo}>¿Quieres practicar más?</Text>
        <Text style={styles.ctaSub}>
          Crea tu cuenta gratis y accede a cientos de preguntas, simulacros completos y seguimiento de tu progreso.
        </Text>
        <TouchableOpacity style={styles.btnCadastrar} onPress={onCadastrar}>
          <Text style={styles.btnCadastrarTxt}>Crear cuenta gratis 🚀</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.btnRepetir} onPress={onRepetir}>
        <Text style={styles.btnRepetirTxt}>🔄 Repetir quiz</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Screen principal ──────────────────────────────────────────────────────
export default function KnowledgeQuizScreen({ navigation }) {
  const { answers } = useQuiz();
  const area = answers.area || 'administrativo';

  const [fase,      setFase]      = useState('intro');   // intro|loading|questao|resultado
  const [questoes,  setQuestoes]  = useState([]);
  const [respostas, setRespostas] = useState([]);
  const [indice,    setIndice]    = useState(0);
  const [tempo,     setTempo]     = useState(TEMPO_QUESTAO);
  const timerRef = useRef(null);

  function limparTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
  }

  async function iniciar() {
    setFase('loading');
    try {
      const qs = await fetchQuestoesMistas(area);
      setQuestoes(qs);
      setRespostas([]);
      setIndice(0);
      setTempo(TEMPO_QUESTAO);
      setFase('questao');
    } catch (e) {
      console.error(e);
      setFase('intro');
    }
  }

  // Timer por questão
  useEffect(() => {
    if (fase !== 'questao') return;
    limparTimer();
    setTempo(TEMPO_QUESTAO);

    timerRef.current = setInterval(() => {
      setTempo(t => {
        if (t <= 1) {
          limparTimer();
          avancar(null); // tempo esgotado = null
          return TEMPO_QUESTAO;
        }
        return t - 1;
      });
    }, 1000);

    return limparTimer;
  }, [fase, indice]);

  function avancar(resposta) {
    limparTimer();
    const novas = [...respostas, resposta];
    setRespostas(novas);

    if (indice + 1 >= questoes.length) {
      setFase('resultado');
    } else {
      setIndice(i => i + 1);
      setTempo(TEMPO_QUESTAO);
    }
  }

  function repetir() {
    setFase('intro');
    setQuestoes([]);
    setRespostas([]);
    setIndice(0);
  }

  function irCadastrar() {
    navigation.navigate('Cadastro', { fromKnowledgeQuiz: true });
  }

  // ── Render ──
  if (fase === 'intro') {
    return (
      <SafeAreaView style={styles.safe}>
        <TelaIntro area={area} onStart={iniciar} />
      </SafeAreaView>
    );
  }

  if (fase === 'loading') {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color="#0177b5" style={{ marginTop: 80 }} />
        <Text style={styles.loadingTxt}>Cargando preguntas...</Text>
      </SafeAreaView>
    );
  }

  if (fase === 'questao' && questoes[indice]) {
    return (
      <SafeAreaView style={styles.safe}>
        <TelaQuestao
          questao={questoes[indice]}
          numero={indice + 1}
          total={questoes.length}
          tempo={tempo}
          onResponder={avancar}
        />
      </SafeAreaView>
    );
  }

  if (fase === 'resultado') {
    return (
      <SafeAreaView style={styles.safe}>
        <TelaResultado
          questoes={questoes}
          respostas={respostas}
          onCadastrar={irCadastrar}
          onRepetir={repetir}
        />
      </SafeAreaView>
    );
  }

  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function areaLabel(area) {
  const m = {
    policia:       'Seguridad Pública',
    juridico:      'Derecho',
    saude:         'Salud',
    fiscal:        'Tributario / SAT',
    ti:            'Tecnología',
    administrativo:'Administración Pública',
  };
  return m[area] || area;
}

function nivelEmoji(d) {
  return d === 'facil' ? '🟢' : d === 'medio' ? '🟡' : '🔴';
}

function nivelStyle(d) {
  const c = d === 'facil' ? '#16a34a' : d === 'medio' ? '#d97706' : '#dc2626';
  return { color: c };
}

function mensagemResultado(pct) {
  if (pct >= 80) return '¡Excelente! Tienes un nivel muy alto. Regístrate para seguir progresando.';
  if (pct >= 60) return 'Buen desempeño. Con práctica llegarás al máximo nivel.';
  if (pct >= 40) return 'Vas por buen camino. Estudiar con nuestra plataforma acelerará tu progreso.';
  return '¡No te rindas! Crea tu cuenta y accede a material de estudio completo.';
}

// ─── Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:          { flex: 1, backgroundColor: '#f9fafb' },
  bold:          { fontWeight: '800' },

  // Intro
  introWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  introEmoji:    { fontSize: 56, marginBottom: 12 },
  introTitulo:   { fontSize: 26, fontWeight: '900', color: '#111827', textAlign: 'center', marginBottom: 10 },
  introSub:      { fontSize: 15, color: '#4b5563', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  introBox:      { backgroundColor: '#fff', borderRadius: 14, padding: 20, width: '100%', marginBottom: 28,
                   shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  infoRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoEmoji:     { fontSize: 18, marginRight: 10 },
  infoTxt:       { fontSize: 14, color: '#374151' },
  btnIniciar:    { backgroundColor: '#01497a', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 40 },
  btnIniciarTxt: { color: '#fff', fontSize: 17, fontWeight: '800' },

  // Loading
  loadingTxt:    { textAlign: 'center', color: '#6b7280', marginTop: 16, fontSize: 15 },

  // Questão
  questaoWrap:   { padding: 20, paddingBottom: 40 },
  baraBg:        { height: 6, backgroundColor: '#e5e7eb', borderRadius: 4, marginBottom: 16 },
  baraFill:      { height: 6, borderRadius: 4 },
  questaoNum:    { fontSize: 13, color: '#6b7280', marginBottom: 2 },
  questaoTempo:  { fontSize: 13, color: '#6b7280', marginBottom: 6 },
  questaoNivel:  { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 12 },
  questaoEnunciado: { fontSize: 17, fontWeight: '700', color: '#111827', lineHeight: 25, marginBottom: 24 },
  opcao:         { backgroundColor: '#fff', borderRadius: 12, flexDirection: 'row', alignItems: 'center',
                   padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: '#e5e7eb',
                   shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  opcaoSel:      { borderColor: '#01497a', backgroundColor: '#eff6ff' },
  opcaoLetra:    { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f3f4f6',
                   alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  opcaoLetraSel: { backgroundColor: '#01497a' },
  opcaoLetraTxt: { fontWeight: '800', fontSize: 14, color: '#374151' },
  opcaoTxt:      { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
  opcaoTxtSel:   { color: '#01497a', fontWeight: '700' },

  // Resultado
  resultadoWrap:   { padding: 20 },
  resultadoEmoji:  { fontSize: 60, textAlign: 'center', marginTop: 20, marginBottom: 8 },
  resultadoTitulo: { fontSize: 28, fontWeight: '900', textAlign: 'center', color: '#111827' },
  resultadoPct:    { fontSize: 42, fontWeight: '900', textAlign: 'center', color: '#01497a', marginBottom: 8 },
  resultadoMsg:    { fontSize: 15, color: '#4b5563', textAlign: 'center', lineHeight: 22, marginBottom: 28 },

  gabItem:       { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 12,
                   borderWidth: 1, borderColor: '#e5e7eb' },
  gabHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  gabNum:        { fontWeight: '800', fontSize: 13, color: '#6b7280' },
  gabNivel:      { fontSize: 14 },
  gabEnunciado:  { fontSize: 13, color: '#374151', marginBottom: 6 },
  gabCorreta:    { fontSize: 13, color: '#16a34a' },
  gabErro:       { fontSize: 13, color: '#dc2626', marginTop: 4 },
  gabExplicacao: { fontSize: 12, color: '#6b7280', marginTop: 6, fontStyle: 'italic' },

  ctaBox:        { backgroundColor: '#01497a', borderRadius: 16, padding: 24, marginTop: 28, marginBottom: 16 },
  ctaTitulo:     { fontSize: 20, fontWeight: '900', color: '#fff', marginBottom: 8 },
  ctaSub:        { fontSize: 14, color: 'rgba(255,255,255,0.85)', lineHeight: 20, marginBottom: 20 },
  btnCadastrar:  { backgroundColor: '#fff', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnCadastrarTxt:{ color: '#01497a', fontWeight: '800', fontSize: 16 },

  btnRepetir:    { borderWidth: 1.5, borderColor: '#01497a', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  btnRepetirTxt: { color: '#01497a', fontWeight: '700', fontSize: 15 },
});
