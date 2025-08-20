import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, ButtonProps } from '@/components/ui/button';
import { useResponsive } from '@/hooks/useMediaQuery';
import { Loader2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  successState?: boolean;
  successText?: string;
  errorState?: boolean;
  errorText?: string;
  animationType?: 'bounce' | 'pulse' | 'slide' | 'scale';
  showSuccessCheck?: boolean;
  showErrorIcon?: boolean;
  resetDelay?: number;
}

const buttonVariants = {
  bounce: {
    hover: { scale: 1.05, y: -2 },
    tap: { scale: 0.95, y: 0 },
    success: { scale: [1, 1.1, 1] },
    error: { scale: [1, 0.95, 1], x: [-2, 2, -2, 2, 0] }
  },
  pulse: {
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
    success: { 
      scale: [1, 1.05, 1],
      transition: { duration: 0.4 }
    },
    error: { 
      backgroundColor: ['var(--destructive)', 'var(--destructive-dark)', 'var(--destructive)'],
      transition: { duration: 0.4 }
    }
  },
  slide: {
    hover: { x: 2 },
    tap: { x: 0 },
    success: { x: [0, 10, 0] },
    error: { x: [-5, 5, -5, 5, 0] }
  },
  scale: {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
    success: { scale: [1, 1.2, 1] },
    error: { scale: [1, 0.9, 1.1, 1] }
  }
};

const iconVariants = {
  loading: {
    rotate: 360,
    transition: { duration: 1, repeat: Infinity, ease: "linear" }
  },
  success: {
    scale: [0, 1.2, 1],
    rotate: [0, 10, 0],
    transition: { duration: 0.5 }
  },
  error: {
    scale: [0, 1.2, 1],
    rotate: [0, -10, 0],
    transition: { duration: 0.5 }
  }
};

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({
    children,
    className,
    isLoading = false,
    loadingText = "Carregando...",
    successState = false,
    successText = "Sucesso!",
    errorState = false,
    errorText = "Erro",
    animationType = 'bounce',
    showSuccessCheck = true,
    showErrorIcon = true,
    resetDelay = 2000,
    disabled,
    onClick,
    ...props
  }, ref) => {
    const { prefersReducedMotion } = useResponsive();
    const [localSuccessState, setLocalSuccessState] = React.useState(false);
    const [localErrorState, setLocalErrorState] = React.useState(false);
    
    const variants = buttonVariants[animationType];
    const isDisabled = disabled || isLoading || localSuccessState || localErrorState;
    
    // Auto-reset states
    React.useEffect(() => {
      if (successState && resetDelay > 0) {
        setLocalSuccessState(true);
        const timer = setTimeout(() => setLocalSuccessState(false), resetDelay);
        return () => clearTimeout(timer);
      }
    }, [successState, resetDelay]);
    
    React.useEffect(() => {
      if (errorState && resetDelay > 0) {
        setLocalErrorState(true);
        const timer = setTimeout(() => setLocalErrorState(false), resetDelay);
        return () => clearTimeout(timer);
      }
    }, [errorState, resetDelay]);

    const getCurrentState = () => {
      if (isLoading) return 'loading';
      if (successState || localSuccessState) return 'success';
      if (errorState || localErrorState) return 'error';
      return 'idle';
    };

    const currentState = getCurrentState();

    const getButtonContent = () => {
      switch (currentState) {
        case 'loading':
          return (
            <div className="flex items-center gap-2">
              <motion.div
                animate={prefersReducedMotion ? undefined : iconVariants.loading}
              >
                <Loader2 className="h-4 w-4" />
              </motion.div>
              <span>{loadingText}</span>
            </div>
          );
        case 'success':
          return (
            <div className="flex items-center gap-2">
              {showSuccessCheck && (
                <motion.div
                  variants={prefersReducedMotion ? undefined : iconVariants}
                  initial="success"
                  animate="success"
                >
                  <Check className="h-4 w-4" />
                </motion.div>
              )}
              <span>{successText}</span>
            </div>
          );
        case 'error':
          return (
            <div className="flex items-center gap-2">
              {showErrorIcon && (
                <motion.div
                  variants={prefersReducedMotion ? undefined : iconVariants}
                  initial="error"
                  animate="error"
                >
                  <X className="h-4 w-4" />
                </motion.div>
              )}
              <span>{errorText}</span>
            </div>
          );
        default:
          return children;
      }
    };

    const getVariant = () => {
      switch (currentState) {
        case 'success':
          return 'default';
        case 'error':
          return 'destructive';
        default:
          return props.variant || 'default';
      }
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick && !isDisabled) {
        onClick(e);
      }
    };

    return (
      <motion.div
        variants={prefersReducedMotion ? undefined : variants}
        initial="idle"
        whileHover={!isDisabled && !prefersReducedMotion ? "hover" : undefined}
        whileTap={!isDisabled && !prefersReducedMotion ? "tap" : undefined}
        animate={
          !prefersReducedMotion && currentState !== 'idle' && currentState !== 'loading' 
            ? currentState 
            : undefined
        }
        className="inline-block"
      >
        <Button
          ref={ref}
          className={cn(
            "transition-all duration-200 touch-target",
            currentState === 'success' && "bg-green-600 hover:bg-green-700 border-green-600",
            currentState === 'error' && "bg-red-600 hover:bg-red-700 border-red-600",
            className
          )}
          disabled={isDisabled}
          onClick={handleClick}
          variant={getVariant()}
          {...props}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentState}
              initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
              animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
              exit={prefersReducedMotion ? undefined : { opacity: 0, y: -10 }}
              transition={prefersReducedMotion ? undefined : { duration: 0.2 }}
            >
              {getButtonContent()}
            </motion.div>
          </AnimatePresence>
        </Button>
      </motion.div>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";

// Componente específico para submissão de formulários
export const SubmitButton: React.FC<{
  isSubmitting: boolean;
  isSubmitted: boolean;
  hasError: boolean;
  children: React.ReactNode;
  className?: string;
  submittingText?: string;
  successText?: string;
  errorText?: string;
}> = ({
  isSubmitting,
  isSubmitted,
  hasError,
  children,
  className,
  submittingText = "Enviando...",
  successText = "Enviado com sucesso!",
  errorText = "Erro no envio"
}) => {
  return (
    <AnimatedButton
      type="submit"
      isLoading={isSubmitting}
      loadingText={submittingText}
      successState={isSubmitted && !hasError}
      successText={successText}
      errorState={hasError}
      errorText={errorText}
      animationType="bounce"
      className={className}
      resetDelay={3000}
    >
      {children}
    </AnimatedButton>
  );
};

// Hook para controlar estados do botão
export const useButtonState = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [isError, setIsError] = React.useState(false);

  const startLoading = () => {
    setIsLoading(true);
    setIsSuccess(false);
    setIsError(false);
  };

  const setSuccess = () => {
    setIsLoading(false);
    setIsSuccess(true);
    setIsError(false);
  };

  const setError = () => {
    setIsLoading(false);
    setIsSuccess(false);
    setIsError(true);
  };

  const reset = () => {
    setIsLoading(false);
    setIsSuccess(false);
    setIsError(false);
  };

  return {
    isLoading,
    isSuccess,
    isError,
    startLoading,
    setSuccess,
    setError,
    reset
  };
};

export default AnimatedButton;