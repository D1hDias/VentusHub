import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, FileText, Calculator, Building2, Search } from "lucide-react";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { motion, AnimatePresence } from "framer-motion";

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
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(LOADING_MESSAGES[0]);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setCurrentMessageIndex(0);
      setCurrentMessage(LOADING_MESSAGES[0]);
      return;
    }

    // Simular progresso
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (duration / 100));
        
        // Sincronizar mensagens com progresso
        if (newProgress <= 33.33 && currentMessageIndex !== 0) {
          setCurrentMessageIndex(0);
          setCurrentMessage(LOADING_MESSAGES[0]);
        } else if (newProgress > 33.33 && newProgress <= 66.66 && currentMessageIndex !== 1) {
          setCurrentMessageIndex(1);
          setCurrentMessage(LOADING_MESSAGES[1]);
        } else if (newProgress > 66.66 && currentMessageIndex !== 2) {
          setCurrentMessageIndex(2);
          setCurrentMessage(LOADING_MESSAGES[2]);
        }
        
        // Garantir que nunca ultrapasse 100%
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          // Fechar o modal automaticamente quando progresso atinge 100%
          setTimeout(() => {
            onClose();
          }, 500); // Pequeno delay para mostrar 100%
          return 100;
        }
        
        return newProgress;
      });
    }, 100);

    return () => {
      clearInterval(progressInterval);
    };
  }, [isOpen, duration, currentMessageIndex]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900">
        <VisuallyHidden>
          <DialogTitle>Processando Cálculo</DialogTitle>
          <DialogDescription>Aguarde enquanto processamos sua consulta</DialogDescription>
        </VisuallyHidden>

        <div className="flex flex-col items-center justify-center space-y-6 py-8 px-4">
          {/* Ícone Principal Animado */}
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="relative"
            >
              <FileText className="h-16 w-16 text-primary" />
            </motion.div>

            {/* Ícones Orbitais */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute -top-2 -right-2"
            >
              <Calculator className="h-6 w-6 text-green-600" />
            </motion.div>

            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-2 -left-2"
            >
              <Building2 className="h-6 w-6 text-blue-600" />
            </motion.div>

            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
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
                transition={{ duration: 0.1 }}
              />
            </div>
          </div>

          {/* Mensagens Animadas */}
          <div className="h-12 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentMessageIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                {currentMessage}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Indicadores de Status */}
          <div className="flex space-x-2">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className={`h-2 w-2 rounded-full ${progress > (index + 1) * 33
                  ? 'bg-green-500'
                  : progress > index * 33
                    ? 'bg-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                animate={progress > index * 33 ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5, repeat: progress > index * 33 ? Infinity : 0 }}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}