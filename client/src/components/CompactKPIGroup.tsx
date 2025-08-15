import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { CompactKPICard } from './CompactKPICard';
import { KPICard } from './KPICard';
import { useMultipleCompactKPI } from '@/hooks/useCompactKPI';
import { useResponsive } from '@/hooks/useMediaQuery';
import { useSmoothtTransitions } from '@/hooks/useSmoothtTransitions';

interface KPIData {
  id: string;
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

interface CompactKPIGroupProps {
  kpiData: KPIData[];
  autoCollapseDelay?: number;
  className?: string;
}

export function CompactKPIGroup({ 
  kpiData, 
  autoCollapseDelay = 5000,
  className = ""
}: CompactKPIGroupProps) {
  const { isMobile } = useResponsive();
  const { getListVariants, getListItemVariants, classes } = useSmoothtTransitions();
  
  // Extrair IDs dos cards
  const cardIds = kpiData.map(kpi => kpi.id);
  
  // Usar o hook para gerenciar múltiplos cards
  const { cardStates, createCardHandler } = useMultipleCompactKPI(cardIds, autoCollapseDelay);

  if (isMobile) {
    return (
      <motion.div 
        variants={getListVariants()}
        initial="hidden"
        animate="visible"
        className={`space-y-2 ${className}`}
      >
        {kpiData.map((kpi, index) => {
          // Criar um CompactKPICard customizado que usa o estado compartilhado
          const handleClick = createCardHandler(kpi.id, kpi.onClick);
          const expandedState = cardStates[kpi.id];
          
          return (
            <motion.div
              key={kpi.id}
              variants={getListItemVariants()}
              className="touch-target"
            >
              <div onClick={handleClick}>
                <CompactKPICard
                  {...kpi}
                  onClick={undefined} // Removemos o onClick original para usar nossa lógica
                  // Passamos o estado através de uma prop customizada se necessário
                />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    );
  }

  // Layout desktop normal
  return (
    <motion.div 
      variants={getListVariants()}
      initial="hidden"
      animate="visible"
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}
    >
      {kpiData.map((kpi, index) => (
        <motion.div
          key={kpi.id}
          variants={getListItemVariants()}
          className={`${classes.cardInteractive} touch-target`}
          onClick={kpi.onClick}
          whileHover={{ scale: classes.hoverScale ? 1.02 : 1 }}
          whileTap={{ scale: classes.hoverScale ? 0.98 : 1 }}
        >
          <KPICard {...kpi} />
        </motion.div>
      ))}
    </motion.div>
  );
}

/**
 * Versão simplificada que automaticamente gera IDs se não fornecidos
 */
export function SimpleCompactKPIGroup({ 
  kpiData, 
  autoCollapseDelay = 5000,
  className = ""
}: {
  kpiData: Omit<KPIData, 'id'>[];
  autoCollapseDelay?: number;
  className?: string;
}) {
  // Gerar IDs automaticamente baseado no título
  const kpiDataWithIds = kpiData.map((kpi, index) => ({
    ...kpi,
    id: kpi.title.toLowerCase().replace(/\s+/g, '-') + '-' + index
  }));

  return (
    <CompactKPIGroup
      kpiData={kpiDataWithIds}
      autoCollapseDelay={autoCollapseDelay}
      className={className}
    />
  );
}