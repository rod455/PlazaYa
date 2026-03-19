// src/screens/knowledge/KnowledgeQuizScreen.js
// Quiz de conhecimentos — navbar visível, ad intersticial antes do resultado
// Questões do banco Supabase com fallback local

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Animated, SafeAreaView, ScrollView, Modal,
} from 'react-native';
import { InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';
import { ADMOB_IDS } from '../../constants/data';

const COLORS = {
  primary: '#0177b5', primaryDark: '#01497a',
  bg: '#f4f6f9', card: '#fff',
  text: '#1a2332', textMuted: '#6b7280',
  border: '#e5e7eb', success: '#16a34a',
  danger: '#dc2626', warning: '#d97706',
};

// ✅ FIX: Sempre usa o ID real — sem fallback para TestIds
const INTERSTITIAL_ID = ADMOB_IDS.INTERSTITIAL;

const TEMPO = 20;

const FALLBACK = [
  { id:'f1', enunciado:'¿Cuál es la tasa general del IVA en México?', opcao_a:'10%', opcao_b:'12%', opcao_c:'15%', opcao_d:'16%', resposta_correta:'d', dificuldade:'facil', explicacao:'La tasa general del IVA en México es del 16%.' },
  { id:'f2', enunciado:'¿Qué artículo de la Constitución establece los derechos del detenido?', opcao_a:'Art. 14', opcao_b:'Art. 16', opcao_c:'Art. 20', opcao_d:'Art. 22', resposta_correta:'c', dificuldade:'medio', explicacao:'El artículo 20 establece los derechos del imputado.' },
  { id:'f3', enunciado:'¿Cuál es el plazo para la declaración anual de personas físicas?', opcao_a:'Enero', opcao_b:'Febrero', opcao_c:'Marzo', opcao_d:'Abril', resposta_correta:'d', dificuldade:'medio', explicacao:'Personas físicas tienen hasta el 30 de abril.' },
  { id:'f4', enunciado:'¿Qué institución regula los medicamentos en México?', opcao_a:'IMSS', opcao_b:'COFEPRIS', opcao_c:'SSA', opcao_d:'ISSSTE', resposta_correta:'b', dificuldade:'facil', explicacao:'COFEPRIS regula los medicamentos.' },
  { id:'f5', enunciado:'Mínimo de días de aguinaldo con 1 año de antigüedad según la LFT:', opcao_a:'10 días', opcao_b:'15 días', opcao_c:'20 días', opcao_d:'30 días', resposta_correta:'b', dificuldade:'dificil', explicacao:'El artículo 87 de la LFT establece mínimo 15 días.' },
];

export default function KnowledgeQuizScreen() {
  const nav = useNavigation();
  const [fase, setFase]           = useState('intro');
  const [questoes, setQuestoes]   = useState([]);
  const [idx, setIdx]             = useState(0);
  const [selecionada, setSel]     = useState(null);
  const [acertos, setAcertos]     = useState(0);
  const [loading, setLoading]     = useState(true);
  const [tempo, setTempo]         = useState(TEMPO);
  const [respostas, setRespostas] = useState([]);
  const [adReady, setAdReady]     = useState(false);
  const [modalDetalhe, setModalDetalhe] = useState(null); // { questao, resposta }
  const [respostaIA, setRespostaIA] = useState(null);
  const [pontosIA, setPontosIA]   = useState(0);

  const timerRef     = useRef(null);
  const progAnim     = useRef(new Animated.Value(1)).current;
  const interstitial = useRef(null);

  // Carrega questões
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('questions').select('*').eq('ativo', true).limit(30);
        const pool = data && data.length >= 5 ? data : FALLBACK;
        setQuestoes([...pool].sort(() => Math.random() - 0.5).slice(0, 5));
      } catch {
        setQuestoes(FALLBACK);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Intersticial
  useEffect(() => {
    try {
      const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
        requestNonPersonalizedAdsOnly: true,
      });
      interstitial.current = ad;
      const u1 = ad.addAdEventListener(AdEventType.LOADED, () => setAdReady(true));
      const u2 = ad.addAdEventListener(AdEventType.CLOSED, () => setFase('resultado'));
      const u3 = ad.addAdEventListener(AdEventType.ERROR,  () => {
        setAdReady(false);
        setFase('resultado');
      });
      ad.load();
      return () => { try { u1(); u2(); u3(); } catch {} };
    } catch (e) {
      console.warn('Ad init error:', e);
    }
  }, []);

  // Timer
  const iniciarTimer = useCallback(() => {
    clearInterval(timerRef.current);
    setTempo(TEMPO);
    Animated.timing(progAnim, { toValue: 1, duration: 0, useNativeDriver: false }).start();
    Animated.timing(progAnim, { toValue: 0, duration: TEMPO * 1000, useNativeDriver: false }).start();
    timerRef.current = setInterval(() => {
      setTempo(t => {
        if (t <= 1) { clearInterval(timerRef.current); responder(null); return 0; }
        return t - 1;
      });
    }, 1000);
  }, [idx]);

  useEffect(() => {
    if (fase === 'quiz') iniciarTimer();
    return () => clearInterval(timerRef.current);
  }, [fase, idx]);

  // IA escolhe resposta: acerta 65% das vezes
  const iaEscolher = useCallback((q) => {
    const opcoes = ['a', 'b', 'c', 'd'];
    const acerta = Math.random() < 0.65;
    if (acerta) return q.resposta_correta;
    const erradas = opcoes.filter(o => o !== q.resposta_correta);
    return erradas[Math.floor(Math.random() * erradas.length)];
  }, []);

  const responder = useCallback((opcao) => {
    clearInterval(timerRef.current);
    const q = questoes[idx];
    if (!q || selecionada !== null) return;
    const correta = opcao !== null && opcao === q.resposta_correta;
    const iaOpcao = iaEscolher(q);
    const iaCorreta = iaOpcao === q.resposta_correta;
    setSel(opcao ?? 'timeout');
    setRespostaIA(iaOpcao);
    if (correta) setAcertos(a => a + 1);
    if (iaCorreta) setPontosIA(p => p + 1);
    setRespostas(r => [...r, { correta, opcao, iaOpcao, iaCorreta, esperada: q.resposta_correta, explicacao: q.explicacao }]);

    setTimeout(() => {
      if (idx + 1 >= questoes.length) {
        // Mostra ad antes do resultado — só se realmente carregado
        if (adReady && interstitial.current) {
          try {
            interstitial.current.show()
              .catch(() => setFase('resultado'));
          } catch {
            setFase('resultado');
          }
        } else {
          setFase('resultado');
        }
      } else {
        setIdx(i => i + 1);
        setSel(null);
        setRespostaIA(null);
      }
    }, 1400);
  }, [selecionada, idx, questoes, adReady]);

  const reiniciar = () => {
    setIdx(0); setAcertos(0); setSel(null);
    setRespostas([]); setPontosIA(0); setRespostaIA(null); setFase('intro');
    // Recarrega o ad
    interstitial.current?.load();
    setAdReady(false);
  };

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (fase === 'intro') {
    const facil   = questoes.filter(q => q.dificuldade === 'facil').length;
    const medio   = questoes.filter(q => q.dificuldade === 'medio').length;
    const dificil = questoes.filter(q => q.dificuldade === 'dificil').length;
    return (
      <SafeAreaView style={s.container}>
        <View style={s.introWrap}>
          <Text style={s.introEmoji}>🧠</Text>
          <Text style={s.introTitle}>¡Prueba tus conocimientos!</Text>
          <Text style={s.introSub}>
            Responde <Text style={{ fontWeight: '900' }}>5 preguntas</Text> y descubre tu nivel.
          </Text>
          <View style={s.infoCard}>
            {facil   > 0 && <Row dot={COLORS.success} txt={`${facil} pregunta${facil > 1 ? 's' : ''} fácil${facil > 1 ? 'es' : ''}`} />}
            {medio   > 0 && <Row dot={COLORS.warning} txt={`${medio} pregunta${medio > 1 ? 's' : ''} media${medio > 1 ? 's' : ''}`} />}
            {dificil > 0 && <Row dot={COLORS.danger}  txt={`${dificil} pregunta${dificil > 1 ? 's' : ''} difícil${dificil > 1 ? 'es' : ''}`} />}
            <Row icon="⏱" txt={`${TEMPO} segundos por pregunta`} />
          </View>
          <TouchableOpacity style={s.btnComenzar} onPress={() => setFase('quiz')} activeOpacity={0.85}>
            <Text style={s.btnComenzarTxt}>Comenzar →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnVolver} onPress={() => nav.goBack()}>
            <Text style={s.btnVolverTxt}>← Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── RESULTADO ──────────────────────────────────────────────────────────────
  if (fase === 'resultado') {
    const ganhou = acertos > pontosIA;
    const empate = acertos === pontosIA;
    const emoji  = ganhou ? '🏆' : empate ? '🤝' : '🤖';
    const titulo = ganhou ? '¡Ganaste a la IA!' : empate ? '¡Empate!' : '¡La IA te ganó!';
    const corUser = acertos > pontosIA ? COLORS.success : acertos < pontosIA ? COLORS.danger : COLORS.warning;
    const corIA   = pontosIA > acertos ? COLORS.success : pontosIA < acertos ? COLORS.danger : COLORS.warning;

    return (
      <SafeAreaView style={s.container}>
        <ScrollView contentContainerStyle={s.resultWrap}>
          <Text style={{ fontSize: 64, marginBottom: 8 }}>{emoji}</Text>
          <Text style={s.resultNivel}>{titulo}</Text>

          {/* Placar final */}
          <View style={s.finalScore}>
            <View style={s.finalBox}>
              <Text style={s.finalEmoji}>🧑</Text>
              <Text style={s.finalNome}>Tú</Text>
              <Text style={[s.finalPontos, { color: corUser }]}>{acertos}</Text>
              <Text style={s.finalDe}>de {questoes.length}</Text>
            </View>
            <Text style={s.finalVS}>VS</Text>
            <View style={s.finalBox}>
              <Text style={s.finalEmoji}>🤖</Text>
              <Text style={s.finalNome}>IA</Text>
              <Text style={[s.finalPontos, { color: corIA }]}>{pontosIA}</Text>
              <Text style={s.finalDe}>de {questoes.length}</Text>
            </View>
          </View>

          {/* Resumo por questão: usuário vs IA */}
          <View style={s.resumo}>
            <Text style={s.resumoTitulo}>Detalle de respuestas</Text>
            {respostas.map((r, i) => {
              const q = questoes[i];
              const opcoes = { a: q?.opcao_a, b: q?.opcao_b, c: q?.opcao_c, d: q?.opcao_d };
              const txtCorreta = opcoes[r.esperada];
              return (
                <TouchableOpacity
                  key={i}
                  style={[s.resumoItem, !r.correta && s.resumoItemErro]}
                  onPress={() => !r.correta && setModalDetalhe({ questao: q, resposta: r })}
                  activeOpacity={r.correta ? 1 : 0.8}
                >
                  <Text style={s.resumoNum}>P{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>
                      <View style={s.resumoPlayer}>
                        <Text style={s.resumoLabel}>🧑 Tú</Text>
                        <Text style={{ fontSize: 16 }}>{r.correta ? '✅' : '❌'}</Text>
                      </View>
                      <View style={s.resumoPlayer}>
                        <Text style={s.resumoLabel}>🤖 IA</Text>
                        <Text style={{ fontSize: 16 }}>{r.iaCorreta ? '✅' : '❌'}</Text>
                      </View>
                    </View>
                    <Text style={s.resumoCorreta}>
                      ✓ {txtCorreta}
                    </Text>
                    {!r.correta && (
                      <Text style={s.resumoTapHint}>Toca para ver detalle →</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={s.btnRepetir} onPress={reiniciar} activeOpacity={0.85}>
            <Text style={s.btnRepetirTxt}>🔄 Volver a intentarlo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnVolver} onPress={() => nav.goBack()}>
            <Text style={s.btnVolverTxt}>← Volver al inicio</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Modal detalhe da questão errada */}
        <Modal visible={!!modalDetalhe} transparent animationType="slide" onRequestClose={() => setModalDetalhe(null)}>
          <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => setModalDetalhe(null)}>
            <TouchableOpacity style={s.modalCard} activeOpacity={1} onPress={() => {}}>
              <Text style={s.modalTitulo}>📋 Detalle de la pregunta</Text>
              <Text style={s.modalPergunta}>{modalDetalhe?.questao?.enunciado}</Text>

              {/* Todas as alternativas */}
              {['a','b','c','d'].map(k => {
                const q = modalDetalhe?.questao;
                const txt = q?.[`opcao_${k}`];
                const esCorreta = k === modalDetalhe?.resposta?.esperada;
                const esUser = k === modalDetalhe?.resposta?.opcao;
                const esIA = k === modalDetalhe?.resposta?.iaOpcao;
                return (
                  <View key={k} style={[
                    s.modalOpcao,
                    esCorreta && s.modalOpcaoCorreta,
                    esUser && !esCorreta && s.modalOpcaoErrada,
                  ]}>
                    <Text style={s.modalOpcaoLetra}>{k.toUpperCase()}</Text>
                    <Text style={[s.modalOpcaoTxt, esCorreta && { color: '#16a34a', fontWeight: '800' }]} numberOfLines={3}>{txt}</Text>
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      {esUser && <Text style={{ fontSize: 12 }}>🧑</Text>}
                      {esIA   && <Text style={{ fontSize: 12 }}>🤖</Text>}
                      {esCorreta && <Text style={{ fontSize: 12 }}>✓</Text>}
                    </View>
                  </View>
                );
              })}

              {/* Explicação bloqueada */}
              <View style={s.explicacaoBlocked}>
                <View style={s.explicacaoBlockedHeader}>
                  <Text style={s.explicacaoBlockedIcon}>🔒</Text>
                  <Text style={s.explicacaoBlockedTitulo}>¿Por qué esta respuesta?</Text>
                </View>
                <Text style={s.explicacaoBlockedTxt} numberOfLines={3}>
                  {modalDetalhe?.questao?.explicacao}
                </Text>
                <View style={s.explicacaoBlockedOverlay}>
                  <Text style={s.explicacaoBlockedCTA}>Crea una cuenta para ver explicaciones</Text>
                </View>
              </View>

              <TouchableOpacity style={s.modalBtnFechar} onPress={() => setModalDetalhe(null)}>
                <Text style={s.modalBtnFecharTxt}>Cerrar</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

      </SafeAreaView>
    );
  }

  // ── QUIZ ───────────────────────────────────────────────────────────────────
  const q = questoes[idx];
  if (!q) return null;

  const OPCOES = [
    { key: 'a', txt: q.opcao_a },
    { key: 'b', txt: q.opcao_b },
    { key: 'c', txt: q.opcao_c },
    { key: 'd', txt: q.opcao_d },
  ];

  const corDif = q.dificuldade === 'facil' ? COLORS.success : q.dificuldade === 'medio' ? COLORS.warning : COLORS.danger;

  return (
    <SafeAreaView style={s.container}>
      {/* Barra de progresso do timer */}
      <View style={s.progressBar}>
        <Animated.View style={[s.progressFill, {
          width: progAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          backgroundColor: tempo <= 5 ? COLORS.danger : COLORS.primary,
        }]} />
      </View>

      <View style={s.quizWrap}>
        {/* Header: placar usuário vs IA */}
        <View style={s.scoreboard}>
          <View style={s.scoreBox}>
            <Text style={s.scoreEmoji}>🧑</Text>
            <Text style={s.scoreNome}>Tú</Text>
            <Text style={s.scorePontos}>{acertos}</Text>
          </View>
          <View style={s.scoreCenter}>
            <Text style={s.scoreVS}>VS</Text>
            <Text style={s.scoreRound}>{idx + 1}/{questoes.length}</Text>
          </View>
          <View style={s.scoreBox}>
            <Text style={s.scoreEmoji}>🤖</Text>
            <Text style={s.scoreNome}>IA</Text>
            <Text style={s.scorePontos}>{pontosIA}</Text>
          </View>
        </View>

        <Text style={[s.quizDif, { color: corDif, textAlign: 'center', marginBottom: 8 }]}>● {q.dificuldade?.toUpperCase()}</Text>
        <Text style={[s.quizTempo, { textAlign: 'center', marginBottom: 12, color: tempo <= 5 ? COLORS.danger : COLORS.primary }]}>⏱ {tempo}s</Text>

        <Text style={s.pergunta}>{q.enunciado}</Text>

        <View style={s.opcoes}>
          {OPCOES.map(({ key, txt }) => {
            // Após responder: destaca apenas as escolhas (sem verde/vermelho)
            const userEscolheu = selecionada === key;
            const iaEscolheu   = respostaIA === key;
            const ativa = !selecionada;

            return (
              <TouchableOpacity
                key={key}
                style={[
                  s.opcao,
                  userEscolheu && s.opcaoUser,
                  iaEscolheu && !userEscolheu && s.opcaoIA,
                  userEscolheu && iaEscolheu && s.opcaoAmbos,
                ]}
                onPress={() => responder(key)}
                disabled={selecionada !== null}
                activeOpacity={0.8}
              >
                <View style={[s.opcaoLetra, {
                  backgroundColor: userEscolheu || iaEscolheu ? COLORS.primary : COLORS.border,
                }]}>
                  <Text style={s.opcaoLetraTxt}>{key.toUpperCase()}</Text>
                </View>
                <Text style={[s.opcaoTxt, { color: (userEscolheu || iaEscolheu) ? COLORS.primary : COLORS.text }]} numberOfLines={3}>{txt}</Text>
                {/* Ícones mostrando quem escolheu */}
                {selecionada && (
                  <View style={s.opcaoIcons}>
                    {userEscolheu && <Text style={s.iconUser}>🧑</Text>}
                    {iaEscolheu   && <Text style={s.iconIA}>🤖</Text>}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Após responder: mostra mini resultado da rodada */}
        {selecionada && (
          <View style={s.rodadaResult}>
            <View style={s.rodadaItem}>
              <Text style={s.rodadaEmoji}>🧑</Text>
              <Text style={[s.rodadaTxt, { color: selecionada === q.resposta_correta ? COLORS.success : COLORS.danger }]}>
                {selecionada === q.resposta_correta ? 'Acertaste ✓' : 'Fallaste ✗'}
              </Text>
            </View>
            <View style={s.rodadaSep} />
            <View style={s.rodadaItem}>
              <Text style={s.rodadaEmoji}>🤖</Text>
              <Text style={[s.rodadaTxt, { color: respostaIA === q.resposta_correta ? COLORS.success : COLORS.danger }]}>
                {respostaIA === q.resposta_correta ? 'Acertó ✓' : 'Falló ✗'}
              </Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function Row({ dot, icon, txt }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      {dot  && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: dot }} />}
      {icon && <Text style={{ fontSize: 14 }}>{icon}</Text>}
      <Text style={{ fontSize: 14, color: '#1a2332' }}>{txt}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f4f6f9' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center' },
  introWrap:    { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  introEmoji:   { fontSize: 56, marginBottom: 16 },
  introTitle:   { fontSize: 26, fontWeight: '900', color: '#1a2332', textAlign: 'center', marginBottom: 8 },
  introSub:     { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  infoCard:     { backgroundColor: '#fff', borderRadius: 16, padding: 20, width: '100%', marginBottom: 28,
                  shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  btnComenzar:  { backgroundColor: '#0177b5', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 48,
                  shadowColor: '#01497a', shadowOpacity: 0.4, shadowRadius: 12,
                  shadowOffset: { width: 0, height: 4 }, elevation: 8, marginBottom: 12 },
  btnComenzarTxt:{ color: '#fff', fontWeight: '900', fontSize: 17 },
  btnVolver:    { paddingVertical: 12 },
  btnVolverTxt: { color: '#6b7280', fontSize: 14 },
  progressBar:  { height: 5, backgroundColor: '#e5e7eb' },
  progressFill: { height: 5, borderRadius: 2 },
  quizWrap:     { flex: 1, padding: 20 },
  quizHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  quizCounter:  { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  quizTempo:    { fontSize: 15, fontWeight: '800' },
  quizDif:      { fontSize: 12, fontWeight: '800' },
  pergunta:     { fontSize: 20, fontWeight: '800', color: '#1a2332', lineHeight: 28, marginBottom: 24 },
  opcoes:       { gap: 10 },
  opcao:        { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
                  borderRadius: 14, borderWidth: 2,
                  shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
                  shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  opcaoLetra:   { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  opcaoLetraTxt:{ fontSize: 14, fontWeight: '900', color: '#fff' },
  opcaoTxt:     { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  explicacao:   { marginTop: 16, backgroundColor: '#fffbeb', borderRadius: 12, padding: 14,
                  borderLeftWidth: 3, borderLeftColor: '#d97706' },
  explicacaoTxt:{ fontSize: 13, color: '#1a2332', lineHeight: 18 },
  resultWrap:   { alignItems: 'center', padding: 24, paddingTop: 40, paddingBottom: 60 },
  resultNivel:  { fontSize: 22, fontWeight: '900', color: '#1a2332', marginBottom: 4 },
  resultPct:    { fontSize: 52, fontWeight: '900', marginBottom: 4 },
  resultSub:    { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  resumo:       { width: '100%', gap: 8, marginBottom: 24 },
  resumoItem:   { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, padding: 10 },
  resumoNum:    { fontSize: 13, fontWeight: '800', color: '#6b7280', width: 24 },
  resumoExp:    { flex: 1, fontSize: 12, color: '#1a2332', lineHeight: 16 },
  // Resumo
  resumoCorreta:    { fontSize: 12, color: '#16a34a', fontWeight: '700', marginTop: 2 },
  resumoTapHint:    { fontSize: 11, color: '#6b7280', marginTop: 2 },
  resumoItemErro:   { borderWidth: 1, borderColor: '#fecaca' },
  // Modal detalhe
  modalBg:          { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard:        { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
                      padding: 24, paddingBottom: 40, maxHeight: '90%' },
  modalTitulo:      { fontSize: 15, fontWeight: '800', color: '#6b7280', marginBottom: 12 },
  modalPergunta:    { fontSize: 17, fontWeight: '800', color: '#1a2332', lineHeight: 24, marginBottom: 16 },
  modalOpcao:       { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
                      borderRadius: 10, borderWidth: 1.5, borderColor: '#e5e7eb',
                      marginBottom: 8, backgroundColor: '#fff' },
  modalOpcaoCorreta:{ backgroundColor: '#dcfce7', borderColor: '#16a34a' },
  modalOpcaoErrada: { backgroundColor: '#fee2e2', borderColor: '#dc2626' },
  modalOpcaoLetra:  { width: 28, height: 28, borderRadius: 6, backgroundColor: '#e5e7eb',
                      justifyContent: 'center', alignItems: 'center' },
  modalOpcaoTxt:    { flex: 1, fontSize: 13, color: '#1a2332' },
  explicacaoBlocked:{ marginTop: 12, borderRadius: 12, overflow: 'hidden',
                      borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' },
  explicacaoBlockedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8,
                              padding: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  explicacaoBlockedIcon:   { fontSize: 16 },
  explicacaoBlockedTitulo: { fontSize: 14, fontWeight: '800', color: '#1a2332' },
  explicacaoBlockedTxt:    { fontSize: 13, color: '#6b7280', padding: 12, lineHeight: 18 },
  explicacaoBlockedOverlay:{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
                              backgroundColor: 'rgba(249,250,251,0.95)',
                              justifyContent: 'center', alignItems: 'center',
                              borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  explicacaoBlockedCTA:    { fontSize: 13, color: '#0177b5', fontWeight: '800' },
  modalBtnFechar:   { marginTop: 16, paddingVertical: 14, alignItems: 'center',
                      borderRadius: 12, backgroundColor: '#f4f6f9' },
  modalBtnFecharTxt:{ fontSize: 15, color: '#6b7280', fontWeight: '700' },
  btnRepetir:   { backgroundColor: '#0177b5', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, marginBottom: 12 },
  btnRepetirTxt:{ color: '#fff', fontWeight: '900', fontSize: 15 },

  // Scoreboard no quiz
  scoreboard:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 16,
                  shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  scoreBox:     { alignItems: 'center', flex: 1 },
  scoreEmoji:   { fontSize: 24, marginBottom: 2 },
  scoreNome:    { fontSize: 11, color: '#6b7280', fontWeight: '700', marginBottom: 2 },
  scorePontos:  { fontSize: 24, fontWeight: '900', color: '#0177b5' },
  scoreCenter:  { alignItems: 'center', flex: 1 },
  scoreVS:      { fontSize: 16, fontWeight: '900', color: '#6b7280' },
  scoreRound:   { fontSize: 11, color: '#6b7280', marginTop: 2 },

  // Opções no modo competição
  opcaoUser:    { borderColor: '#0177b5', backgroundColor: '#eff6ff', borderWidth: 2.5 },
  opcaoIA:      { borderColor: '#7c3aed', backgroundColor: '#f5f3ff', borderWidth: 2.5 },
  opcaoAmbos:   { borderColor: '#0177b5', backgroundColor: '#eff6ff', borderWidth: 2.5 },
  opcaoIcons:   { flexDirection: 'row', gap: 2 },
  iconUser:     { fontSize: 14 },
  iconIA:       { fontSize: 14 },

  // Mini resultado da rodada
  rodadaResult: { marginTop: 14, backgroundColor: '#fff', borderRadius: 12, padding: 14,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
                  shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  rodadaItem:   { alignItems: 'center', gap: 4 },
  rodadaEmoji:  { fontSize: 20 },
  rodadaTxt:    { fontSize: 13, fontWeight: '800' },
  rodadaSep:    { width: 1, height: 30, backgroundColor: '#e5e7eb' },

  // Placar final
  finalScore:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
                  backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%',
                  marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.08,
                  shadowRadius: 12, elevation: 4 },
  finalBox:     { alignItems: 'center', gap: 4 },
  finalEmoji:   { fontSize: 32 },
  finalNome:    { fontSize: 13, fontWeight: '700', color: '#6b7280' },
  finalPontos:  { fontSize: 40, fontWeight: '900' },
  finalDe:      { fontSize: 12, color: '#6b7280' },
  finalVS:      { fontSize: 18, fontWeight: '900', color: '#6b7280' },

  // Resumo por questão
  resumoTitulo: { fontSize: 14, fontWeight: '800', color: '#6b7280', marginBottom: 10, alignSelf: 'flex-start' },
  resumoItem:   { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8,
                  width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8,
                  flexWrap: 'wrap',
                  shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  resumoNum:    { fontSize: 13, fontWeight: '800', color: '#6b7280', width: 24 },
  resumoPlayer: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  resumoLabel:  { fontSize: 12, color: '#6b7280' },
  resumoExp:    { width: '100%', fontSize: 12, color: '#1a2332', lineHeight: 16, marginTop: 4 },
});
