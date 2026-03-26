// src/utils/salarioUtils.js
// Sistema centralizado de salarios para PlazaYa (México)
// Salarios en MXN basados en tabuladores del gobierno federal mexicano

const SALARIOS_ORGAO = {
  'sat':              { min: 25000, max: 60000 },
  'imss':             { min: 12000, max: 35000 },
  'issste':           { min: 12000, max: 30000 },
  'pemex':            { min: 18000, max: 50000 },
  'cfe':              { min: 15000, max: 40000 },
  'banxico':          { min: 30000, max: 80000 },
  'guardia nacional': { min: 15000, max: 25000 },
  'policia federal':  { min: 15000, max: 30000 },
  'marina':           { min: 14000, max: 35000 },
  'sedena':           { min: 12000, max: 30000 },
  'sep':              { min: 10000, max: 25000 },
  'sre':              { min: 15000, max: 45000 },
  'poder judicial':   { min: 20000, max: 60000 },
  'scjn':             { min: 30000, max: 100000 },
  'inai':             { min: 20000, max: 50000 },
  'ine':              { min: 15000, max: 45000 },
};

const SALARIOS_CARGO = {
  'magistrado':       { min: 50000, max: 100000 },
  'juez':             { min: 40000, max: 80000 },
  'secretario':       { min: 15000, max: 35000 },
  'oficial':          { min: 12000, max: 25000 },
  'analista':         { min: 15000, max: 30000 },
  'director':         { min: 35000, max: 70000 },
  'subdirector':      { min: 25000, max: 45000 },
  'jefe de departamento': { min: 18000, max: 35000 },
  'enlace':           { min: 10000, max: 18000 },
  'medico':           { min: 15000, max: 40000 },
  'enfermero':        { min: 10000, max: 20000 },
  'profesor':         { min: 10000, max: 25000 },
  'policia':          { min: 12000, max: 22000 },
  'ingeniero':        { min: 18000, max: 40000 },
  'abogado':          { min: 15000, max: 35000 },
  'contador':         { min: 15000, max: 30000 },
  'auditor':          { min: 20000, max: 50000 },
};

const SALARIOS_AREA_NIVEL = {
  'fiscal_superior':        { min: 25000, max: 60000 },
  'fiscal_medio':           { min: 12000, max: 25000 },
  'policial_superior':      { min: 18000, max: 35000 },
  'policial_medio':         { min: 12000, max: 22000 },
  'juridico_superior':      { min: 20000, max: 60000 },
  'juridico_medio':         { min: 12000, max: 25000 },
  'saude_superior':         { min: 15000, max: 40000 },
  'saude_medio':            { min: 8000,  max: 18000 },
  'educacao_superior':      { min: 12000, max: 25000 },
  'educacao_medio':         { min: 8000,  max: 15000 },
  'tecnologia_superior':    { min: 18000, max: 45000 },
  'tecnologia_medio':       { min: 12000, max: 25000 },
  'administrativo_superior':{ min: 15000, max: 35000 },
  'administrativo_medio':   { min: 8000,  max: 18000 },
  'geral_superior':         { min: 12000, max: 30000 },
  'geral_medio':            { min: 8000,  max: 18000 },
  'geral_todos':            { min: 8000,  max: 25000 },
};

export function estimarSalario(titulo, area, nivel) {
  const t = (titulo || '').toLowerCase();
  for (const [orgao, faixa] of Object.entries(SALARIOS_ORGAO)) {
    if (t.includes(orgao)) return faixa;
  }
  for (const [cargo, faixa] of Object.entries(SALARIOS_CARGO)) {
    if (t.includes(cargo)) return faixa;
  }
  const chave = `${area || 'geral'}_${nivel || 'todos'}`;
  if (SALARIOS_AREA_NIVEL[chave]) return SALARIOS_AREA_NIVEL[chave];
  return { min: 8000, max: 25000 };
}

export function corrigirSalario(salarioParseado, titulo, area, nivel) {
  if (salarioParseado && salarioParseado >= 3000) {
    return { valor: salarioParseado, estimado: false };
  }
  const faixa = estimarSalario(titulo, area, nivel);
  return { valor: faixa.max, valorMin: faixa.min, estimado: true };
}

export function formatarSalario(salarioInfo) {
  if (!salarioInfo) return 'Salario por confirmar';
  const { valor, valorMin, estimado } = salarioInfo;
  if (!valor) return 'Salario por confirmar';
  const valorStr = `$${Number(valor).toLocaleString('es-MX')} MXN`;
  if (estimado && valorMin) {
    const minStr = `$${Number(valorMin).toLocaleString('es-MX')}`;
    return `${minStr} a ${valorStr}*`;
  }
  if (estimado) return `Hasta ${valorStr}*`;
  return `Hasta ${valorStr}`;
}

export function formatarValor(valor) {
  if (!valor || valor < 1000) return null;
  return `$${Number(valor).toLocaleString('es-MX')} MXN`;
}

export function processarSalarioConcurso(concurso) {
  const salarioInfo = corrigirSalario(concurso.salario, concurso.titulo, concurso.area, concurso.nivel);
  return {
    ...concurso,
    salario: salarioInfo.valor,
    salarioMin: salarioInfo.valorMin || null,
    salarioEstimado: salarioInfo.estimado,
  };
}
