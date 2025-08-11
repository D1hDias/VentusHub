import { useEffect, useState } from 'react';

/**
 * Hook para detectar media queries e mudanças de viewport
 * @param query - Media query string (ex: '(min-width: 768px)')
 * @returns boolean indicando se a media query corresponde
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Verificar se matchMedia está disponível (SSR safety)
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    // Função para atualizar o estado
    const handleChange = () => setMatches(mediaQuery.matches);
    
    // Definir estado inicial
    handleChange();
    
    // Listener para mudanças
    mediaQuery.addEventListener('change', handleChange);
    
    // Cleanup
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

/**
 * Hook para detectar breakpoints comuns
 */
export function useBreakpoints() {
  const isXs = useMediaQuery('(max-width: 479px)');
  const isSm = useMediaQuery('(min-width: 640px)');
  const isMd = useMediaQuery('(min-width: 768px)');
  const isLg = useMediaQuery('(min-width: 1024px)');
  const isXl = useMediaQuery('(min-width: 1280px)');
  const is2Xl = useMediaQuery('(min-width: 1536px)');
  
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  
  return {
    isXs,
    isSm,
    isMd, 
    isLg,
    isXl,
    is2Xl,
    isMobile,
    isTablet,
    isDesktop,
    // Helpers
    current: isXs ? 'xs' : isSm ? 'sm' : isMd ? 'md' : isLg ? 'lg' : isXl ? 'xl' : '2xl'
  };
}

/**
 * Hook para detectar capacidades de input do dispositivo
 */
export function useInputCapabilities() {
  const hasHover = useMediaQuery('(hover: hover)');
  const hasPointer = useMediaQuery('(pointer: fine)');
  const hasTouch = useMediaQuery('(pointer: coarse)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const prefersHighContrast = useMediaQuery('(prefers-contrast: high)');
  
  return {
    hasHover,
    hasPointer,
    hasTouch,
    prefersReducedMotion,
    prefersHighContrast,
    // Helpers
    isTouchDevice: hasTouch && !hasHover,
    isDesktopDevice: hasHover && hasPointer
  };
}

/**
 * Hook combinado para responsividade completa
 */
export function useResponsive() {
  const breakpoints = useBreakpoints();
  const capabilities = useInputCapabilities();
  
  return {
    ...breakpoints,
    ...capabilities
  };
}