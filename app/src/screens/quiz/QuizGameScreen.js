// src/screens/quiz/QuizGameScreen.js
// Quiz completo con 5 preguntas y competencia contra la IA
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, SafeAreaView, Alert, Animated,
} from 'react-native';
import { RewardedAd, RewardedAdEventType, AdEventType } from 'react-native-google-mobile-ads';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuiz } from '../../context/QuizContext';
import { fetchQuestoesQuiz, simularRespostasIA } from '../../services/quizService';
import { shouldShowNPS } from '../../components/NPSModal';
import { ADMOB_IDS } from '../../constants/data';

const OPCOES = ['a', 'b', 'c', 'd'];
const LABEL_OPCAO = { a: 'A', b: 'B', c: 'C', d: 'D' };
const TEMPO_POR_QUESTAO = 20;
const TOTAL_QUESTOES = 5;

const rewarded = RewardedAd.createForAdRequest(ADMOB_IDS.REWARDED, {
  keywords: ['empleo gobierno', 'convocatoria', 'curso preparacion'],
});

function TelaIntro({ onStart, area }) {
  return (
    <View style={styles.introContainer}>
      <Text style={styles.introEmoji}>🧠</Text>
      <Text style={styles.introTitulo}>¡Prueba tu conocimiento!</Text>
      <Text style={styles.introSub}>
        Responde <Text style={styles.bold}>5 preguntas</Text> sobre{' '}
        <Text style={styles.bold}>{area || 'servicio público'}</Text> y compite contra la IA.
      </Text>
      <View style={styles.introInfoBox}>
        <InfoRow emoji="🟢" texto="1 pregunta fácil" />
        <InfoRow emoji="🟡" texto="1 pregunta media" />
        <InfoRow emoji="🔴" texto="3 preguntas difíciles" />
        <InfoRow emoji="⏱️" texto={`${TEMPO_POR_QUESTAO} segundos por pregunta`} />
        <InfoRow emoji="🤖" texto="La IA también responde — ¿quién gana?" />
      </View>
      <TouchableOpacity style={styles.btnIniciar} onPress={onStart} activeOpacity={0.85}>
        <Text style={styles.btnIniciarText}>Comenzar el quiz →</Text>
      </TouchableOpacity>
    </View>
  );
}

function InfoRow({ emoji, texto }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoEmoji}>{emoji}</Text>
      <Text style={styles.infoTexto}>{texto}</Text>
    </View>
  );
}

function TelaQuestao({ questao, numero, total, onResponder, tempoRestante }) {
  const [selecionada, setSelecionada] = useState(null);
  const progresso = tempoRestante / TEMPO_POR_QUESTAO;
  const corBarra = tempoRestante > 10 ? '#2d8a3e' : tempoRestante > 5 ? '#FFB800' : '#FF4444';
  return (
    <ScrollView style={styles.questaoScroll} contentContainerStyle={styles.questaoContainer}>
      <View style={styles.tempoRow}>
        <View style={styles.tempoTrack}>
          <View style={[styles.tempoFill, { width: `${progresso * 100}%`, backgroundColor: corBarra }]} />
        </View>
        <Text style={[styles.tempoTexto, tempoRestante <= 5 && styles.tempoTextoUrgente]}>⏱ {tempoRestante}s</Text>
      </View>
      <Text style={styles.questaoProgresso}>Pregunta {numero} de {total}</Text>
      <Text style={styles.dificuldadeLabel}>
        {questao.dificuldade === 'facil' ? '🟢 Fácil' : questao.dificuldade === 'medio' ? '🟡 Media' : '🔴 Difícil'}
      </Text>
      <Text style={styles.enunciado}>{questao.enunciado}</Text>
      {OPCOES.map(letra => (
        <TouchableOpacity key={letra} style={[styles.opcao, selecionada === letra && styles.opcaoSelecionada]} onPress={() => setSelecionada(letra)} activeOpacity={0.7}>
          <View style={[styles.opcaoLetra, selecionada === letra && styles.opcaoLetraSelecionada]}>
            <Text style={[styles.opcaoLetraTexto, selecionada === letra && { color: '#FFF' }]}>{LABEL_OPCAO[letra]}</Text>
          </View>
          <Text style={[styles.opcaoTexto, selecionada === letra && styles.opcaoTextoSelecionado]}>{questao[`opcao_${letra}`]}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={[styles.btnConfirmar, !selecionada && styles.btnConfirmarDisabled]} onPress={() => selecionada && onResponder(selecionada)} activeOpacity={selecionada ? 0.85 : 1}>
        <Text style={styles.btnConfirmarTexto}>{numero === total ? 'Finalizar →' : 'Confirmar →'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function TelaGateAd({ onAssistir, onSkip, adReady, showing }) {
  const [showSkip, setShowSkip] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => { if (!adReady) setShowSkip(true); }, 8000);
    return () => clearTimeout(t);
  }, [adReady]);
  return (
    <View style={styles.gateContainer}>
      <View style={styles.gateCard}>
        <Text style={styles.gateEmoji}>🎯</Text>
        <Text style={styles.gateTitulo}>¡Quiz completado!</Text>
        <Text style={styles.gateSub}>Mira un video corto para descubrir qué tan preparado estás.</Text>
        {!adReady && !showing && !showSkip && (
          <View style={{ alignItems: 'center', padding: 16 }}>
            <ActivityIndicator color="#FF8C40" size="small" />
            <Text style={styles.gateLoadingTexto}>Preparando tu resultado...</Text>
          </View>
        )}
        {adReady && !showing && (
          <TouchableOpacity style={styles.gateBtnAd} onPress={onAssistir} activeOpacity={0.88}>
            <Text style={styles.gateBtnAdTexto}>▶ Ver qué tan preparado estás</Text>
          </TouchableOpacity>
        )}
        {showSkip && !adReady && !showing && (
          <TouchableOpacity style={styles.gateSkipBtn} onPress={onSkip} activeOpacity={0.85}>
            <Text style={styles.gateSkipText}>Saltar y ver resultado →</Text>
          </TouchableOpacity>
        )}
        {showing && (
          <View style={{ alignItems: 'center', padding: 16 }}>
            <ActivityIndicator color="#FF8C40" size="small" />
            <Text style={styles.gateLoadingTexto}>Mostrando video...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function TelaResultado({ questoes, respostasUsuario, respostasIA, onReiniciar, onVoltar }) {
  const acertosUsuario = questoes.filter((q, i) => respostasUsuario[i] === q.resposta_correta).length;
  const acertosIA = questoes.filter((q, i) => respostasIA[i] === q.resposta_correta).length;
  const venceu = acertosUsuario >= acertosIA;
  return (
    <ScrollView style={styles.resultadoScroll} contentContainerStyle={styles.resultadoContainer}>
      <Text style={styles.resultadoEmoji}>{venceu ? '🏆' : '🤖'}</Text>
      <Text style={styles.resultadoTitulo}>{venceu ? '¡Ganaste!' : '¡La IA ganó esta vez!'}</Text>
      {acertosUsuario < 3 && (
        <View style={styles.mediaAviso}><Text style={styles.mediaAvisoTexto}>📉 Quedaste debajo del promedio (menos de 3 aciertos)</Text></View>
      )}
      <View style={styles.placarRow}>
        <View style={[styles.placarBox, venceu && styles.placarBoxVencedor]}>
          <Text style={styles.placarEmoji}>👤</Text>
          <Text style={styles.placarNome}>Tú</Text>
          <Text style={styles.placarPontos}>{acertosUsuario}/{TOTAL_QUESTOES}</Text>
        </View>
        <Text style={styles.placarVs}>VS</Text>
        <View style={[styles.placarBox, !venceu && styles.placarBoxVencedor]}>
          <Text style={styles.placarEmoji}>🤖</Text>
          <Text style={styles.placarNome}>IA</Text>
          <Text style={styles.placarPontos}>{acertosIA}/{TOTAL_QUESTOES}</Text>
        </View>
      </View>
      <Text style={styles.gabaritoTitulo}>Respuestas</Text>
      {questoes.map((q, i) => {
        const ok = respostasUsuario[i] === q.resposta_correta;
        const iaOk = respostasIA[i] === q.resposta_correta;
        return (
          <View key={q.id} style={styles.gabaritoCard}>
            <View style={styles.gabaritoHeader}>
              <Text style={styles.gabaritoNumero}>P{i + 1}</Text>
              <Text>{q.dificuldade === 'facil' ? '🟢' : q.dificuldade === 'medio' ? '🟡' : '🔴'}</Text>
              <View style={styles.gabaritoIcons}>
                <Text>{ok ? '✅' : '❌'} Tú</Text>
                <Text style={{ marginLeft: 10 }}>{iaOk ? '✅' : '❌'} IA</Text>
              </View>
            </View>
            <Text style={styles.gabaritoEnunciado} numberOfLines={2}>{q.enunciado}</Text>
            <Text style={styles.gabaritoResposta}>Correcta: <Text style={styles.bold}>{LABEL_OPCAO[q.resposta_correta]}) {q[`opcao_${q.resposta_correta}`]}</Text></Text>
            {!ok && respostasUsuario[i] && <Text style={styles.gabaritoErro}>Tú: {LABEL_OPCAO[respostasUsuario[i]]}) {q[`opcao_${respostasUsuario[i]}`]}</Text>}
            {!respostasUsuario[i] && <Text style={styles.gabaritoErro}>Tiempo agotado</Text>}
          </View>
        );
      })}
      <TouchableOpacity style={styles.btnTentarNovamente} onPress={onReiniciar} activeOpacity={0.85}>
        <Text style={styles.btnTentarTexto}>🔄 Intentar de nuevo</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btnVoltar} onPress={onVoltar} activeOpacity={0.85}>
        <Text style={styles.btnVoltarTexto}>← Volver a convocatorias</Text>
      </TouchableOpacity>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

export default function QuizGameScreen({ navigation }) {
  const { answers } = useQuiz();
  const [fase, setFase] = useState('intro');
  const [questoes, setQuestoes] = useState([]);
  const [respostasUsuario, setRespostasUsuario] = useState([]);
  const [respostasIA, setRespostasIA] = useState([]);
  const [indice, setIndice] = useState(0);
  const [tempo, setTempo] = useState(TEMPO_POR_QUESTAO);
  const [adReady, setAdReady] = useState(false);
  const [adShowing, setAdShowing] = useState(false);
  const timerRef = useRef(null);
  const rewardGanhoRef = useRef(false);

  useEffect(() => {
    const u1 = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => setAdReady(true));
    const u2 = rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => { rewardGanhoRef.current = true; });
    const u3 = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      setAdReady(false); setAdShowing(false);
      if (rewardGanhoRef.current) { rewardGanhoRef.current = false; setFase('resultado'); salvarStats(questoes, respostasUsuario); }
      rewarded.load();
    });
    const u4 = rewarded.addAdEventListener(AdEventType.ERROR, () => {
      setAdShowing(false); setAdReady(false); rewardGanhoRef.current = false;
      setFase('resultado'); salvarStats(questoes, respostasUsuario);
    });
    rewarded.load();
    return () => { u1(); u2(); u3(); u4(); };
  }, []);

  function limparTimer() { if (timerRef.current) clearInterval(timerRef.current); }

  async function salvarStats(qs, resps) {
    try {
      const acertos = qs.filter((q, i) => resps[i] === q.resposta_correta).length;
      const prevDone = parseInt(await AsyncStorage.getItem('@plazaya:quizzes_done')) || 0;
      const prevCorrect = parseInt(await AsyncStorage.getItem('@plazaya:total_correct')) || 0;
      const prevTotal = parseInt(await AsyncStorage.getItem('@plazaya:total_questions')) || 0;
      await AsyncStorage.setItem('@plazaya:quizzes_done', String(prevDone + 1));
      await AsyncStorage.setItem('@plazaya:total_correct', String(prevCorrect + acertos));
      await AsyncStorage.setItem('@plazaya:total_questions', String(prevTotal + qs.length));
    } catch {}
  }

  async function iniciarQuiz() {
    setFase('loading');
    try {
      const qs = await fetchQuestoesQuiz(answers.area);
      if (!qs || qs.length === 0) { Alert.alert('Error', 'No fue posible cargar las preguntas.'); setFase('intro'); return; }
      setQuestoes(qs); setRespostasIA(simularRespostasIA(qs)); setRespostasUsuario([]); setIndice(0); setTempo(TEMPO_POR_QUESTAO); setFase('questao');
    } catch { Alert.alert('Error', 'No fue posible cargar las preguntas.'); setFase('intro'); }
  }

  function responder(letra) {
    limparTimer();
    const novas = [...respostasUsuario, letra];
    setRespostasUsuario(novas);
    if (indice + 1 < questoes.length) { setIndice(indice + 1); setTempo(TEMPO_POR_QUESTAO); }
    else { setFase('gate'); }
  }

  useEffect(() => {
    if (fase !== 'questao') return;
    limparTimer();
    timerRef.current = setInterval(() => {
      setTempo(prev => { if (prev <= 1) { clearInterval(timerRef.current); responder(null); return TEMPO_POR_QUESTAO; } return prev - 1; });
    }, 1000);
    return () => limparTimer();
  }, [fase, indice]);

  async function assistirAd() {
    if (!adReady) return;
    rewardGanhoRef.current = false; setAdShowing(true);
    try { await rewarded.show(); } catch { setAdShowing(false); setFase('resultado'); salvarStats(questoes, respostasUsuario); }
  }

  async function handleVoltarComNPS() {
    const deveNPS = await shouldShowNPS();
    if (deveNPS) navigation.navigate('Home', { triggerNPS: true });
    else navigation.goBack();
  }

  if (fase === 'intro') return (
    <SafeAreaView style={styles.safe}>
      <TouchableOpacity style={styles.btnFechar} onPress={() => navigation.goBack()}>
        <Text style={styles.btnFecharTexto}>✕</Text>
      </TouchableOpacity>
      <TelaIntro onStart={iniciarQuiz} area={answers.area} />
    </SafeAreaView>
  );
  if (fase === 'loading') return (<SafeAreaView style={[styles.safe, styles.center]}><ActivityIndicator color="#FF6B35" size="large" /><Text style={styles.loadingTexto}>Preparando las preguntas...</Text></SafeAreaView>);
  if (fase === 'questao' && questoes[indice]) return (<SafeAreaView style={styles.safe}><TelaQuestao questao={questoes[indice]} numero={indice + 1} total={questoes.length} tempoRestante={tempo} onResponder={responder} /></SafeAreaView>);
  if (fase === 'gate') return (<SafeAreaView style={styles.safe}><TelaGateAd onAssistir={assistirAd} onSkip={() => { setFase('resultado'); salvarStats(questoes, respostasUsuario); }} adReady={adReady} showing={adShowing} /></SafeAreaView>);
  if (fase === 'resultado') return (<SafeAreaView style={styles.safe}><TelaResultado questoes={questoes} respostasUsuario={respostasUsuario} respostasIA={respostasIA} onReiniciar={iniciarQuiz} onVoltar={handleVoltarComNPS} /></SafeAreaView>);
  return null;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F6F9' },
  center: { justifyContent: 'center', alignItems: 'center' },
  bold: { fontWeight: '800' },
  btnFechar: { position: 'absolute', top: 50, right: 20, zIndex: 10, width: 36, height: 36, borderRadius: 18, backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  btnFecharTexto: { fontSize: 18, color: '#6B7280', fontWeight: '800' },
  loadingTexto: { fontSize: 16, color: '#6B7280', marginTop: 16, fontWeight: '600' },
  introContainer: { flex: 1, justifyContent: 'center', padding: 24 },
  introEmoji: { fontSize: 64, textAlign: 'center', marginBottom: 16 },
  introTitulo: { fontSize: 28, fontWeight: '900', color: '#1A2332', textAlign: 'center', marginBottom: 12 },
  introSub: { fontSize: 16, color: '#4B5563', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  introInfoBox: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 32, elevation: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  infoEmoji: { fontSize: 18, marginRight: 10 },
  infoTexto: { fontSize: 14, color: '#374151' },
  btnIniciar: { backgroundColor: '#FF6B35', borderRadius: 16, paddingVertical: 18, alignItems: 'center', elevation: 4 },
  btnIniciarText: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  questaoScroll: { flex: 1 },
  questaoContainer: { padding: 20 },
  tempoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  tempoTrack: { flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  tempoFill: { height: '100%', borderRadius: 4 },
  tempoTexto: { fontSize: 16, fontWeight: '800', color: '#374151', minWidth: 50 },
  tempoTextoUrgente: { color: '#FF4444' },
  questaoProgresso: { fontSize: 13, color: '#9CA3AF', fontWeight: '600', marginBottom: 4 },
  dificuldadeLabel: { fontSize: 13, fontWeight: '700', marginBottom: 16 },
  enunciado: { fontSize: 16, color: '#1A2332', lineHeight: 24, marginBottom: 20, fontWeight: '500' },
  opcao: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 2, borderColor: '#E5E7EB', elevation: 1 },
  opcaoSelecionada: { borderColor: '#FF6B35', backgroundColor: '#FFF7F5' },
  opcaoLetra: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  opcaoLetraSelecionada: { backgroundColor: '#FF6B35' },
  opcaoLetraTexto: { fontWeight: '800', fontSize: 14, color: '#374151' },
  opcaoTexto: { flex: 1, fontSize: 14, color: '#374151', lineHeight: 20 },
  opcaoTextoSelecionado: { color: '#FF6B35', fontWeight: '600' },
  btnConfirmar: { backgroundColor: '#FF6B35', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12, elevation: 4 },
  btnConfirmarDisabled: { backgroundColor: '#D1D5DB' },
  btnConfirmarTexto: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  gateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  gateCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 28, alignItems: 'center', width: '100%', elevation: 6 },
  gateEmoji: { fontSize: 56, marginBottom: 12 },
  gateTitulo: { fontSize: 22, fontWeight: '900', color: '#1A2332', textAlign: 'center', marginBottom: 8 },
  gateSub: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  gateLoadingTexto: { fontSize: 14, color: '#6B7280', marginTop: 10, fontWeight: '600' },
  gateBtnAd: { backgroundColor: '#1A2332', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 24, width: '100%', alignItems: 'center', elevation: 4 },
  gateBtnAdTexto: { color: '#FF6B35', fontSize: 15, fontWeight: '900' },
  gateSkipBtn: { marginTop: 16, paddingVertical: 12 },
  gateSkipText: { color: '#9CA3AF', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  resultadoScroll: { flex: 1 },
  resultadoContainer: { padding: 20, alignItems: 'center' },
  resultadoEmoji: { fontSize: 64, marginTop: 20, marginBottom: 8 },
  resultadoTitulo: { fontSize: 26, fontWeight: '900', color: '#1A2332', marginBottom: 12 },
  mediaAviso: { backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10, marginBottom: 16, width: '100%' },
  mediaAvisoTexto: { color: '#92400E', fontSize: 13, textAlign: 'center', fontWeight: '600' },
  placarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 28, gap: 12 },
  placarBox: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 18, alignItems: 'center', elevation: 2, borderWidth: 2, borderColor: 'transparent' },
  placarBoxVencedor: { borderColor: '#FF6B35', backgroundColor: '#FFF7F5' },
  placarEmoji: { fontSize: 32, marginBottom: 6 },
  placarNome: { fontSize: 13, color: '#6B7280', fontWeight: '600', marginBottom: 4 },
  placarPontos: { fontSize: 28, fontWeight: '900', color: '#1A2332' },
  placarVs: { fontSize: 18, fontWeight: '900', color: '#9CA3AF' },
  gabaritoTitulo: { fontSize: 18, fontWeight: '900', color: '#1A2332', alignSelf: 'flex-start', marginBottom: 14 },
  gabaritoCard: { backgroundColor: '#FFF', borderRadius: 14, padding: 14, marginBottom: 10, width: '100%', elevation: 1 },
  gabaritoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  gabaritoNumero: { fontWeight: '800', fontSize: 14, color: '#374151' },
  gabaritoIcons: { flexDirection: 'row', marginLeft: 'auto' },
  gabaritoEnunciado: { fontSize: 13, color: '#4B5563', marginBottom: 6, lineHeight: 18 },
  gabaritoResposta: { fontSize: 12, color: '#059669' },
  gabaritoErro: { fontSize: 12, color: '#DC2626', marginTop: 2 },
  btnTentarNovamente: { backgroundColor: '#FF6B35', borderRadius: 14, paddingVertical: 15, paddingHorizontal: 40, marginTop: 24, elevation: 4 },
  btnTentarTexto: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  btnVoltar: { marginTop: 12, paddingVertical: 12 },
  btnVoltarTexto: { color: '#6B7280', fontSize: 14, fontWeight: '600' },
});
