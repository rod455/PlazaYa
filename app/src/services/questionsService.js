// src/services/questionsService.js
// Busca questões: primeiro do banco Supabase, completa com IA se necessário

import { supabase } from './supabase';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
const TOTAL_QUESTOES    = 5;

// Distribuição de dificuldade por posição
const DISTRIBUICAO = [
  'facil',   // q1
  'medio',   // q2
  'dificil', // q3
  'dificil', // q4
  'dificil', // q5
];

// ─── BUSCA HÍBRIDA ───────────────────────────────────────────────────────────
export async function fetchQuestoesMistas(area) {
  const questoesBanco = await fetchQuestoesBanco(area);
  
  if (questoesBanco.length >= TOTAL_QUESTOES) {
    return questoesBanco.slice(0, TOTAL_QUESTOES);
  }

  // Complementa com IA as que faltam
  const faltam = TOTAL_QUESTOES - questoesBanco.length;
  const dificuldadesFaltando = DISTRIBUICAO.slice(questoesBanco.length);
  
  console.log(`📚 Banco: ${questoesBanco.length} questões | 🤖 IA vai gerar: ${faltam}`);
  
  const questoesIA = await gerarQuestoesIA(area, dificuldadesFaltando);
  return [...questoesBanco, ...questoesIA];
}

// ─── BANCO DE DADOS ───────────────────────────────────────────────────────────
async function fetchQuestoesBanco(area) {
  const questoes = [];

  for (const dificuldade of DISTRIBUICAO) {
    const { data } = await supabase
      .from('questions')
      .select('*')
      .eq('area', area)
      .eq('dificuldade', dificuldade)
      // exclui ids que já foram pegos (evita repetição)
      .not('id', 'in', `(${questoes.map(q => `'${q.id}'`).join(',') || "''"})`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data && data.length > 0) {
      // sorteia uma questão aleatória do pool
      const escolhida = data[Math.floor(Math.random() * data.length)];
      questoes.push(escolhida);
    } else {
      break; // não tem mais questões desse nível no banco
    }
  }

  return questoes;
}

// ─── GERAÇÃO VIA IA (Claude) ──────────────────────────────────────────────────
async function gerarQuestoesIA(area, dificuldades) {
  if (!ANTHROPIC_API_KEY) {
    console.warn('⚠️  ANTHROPIC_API_KEY não configurada — usando questões fallback');
    return dificuldades.map(d => questaoFallback(area, d));
  }

  const labels = {
    policia:       'Seguridad Pública y Derecho Penal de México',
    juridico:      'Derecho Civil, Laboral y Constitucional de México',
    saude:         'Salud Pública y legislación sanitaria de México',
    fiscal:        'Derecho Tributario y SAT México',
    ti:            'Tecnología de la Información, redes y seguridad informática',
    administrativo:'Administración Pública Federal de México',
  };
  const areaLabel = labels[area] || area;

  const prompt = `Genera ${dificuldades.length} preguntas de opción múltiple sobre ${areaLabel} para un examen de oposición del gobierno de México.

Distribución de dificultad: ${dificuldades.join(', ')}.

Responde SOLO con un JSON válido, sin markdown, sin explicaciones, en este formato exacto:
{
  "questoes": [
    {
      "area": "${area}",
      "tema": "subtema específico",
      "dificuldade": "facil|medio|dificil",
      "enunciado": "texto de la pregunta",
      "opcao_a": "opción A",
      "opcao_b": "opción B",
      "opcao_c": "opción C",
      "opcao_d": "opción D",
      "resposta_correta": "a|b|c|d",
      "explicacao": "breve explicación de por qué es correcta",
      "fonte": "ia"
    }
  ]
}

Requisitos:
- Preguntas basadas em legislación y normativas reales de México
- Cada pregunta deve ter exatamente 4 opções
- Apenas UMA resposta correta
- Nível de dificuldade: facil=conocimiento básico, medio=aplicación, dificil=análisis`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const texto = data.content?.[0]?.text ?? '';
    const clean = texto.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    return parsed.questoes ?? [];
  } catch (err) {
    console.error('Erro ao gerar questões via IA:', err);
    return dificuldades.map(d => questaoFallback(area, d));
  }
}

// ─── FALLBACK (sem IA e sem banco) ───────────────────────────────────────────
function questaoFallback(area, dificuldade) {
  return {
    id: `fallback_${Date.now()}_${Math.random()}`,
    area,
    dificuldade,
    enunciado: `¿Cuál de las siguientes afirmaciones sobre ${area} es correcta?`,
    opcao_a: 'Opción A — reemplazar con contenido real',
    opcao_b: 'Opción B — reemplazar con contenido real',
    opcao_c: 'Opción C — reemplazar con contenido real',
    opcao_d: 'Opción D — reemplazar con contenido real',
    resposta_correta: 'a',
    explicacao: 'Configure o banco de dados ou a API key para questões reais.',
    fonte: 'fallback',
  };
}

// ─── QUESTÕES PARA ESTUDO (módulo estudar) ───────────────────────────────────
export async function fetchQuestoesTema({ area, tema, quantidade = 10 }) {
  let query = supabase
    .from('questions')
    .select('*')
    .eq('area', area)
    .eq('ativo', true)
    .limit(quantidade * 3); // busca pool maior para randomizar

  if (tema) query = query.eq('tema', tema);

  const { data, error } = await query;
  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Embaralha e pega a quantidade desejada
  return shuffle(data).slice(0, quantidade);
}

export async function fetchSimulado({ area, quantidade = 20 }) {
  // Simulado: distribuição proporcional por dificuldade
  const [ faceis, medios, dificeis ] = await Promise.all([
    buscarPorDificuldade(area, 'facil',   Math.ceil(quantidade * 0.3)),
    buscarPorDificuldade(area, 'medio',   Math.ceil(quantidade * 0.3)),
    buscarPorDificuldade(area, 'dificil', Math.ceil(quantidade * 0.4)),
  ]);

  return shuffle([...faceis, ...medios, ...dificeis]).slice(0, quantidade);
}

async function buscarPorDificuldade(area, dificuldade, limite) {
  const { data } = await supabase
    .from('questions')
    .select('*')
    .eq('area', area)
    .eq('dificuldade', dificuldade)
    .eq('ativo', true)
    .limit(limite * 3);
  return shuffle(data ?? []).slice(0, limite);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── SALVAR SESSÃO DE ESTUDO ─────────────────────────────────────────────────
export async function salvarSessaoEstudo({ userId, tipo, area, tema, total, acertos, tempoSeg, respostas }) {
  // 1. Cria a sessão
  const { data: sessao, error } = await supabase
    .from('study_sessions')
    .insert({ user_id: userId, tipo, area, tema, total, acertos, tempo_seg: tempoSeg, concluida: true })
    .select()
    .single();

  if (error) throw error;

  // 2. Registra cada resposta
  const rows = respostas.map(r => ({
    user_id:     userId,
    session_id:  sessao.id,
    question_id: r.questionId,
    resposta:    r.resposta,
    correta:     r.correta,
    tempo_seg:   r.tempoSeg,
  }));

  if (rows.length > 0) {
    await supabase.from('user_answers').insert(rows);
  }

  return sessao;
}

// ─── HISTÓRICO DO USUÁRIO ────────────────────────────────────────────────────
export async function fetchHistorico(userId, limite = 20) {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limite);
  if (error) throw error;
  return data ?? [];
}
