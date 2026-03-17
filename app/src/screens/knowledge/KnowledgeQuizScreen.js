// src/screens/knowledge/KnowledgeQuizScreen.js
// Quiz de conhecimentos — navbar visível, ad intersticial antes do resultado
// Questões do banco Supabase com fallback local

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator,
  Animated, SafeAreaView, ScrollView,
} from 'react-native';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase';

const COLORS = {
  primary: '#0177b5', primaryDark: '#01497a',
  bg: '#f4f6f9', card: '#fff',
  text: '#1a2332', textMuted: '#6b7280',
  border: '#e5e7eb', success: '#16a34a',
  danger: '#dc2626', warning: '#d97706',
};

const INTERSTITIAL_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-9316035916536420/2550558246';

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
    const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
      requestNonPersonalizedAdsOnly: true,
    });
    interstitial.current = ad;
    const u1 = ad.addAdEventListener(AdEventType.LOADED, () => setAdReady(true));
    const u2 = ad.addAdEventListener(AdEventType.CLOSED, () => setFase('resultado'));
    const u3 = ad.addAdEventListener(AdEventType.ERROR,  () => setFase('resultado'));
    ad.load();
    return () => { u1(); u2(); u3(); };
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

  const responder = useCallback((opcao) => {
    clearInterval(timerRef.current);
    const q = questoes[idx];
    if (!q || selecionada !== null) return;
    const correta = opcao !== null && opcao === q.resposta_correta;
    setSel(opcao ?? 'timeout');
    if (correta) setAcertos(a => a + 1);
    setRespostas(r => [...r, { correta, opcao, esperada: q.resposta_correta, explicacao: q.explicacao }]);

    setTimeout(() => {
      if (idx + 1 >= questoes.length) {
        // Mostra ad antes do resultado
        if (adReady && interstitial.current) {
          try { interstitial.current.show(); } catch { setFase('resultado'); }
        } else {
          setFase('resultado');
        }
      } else {
        setIdx(i => i + 1);
        setSel(null);
      }
    }, 1400);
  }, [selecionada, idx, questoes, adReady]);

  const reiniciar = () => {
    setIdx(0); setAcertos(0); setSel(null);
    setRespostas([]); setFase('intro');
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
    const pct  = Math.round((acertos / questoes.length) * 100);
    const cor  = pct >= 80 ? COLORS.success : pct >= 60 ? COLORS.primary : pct >= 40 ? COLORS.warning : COLORS.danger;
    const nivel = pct >= 80 ? '🏆 Experto' : pct >= 60 ? '🎯 Bueno' : pct >= 40 ? '📚 Regular' : '💪 Principiante';
    return (
      <SafeAreaView style={s.container}>
        <ScrollView contentContainerStyle={s.resultWrap}>
          <Text style={{ fontSize: 56, marginBottom: 8 }}>{pct >= 80 ? '🏆' : pct >= 60 ? '🎯' : pct >= 40 ? '📚' : '💪'}</Text>
          <Text style={s.resultNivel}>{nivel}</Text>
          <Text style={[s.resultPct, { color: cor }]}>{pct}%</Text>
          <Text style={s.resultSub}>{acertos} de {questoes.length} correctas</Text>

          <View style={s.resumo}>
            {respostas.map((r, i) => (
              <View key={i} style={[s.resumoItem, { backgroundColor: r.correta ? '#dcfce7' : '#fee2e2' }]}>
                <Text style={s.resumoNum}>P{i + 1}</Text>
                <Text style={{ fontSize: 18 }}>{r.correta ? '✅' : '❌'}</Text>
                {!r.correta && r.explicacao && (
                  <Text style={s.resumoExp} numberOfLines={2}>{r.explicacao}</Text>
                )}
              </View>
            ))}
          </View>

          <TouchableOpacity style={s.btnRepetir} onPress={reiniciar} activeOpacity={0.85}>
            <Text style={s.btnRepetirTxt}>🔄 Repetir quiz</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnVolver} onPress={() => nav.goBack()}>
            <Text style={s.btnVolverTxt}>← Volver al inicio</Text>
          </TouchableOpacity>
        </ScrollView>
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

  const corBotao = (key) => {
    if (!selecionada) return { bg: '#fff', border: COLORS.border, txt: COLORS.text };
    if (key === q.resposta_correta) return { bg: '#dcfce7', border: COLORS.success, txt: COLORS.success };
    if (key === selecionada) return { bg: '#fee2e2', border: COLORS.danger, txt: COLORS.danger };
    return { bg: '#fff', border: COLORS.border, txt: COLORS.textMuted };
  };

  const corDif = q.dificuldade === 'facil' ? COLORS.success : q.dificuldade === 'medio' ? COLORS.warning : COLORS.danger;

  return (
    <SafeAreaView style={s.container}>
      {/* Barra de progresso */}
      <View style={s.progressBar}>
        <Animated.View style={[s.progressFill, {
          width: progAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          backgroundColor: tempo <= 5 ? COLORS.danger : COLORS.primary,
        }]} />
      </View>

      <View style={s.quizWrap}>
        <View style={s.quizHeader}>
          <Text style={s.quizCounter}>{idx + 1}/{questoes.length}</Text>
          <Text style={[s.quizTempo, { color: tempo <= 5 ? COLORS.danger : COLORS.primary }]}>⏱ {tempo}s</Text>
          <Text style={[s.quizDif, { color: corDif }]}>{q.dificuldade?.toUpperCase()}</Text>
        </View>

        <Text style={s.pergunta}>{q.enunciado}</Text>

        <View style={s.opcoes}>
          {OPCOES.map(({ key, txt }) => {
            const c = corBotao(key);
            return (
              <TouchableOpacity
                key={key}
                style={[s.opcao, { backgroundColor: c.bg, borderColor: c.border }]}
                onPress={() => responder(key)}
                disabled={selecionada !== null}
                activeOpacity={0.8}
              >
                <View style={[s.opcaoLetra, { backgroundColor: c.border }]}>
                  <Text style={[s.opcaoLetraTxt, { color: selecionada ? '#fff' : '#fff' }]}>{key.toUpperCase()}</Text>
                </View>
                <Text style={[s.opcaoTxt, { color: c.txt }]} numberOfLines={3}>{txt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selecionada && q.explicacao && (
          <View style={s.explicacao}>
            <Text style={s.explicacaoTxt}>💡 {q.explicacao}</Text>
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
  btnRepetir:   { backgroundColor: '#0177b5', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, marginBottom: 12 },
  btnRepetirTxt:{ color: '#fff', fontWeight: '900', fontSize: 15 },
});
