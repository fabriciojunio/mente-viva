// src/shared/theme/index.js
export const COLORS = {
  rose:      '#FF6B9D', roseDark: '#D94F7E', roseLight: '#FFB3D0',
  lavender:  '#C084FC', lavDark:  '#7C3AED',
  mint:      '#34D399', mintDark: '#10B981',
  sky:       '#60A5FA', skyDark:  '#3B82F6',
  amber:     '#FBBF24', amberDark:'#F59E0B',
  coral:     '#FB923C', coralDark:'#F97316',
  teal:      '#2DD4BF', tealDark: '#14B8A6',
  // Fundo escuro violeta — combina naturalmente com rosa e lavanda
  bg:        '#0B0D1A',
  white:     '#151829',
  gray100:   '#0F1120', gray200: '#1E2140', gray300: '#2C3058',
  gray500:   '#8085B0', gray700: '#C0C4E0',
  text:      '#EBEDff',
  success:   '#34D399',
  error:     '#F87171',
};

export const RADIUS = { sm:10, md:14, lg:20, xl:28, full:999 };

export const SHADOW = {
  card:   { shadowColor:'#7C3AED', shadowOffset:{width:0,height:3}, shadowOpacity:0.25, shadowRadius:10, elevation:5 },
  strong: { shadowColor:'#000',    shadowOffset:{width:0,height:5}, shadowOpacity:0.25, shadowRadius:14, elevation:8 },
};

export const FONTS = { regular:{fontWeight:'400'}, semibold:{fontWeight:'600'}, bold:{fontWeight:'700'}, black:{fontWeight:'900'} };

export const GAME_COLORS = {
  memory:     { from:'#D94F7E', to:'#FF6B9D' },
  speed:      { from:'#10B981', to:'#34D399' },
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
  math:       { name:'Contas',         icon:'🧮', brain:'reasoning', desc:'Calcule depressa!' },
  word:       { name:'Palavras',       icon:'📝', brain:'language',  desc:'Adivinhe a palavra' },
  wordsearch: { name:'Caça-Palavras',  icon:'🔍', brain:'language',  desc:'Encontre as palavras' },
};

export const BRAIN_AREAS = {
  memory:    { label:'Memória',    color:COLORS.rose,      icon:'🎴' },
  speed:     { label:'Velocidade', color:COLORS.mintDark,  icon:'⚡' },
  attention: { label:'Atenção',    color:COLORS.skyDark,   icon:'🎯' },
  reasoning: { label:'Raciocínio', color:COLORS.amberDark, icon:'🧮' },
  language:  { label:'Linguagem',  color:COLORS.coralDark, icon:'📖' },
};
