import { useState, useCallback, useRef, useEffect } from 'react';
import { useResponsive } from './useMediaQuery';

export type KPIExpandState = 'collapsed' | 'expanded' | 'ready-to-navigate';

interface UseCompactKPIProps {
  onNavigate?: () => void;
  autoCollapseDelay?: number;
}

interface UseCompactKPIReturn {
  expandedState: KPIExpandState;
  handleCardClick: () => void;
  resetState: () => void;
  isCompactMode: boolean;
}

/**
 * Hook para gerenciar o estado e comportamento dos KPI cards compactos
 * Implementa a lógica de expansão em duas etapas para mobile
 */
export function useCompactKPI({ 
  onNavigate,
  autoCollapseDelay = 5000 
}: UseCompactKPIProps = {}): UseCompactKPIReturn {
  const { isMobile } = useResponsive();
  const [expandedState, setExpandedState] = useState<KPIExpandState>('collapsed');

  const resetState = useCallback(() => {
    setExpandedState('collapsed');
  }, []);

  const handleCardClick = useCallback(() => {
    if (!onNavigate) return;

    if (expandedState === 'collapsed') {
      // Primeiro clique: expandir para mostrar conteúdo
      setExpandedState('expanded');
      
      // Auto-colapsar após um tempo se não houver interação
      if (autoCollapseDelay > 0) {
        setTimeout(() => {
          setExpandedState(prev => prev === 'expanded' ? 'collapsed' : prev);
        }, autoCollapseDelay);
      }
    } else if (expandedState === 'expanded') {
      // Segundo clique: marcar como pronto para navegar
      setExpandedState('ready-to-navigate');
      
      // Pequeno delay para mostrar o estado visual, depois navegar
      setTimeout(() => {
        onNavigate();
        // Reset do estado após navegação
        setTimeout(() => setExpandedState('collapsed'), 100);
      }, 200);
    } else {
      // Estado ready-to-navigate: navegar imediatamente
      onNavigate();
      setExpandedState('collapsed');
    }
  }, [expandedState, onNavigate, autoCollapseDelay]);

  return {
    expandedState,
    handleCardClick,
    resetState,
    isCompactMode: isMobile
  };
}

/**
 * Hook para gerenciar múltiplos KPI cards
 * Permite que apenas um card seja expandido por vez
 * Com timeout e colapso automático ao clicar em outro
 */
export function useMultipleCompactKPI(cardIds: string[], autoCollapseDelay: number = 5000) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [cardStates, setCardStates] = useState<Record<string, KPIExpandState>>(() =>
    cardIds.reduce((acc, id) => ({ ...acc, [id]: 'collapsed' }), {})
  );
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Função para colapsar tudo
  const collapseAll = useCallback(() => {
    setCardStates(prev => {
      const newStates = { ...prev };
      Object.keys(newStates).forEach(id => {
        newStates[id] = 'collapsed';
      });
      return newStates;
    });
    setExpandedCard(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const createCardHandler = useCallback((cardId: string, onNavigate?: () => void) => {
    return () => {
      const currentState = cardStates[cardId];
      
      if (currentState === 'collapsed') {
        // Colapsar outros cards e expandir este
        setCardStates(prev => {
          const newStates = { ...prev };
          Object.keys(newStates).forEach(id => {
            newStates[id] = id === cardId ? 'expanded' : 'collapsed';
          });
          return newStates;
        });
        setExpandedCard(cardId);
        
        // Limpar timeout anterior e criar novo
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        if (autoCollapseDelay > 0) {
          timeoutRef.current = setTimeout(() => {
            setCardStates(prev => {
              // Só colapsar se ainda estiver expandido
              if (prev[cardId] === 'expanded') {
                return { ...prev, [cardId]: 'collapsed' };
              }
              return prev;
            });
            setExpandedCard(null);
          }, autoCollapseDelay);
        }
        
      } else if (currentState === 'expanded') {
        // Preparar para navegação
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        setCardStates(prev => ({
          ...prev,
          [cardId]: 'ready-to-navigate'
        }));
        
        // Navegar após breve delay
        setTimeout(() => {
          if (onNavigate) onNavigate();
          collapseAll();
        }, 200);
      } else {
        // Navegar imediatamente
        if (onNavigate) onNavigate();
        collapseAll();
      }
    };
  }, [cardStates, autoCollapseDelay, collapseAll]);

  const resetAllStates = useCallback(() => {
    collapseAll();
  }, [collapseAll]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    cardStates,
    expandedCard,
    createCardHandler,
    resetAllStates,
    collapseAll
  };
}

/**
 * Utilitários para animações dos KPI cards
 */
export const compactKPIAnimations = {
  cardVariants: {
    collapsed: {
      height: "auto",
      transition: { 
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    expanded: {
      height: "auto",
      transition: { 
        duration: 0.4,
        ease: "easeInOut"
      }
    }
  },
  
  iconVariants: {
    collapsed: { 
      scale: 1,
      rotate: 0,
      transition: { duration: 0.3 }
    },
    expanded: { 
      scale: 1.1,
      rotate: 5,
      transition: { duration: 0.3 }
    },
    hover: {
      scale: 1.15,
      rotate: 10,
      transition: { duration: 0.2 }
    }
  },

  contentVariants: {
    hidden: {
      opacity: 0,
      height: 0,
      y: -10,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    visible: {
      opacity: 1,
      height: "auto",
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeInOut"
      }
    }
  },

  stateIndicatorVariants: {
    collapsed: {
      opacity: 0,
      scale: 0,
      transition: { duration: 0.2 }
    },
    expanded: {
      opacity: 0.7,
      scale: 1,
      transition: { duration: 0.3 }
    },
    readyToNavigate: {
      opacity: 1,
      scale: 1.1,
      transition: { duration: 0.2 }
    }
  }
};