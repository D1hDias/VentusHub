import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Check, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusType = 'complete' | 'incomplete' | 'critical' | 'pending';

interface StageStatusBadgeProps {
  count: number;
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
  className?: string;
}

const statusConfig = {
  complete: {
    background: 'bg-gradient-to-br from-green-500 to-green-600',
    border: 'border-green-700',
    icon: Check,
    text: 'text-white',
    pulse: false,
  },
  incomplete: {
    background: 'bg-gradient-to-br from-amber-500 to-amber-600',
    border: 'border-amber-700',
    icon: Clock,
    text: 'text-white',
    pulse: false,
  },
  critical: {
    background: 'bg-gradient-to-br from-red-500 to-red-600',
    border: 'border-red-700',
    icon: AlertTriangle,
    text: 'text-white',
    pulse: true,
  },
  pending: {
    background: 'bg-gradient-to-br from-gray-500 to-gray-600',
    border: 'border-gray-700',
    icon: AlertCircle,
    text: 'text-white',
    pulse: false,
  },
};

const sizeConfig = {
  sm: {
    container: 'w-5 h-5',
    text: 'text-xs',
    icon: 'w-3 h-3',
  },
  md: {
    container: 'w-6 h-6',
    text: 'text-xs',
    icon: 'w-3.5 h-3.5',
  },
  lg: {
    container: 'w-7 h-7',
    text: 'text-sm',
    icon: 'w-4 h-4',
  },
};

export function StageStatusBadge({ 
  count, 
  status, 
  size = 'md', 
  showPulse = false,
  className 
}: StageStatusBadgeProps) {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const shouldPulse = showPulse || (config.pulse && count > 0);
  const Icon = config.icon;

  // Se count é 0 e status é complete, mostra ícone de check
  const showIcon = count === 0 && status === 'complete';
  const showCount = count > 0;

  const badgeVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    },
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  if (!showIcon && !showCount) {
    return null;
  }

  return (
    <motion.div
      className={cn(
        "relative flex items-center justify-center rounded-full border-2 font-bold shadow-lg",
        config.background,
        config.border,
        config.text,
        sizeStyles.container,
        className
      )}
      variants={badgeVariants}
      initial="initial"
      animate={shouldPulse ? "pulse" : "animate"}
      whileHover={{ scale: 1.05 }}
      role="status"
      aria-label={
        showIcon 
          ? `Etapa completa` 
          : `${count} ${count === 1 ? 'pendência' : 'pendências'} ${status === 'critical' ? 'crítica' : ''}`
      }
    >
      {showIcon ? (
        <Icon className={sizeStyles.icon} />
      ) : (
        <span className={sizeStyles.text}>
          {count > 99 ? '99+' : count}
        </span>
      )}
      
      {/* Pulse ring for critical items */}
      {shouldPulse && (
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full border-2",
            config.background,
            "opacity-75"
          )}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.75, 0, 0.75],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </motion.div>
  );
}

// Helper component for positioning badges
interface BadgeWrapperProps {
  children: React.ReactNode;
  badge?: React.ReactNode;
  badgePosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function BadgeWrapper({ 
  children, 
  badge, 
  badgePosition = 'top-right' 
}: BadgeWrapperProps) {
  const positionClasses = {
    'top-right': '-top-2 -right-2',
    'top-left': '-top-2 -left-2',
    'bottom-right': '-bottom-2 -right-2',
    'bottom-left': '-bottom-2 -left-2',
  };

  return (
    <div className="relative inline-block">
      {children}
      {badge && (
        <div className={cn("absolute z-10", positionClasses[badgePosition])}>
          {badge}
        </div>
      )}
    </div>
  );
}