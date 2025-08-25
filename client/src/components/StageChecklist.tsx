import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Check, X, Clock, AlertTriangle, FileText, CheckCircle, User, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { PendencyItem } from './PendencyModal';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  category: 'document' | 'approval' | 'payment' | 'inspection' | 'data';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  dueDate?: Date;
  assignedTo?: string;
  dependencies?: string[];
  completedAt?: Date;
  completedBy?: string;
}

interface StageChecklistProps {
  stageId: number;
  stageName: string;
  requirements: ChecklistItem[];
  isExpanded: boolean;
  onToggle: () => void;
  showCriticalOnly?: boolean;
  onUpdateRequirement?: (requirementId: string, status: ChecklistItem['status']) => void;
  className?: string;
}

const statusConfig = {
  pending: { icon: Clock, color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Pendente' },
  in_progress: { icon: AlertTriangle, color: 'text-amber-500', bgColor: 'bg-amber-100', label: 'Em Andamento' },
  completed: { icon: Check, color: 'text-green-500', bgColor: 'bg-green-100', label: 'Completo' },
  blocked: { icon: X, color: 'text-red-500', bgColor: 'bg-red-100', label: 'Bloqueado' },
};

const categoryConfig = {
  document: { icon: FileText, color: 'bg-blue-100 text-blue-800', label: 'Documento' },
  approval: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Aprovação' },
  payment: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pagamento' },
  inspection: { icon: AlertTriangle, color: 'bg-orange-100 text-orange-800', label: 'Vistoria' },
  data: { icon: FileText, color: 'bg-purple-100 text-purple-800', label: 'Dados' },
};

const priorityConfig = {
  low: { color: 'bg-gray-100 text-gray-700', label: 'Baixa' },
  medium: { color: 'bg-blue-100 text-blue-700', label: 'Média' },
  high: { color: 'bg-amber-100 text-amber-700', label: 'Alta' },
  critical: { color: 'bg-red-100 text-red-700', label: 'Crítica' },
};

export function StageChecklist({
  stageId,
  stageName,
  requirements,
  isExpanded,
  onToggle,
  showCriticalOnly = false,
  onUpdateRequirement,
  className,
}: StageChecklistProps) {
  const filteredRequirements = showCriticalOnly 
    ? requirements.filter((req: any) => req.priority === 'critical')
    : requirements;

  const completedCount = filteredRequirements.filter((req: any) => req.status === 'completed').length;
  const totalCount = filteredRequirements.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  const criticalIncomplete = requirements.filter((req: any) => 
    req.priority === 'critical' && req.status !== 'completed'
  ).length;

  const getStageStatus = () => {
    if (completionPercentage === 100) return 'complete';
    if (criticalIncomplete > 0) return 'critical';
    if (completedCount > 0) return 'incomplete';
    return 'pending';
  };

  const stageStatus = getStageStatus();

  const headerVariants = {
    collapsed: { backgroundColor: 'rgba(249, 250, 251, 1)' },
    expanded: { backgroundColor: 'rgba(239, 246, 255, 1)' },
  };

  const contentVariants = {
    collapsed: { height: 0, opacity: 0 },
    expanded: { 
      height: 'auto', 
      opacity: 1,
      transition: {
        height: { duration: 0.3, ease: 'easeOut' },
        opacity: { duration: 0.2, delay: 0.1 }
      }
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (index: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: index * 0.05,
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    })
  };

  return (
    <motion.div
      className={cn(
        "border border-gray-200 rounded-lg overflow-hidden shadow-sm",
        className
      )}
      initial={false}
    >
      {/* Header */}
      <motion.button
        className="w-full p-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        onClick={onToggle}
        variants={headerVariants}
        animate={isExpanded ? 'expanded' : 'collapsed'}
        whileHover={{ backgroundColor: 'rgba(243, 244, 246, 1)' }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </motion.div>
            
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-gray-900">{stageName}</h3>
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-xs font-medium",
                  stageStatus === 'complete' && "bg-green-100 text-green-800",
                  stageStatus === 'critical' && "bg-red-100 text-red-800",
                  stageStatus === 'incomplete' && "bg-amber-100 text-amber-800",
                  stageStatus === 'pending' && "bg-gray-100 text-gray-800"
                )}
              >
                {completedCount}/{totalCount} completo
              </Badge>
              
              {criticalIncomplete > 0 && (
                <Badge className="bg-red-100 text-red-800 text-xs">
                  {criticalIncomplete} crítica{criticalIncomplete !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {completionPercentage}%
              </div>
              <div className="text-xs text-gray-500">
                {showCriticalOnly ? 'Críticas' : 'Geral'}
              </div>
            </div>
            <div className="w-16">
              <Progress 
                value={completionPercentage} 
                className="h-2"
              />
            </div>
          </div>
        </div>
      </motion.button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            variants={contentVariants}
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            className="overflow-hidden"
          >
            <div className="border-t border-gray-200">
              <div className="p-4 space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{completedCount}</div>
                    <div className="text-xs text-gray-600">Completos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-amber-600">
                      {requirements.filter((r: any) => r.status === 'in_progress').length}
                    </div>
                    <div className="text-xs text-gray-600">Em Andamento</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-600">
                      {requirements.filter((r: any) => r.status === 'pending').length}
                    </div>
                    <div className="text-xs text-gray-600">Pendentes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-600">
                      {requirements.filter((r: any) => r.status === 'blocked').length}
                    </div>
                    <div className="text-xs text-gray-600">Bloqueados</div>
                  </div>
                </div>

                <Separator />

                {/* Requirements List */}
                <div className="space-y-3">
                  {filteredRequirements.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum requisito {showCriticalOnly ? 'crítico ' : ''}encontrado</p>
                    </div>
                  ) : (
                    filteredRequirements.map((requirement, index) => (
                      <motion.div
                        key={requirement.id}
                        custom={index}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <ChecklistItemCard
                          requirement={requirement}
                          onUpdateStatus={onUpdateRequirement}
                        />
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ChecklistItemCard({ 
  requirement, 
  onUpdateStatus 
}: { 
  requirement: ChecklistItem;
  onUpdateStatus?: (id: string, status: ChecklistItem['status']) => void;
}) {
  const statusInfo = statusConfig[requirement.status];
  const categoryInfo = categoryConfig[requirement.category];
  const priorityInfo = priorityConfig[requirement.priority];
  const StatusIcon = statusInfo.icon;
  const CategoryIcon = categoryInfo.icon;

  const isOverdue = requirement.dueDate && new Date() > new Date(requirement.dueDate) && requirement.status !== 'completed';

  return (
    <div className={cn(
      "border rounded-lg p-4 bg-white",
      requirement.status === 'completed' && "bg-green-50 border-green-200",
      requirement.status === 'blocked' && "bg-red-50 border-red-200",
      requirement.priority === 'critical' && requirement.status !== 'completed' && "border-l-4 border-l-red-500",
      isOverdue && "bg-red-50 border-red-200"
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "p-2 rounded-lg",
          statusInfo.bgColor
        )}>
          <StatusIcon className={cn("w-4 h-4", statusInfo.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-medium text-gray-900 text-sm">{requirement.title}</h4>
            <div className="flex gap-1 flex-shrink-0">
              <Badge variant="secondary" className={cn("text-xs", categoryInfo.color)}>
                {categoryInfo.label}
              </Badge>
              <Badge variant="secondary" className={cn("text-xs", priorityInfo.color)}>
                {priorityInfo.label}
              </Badge>
            </div>
          </div>

          <p className="text-xs text-gray-600 mb-3">{requirement.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {requirement.dueDate && (
                <div className={cn(
                  "flex items-center gap-1",
                  isOverdue && "text-red-600 font-medium"
                )}>
                  <Calendar className="w-3 h-3" />
                  {new Date(requirement.dueDate).toLocaleDateString('pt-BR')}
                </div>
              )}
              {requirement.assignedTo && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {requirement.assignedTo}
                </div>
              )}
              {requirement.completedAt && (
                <div className="text-green-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Completo em {new Date(requirement.completedAt).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>

            {onUpdateStatus && requirement.status !== 'completed' && (
              <div className="flex gap-1">
                {requirement.status !== 'in_progress' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onUpdateStatus(requirement.id, 'in_progress')}
                    className="text-xs px-2 py-1 h-auto"
                  >
                    Iniciar
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={() => onUpdateStatus(requirement.id, 'completed')}
                  className="text-xs px-2 py-1 h-auto bg-green-600 hover:bg-green-700"
                >
                  Marcar Completo
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}