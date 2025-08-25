import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsive } from '@/hooks/useMediaQuery';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Tipos de feedback
export type FeedbackType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface FeedbackConfig {
  icon: React.ComponentType<{ className?: string }>;
  colors: {
    bg: string;
    border: string;
    text: string;
    icon: string;
  };
}

const feedbackConfigs: Record<FeedbackType, FeedbackConfig> = {
  success: {
    icon: CheckCircle,
    colors: {
      bg: 'bg-green-50 dark:bg-green-950/50',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      icon: 'text-green-600 dark:text-green-400'
    }
  },
  error: {
    icon: XCircle,
    colors: {
      bg: 'bg-red-50 dark:bg-red-950/50',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      icon: 'text-red-600 dark:text-red-400'
    }
  },
  warning: {
    icon: AlertTriangle,
    colors: {
      bg: 'bg-yellow-50 dark:bg-yellow-950/50',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: 'text-yellow-600 dark:text-yellow-400'
    }
  },
  info: {
    icon: Info,
    colors: {
      bg: 'bg-blue-50 dark:bg-blue-950/50',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      icon: 'text-blue-600 dark:text-blue-400'
    }
  },
  loading: {
    icon: Info,
    colors: {
      bg: 'bg-gray-50 dark:bg-gray-950/50',
      border: 'border-gray-200 dark:border-gray-800',
      text: 'text-gray-800 dark:text-gray-200',
      icon: 'text-gray-600 dark:text-gray-400'
    }
  }
};

interface AnimatedFeedbackProps {
  type: FeedbackType;
  title?: string;
  message: string;
  isVisible: boolean;
  onClose?: () => void;
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
  duration?: number;
  showCloseButton?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'secondary' | 'destructive';
  }>;
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-4 right-4',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
};

const feedbackVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8, 
    y: -20 
  },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9, 
    x: 300,
    transition: {
      duration: 0.2
    }
  }
};

const progressVariants = {
  initial: { width: "100%" },
  animate: (duration: number) => ({
    width: "0%",
    transition: {
      duration: duration / 1000,
      ease: "linear"
    }
  })
};

export const AnimatedFeedback: React.FC<AnimatedFeedbackProps> = ({
  type,
  title,
  message,
  isVisible,
  onClose,
  position = 'top-right',
  duration = 4000,
  showCloseButton = true,
  actions = []
}) => {
  const { prefersReducedMotion } = useResponsive();
  const config = feedbackConfigs[type];
  const Icon = config.icon;

  React.useEffect(() => {
    if (isVisible && duration > 0 && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`fixed z-50 max-w-md w-full ${positionClasses[position]}`}
          variants={prefersReducedMotion ? undefined : feedbackVariants}
          initial={prefersReducedMotion ? undefined : "hidden"}
          animate={prefersReducedMotion ? undefined : "visible"}
          exit={prefersReducedMotion ? undefined : "exit"}
        >
          <div className={`p-4 border rounded-lg shadow-lg ${config.colors.bg} ${config.colors.border}`}>
            {/* Progress Bar */}
            {duration > 0 && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
                <motion.div
                  className={`h-full ${config.colors.icon.replace('text-', 'bg-')}`}
                  variants={prefersReducedMotion ? undefined : progressVariants}
                  initial={prefersReducedMotion ? undefined : "initial"}
                  animate={prefersReducedMotion ? undefined : "animate"}
                  custom={duration}
                />
              </div>
            )}

            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="flex-shrink-0">
                {type === 'loading' ? (
                  <motion.div
                    animate={prefersReducedMotion ? undefined : { rotate: 360 }}
                    transition={prefersReducedMotion ? undefined : {
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    <div className={`w-5 h-5 border-2 border-current border-t-transparent rounded-full ${config.colors.icon}`} />
                  </motion.div>
                ) : (
                  <Icon className={`w-5 h-5 ${config.colors.icon}`} />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {title && (
                  <h4 className={`text-sm font-semibold ${config.colors.text} mb-1`}>
                    {title}
                  </h4>
                )}
                <p className={`text-sm ${config.colors.text}`}>
                  {message}
                </p>

                {/* Actions */}
                {actions.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {actions.map((action, index) => (
                      <Button
                        key={index}
                        variant={action.variant || 'secondary'}
                        size="sm"
                        onClick={action.onClick}
                        className="text-xs"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Close Button */}
              {showCloseButton && onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex-shrink-0 h-6 w-6 p-0 hover:bg-transparent ${config.colors.text}`}
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook para gerenciar múltiplas mensagens de feedback
export const useFeedbackQueue = () => {
  const [feedbacks, setFeedbacks] = React.useState<
    Array<AnimatedFeedbackProps & { id: string }>
  >([]);

  const addFeedback = (feedback: Omit<AnimatedFeedbackProps, 'isVisible' | 'onClose'>) => {
    const id = Math.random().toString(36).substring(7);
    setFeedbacks(prev => [...prev, { ...feedback, id, isVisible: true, onClose: () => removeFeedback(id) }]);
  };

  const removeFeedback = (id: string) => {
    setFeedbacks(prev => prev.filter((f: any) => f.id !== id));
  };

  const clearAll = () => {
    setFeedbacks([]);
  };

  return {
    feedbacks,
    addFeedback,
    removeFeedback,
    clearAll
  };
};

// Componente para renderizar a queue de feedbacks
export const FeedbackQueue: React.FC<{
  feedbacks: Array<AnimatedFeedbackProps & { id: string }>;
  maxVisible?: number;
}> = ({ feedbacks, maxVisible = 3 }) => {
  const visibleFeedbacks = feedbacks.slice(0, maxVisible);

  return (
    <>
      {visibleFeedbacks.map((feedback, index) => (
        <div key={feedback.id} style={{ zIndex: 1000 - index }}>
          <AnimatedFeedback {...feedback} />
        </div>
      ))}
    </>
  );
};

export default AnimatedFeedback;