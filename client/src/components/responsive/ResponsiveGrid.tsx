import React from 'react';
import { useContainerQuery } from '@/hooks/useContainerQuery';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsive } from '@/hooks/useMediaQuery';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  // Grid configuration
  minItemWidth?: number;
  maxColumns?: number;
  gap?: 'sm' | 'md' | 'lg';
  // Animation
  animateItems?: boolean;
  staggerDelay?: number;
  // Container query breakpoints
  breakpoints?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
}

const gapClasses = {
  sm: 'gap-space-fluid-xs',
  md: 'gap-space-fluid-s',
  lg: 'gap-space-fluid-m'
};

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = '',
  minItemWidth = 280,
  maxColumns = 4,
  gap = 'md',
  animateItems = false,
  staggerDelay = 0.05,
  breakpoints = {
    sm: 400,
    md: 600,
    lg: 900,
    xl: 1200
  }
}) => {
  const [containerRef, currentBreakpoint] = useContainerQuery(breakpoints) as unknown as [React.RefObject<HTMLDivElement>, string | null];
  const { prefersReducedMotion } = useResponsive();
  const shouldAnimate = animateItems && !prefersReducedMotion;

  // Calcular número de colunas baseado no breakpoint do container
  const getColumns = () => {
    if (!currentBreakpoint) return 1;
    
    switch (currentBreakpoint) {
      case 'xl': return Math.min(maxColumns, 4);
      case 'lg': return Math.min(maxColumns, 3);
      case 'md': return Math.min(maxColumns, 2);
      case 'sm': return Math.min(maxColumns, 2);
      default: return 1;
    }
  };

  const columns = getColumns();
  const childrenArray = React.Children.toArray(children);

  return (
    <div 
      ref={containerRef}
      className={`container-query ${className}`}
    >
      <div 
        className={`grid ${gapClasses[gap]}`}
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`
        }}
      >
        {shouldAnimate ? (
          <AnimatePresence mode="popLayout">
            {childrenArray.map((child, index) => (
              <motion.div
                key={index}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  duration: 0.2,
                  delay: index * staggerDelay,
                  layout: { duration: 0.3 }
                }}
              >
                {child}
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          childrenArray
        )}
      </div>
    </div>
  );
};

// Variações específicas para casos comuns
export const KPIGrid: React.FC<Omit<ResponsiveGridProps, 'minItemWidth' | 'maxColumns'>> = (props: any) => {
  const { isMobile } = useResponsive();
  
  // Para mobile, usar layout de coluna única otimizado (lista)
  if (isMobile) {
    return (
      <div className="space-y-2">
        {props.children}
      </div>
    );
  }
  
  // Para desktop, usar grid responsivo
  return (
    <ResponsiveGrid
      {...props}
      minItemWidth={240}
      maxColumns={4}
      breakpoints={{
        sm: 300,
        md: 600,
        lg: 900,
        xl: 1200
      }}
    />
  );
};

export const CardGrid: React.FC<Omit<ResponsiveGridProps, 'minItemWidth' | 'maxColumns'>> = (props: any) => (
  <ResponsiveGrid
    {...props}
    minItemWidth={320}
    maxColumns={3}
    breakpoints={{
      sm: 350,
      md: 700,
      lg: 1050,
      xl: 1400
    }}
  />
);

export const CompactGrid: React.FC<Omit<ResponsiveGridProps, 'minItemWidth' | 'maxColumns'>> = (props: any) => (
  <ResponsiveGrid
    {...props}
    minItemWidth={200}
    maxColumns={6}
    gap="sm"
    breakpoints={{
      sm: 220,
      md: 440,
      lg: 660,
      xl: 880
    }}
  />
);

// Hook para usar as informações do grid em componentes filhos
export const useGridContext = () => {
  // Em uma implementação real, isso viria de um Context Provider
  // Por enquanto, retornamos informações básicas
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  return {
    columns: isDesktop ? 4 : isTablet ? 2 : 1,
    isMobile,
    isTablet,
    isDesktop
  };
};

export default ResponsiveGrid;