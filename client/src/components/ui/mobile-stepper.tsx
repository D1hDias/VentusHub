import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useDeviceInfo } from '@/hooks/use-mobile';

interface Step {
  id: string;
  title: string;
  content: React.ReactNode;
  isValid?: boolean;
}

interface MobileStepperProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onComplete?: () => void;
  isLoading?: boolean;
}

export function MobileStepper({ 
  steps, 
  currentStep, 
  onStepChange, 
  onComplete,
  isLoading = false 
}: MobileStepperProps) {
  const { isMobile } = useDeviceInfo();
  const progress = ((currentStep + 1) / steps.length) * 100;
  
  const canGoNext = currentStep < steps.length - 1 && (steps[currentStep]?.isValid !== false);
  const canGoPrev = currentStep > 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep && onComplete) {
      onComplete();
    } else if (canGoNext) {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (canGoPrev) {
      onStepChange(currentStep - 1);
    }
  };

  if (!isMobile) {
    // Desktop version - show all content at once or tabs
    return (
      <div className="space-y-6">
        {/* Desktop step indicators */}
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex items-center space-x-2 cursor-pointer ${
                index <= currentStep ? 'text-primary' : 'text-muted-foreground'
              }`}
              onClick={() => onStepChange(index)}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                index < currentStep 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : index === currentStep
                  ? 'border-primary text-primary'
                  : 'border-muted-foreground'
              }`}>
                {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span className="font-medium">{step.title}</span>
            </div>
          ))}
        </div>
        
        {/* Desktop content */}
        <div className="min-h-[400px]">
          {steps[currentStep]?.content}
        </div>
        
        {/* Desktop navigation */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrev} 
            disabled={!canGoPrev}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          <Button 
            onClick={handleNext} 
            disabled={!canGoNext || isLoading}
          >
            {isLastStep ? 'Concluir' : 'Próximo'}
            {!isLastStep && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    );
  }

  // Mobile version with full-screen steps
  return (
    <div className="h-full flex flex-col">
      {/* Mobile header with progress */}
      <div className="sticky top-0 bg-background border-b p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">{steps[currentStep]?.title}</h2>
          <span className="text-sm text-muted-foreground">
            {currentStep + 1} de {steps.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Mobile content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full p-4"
          >
            {steps[currentStep]?.content}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mobile navigation */}
      <div className="sticky bottom-0 bg-background border-t p-4 mobile-bottom-safe">
        <div className="flex gap-3">
          {canGoPrev && (
            <Button 
              variant="outline" 
              onClick={handlePrev}
              className="flex-1 touch-target"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          )}
          <Button 
            onClick={handleNext} 
            disabled={!canGoNext || isLoading}
            className={`touch-target ${canGoPrev ? 'flex-1' : 'w-full'}`}
          >
            {isLastStep ? 'Finalizar' : 'Continuar'}
            {!isLastStep && <ChevronRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Hook para controlar steps
export function useSteps(initialStep = 0) {
  const [currentStep, setCurrentStep] = React.useState(initialStep);
  
  const goToStep = (step: number) => setCurrentStep(step);
  const nextStep = () => setCurrentStep(prev => prev + 1);
  const prevStep = () => setCurrentStep(prev => prev - 1);
  const reset = () => setCurrentStep(0);
  
  return {
    currentStep,
    goToStep,
    nextStep,
    prevStep,
    reset
  };
}