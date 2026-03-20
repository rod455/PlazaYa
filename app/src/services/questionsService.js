// src/services/questionsService.js
// Questões híbridas: busca primeiro do Supabase, fallback para dados locais

import { supabase } from './supabase';

// ── Buscar questões por tema ──────────────────────────────────────────────────
export async function fetchQuestoesTema({ area, tema, quantidade = 10 }) {
  try {
    let query = supabase
      .from('questoes')
      .select('*')
      .eq('ativa', true)
      .limit(quantidade * 3); // pega mais para randomizar

    if (area) query = query.eq('area', area);
    if (tema) query = query.eq('tema', tema);

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Shuffle e limita
    const shuffled = data.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, quantidade);
  } catch (e) {
    console.error('fetchQuestoesTema error:', e);
    return [];
  }
}

// ── Buscar simulado completo ──────────────────────────────────────────────────
export async function fetchSimulado({ area, quantidade = 20 }) {
  try {
    let query = supabase
      .from('questoes')
      .select('*')
      .eq('ativa', true)
      .limit(quantidade * 2);

    if (area) query = query.eq('area', area);

    const { data, error } = await query;
    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Mistura dificuldades: 30% fácil, 50% médio, 20% difícil
    const faceis = data.filter(q => q.dificuldade === 'facil').sort(() => Math.random() - 0.5);
    const medias = data.filter(q => q.dificuldade === 'medio').sort(() => Math.random() - 0.5);
    const dificeis = data.filter(q => q.dificuldade === 'dificil').sort(() => Math.random() - 0.5);

    const result = [
      ...faceis.slice(0, Math.ceil(quantidade * 0.3)),
      ...medias.slice(0, Math.ceil(quantidade * 0.5)),
      ...dificeis.slice(0, Math.ceil(quantidade * 0.2)),
    ].sort(() => Math.random() - 0.5);

    return result.slice(0, quantidade);
  } catch (e) {
    console.error('fetchSimulado error:', e);
    return [];
  }
}

// ── Salvar sessão de estudo ───────────────────────────────────────────────────
export async function salvarSessaoEstudo({ userId, area, tema, tipo, acertos, total, tempoTotal }) {
  try {
    if (!userId) return;
    const { error } = await supabase
      .from('sessoes_estudo')
      .insert({
        user_id: userId,
        area,
        tema,
        tipo,
        acertos,
        total,
        tempo_total_seg: tempoTotal,
        pontuacao: Math.round((acertos / total) * 100),
      });
    if (error) console.log('salvarSessaoEstudo error:', error);
  } catch (e) {
    console.log('salvarSessaoEstudo error:', e);
  }
}

// ── Buscar histórico de estudo ────────────────────────────────────────────────
export async function fetchHistoricoEstudo(userId, limite = 20) {
  try {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('sessoes_estudo')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limite);

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('fetchHistoricoEstudo error:', e);
    return [];
  }
}

// ── Buscar temas disponíveis ──────────────────────────────────────────────────
export async function fetchTemasDisponiveis(area) {
  try {
    let query = supabase
      .from('questoes')
      .select('tema, area')
      .eq('ativa', true);

    if (area) query = query.eq('area', area);

    const { data, error } = await query;
    if (error) throw error;
    if (!data) return [];

    // Agrupa por tema e conta
    const temas = {};
    for (const q of data) {
      const key = q.tema || 'General';
      if (!temas[key]) temas[key] = { tema: key, area: q.area, count: 0 };
      temas[key].count++;
    }

    return Object.values(temas).sort((a, b) => b.count - a.count);
  } catch (e) {
    console.error('fetchTemasDisponiveis error:', e);
    return [];
  }
}
