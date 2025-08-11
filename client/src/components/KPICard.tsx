import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useSmoothtTransitions, useLoadingAnimation } from "@/hooks/useSmoothtTransitions";
import React from "react";

interface KPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  iconBgColor: string;
  progress: number;
  subtitle: string;
  onClick?: () => void;
  isLoading?: boolean;
  animateValue?: boolean;
}

export function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  iconBgColor, 
  progress, 
  subtitle, 
  onClick,
  isLoading = false,
  animateValue = true
}: KPICardProps) {
  const { getCardVariants, classes, prefersReducedMotion } = useSmoothtTransitions();
  const loadingAnimation = useLoadingAnimation();
  const [displayValue, setDisplayValue] = React.useState(0);
  
  // Animação do contador de valores
  React.useEffect(() => {
    if (!animateValue || prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const duration = 1000; // 1 segundo
    const steps = 30;
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

  // Usar variantes otimizadas
  const cardVariants = getCardVariants();
  
  const iconVariants = {
    idle: { rotate: 0, scale: 1 },
    hover: {
      rotate: prefersReducedMotion ? 0 : 5,
      scale: prefersReducedMotion ? 1 : 1.1,
      transition: { duration: 0.2, ease: "easeOut" }
    }
  };

  const progressVariants = {
    initial: { width: 0, opacity: 0 },
    animate: {
      width: `${progress}%`,
      opacity: 1,
      transition: {
        width: { duration: prefersReducedMotion ? 0 : 1.5, ease: "easeOut" },
        opacity: { duration: prefersReducedMotion ? 0 : 0.3 }
      }
    }
  };

  const CardComponent = onClick ? motion.div : Card;
  
  // Converter cor do ícone para formato RGB para usar na sombra
  const getShadowColor = (color: string) => {
    // Se é uma cor hex, converter para rgb
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `${r}, ${g}, ${b}`;
    }
    // Se é uma cor hsl, extrair e converter (básico)
    if (color.startsWith('hsl')) {
      // Para cores comuns do sistema, mapear manualmente
      const colorMap: { [key: string]: string } = {
        'hsl(159, 69%, 38%)': '30, 164, 117', // verde
        'hsl(32, 81%, 46%)': '212, 124, 22', // laranja
        'hsl(0, 72%, 51%)': '220, 38, 38', // vermelho
      };
      return colorMap[color] || '0, 31, 63'; // fallback para primary
    }
    // Fallback para primary color
    return '0, 31, 63';
  };
  
  const shadowColor = getShadowColor(iconBgColor);
  
  const cardProps = onClick ? {
    as: Card,
    variants: cardVariants,
    initial: "initial",
    animate: "animate",
    whileHover: "hover",
    whileTap: "tap",
    onClick,
    className: `${classes.cardInteractive} touch-target border rounded-md m-1 transition-shadow`,
    style: { 
      cursor: 'pointer',
      '--tw-shadow-color': `rgb(${shadowColor})`,
      '--hover-shadow': `0 4px 12px rgba(${shadowColor}, 0.15)`
    } as React.CSSProperties
  } : {
    className: `${classes.transitionSmooth} border rounded-md m-1`
  };

  return (
    <CardComponent {...cardProps}>
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-4">
          {/* Icon com animação */}
          <motion.div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white relative overflow-hidden"
            style={{ backgroundColor: iconBgColor }}
            variants={onClick ? iconVariants : undefined}
            initial={onClick ? "idle" : undefined}
            whileHover={onClick ? "hover" : undefined}
          >
            <Icon className="h-6 w-6 relative z-10" />
            
            {/* Pulse effect durante loading */}
            {isLoading && (
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{ backgroundColor: iconBgColor }}
                {...loadingAnimation}
              />
            )}
          </motion.div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <motion.p 
              className="text-2xl font-bold text-primary tabular-nums"
              key={displayValue} // Re-trigger animation when value changes
              initial={prefersReducedMotion ? undefined : { scale: 1.1 }}
              animate={prefersReducedMotion ? undefined : { scale: 1 }}
              transition={prefersReducedMotion ? undefined : { duration: 0.2, ease: "easeOut" }}
            >
              {isLoading ? (
                <motion.span {...loadingAnimation}>
                  --
                </motion.span>
              ) : (
                displayValue
              )}
            </motion.p>
          </div>
        </div>
        
        {/* Progress bar animada */}
        <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-2 overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/80 to-primary rounded-full"
            variants={prefersReducedMotion ? undefined : progressVariants}
            initial={prefersReducedMotion ? undefined : "initial"}
            animate={prefersReducedMotion ? undefined : "animate"}
            style={{ width: prefersReducedMotion ? `${progress}%` : undefined }}
          />
        </div>
        
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </CardContent>
    </CardComponent>
  );
}
