import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, FileText, Calculator, Building2, Search } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { motion, AnimatePresence } from "framer-motion";
import { useResponsive } from "@/hooks/useMediaQuery";

interface LoadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
  selectedBanks?: number;
  duration?: number;
  customMessages?: string[];
}

const DEFAULT_LOADING_MESSAGES = [
  "Fazendo contato com o Registro Geral de Imóveis",
  "Consultando a base de dados da sua região",
  "Calculando"
];

export function LoadingModal({
  isOpen,
  onClose,
  message = "Processando...",
  selectedBanks = 1,
  duration = 4000,
  customMessages
}: LoadingModalProps) {
  const LOADING_MESSAGES = customMessages || DEFAULT_LOADING_MESSAGES;
  const [progress, setProgress] = useState(0);
  const { prefersReducedMotion } = useResponsive();
  
  // Otimizar cálculo da mensagem atual com useMemo
  const currentMessageData = useMemo(() => {
    const messageIndex = progress <= 33.33 ? 0 : progress <= 66.66 ? 1 : 2;
    return {
      index: messageIndex,
      message: LOADING_MESSAGES[messageIndex]
    };
  }, [progress, LOADING_MESSAGES]);
  // Forçar animações para o modal de loading (ignorar preferência do usuário)
  const forceAnimations = true; // Ativado para garantir animações no loading

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    const totalSteps = duration / 100; // Total de atualizações (40 steps para 4000ms)
    const incremento = 100 / totalSteps; // Incremento preciso: 2.5% por step
    let stepCount = 0;

    console.log(`🔄 Loading iniciado: ${totalSteps} steps, incremento ${incremento.toFixed(2)}% cada 100ms`);

    // Simular progresso linear
    const progressInterval = setInterval(() => {
      stepCount++;
      const newProgress = Math.min((stepCount * incremento), 100);
      
      setProgress(newProgress);
      
      // Fechar quando completar
      if (newProgress >= 100) {
        clearInterval(progressInterval);
        console.log('✅ Loading completado, fechando em 500ms');
        setTimeout(() => {
          onClose();
        }, 500);
      }
    }, 100);

    return () => {
      clearInterval(progressInterval);
    };
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
        <VisuallyHidden>
          <DialogTitle>Processando Cálculo</DialogTitle>
          <DialogDescription>Aguarde enquanto processamos sua consulta</DialogDescription>
        </VisuallyHidden>

        <div className="flex flex-col items-center justify-center space-y-6 py-8 px-4">
          {/* Ícone Principal Animado */}
          <div className="relative">
            <motion.div
              animate={prefersReducedMotion && !forceAnimations ? undefined : { rotate: 360 }}
              transition={prefersReducedMotion && !forceAnimations ? undefined : { duration: 2, repeat: Infinity, ease: "linear" }}
              className="relative"
            >
              <FileText className="h-16 w-16 text-primary" />
            </motion.div>

            {/* Ícones Orbitais */}
            <motion.div
              animate={prefersReducedMotion && !forceAnimations ? undefined : { rotate: -360 }}
              transition={prefersReducedMotion && !forceAnimations ? undefined : { duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute -top-2 -right-2"
            >
              <Calculator className="h-6 w-6 text-green-600" />
            </motion.div>

            <motion.div
              animate={prefersReducedMotion && !forceAnimations ? undefined : { rotate: -360 }}
              transition={prefersReducedMotion && !forceAnimations ? undefined : { duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-2 -left-2"
            >
              <Building2 className="h-6 w-6 text-blue-600" />
            </motion.div>

            <motion.div
              animate={prefersReducedMotion && !forceAnimations ? undefined : { rotate: -360 }}
              transition={prefersReducedMotion && !forceAnimations ? undefined : { duration: 3.5, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 -left-4"
            >
              <Search className="h-5 w-5 text-orange-600" />
            </motion.div>
          </div>

          {/* Título Principal */}
          <div className="text-center">
          </div>

          {/* Barra de Progresso */}
          <div className="w-full max-w-sm">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ 
                  duration: 0.05, // Mais rápido para melhor sincronização
                  ease: "linear"  // Movimento linear uniforme
                }}
              />
            </div>
          </div>

          {/* Mensagens Animadas */}
          <div className="h-12 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentMessageData.index}
                initial={prefersReducedMotion && !forceAnimations ? undefined : { opacity: 0, y: 20 }}
                animate={prefersReducedMotion && !forceAnimations ? undefined : { opacity: 1, y: 0 }}
                exit={prefersReducedMotion && !forceAnimations ? undefined : { opacity: 0, y: -20 }}
                transition={prefersReducedMotion && !forceAnimations ? undefined : { duration: 0.3 }}
                className="text-center text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                {currentMessageData.message}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Indicadores de Status */}
          <div className="flex space-x-2">
            {[0, 1, 2].map((index: any) => (
              <motion.div
                key={index}
                className={`h-2 w-2 rounded-full ${progress > (index + 1) * 33
                  ? 'bg-green-500'
                  : progress > index * 33
                    ? 'bg-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                animate={prefersReducedMotion && !forceAnimations ? undefined : progress > index * 33 ? { scale: [1, 1.2, 1] } : {}}
                transition={prefersReducedMotion && !forceAnimations ? undefined : { duration: 0.5, repeat: progress > index * 33 ? Infinity : 0 }}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}