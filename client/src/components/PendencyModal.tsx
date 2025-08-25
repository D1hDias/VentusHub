import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Clock, FileText, CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface PendencyItem {
  id: string;
  title: string;
  description: string;
  category: 'document' | 'approval' | 'payment' | 'inspection' | 'data';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  dueDate?: Date;
  assignedTo?: string;
  dependencies?: string[];
}

interface PendencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageName: string;
  stageNumber: number;
  targetStage: number;
  pendencies: PendencyItem[];
  onProceed: () => void;
  onReview: () => void;
  canProceed: boolean;
  totalRequirements: number;
  completedRequirements: number;
}

const categoryConfig = {
  document: { icon: FileText, color: 'bg-blue-100 text-blue-800', label: 'Documento' },
  approval: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Aprovação' },
  payment: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pagamento' },
  inspection: { icon: AlertTriangle, color: 'bg-orange-100 text-orange-800', label: 'Vistoria' },
  data: { icon: FileText, color: 'bg-purple-100 text-purple-800', label: 'Dados' },
};

const priorityConfig = {
  low: { color: 'bg-gray-100 text-gray-800', label: 'Baixa' },
  medium: { color: 'bg-blue-100 text-blue-800', label: 'Média' },
  high: { color: 'bg-amber-100 text-amber-800', label: 'Alta' },
  critical: { color: 'bg-red-100 text-red-800', label: 'Crítica' },
};

export function PendencyModal({
  isOpen,
  onClose,
  stageName,
  stageNumber,
  targetStage,
  pendencies,
  onProceed,
  onReview,
  canProceed,
  totalRequirements,
  completedRequirements,
}: PendencyModalProps) {
  const criticalPendencies = pendencies.filter((p: any) => p.priority === 'critical');
  const nonCriticalPendencies = pendencies.filter((p: any) => p.priority !== 'critical');
  const completionPercentage = Math.round((completedRequirements / totalRequirements) * 100);

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="flex flex-col h-full"
        >
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex items-center gap-2">
                <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-sm font-medium">
                  Etapa {stageNumber}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-medium">
                  Etapa {targetStage}
                </span>
              </div>
            </DialogTitle>
            <DialogDescription className="text-base">
              Avançando de <strong>{stageName}</strong> com pendências não resolvidas.
              Você pode continuar, mas recomendamos resolver as pendências primeiro.
            </DialogDescription>
          </DialogHeader>

          {/* Progress Summary */}
          <motion.div 
            className="bg-gray-50 rounded-lg p-4 my-4 flex-shrink-0"
            variants={itemVariants}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-700">Progresso da Etapa</span>
              <span className="text-sm font-bold text-gray-900">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>{completedRequirements} de {totalRequirements} itens completos</span>
              <span>{pendencies.length} pendências restantes</span>
            </div>
          </motion.div>

          {/* Pendencies List */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              <div className="space-y-4">
                {/* Critical Pendencies */}
                {criticalPendencies.length > 0 && (
                  <motion.div variants={itemVariants}>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <h4 className="font-semibold text-red-800">
                        Pendências Críticas ({criticalPendencies.length})
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {criticalPendencies.map((pendency) => (
                        <PendencyItem key={pendency.id} pendency={pendency} />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Non-Critical Pendencies */}
                {nonCriticalPendencies.length > 0 && (
                  <motion.div variants={itemVariants}>
                    {criticalPendencies.length > 0 && <Separator className="my-4" />}
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-5 h-5 text-amber-500" />
                      <h4 className="font-semibold text-amber-800">
                        Outras Pendências ({nonCriticalPendencies.length})
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {nonCriticalPendencies.map((pendency) => (
                        <PendencyItem key={pendency.id} pendency={pendency} />
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Actions */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-3 pt-4 flex-shrink-0"
            variants={itemVariants}
          >
            <Button
              variant="outline"
              onClick={onReview}
              className="flex-1 sm:flex-initial"
            >
              Revisar Pendências
            </Button>
            <Button
              onClick={onProceed}
              disabled={!canProceed}
              className={`flex-1 ${
                criticalPendencies.length > 0 
                  ? 'bg-amber-600 hover:bg-amber-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {criticalPendencies.length > 0 
                ? 'Continuar com Ressalvas' 
                : 'Continuar'}
            </Button>
          </motion.div>

          {/* Warning for critical items */}
          {criticalPendencies.length > 0 && (
            <motion.div 
              className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3 flex-shrink-0"
              variants={itemVariants}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-800">
                  <strong>Atenção:</strong> Esta etapa possui pendências críticas. 
                  Avançar pode impactar a qualidade do processo. Considere resolver 
                  as pendências críticas antes de continuar.
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

function PendencyItem({ pendency }: { pendency: PendencyItem }) {
  const categoryInfo = categoryConfig[pendency.category];
  const priorityInfo = priorityConfig[pendency.priority];
  const CategoryIcon = categoryInfo.icon;

  return (
    <motion.div
      className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${categoryInfo.color.replace('text-', 'bg-').replace('800', '500').replace('bg-bg-', 'bg-')} bg-opacity-20`}>
          <CategoryIcon className={`w-4 h-4 ${categoryInfo.color.split(' ')[1]}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h5 className="font-medium text-gray-900 text-sm">{pendency.title}</h5>
            <div className="flex gap-1 flex-shrink-0">
              <Badge variant="secondary" className={`text-xs ${categoryInfo.color}`}>
                {categoryInfo.label}
              </Badge>
              <Badge variant="secondary" className={`text-xs ${priorityInfo.color}`}>
                {priorityInfo.label}
              </Badge>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-1">{pendency.description}</p>
          {pendency.dueDate && (
            <p className="text-xs text-amber-600 mt-1">
              Prazo: {new Date(pendency.dueDate).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}