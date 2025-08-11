import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useResponsive } from "@/hooks/useMediaQuery";
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
  const { prefersReducedMotion } = useResponsive();
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

  const cardVariants = {
    idle: { scale: 1 },
    hover: { 
      scale: prefersReducedMotion ? 1 : 1.02,
      transition: { duration: 0.2 }
    },
    tap: { 
      scale: prefersReducedMotion ? 1 : 0.98,
      transition: { duration: 0.1 }
    }
  };

  const iconVariants = {
    idle: { rotate: 0, scale: 1 },
    hover: {
      rotate: prefersReducedMotion ? 0 : 5,
      scale: prefersReducedMotion ? 1 : 1.1,
      transition: { duration: 0.2 }
    }
  };

  const progressVariants = {
    initial: { width: 0, opacity: 0 },
    animate: {
      width: `${progress}%`,
      opacity: 1,
      transition: {
        width: { duration: prefersReducedMotion ? 0 : 1.5, ease: "easeOut" },
        opacity: { duration: 0.3 }
      }
    }
  };

  const CardComponent = onClick ? motion.div : Card;
  const cardProps = onClick ? {
    as: Card,
    variants: cardVariants,
    initial: "idle",
    whileHover: "hover",
    whileTap: "tap",
    onClick,
    className: "hover:shadow-lg transition-shadow cursor-pointer touch-target",
    style: { cursor: 'pointer' }
  } : {
    className: "hover:shadow-md transition-shadow"
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
            {isLoading && !prefersReducedMotion && (
              <motion.div
                className="absolute inset-0 rounded-xl"
                style={{ backgroundColor: iconBgColor }}
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
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
              transition={prefersReducedMotion ? undefined : { duration: 0.2 }}
            >
              {isLoading && !prefersReducedMotion ? (
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
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
