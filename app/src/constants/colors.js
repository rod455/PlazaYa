// src/constants/colors.js
// Branding PlazaYa — Nova paleta oficial 2026
// Tipografia: Inter (Bold 700, Semibold 600, Regular 400)

export const COLORS = {
  // Cores principais (branding)
  orange:       '#FF8C40',   // ação / energia / CTA primário
  pink:         '#FF4F8E',   // destaque / atenção
  purple:       '#7A5CFF',   // tecnologia / premium
  blue:         '#3B82F6',   // confiança / links

  // Primary = orange (cor principal de ação)
  primary:      '#FF8C40',
  primaryDark:  '#E6752E',
  primaryLight: '#FFB380',

  // Tons de texto
  text:         '#0F172A',   // preto — textos principais
  textSecondary:'#334155',   // cinza escuro — textos secundários
  textMuted:    '#64748B',   // cinza médio — apoio / labels
  gray:         '#64748B',

  // Neutros
  border:       '#E2E8F0',   // cinza claro — bordas / divisores
  bg:           '#FFFFFF',   // fundo principal
  bgSecondary:  '#F8FAFC',   // fundo secundário (cards, seções)
  white:        '#FFFFFF',

  // Status
  success:      '#10B981',
  danger:       '#EF4444',
  warning:      '#F59E0B',
  info:         '#3B82F6',

  // Legado (compatibilidade)
  red:          '#FF4F8E',
  gold:         '#FF8C40',
  goldLight:    '#FFB380',
};

export const FONTS = {
  regular:  'Inter_400Regular',
  medium:   'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold:     'Inter_700Bold',
};

export const FONT_WEIGHTS = {
  title:    '700',   // Inter Bold
  subtitle: '600',   // Inter Semibold
  body:     '400',   // Inter Regular
  button:   '600',   // Inter Semibold
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
