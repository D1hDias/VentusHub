import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import { useResponsive } from '@/hooks/useMediaQuery';

interface CardField<T> {
  key: keyof T;
  label: string;
  accessor?: (item: T) => React.ReactNode;
  type?: 'primary' | 'secondary' | 'metadata' | 'badge';
  className?: string;
}

interface CardListProps<T> {
  data: T[];
  fields: CardField<T>[];
  onItemClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  className?: string;
  cardClassName?: string;
  // Layout options
  title?: (item: T) => React.ReactNode;
  subtitle?: (item: T) => React.ReactNode;
  avatar?: (item: T) => React.ReactNode;
  rightContent?: (item: T) => React.ReactNode;
  // Animation
  animateItems?: boolean;
}

function CardList<T extends Record<string, any>>({
  data,
  fields,
  onItemClick,
  actions,
  className = '',
  cardClassName = '',
  title,
  subtitle,
  avatar,
  rightContent,
  animateItems = false
}: CardListProps<T>) {
  const { prefersReducedMotion } = useResponsive();
  const shouldAnimate = animateItems && !prefersReducedMotion;

  const primaryFields = fields.filter(f => f.type === 'primary' || !f.type);
  const secondaryFields = fields.filter(f => f.type === 'secondary');
  const metadataFields = fields.filter(f => f.type === 'metadata');
  const badgeFields = fields.filter(f => f.type === 'badge');

  const CardItem = ({ item, index }: { item: T; index: number }) => (
    <Card
      className={`container-query p-fluid-s touch-target transition-all duration-200 ${cardClassName} ${
        onItemClick 
          ? 'cursor-pointer hover:bg-muted/50 hover:shadow-md active:bg-muted/75 active:scale-[0.99]' 
          : ''
      }`}
      onClick={() => onItemClick?.(item)}
    >
      <div className="space-y-space-fluid-xs">
        {/* Header com avatar e título */}
        <div className="flex items-start gap-space-fluid-xs">
          {avatar && (
            <div className="flex-shrink-0">
              {avatar(item)}
            </div>
          )}
          
          <div className="flex-1 min-w-0 space-y-1">
            {title && (
              <div className="font-semibold text-fluid-lg leading-tight">
                {title(item)}
              </div>
            )}
            {subtitle && (
              <div className="text-muted-foreground text-fluid-sm">
                {subtitle(item)}
              </div>
            )}
          </div>

          {rightContent && (
            <div className="flex-shrink-0">
              {rightContent(item)}
            </div>
          )}
        </div>

        {/* Badges */}
        {badgeFields.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {badgeFields.map((field) => (
              <div key={String(field.key)}>
                {field.accessor ? field.accessor(item) : (
                  <Badge variant="secondary" className="text-xs">
                    {item[field.key]}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Campos primários - grid responsivo */}
        {primaryFields.length > 0 && (
          <>
            {(title || subtitle || badgeFields.length > 0) && <Separator />}
            <div className="grid-adaptive grid-adaptive-2 gap-space-fluid-xs">
              {primaryFields.map((field) => (
                <div key={String(field.key)} className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {field.label}
                  </div>
                  <div className={`text-fluid-sm font-medium ${field.className || ''}`}>
                    {field.accessor ? field.accessor(item) : item[field.key]}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Campos secundários - lista compacta */}
        {secondaryFields.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              {secondaryFields.map((field) => (
                <div key={String(field.key)} className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {field.label}:
                  </span>
                  <span className={`text-xs font-medium ${field.className || ''}`}>
                    {field.accessor ? field.accessor(item) : item[field.key]}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Metadata - informações extras */}
        {metadataFields.length > 0 && (
          <>
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              {metadataFields.map((field) => (
                <div key={String(field.key)} className="flex items-center gap-2">
                  <span>{field.label}:</span>
                  <span className={field.className || ''}>
                    {field.accessor ? field.accessor(item) : item[field.key]}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Ações */}
        {actions && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-2">
              {actions(item)}
            </div>
          </>
        )}
      </div>
    </Card>
  );

  return (
    <div className={`space-y-space-fluid-xs ${className}`}>
      {shouldAnimate ? (
        <AnimatePresence mode="popLayout">
          {data.map((item, index) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.2, 
                delay: index * 0.05,
                layout: { duration: 0.3 }
              }}
            >
              <CardItem item={item} index={index} />
            </motion.div>
          ))}
        </AnimatePresence>
      ) : (
        data.map((item, index) => (
          <CardItem key={index} item={item} index={index} />
        ))
      )}
    </div>
  );
}

// Componentes auxiliares para campos comuns
export const CurrencyField = ({ value }: { value: number }) => (
  <span className="font-mono font-medium text-green-600 dark:text-green-400">
    {new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value)}
  </span>
);

export const DateField = ({ date }: { date: string | Date }) => {
  const formattedDate = typeof date === 'string' ? new Date(date) : date;
  return (
    <span className="text-muted-foreground">
      {formattedDate.toLocaleDateString('pt-BR')}
    </span>
  );
};

export const StatusField = ({ 
  status, 
  variant 
}: { 
  status: string; 
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}) => (
  <Badge variant={variant || 'secondary'} className="text-xs">
    {status}
  </Badge>
);

export default CardList;