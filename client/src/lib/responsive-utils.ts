/**
 * Utilitários para design responsivo padronizado
 * Centraliza patterns de grid, spacing e breakpoints
 */

// Breakpoints padronizados (alinhados com Tailwind CSS)
export const BREAKPOINTS = {
  sm: 640,   // Smartphones grandes / tablets pequenos
  md: 768,   // Tablets / laptops pequenos  
  lg: 1024,  // Desktops
  xl: 1280,  // Desktops grandes
  xxl: 1536  // Telas ultra-wide
} as const;

// Grid patterns padronizados para diferentes contextos
export const GRID_PATTERNS = {
  // Estatísticas e KPIs
  stats: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
  statsCompact: "grid grid-cols-2 md:grid-cols-4 gap-3",
  
  // Formulários
  form: "grid grid-cols-1 md:grid-cols-2 gap-4",
  formComplex: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
  formInline: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3",
  
  // Cards de conteúdo
  cards: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  cardsCompact: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4",
  
  // Bancos e seleções
  banks: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3",
  banksLarge: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4",
  
  // Listas e tabelas
  list: "grid grid-cols-1 gap-2",
  listTwoCol: "grid grid-cols-1 md:grid-cols-2 gap-4",
  
  // Dashboard layouts
  dashboard: "grid grid-cols-1 lg:grid-cols-12 gap-6",
  dashboardSidebar: "grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8",
  
  // Simuladores
  simulator: "grid grid-cols-1 xl:grid-cols-3 gap-6",
  simulatorResults: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
} as const;

// Spacing patterns padronizados
export const SPACING_PATTERNS = {
  container: "container mx-auto px-4 py-8 max-w-7xl",
  containerCompact: "container mx-auto px-4 py-6 max-w-6xl",
  containerFluid: "mx-auto px-4 sm:px-6 lg:px-8 py-8",
  
  section: "mb-8 md:mb-12",
  sectionCompact: "mb-6 md:mb-8",
  
  card: "p-4 md:p-6",
  cardCompact: "p-3 md:p-4",
  cardLarge: "p-6 md:p-8",
} as const;

// Classes de visibilidade responsiva padronizadas
export const RESPONSIVE_CLASSES = {
  // Mostrar apenas em mobile
  mobileOnly: "block md:hidden",
  // Mostrar apenas em desktop
  desktopOnly: "hidden md:block",
  // Mostrar em tablet e acima
  tabletUp: "hidden sm:block",
  // Mostrar apenas em mobile e tablet
  mobileTabletOnly: "block md:hidden",
} as const;

// Utilidade para gerar classes de grid customizadas
export const createGridPattern = (
  mobile: number = 1,
  tablet: number = 2,
  desktop: number = 3,
  large?: number,
  gap: string = "gap-4"
) => {
  const classes = [`grid grid-cols-${mobile}`, gap];
  
  if (tablet !== mobile) classes.push(`md:grid-cols-${tablet}`);
  if (desktop !== tablet) classes.push(`lg:grid-cols-${desktop}`);
  if (large && large !== desktop) classes.push(`xl:grid-cols-${large}`);
  
  return classes.join(" ");
};

// Utilidade para classes condicionais baseadas em dispositivo
export const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(" ");
};

// Utilidade para detectar dispositivo via JavaScript
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  
  if (width < BREAKPOINTS.md) return 'mobile';
  if (width < BREAKPOINTS.lg) return 'tablet';
  return 'desktop';
};

// Utilidade para classes responsivas de texto
export const TEXT_RESPONSIVE = {
  // Títulos principais
  h1: "text-3xl md:text-4xl lg:text-5xl font-bold",
  h2: "text-2xl md:text-3xl lg:text-4xl font-semibold", 
  h3: "text-xl md:text-2xl lg:text-3xl font-semibold",
  h4: "text-lg md:text-xl lg:text-2xl font-medium",
  
  // Textos de corpo
  body: "text-sm md:text-base",
  bodyLarge: "text-base md:text-lg",
  caption: "text-xs md:text-sm",
  
  // Textos especiais
  hero: "text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold",
  subtitle: "text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300"
} as const;

// Export de todos os patterns como um objeto para fácil importação
export const RESPONSIVE = {
  BREAKPOINTS,
  GRID_PATTERNS,
  SPACING_PATTERNS,
  RESPONSIVE_CLASSES,
  TEXT_RESPONSIVE,
  createGridPattern,
  cn,
  getDeviceType
} as const;