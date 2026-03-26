// src/constants/data.js
// Dados de configuração do app PlazaYa (México) + ConcursosBrasil

// ─── AdMob — PlazaYa (México) ────────────────────────────────────────────────
export const ADMOB_IDS = {
  APP_ID:       'ca-app-pub-9316035916536420~2327897668',
  BANNER:       'ca-app-pub-9316035916536420/2364067431',
  APP_OPEN:     'ca-app-pub-9316035916536420/6648202461',
  INTERSTITIAL: 'ca-app-pub-9316035916536420/2976243277',
  REWARDED:     'ca-app-pub-9316035916536420/4784148966',
};

// Keywords centralizadas para todos los ad units
export const AD_KEYWORDS = {
  BANNER: [
    'empleo gobierno mexico', 'convocatoria publica', 'plaza gobierno',
    'servicio profesional carrera', 'curso preparacion', 'oposiciones mexico',
    'empleo publico', 'trabajo gobierno', 'bolsa de trabajo',
  ],
  INTERSTITIAL: [
    'curso preparacion oposiciones', 'maestria online', 'MBA ejecutivo',
    'universidad en linea', 'prestamo personal', 'tarjeta de credito',
    'cuenta digital', 'seguro de vida', 'afore', 'inversion cetes',
    'empleo gobierno federal', 'servidor publico',
  ],
  REWARDED: [
    'curso preparacion servicio profesional', 'maestria derecho',
    'MBA finanzas', 'especializacion online', 'prestamo nomina',
    'financiamiento', 'tarjeta platinum', 'seguro vida servidor publico',
    'afore rendimiento', 'inversion cetes directo',
    'convocatoria sat', 'convocatoria guardia nacional',
  ],
  APP_OPEN: [
    'convocatoria publica 2026', 'empleo gobierno federal',
    'maestria online', 'MBA online', 'cuenta digital',
    'tarjeta de credito', 'seguro de vida', 'plan dental',
    'universidad en linea', 'curso online', 'empleo publico federal',
  ],
};

// ─── AdMob — ConcursosBrasil ─────────────────────────────────────────────────
export const ADMOB_IDS_BR = {
  APP_ID:       'ca-app-pub-9316035916536420~8124628178',
  BANNER:       'ca-app-pub-9316035916536420/2364067431',
  REWARDED:     'ca-app-pub-9316035916536420/4784148966',
  INTERSTITIAL: 'ca-app-pub-9316035916536420/2976243277',
};

// ─── Estados / Regiões do México ──────────────────────────────────────────────
export const ESTADOS_MEXICO = [
  { uf: 'AGS', nome: 'Aguascalientes' },
  { uf: 'BCN', nome: 'Baja California' },
  { uf: 'BCS', nome: 'Baja California Sur' },
  { uf: 'CAM', nome: 'Campeche' },
  { uf: 'CHP', nome: 'Chiapas' },
  { uf: 'CHH', nome: 'Chihuahua' },
  { uf: 'CMX', nome: 'Ciudad de México' },
  { uf: 'COA', nome: 'Coahuila' },
  { uf: 'COL', nome: 'Colima' },
  { uf: 'DGO', nome: 'Durango' },
  { uf: 'GTO', nome: 'Guanajuato' },
  { uf: 'GRO', nome: 'Guerrero' },
  { uf: 'HGO', nome: 'Hidalgo' },
  { uf: 'JAL', nome: 'Jalisco' },
  { uf: 'MEX', nome: 'Estado de México' },
  { uf: 'MIC', nome: 'Michoacán' },
  { uf: 'MOR', nome: 'Morelos' },
  { uf: 'NAY', nome: 'Nayarit' },
  { uf: 'NLE', nome: 'Nuevo León' },
  { uf: 'OAX', nome: 'Oaxaca' },
  { uf: 'PUE', nome: 'Puebla' },
  { uf: 'QRO', nome: 'Querétaro' },
  { uf: 'ROO', nome: 'Quintana Roo' },
  { uf: 'SLP', nome: 'San Luis Potosí' },
  { uf: 'SIN', nome: 'Sinaloa' },
  { uf: 'SON', nome: 'Sonora' },
  { uf: 'TAB', nome: 'Tabasco' },
  { uf: 'TAM', nome: 'Tamaulipas' },
  { uf: 'TLA', nome: 'Tlaxcala' },
  { uf: 'VER', nome: 'Veracruz' },
  { uf: 'YUC', nome: 'Yucatán' },
  { uf: 'ZAC', nome: 'Zacatecas' },
];

// ─── Estados do Brasil ────────────────────────────────────────────────────────
export const ESTADOS_BRASIL = [
  { uf: 'AC', nome: 'Acre' },
  { uf: 'AL', nome: 'Alagoas' },
  { uf: 'AP', nome: 'Amapá' },
  { uf: 'AM', nome: 'Amazonas' },
  { uf: 'BA', nome: 'Bahia' },
  { uf: 'CE', nome: 'Ceará' },
  { uf: 'DF', nome: 'Distrito Federal' },
  { uf: 'ES', nome: 'Espírito Santo' },
  { uf: 'GO', nome: 'Goiás' },
  { uf: 'MA', nome: 'Maranhão' },
  { uf: 'MT', nome: 'Mato Grosso' },
  { uf: 'MS', nome: 'Mato Grosso do Sul' },
  { uf: 'MG', nome: 'Minas Gerais' },
  { uf: 'PA', nome: 'Pará' },
  { uf: 'PB', nome: 'Paraíba' },
  { uf: 'PR', nome: 'Paraná' },
  { uf: 'PE', nome: 'Pernambuco' },
  { uf: 'PI', nome: 'Piauí' },
  { uf: 'RJ', nome: 'Rio de Janeiro' },
  { uf: 'RN', nome: 'Rio Grande do Norte' },
  { uf: 'RS', nome: 'Rio Grande do Sul' },
  { uf: 'RO', nome: 'Rondônia' },
  { uf: 'RR', nome: 'Roraima' },
  { uf: 'SC', nome: 'Santa Catarina' },
  { uf: 'SP', nome: 'São Paulo' },
  { uf: 'SE', nome: 'Sergipe' },
  { uf: 'TO', nome: 'Tocantins' },
];

// ─── Áreas de concursos (México) ─────────────────────────────────────────────
export const AREA_OPTIONS = [
  { id: 'policia',       label: 'Seguridad Pública (Policía, GN)', icon: '👮' },
  { id: 'juridico',      label: 'Jurídico / Poder Judicial',        icon: '⚖️' },
  { id: 'saude',         label: 'Salud (IMSS, ISSSTE, SSA)',         icon: '🏥' },
  { id: 'fiscal',        label: 'Tributario / SAT / Finanzas',       icon: '📋' },
  { id: 'ti',            label: 'Tecnología de la Información',      icon: '💻' },
  { id: 'administrativo',label: 'Administrativo / Gestión Pública',  icon: '🏛️' },
  { id: 'educacion',     label: 'Educación (SEP, USICAMM)',          icon: '📚' },
];

// ─── Áreas de concursos (Brasil) ─────────────────────────────────────────────
export const AREA_OPTIONS_BR = [
  { id: 'policia',  label: 'Polícia (PM, PC, PRF, PF)', icon: '🛡️' },
  { id: 'saude',    label: 'Saúde',                      icon: '➕' },
  { id: 'bancario', label: 'Bancário',                   icon: '🏦' },
  { id: 'juridico', label: 'Jurídico (Tribunais)',       icon: '⚖️' },
  { id: 'inss',     label: 'INSS',                       icon: '🏛️' },
  { id: 'fiscal',   label: 'Fiscal e Tributário',        icon: '📋' },
  { id: 'educacao', label: 'Educação',                   icon: '📚' },
  { id: 'tecnologia', label: 'Tecnologia da Informação', icon: '💻' },
];

// ─── Escolaridade (México) ────────────────────────────────────────────────────
export const ESCOLARIDADE_OPTIONS = [
  { id: 'secundaria',    label: 'Secundaria' },
  { id: 'preparatoria',  label: 'Preparatoria / Bachillerato' },
  { id: 'tecnico',       label: 'Técnico / TSU' },
  { id: 'licenciatura',  label: 'Licenciatura' },
  { id: 'maestria',      label: 'Maestría / Doctorado' },
];

// ─── Escolaridade (Brasil) ────────────────────────────────────────────────────
export const ESCOLARIDADE_OPTIONS_BR = [
  { id: 'fundamental', label: 'Fundamental Completo' },
  { id: 'medio',       label: 'Ensino Médio completo' },
  { id: 'tecnico',     label: 'Técnico' },
  { id: 'superior',    label: 'Superior' },
  { id: 'pos',         label: 'Pós-graduação' },
];

// ─── Mobilidade ───────────────────────────────────────────────────────────────
export const MOBILIDADE_OPTIONS = [
  { id: 'regiao',       label: 'Solo en mi estado' },
  { id: 'outro_estado', label: 'Puedo cambiar de estado' },
];

// ─── Faixa salarial (México — MXN) ───────────────────────────────────────────
export const SALARIO_OPTIONS = [
  { id: 'ate15k',   label: 'Hasta $15,000 MXN',      min: 0,     max: 15000 },
  { id: '15k_30k',  label: '$15,000 a $30,000 MXN',   min: 15000, max: 30000 },
  { id: '30k_60k',  label: '$30,000 a $60,000 MXN',   min: 30000, max: 60000 },
  { id: 'acima60k', label: 'Más de $60,000 MXN',      min: 60000, max: 999999 },
];

// ─── Faixa salarial (Brasil — BRL) ───────────────────────────────────────────
export const SALARIO_OPTIONS_BR = [
  { id: 'ate4k',    label: 'Até R$ 4.000',     min: 0,     max: 4000 },
  { id: '4k_8k',    label: 'R$ 4.000 a R$ 8.000', min: 4000,  max: 8000 },
  { id: '8k_15k',   label: 'R$ 8.000 a R$ 15.000', min: 8000,  max: 15000 },
  { id: 'acima15k', label: 'Acima de R$ 15.000',    min: 15000, max: 999999 },
];

// ─── Opções de preparação ─────────────────────────────────────────────────────
export const CURSO_OPTIONS = [
  { id: 'sim_curso',     label: 'Sí, quiero comprar un curso' },
  { id: 'conta_propria', label: 'No, voy a estudiar por mi cuenta' },
  { id: 'pesquisando',   label: 'No sé, solo estoy investigando' },
];

export const PREPARACAO_OPTIONS = [
  { id: 'presencial',      label: 'Curso presencial' },
  { id: 'semi_presencial',  label: 'Curso semi-presencial' },
  { id: 'online',           label: 'Curso en línea' },
  { id: 'sozinho',          label: 'Voy a estudiar solo' },
];
