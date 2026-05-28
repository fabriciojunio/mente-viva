// src/shared/theme/index.js
export const COLORS = {
  rose:      '#FF6B9D', roseDark: '#D94F7E', roseLight: '#FFB3D0',
  lavender:  '#C084FC', lavDark:  '#7C3AED',
  mint:      '#34D399', mintDark: '#059669',
  sky:       '#60A5FA', skyDark:  '#2563EB',
  amber:     '#FBBF24', amberDark:'#D97706',
  coral:     '#FB923C', coralDark:'#EA580C',
  teal:      '#2DD4BF', tealDark: '#0D9488',
  bg:        '#FFF5F8',
  white:     '#FFFFFF',
  gray100:   '#F9FAFB', gray200: '#F3F4F6', gray300: '#E5E7EB',
  gray500:   '#6B7280', gray700: '#374151',
  text:      '#1F2937',
  success:   '#059669',
  error:     '#DC2626',
};

export const RADIUS = { sm:10, md:14, lg:20, xl:28, full:999 };

export const SHADOW = {
  card:   { shadowColor:'#FF6B9D', shadowOffset:{width:0,height:3}, shadowOpacity:0.12, shadowRadius:10, elevation:5 },
  strong: { shadowColor:'#000',    shadowOffset:{width:0,height:5}, shadowOpacity:0.12, shadowRadius:14, elevation:8 },
};

export const FONTS = { regular:{fontWeight:'400'}, semibold:{fontWeight:'600'}, bold:{fontWeight:'700'}, black:{fontWeight:'900'} };

export const GAME_COLORS = {
  memory:     { from:'#FF6B9D', to:'#FFB3D0' },
  speed:      { from:'#059669', to:'#34D399' },
  sequence:   { from:'#2563EB', to:'#60A5FA' },
  stroop:     { from:'#7C3AED', to:'#C084FC' },
  math:       { from:'#D97706', to:'#FBBF24' },
  word:       { from:'#EA580C', to:'#FB923C' },
  wordsearch: { from:'#0D9488', to:'#2DD4BF' },
};

export const GAME_INFO = {
  memory:     { name:'Memória',        icon:'🎴', brain:'memory',    desc:'Encontre os pares' },
  speed:      { name:'Rapidez',        icon:'⚡', brain:'speed',     desc:'Igual ou diferente?' },
  sequence:   { name:'Sequência',      icon:'🔢', brain:'attention', desc:'Repita a ordem' },
  stroop:     { name:'Cores',          icon:'🎨', brain:'attention', desc:'Nome ou cor?' },
  math:       { name:'Contas Rápidas', icon:'🧮', brain:'reasoning', desc:'Calcule depressa!' },
  word:       { name:'Palavras',       icon:'📝', brain:'language',  desc:'Adivinhe a palavra' },
  wordsearch: { name:'Caça-Palavras',  icon:'🔍', brain:'language',  desc:'Encontre as palavras' },
};

export const BRAIN_AREAS = {
  memory:    { label:'Memória',    color:COLORS.rose,     icon:'🎴' },
  speed:     { label:'Velocidade', color:COLORS.mintDark, icon:'⚡' },
  attention: { label:'Atenção',    color:COLORS.skyDark,  icon:'🎯' },
  reasoning: { label:'Raciocínio', color:COLORS.amberDark,icon:'🧮' },
  language:  { label:'Linguagem',  color:COLORS.coralDark,icon:'📖' },
};
