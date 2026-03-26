// src/services/convocatoriasApi.js
// API de convocatorias para PlazaYa (México)
// Fuente principal: Supabase
import { supabase } from './supabase';
import { processarSalarioConcurso } from '../utils/salarioUtils';

export async function fetchConvocatoriasFiltradas({ estado = null, salarioMin = 0, area = null }) {
  try {
    const data = await fetchFromSupabase(estado, area);
    if (data.length > 0) {
      return filtrar(data, salarioMin, area);
    }
  } catch (e) {
    console.error('fetchConvocatoriasFiltradas error:', e);
  }
  return filtrar(getMockMinimo(), salarioMin, area);
}

async function fetchFromSupabase(estado, area) {
  const results = [];
  try {
    let q = supabase
      .from('convocatorias_activas')
      .select('*')
      .order('fecha_publicacion', { ascending: false })
      .limit(80);

    if (estado) q = q.or(`estado.eq.${estado},estado.eq.FEDERAL`);

    const { data, error } = await q;
    if (error) throw error;
    if (!data) return [];

    for (const d of data) {
      results.push(processarSalarioConcurso({
        id: d.id,
        titulo: d.titulo || '',
        orgao: d.dependencia || '',
        uf: d.estado || 'FEDERAL',
        area: d.area || detectarArea(d.titulo || ''),
        nivel: d.escolaridad || 'todos',
        vagas: d.num_plazas ? String(d.num_plazas) : null,
        salario: d.salario_max || d.salario_min || null,
        fimInscricoes: d.fecha_cierre || null,
        previsto: false,
        link: d.url || null,
        fonte: 'Convocatorias',
        status: d.status_cierre || 'abierta',
      }));
    }
  } catch (e) {
    console.error('fetchFromSupabase error:', e);
  }
  return results;
}

function detectarArea(titulo) {
  const t = (titulo || '').toLowerCase();
  if (/polic|seguridad|guardia|gendarme|custodio/.test(t)) return 'policia';
  if (/fiscal|sat|tributar|auditor|hacienda/.test(t)) return 'fiscal';
  if (/salud|medic|enferm|hospital|imss|issste|farmac/.test(t)) return 'saude';
  if (/educa|profesor|docente|maestro|sep|usicamm/.test(t)) return 'educacion';
  if (/juez|magistrad|tribunal|poder judicial|justicia/.test(t)) return 'juridico';
  if (/tecnolog|ti |sistema|programad|desarroll/.test(t)) return 'ti';
  if (/administra|gestion/.test(t)) return 'administrativo';
  return 'geral';
}

const AREA_MAP = {
  policia: ['policia'],
  fiscal: ['fiscal'],
  saude: ['saude'],
  educacion: ['educacion'],
  juridico: ['juridico'],
  ti: ['ti', 'tecnologia'],
  administrativo: ['administrativo', 'geral'],
};

function calcularRelevancia(conv, area) {
  let score = 0;
  if (area) {
    const areasAlvo = AREA_MAP[area] || [area];
    if (areasAlvo.includes(conv.area)) score += 50;
  }
  if (conv.salario) {
    if (conv.salario >= 30000) score += 20;
    else if (conv.salario >= 15000) score += 10;
  }
  if (conv.vagas) score += 5;
  if (conv.status === 'abierta') score += 15;
  return score;
}

function filtrar(lista, salarioMin, area) {
  let result = lista;
  if (salarioMin > 0) {
    result = result.filter(c => !c.salario || c.salario >= salarioMin);
  }
  if (area) {
    const areasAlvo = AREA_MAP[area] || [area];
    const matchArea = result.filter(c => areasAlvo.includes(c.area));
    const outros = result.filter(c => !areasAlvo.includes(c.area));
    if (matchArea.length >= 3) result = [...matchArea, ...outros];
  }
  result = result.map(c => ({ ...c, _score: calcularRelevancia(c, area) }));
  result.sort((a, b) => {
    if (b._score !== a._score) return b._score - a._score;
    return (b.salario || 0) - (a.salario || 0);
  });
  result = result.map(({ _score, ...rest }) => rest);
  return result;
}

function getMockMinimo() {
  return [
    { titulo: 'SAT - Administrador Desconcentrado', vagas: '150', salario: 45000, fimInscricoes: null, previsto: true },
    { titulo: 'Guardia Nacional - Guardia', vagas: '2000', salario: 17000, fimInscricoes: null, previsto: true },
    { titulo: 'IMSS - Médico Familiar', vagas: '500', salario: 28000, fimInscricoes: null, previsto: true },
    { titulo: 'Poder Judicial - Oficial Judicial', vagas: '300', salario: 22000, fimInscricoes: null, previsto: true },
    { titulo: 'SEP - Profesor de Educación Básica', vagas: '1000', salario: 14000, fimInscricoes: null, previsto: true },
    { titulo: 'CFE - Ingeniero Eléctrico', vagas: '200', salario: 25000, fimInscricoes: null, previsto: true },
  ].map(item => processarSalarioConcurso({
    id: Math.random().toString(36).substr(2, 9),
    titulo: item.titulo,
    uf: 'FEDERAL',
    orgao: item.titulo.split(' - ')[0],
    area: detectarArea(item.titulo),
    nivel: 'todos',
    ...item,
  }));
}
