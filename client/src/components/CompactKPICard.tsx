import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSmoothtTransitions, useLoadingAnimation } from "@/hooks/useSmoothtTransitions";
import { useCompactKPI, compactKPIAnimations, KPIExpandState } from "@/hooks/useCompactKPI";
import React from "react";

interface CompactKPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconBgColor: string;
  progress: number;
  subtitle: string;
  onClick?: () => void;
  isLoading?: boolean;
  animateValue?: boolean;
  autoCollapseDelay?: number;
  // Props para controle externo
  externalExpandedState?: KPIExpandState;
  onStateChange?: (newState: KPIExpandState) => void;
}

export function CompactKPICard({ 
  title, 
  value, 
  icon: Icon, 
  iconBgColor, 
  progress, 
  subtitle, 
  onClick,
  isLoading = false,
  animateValue = true,
  autoCollapseDelay = 5000,
  externalExpandedState,
  onStateChange
}: CompactKPICardProps) {
  const { classes, prefersReducedMotion } = useSmoothtTransitions();
  const loadingAnimation = useLoadingAnimation();
  const [displayValue, setDisplayValue] = React.useState(0);
  
  // Usar estado externo se fornecido, senão usar hook interno
  const internalHook = useCompactKPI({ 
    onNavigate: onClick,
    autoCollapseDelay
  });
  
  const expandedState = externalExpandedState ?? internalHook.expandedState;
  const handleCardClick = onStateChange ? (() => {
    // Lógica para controle externo
    if (expandedState === 'collapsed') {
      onStateChange('expanded');
    } else if (expandedState === 'expanded') {
      onStateChange('ready-to-navigate');
      setTimeout(() => {
        if (onClick) onClick();
        onStateChange('collapsed');
      }, 200);
    } else {
      if (onClick) onClick();
      onStateChange('collapsed');
    }
  }) : internalHook.handleCardClick;

  // Animação do contador de valores
  React.useEffect(() => {
    if (!animateValue || prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const duration = 800;
    const steps = 20;
    const increment = value / steps;
    const stepTime = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, animateValue, prefersReducedMotion]);

  // Usar as variantes de animação do hook
  const {
    cardVariants,
    iconVariants,
    contentVariants,
    stateIndicatorVariants
  } = compactKPIAnimations;

  // Adaptar variantes para modo reduzido
  const adaptedIconVariants = prefersReducedMotion ? {
    collapsed: { scale: 1, rotate: 0, transition: { duration: 0.3 } },
    expanded: { scale: 1.1, rotate: 0, transition: { duration: 0.3 } },
    hover: { scale: 1.15, rotate: 0, transition: { duration: 0.2 } }
  } : iconVariants;

  const progressVariants = {
    hidden: { 
      width: 0,
      opacity: 0 
    },
    visible: {
      width: `${progress}%`,
      opacity: 1,
      transition: {
        width: { duration: prefersReducedMotion ? 0 : 1.2, ease: "easeOut" },
        opacity: { duration: prefersReducedMotion ? 0 : 0.3 }
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="collapsed"
      animate={expandedState !== 'collapsed' ? "expanded" : "collapsed"}
      className={`${classes.cardInteractive} relative`}
    >
      <Card 
        className={`
          border transition-all duration-300 cursor-pointer overflow-hidden
          ${expandedState === 'expanded' ? 'border-primary/30 bg-primary/5' : ''}
          ${expandedState === 'ready-to-navigate' ? 'border-primary bg-primary/10' : ''}
          hover:border-primary/50 hover:shadow-md
        `}
        onClick={handleCardClick}
      >
        <CardContent className="p-2">
          {/* Header sempre visível */}
          <div className="flex items-center gap-2">
            {/* Ícone com estados visuais */}
            <motion.div
              className="relative w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
              style={{ backgroundColor: iconBgColor }}
              variants={adaptedIconVariants}
              initial="collapsed"
              animate={expandedState}
              whileHover={onClick ? "hover" : undefined}
            >
              <Icon className="h-5 w-5 relative z-10" />
              
              {/* Loading effect */}
              {isLoading && (
                <motion.div
                  className="absolute inset-0 rounded-lg"
                  style={{ backgroundColor: iconBgColor }}
                  {...loadingAnimation}
                />
              )}

              {/* Indicador de estado no canto */}
              <motion.div 
                className="absolute -top-1 -right-1"
                variants={stateIndicatorVariants}
                initial="collapsed"
                animate={
                  expandedState === 'ready-to-navigate' ? 'readyToNavigate' : 
                  expandedState === 'expanded' ? 'expanded' : 'collapsed'
                }
              >
                {expandedState === 'expanded' && (
                  <div className="w-3 h-3 rounded-full bg-primary flex items-center justify-center">
                    <ChevronDown className="h-2 w-2 text-white" />
                  </div>
                )}
                {expandedState === 'ready-to-navigate' && (
                  <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                    <ExternalLink className="h-2 w-2 text-white" />
                  </div>
                )}
              </motion.div>
            </motion.div>
            
            {/* Título e indicador visual */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm truncate text-foreground">
                  {title}
                </h3>
                
                {/* Indicador de expansão */}
                <motion.div
                  initial={false}
                  animate={{ 
                    rotate: expandedState !== 'collapsed' ? 180 : 0,
                    scale: expandedState === 'ready-to-navigate' ? 1.2 : 1
                  }}
                  transition={{ duration: 0.3 }}
                  className={`
                    ${expandedState === 'ready-to-navigate' ? 'text-primary' : 'text-muted-foreground'}
                  `}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </div>
              
              {/* Linha de estado minimalista */}
              <motion.div 
                className="w-full h-0.5 bg-muted rounded-full mt-1 overflow-hidden"
                initial={false}
                animate={{
                  backgroundColor: 
                    expandedState === 'ready-to-navigate' ? 'rgb(34 197 94)' :
                    expandedState === 'expanded' ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
                }}
              >
                <motion.div
                  className="h-full bg-current"
                  initial={{ width: "0%" }}
                  animate={{ 
                    width: expandedState !== 'collapsed' ? "100%" : "0%" 
                  }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                />
              </motion.div>
            </div>
          </div>

          {/* Conteúdo expansível */}
          <AnimatePresence>
            {expandedState !== 'collapsed' && (
              <motion.div
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="mt-2 pt-2 border-t border-border/50"
              >
                {/* Valor principal */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground">Valor</span>
                  <motion.span 
                    className="text-2xl font-bold text-primary tabular-nums"
                    key={displayValue}
                    initial={prefersReducedMotion ? undefined : { scale: 1.1, opacity: 0 }}
                    animate={prefersReducedMotion ? undefined : { scale: 1, opacity: 1 }}
                    transition={prefersReducedMotion ? undefined : { duration: 0.3 }}
                  >
                    {isLoading ? (
                      <motion.span {...loadingAnimation}>--</motion.span>
                    ) : (
                      displayValue.toLocaleString()
                    )}
                  </motion.span>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Progresso</span>
                    <span className="text-xs font-bold text-primary">{progress}%</span>
                  </div>
                  
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/80 to-primary rounded-full"
                      variants={prefersReducedMotion ? undefined : progressVariants}
                      initial={prefersReducedMotion ? undefined : "hidden"}
                      animate={prefersReducedMotion ? undefined : "visible"}
                      style={{ width: prefersReducedMotion ? `${progress}%` : undefined }}
                    />
                  </div>
                </div>

                {/* Subtitle */}
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {subtitle}
                </p>

                {/* Call to action hint */}
                {expandedState === 'expanded' && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.3 }}
                    className="mt-2 pt-2 border-t border-border/30"
                  >
                    <p className="text-xs text-muted-foreground/70 text-center flex items-center justify-center gap-1">
                      <ChevronRight className="h-3 w-3" />
                      Toque novamente para navegar
                    </p>
                  </motion.div>
                )}

                {expandedState === 'ready-to-navigate' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-2 pt-2 border-t border-primary/30"
                  >
                    <p className="text-xs text-primary text-center font-medium flex items-center justify-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      Navegando...
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}