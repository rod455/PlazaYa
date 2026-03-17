// src/constants/data.js
// Dados de configuração do app Concursos México

// ─── AdMob — IDs reais do app PlazaYa (México) ───────────────────────────────
export const ADMOB_IDS = {
  APP_ID:       'ca-app-pub-9316035916536420~2327897668', // App ID
  REWARDED:     'ca-app-pub-9316035916536420/3401306180', // Vídeo após onboarding
  BANNER:       'ca-app-pub-9316035916536420/4577955786', // Banner em todas as telas
  INTERSTITIAL: 'ca-app-pub-9316035916536420/2550558246', // Intersticial a cada 3 min
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

// ─── Áreas de concursos ───────────────────────────────────────────────────────
export const AREA_OPTIONS = [
  { id: 'policia',       label: 'Seguridad Pública (Policía, GN)', icon: '👮' },
  { id: 'juridico',      label: 'Jurídico / Poder Judicial',        icon: '⚖️' },
  { id: 'saude',         label: 'Salud (IMSS, ISSSTE, SSA)',         icon: '🏥' },
  { id: 'fiscal',        label: 'Tributario / SAT / Finanzas',       icon: '📋' },
  { id: 'ti',            label: 'Tecnología de la Información',      icon: '💻' },
  { id: 'administrativo',label: 'Administrativo / Gestión Pública',  icon: '🏛️' },
];

// ─── Escolaridade ─────────────────────────────────────────────────────────────
export const ESCOLARIDADE_OPTIONS = [
  { id: 'secundaria',  label: 'Secundaria completa',   icon: '📖' },
  { id: 'preparatoria',label: 'Preparatoria completa', icon: '🎒' },
  { id: 'tecnico',     label: 'Técnico / Tecnológico', icon: '🔧' },
  { id: 'licenciatura',label: 'Licenciatura',           icon: '🎓' },
  { id: 'posgrado',    label: 'Posgrado',               icon: '🏆' },
];

// ─── Faixa salarial ───────────────────────────────────────────────────────────
export const SALARIO_OPTIONS = [
  { id: 'ate10k',   label: 'Hasta $10,000 MXN',           min: 0,     max: 10000  },
  { id: '10k_20k',  label: '$10,000 a $20,000 MXN',       min: 10000, max: 20000  },
  { id: '20k_40k',  label: '$20,000 a $40,000 MXN',       min: 20000, max: 40000  },
  { id: 'acima40k', label: 'Más de $40,000 MXN',          min: 40000, max: 999999 },
];

// ─── Mobilidade ───────────────────────────────────────────────────────────────
export const MOBILIDADE_OPTIONS = [
  { id: 'local',  label: 'Quiero plazas en mi estado',      icon: '📍' },
  { id: 'federal',label: 'Acepto plazas en cualquier estado', icon: '🇲🇽' },
];

// ─── Preparação ───────────────────────────────────────────────────────────────
export const PREPARACAO_OPTIONS = [
  { id: 'imediato',    label: '¡Estoy listo para comenzar ahora!', icon: '🚀' },
  { id: 'breve',       label: 'Comenzaré en los próximos meses',   icon: '📅' },
  { id: 'pesquisando', label: 'Todavía estoy investigando',        icon: '🔍' },
];

// ─── Curso ────────────────────────────────────────────────────────────────────
export const CURSO_OPTIONS = [
  { id: 'sim',    label: 'Sí, quiero un curso de preparación', icon: '📚' },
  { id: 'talvez', label: 'Quizás, depende del costo',           icon: '🤔' },
  { id: 'nao',    label: 'No, prefiero estudiar solo',          icon: '💪' },
];
