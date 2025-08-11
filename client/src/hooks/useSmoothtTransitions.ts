import { useEffect, useState } from 'react';
import { useResponsive } from '@/hooks/useMediaQuery';

export interface TransitionConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  type?: 'smooth' | 'bounce' | 'spring' | 'instant';
}

export const useSmoothtTransitions = () => {
  const { prefersReducedMotion } = useResponsive();
  const [isReady, setIsReady] = useState(false);

  // Configurações de transição otimizadas
  const configs = {
    instant: {
      duration: prefersReducedMotion ? 0.01 : 0,
      easing: 'linear'
    },
    smooth: {
      duration: prefersReducedMotion ? 0.01 : 0.2,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    },
    bounce: {
      duration: prefersReducedMotion ? 0.01 : 0.4,
      easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
    },
    spring: {
      duration: prefersReducedMotion ? 0.01 : 0.3,
      easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
    }
  };

  // Variantes do Framer Motion otimizadas
  const getMotionVariants = (type: TransitionConfig['type'] = 'smooth') => {
    const config = configs[type];
    
    return {
      initial: { opacity: 0, scale: 0.95 },
      animate: { 
        opacity: 1, 
        scale: 1,
        transition: {
          duration: config.duration,
          ease: config.easing
        }
      },
      exit: { 
        opacity: 0, 
        scale: 0.95,
        transition: {
          duration: config.duration * 0.7,
          ease: config.easing
        }
      },
      hover: {
        scale: prefersReducedMotion ? 1 : 1.02,
        y: prefersReducedMotion ? 0 : -2,
        transition: {
          duration: config.duration,
          ease: config.easing
        }
      },
      tap: {
        scale: prefersReducedMotion ? 1 : 0.98,
        transition: {
          duration: config.duration * 0.5,
          ease: config.easing
        }
      }
    };
  };

  // Variantes para cards
  const getCardVariants = () => ({
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.01 : 0.2,
        ease: "easeOut"
      }
    },
    hover: {
      y: prefersReducedMotion ? 0 : -2,
      boxShadow: prefersReducedMotion ? 
        "0 4px 12px rgba(0, 31, 63, 0.1)" : 
        "0 8px 25px rgba(0, 31, 63, 0.15)",
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  });

  // Variantes para listas
  const getListVariants = () => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
        delayChildren: prefersReducedMotion ? 0 : 0.1
      }
    }
  });

  const getListItemVariants = () => ({
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: prefersReducedMotion ? 0.01 : 0.2,
        ease: "easeOut"
      }
    }
  });

  // CSS classes para transições
  const getCSSClass = (type: TransitionConfig['type'] = 'smooth') => {
    if (prefersReducedMotion) return '';
    
    switch (type) {
      case 'instant': return '';
      case 'smooth': return 'transition-smooth';
      case 'bounce': return 'transition-smooth-slow';
      case 'spring': return 'transition-smooth';
      default: return 'transition-smooth';
    }
  };

  // Classes utilitárias
  const classes = {
    cardInteractive: prefersReducedMotion ? 'cursor-pointer' : 'card-interactive',
    buttonInteractive: prefersReducedMotion ? '' : 'button-interactive',
    hoverLift: prefersReducedMotion ? '' : 'hover-lift',
    hoverScale: prefersReducedMotion ? '' : 'hover-scale',
    hoverGlow: prefersReducedMotion ? '' : 'hover-glow',
    transitionSmooth: prefersReducedMotion ? '' : 'transition-smooth',
    transitionColors: prefersReducedMotion ? '' : 'transition-colors'
  };

  // Inicializar depois do primeiro render para evitar hidratação inconsistente
  useEffect(() => {
    setIsReady(true);
  }, []);

  return {
    isReady,
    configs,
    getMotionVariants,
    getCardVariants,
    getListVariants,
    getListItemVariants,
    getCSSClass,
    classes,
    prefersReducedMotion
  };
};

// Hook especializado para animações de entrada
export const useEntranceAnimation = (delay: number = 0) => {
  const { prefersReducedMotion } = useResponsive();
  
  return {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: prefersReducedMotion ? 0.01 : 0.3,
        delay: prefersReducedMotion ? 0 : delay,
        ease: "easeOut"
      }
    }
  };
};

// Hook para animações de loading
export const useLoadingAnimation = () => {
  const { prefersReducedMotion } = useResponsive();
  
  return {
    animate: prefersReducedMotion ? {} : {
      opacity: [1, 0.5, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };
};