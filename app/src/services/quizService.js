import { supabase } from './supabase';

export async function fetchQuestoesQuiz(area) {
  const areaNormalizada = area && area.startsWith('otro:')
    ? area.replace('otro:', '')
    : area;

  const dificuldades = [
    { nivel: 'facil',   quantidade: 1 },
    { nivel: 'medio',   quantidade: 1 },
    { nivel: 'dificil', quantidade: 3 },
  ];

  const todasQuestoes = [];

  for (const { nivel, quantidade } of dificuldades) {
    if (areaNormalizada) {
      const { data: dataArea, error: errorArea } = await supabase
        .from('questoes')
        .select('id, enunciado, opcao_a, opcao_b, opcao_c, opcao_d, opcao_e, resposta_correta, dificuldade, area')
        .eq('dificuldade', nivel)
        .eq('area', areaNormalizada)
        .limit(quantidade * 4);

      if (!errorArea && dataArea && dataArea.length >= quantidade) {
        const shuffled = dataArea.sort(() => Math.random() - 0.5).slice(0, quantidade);
        todasQuestoes.push(...shuffled);
        continue;
      }
    }

    const { data, error } = await supabase
      .from('questoes')
      .select('id, enunciado, opcao_a, opcao_b, opcao_c, opcao_d, opcao_e, resposta_correta, dificuldade, area')
      .eq('dificuldade', nivel)
      .limit(quantidade * 4);

    if (error || !data) continue;
    const shuffled = data.sort(() => Math.random() - 0.5).slice(0, quantidade);
    todasQuestoes.push(...shuffled);
  }

  return todasQuestoes.sort(() => Math.random() - 0.5);
}

export function simularRespostasIA(questoes) {
  const probAcerto = { facil: 0.85, medio: 0.65, dificil: 0.45 };
  return questoes.map(q => {
    const prob = probAcerto[q.dificuldade] || 0.6;
    const acertou = Math.random() < prob;
    if (acertou) return q.resposta_correta;
    const opcoes = ['a', 'b', 'c', 'd', 'e'].filter(o => o !== q.resposta_correta && q[`opcao_${o}`]);
    return opcoes[Math.floor(Math.random() * opcoes.length)];
  });
}
