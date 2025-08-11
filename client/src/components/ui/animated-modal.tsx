import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useResponsive } from '@/hooks/useMediaQuery';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';

interface AnimatedModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  animationType?: 'fade' | 'slide' | 'scale' | 'bounce';
  overlayClassName?: string;
  hideCloseButton?: boolean;
}

const modalVariants: Record<string, Variants> = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  },
  slide: {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 30, scale: 0.95 }
  },
  scale: {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 }
  },
  bounce: {
    hidden: { opacity: 0, scale: 0.3, rotate: -10 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 300
      }
    },
    exit: { opacity: 0, scale: 0.8, rotate: 5 }
  }
};

const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};

export const AnimatedModal: React.FC<AnimatedModalProps> = ({
  children,
  isOpen,
  onClose,
  className = '',
  animationType = 'slide',
  overlayClassName = '',
  hideCloseButton = false
}) => {
  const { prefersReducedMotion } = useResponsive();
  
  // Se o usuário prefere movimento reduzido, use apenas fade
  const effectiveAnimation = prefersReducedMotion ? 'fade' : animationType;
  
  const variants = modalVariants[effectiveAnimation];
  const transition = prefersReducedMotion 
    ? { duration: 0.15 } 
    : { duration: 0.3, ease: "easeOut" };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogOverlay asChild>
            <motion.div
              className={`fixed inset-0 z-50 bg-background/80 backdrop-blur-sm ${overlayClassName}`}
              variants={prefersReducedMotion ? undefined : overlayVariants}
              initial={prefersReducedMotion ? undefined : "hidden"}
              animate={prefersReducedMotion ? undefined : "visible"}
              exit={prefersReducedMotion ? undefined : "exit"}
              transition={transition}
              onClick={onClose}
            />
          </DialogOverlay>
          
          <DialogContent 
            asChild 
            className={`fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] ${className}`}
          >
            <motion.div
              variants={prefersReducedMotion ? undefined : variants}
              initial={prefersReducedMotion ? undefined : "hidden"}
              animate={prefersReducedMotion ? undefined : "visible"}
              exit={prefersReducedMotion ? undefined : "exit"}
              transition={transition}
              onClick={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

// Componente de Toast animado para feedback
interface AnimatedToastProps {
  children: React.ReactNode;
  isVisible: boolean;
  type?: 'success' | 'error' | 'warning' | 'info';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center';
  duration?: number;
  onClose?: () => void;
}

const toastVariants: Variants = {
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
    y: -10,
    transition: {
      duration: 0.2
    }
  }
};

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2'
};

const typeClasses = {
  success: 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200',
  error: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
  info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200'
};

export const AnimatedToast: React.FC<AnimatedToastProps> = ({
  children,
  isVisible,
  type = 'info',
  position = 'top-right',
  duration = 4000,
  onClose
}) => {
  const { prefersReducedMotion } = useResponsive();

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
          className={`fixed z-50 p-4 border rounded-lg shadow-lg max-w-sm ${positionClasses[position]} ${typeClasses[type]}`}
          variants={prefersReducedMotion ? undefined : toastVariants}
          initial={prefersReducedMotion ? undefined : "hidden"}
          animate={prefersReducedMotion ? undefined : "visible"}
          exit={prefersReducedMotion ? undefined : "exit"}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook para usar animações condicionais
export const useConditionalAnimation = () => {
  const { prefersReducedMotion } = useResponsive();

  const getVariants = (variants: Variants): Variants | undefined => {
    return prefersReducedMotion ? undefined : variants;
  };

  const getTransition = (transition: any) => {
    return prefersReducedMotion ? { duration: 0.15 } : transition;
  };

  const getProps = (animationProps: any) => {
    return prefersReducedMotion ? {} : animationProps;
  };

  return {
    getVariants,
    getTransition,
    getProps,
    prefersReducedMotion
  };
};

export default AnimatedModal;