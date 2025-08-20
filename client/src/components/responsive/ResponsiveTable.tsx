import React from 'react';
import { useResponsive } from '@/hooks/useMediaQuery';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';

interface Column<T> {
  key: keyof T;
  header: string;
  accessor?: (item: T) => React.ReactNode;
  mobileHide?: boolean;
  className?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  actions?: (item: T) => React.ReactNode;
  className?: string;
  mobileCardClassName?: string;
  // Props específicas para mobile
  mobileTitle?: (item: T) => React.ReactNode;
  mobileSubtitle?: (item: T) => React.ReactNode;
  mobilePrimaryFields?: (keyof T)[];
  mobileSecondaryFields?: (keyof T)[];
}

function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  actions,
  className = '',
  mobileCardClassName = '',
  mobileTitle,
  mobileSubtitle,
  mobilePrimaryFields = [],
  mobileSecondaryFields = []
}: ResponsiveTableProps<T>) {
  const { isMobile } = useResponsive();

  // Renderizar tabela desktop
  const renderTable = () => (
    <div className={`container-query ${className}`}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={String(column.key)} className={column.className}>
                {column.header}
              </TableHead>
            ))}
            {actions && <TableHead className="w-12"></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item, index) => (
            <TableRow
              key={index}
              onClick={() => onRowClick?.(item)}
              className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
            >
              {columns.map((column) => (
                <TableCell key={String(column.key)} className={column.className}>
                  {column.accessor ? column.accessor(item) : item[column.key]}
                </TableCell>
              ))}
              {actions && (
                <TableCell>
                  <div className="flex justify-end">
                    {actions(item)}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  // Renderizar cards mobile
  const renderCards = () => (
    <div className={`container-query space-y-3 ${className}`}>
      {data.map((item, index) => (
        <Card
          key={index}
          className={`p-fluid-s touch-target ${mobileCardClassName} ${
            onRowClick ? 'cursor-pointer hover:bg-muted/50 active:bg-muted/75' : ''
          }`}
          onClick={() => onRowClick?.(item)}
        >
          <div className="space-y-3">
            {/* Título e subtítulo */}
            <div className="space-y-1">
              {mobileTitle && (
                <div className="font-semibold text-fluid-lg">
                  {mobileTitle(item)}
                </div>
              )}
              {mobileSubtitle && (
                <div className="text-muted-foreground text-fluid-sm">
                  {mobileSubtitle(item)}
                </div>
              )}
            </div>

            {/* Campos primários */}
            {mobilePrimaryFields.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {mobilePrimaryFields.map((field) => {
                  const column = columns.find(col => col.key === field);
                  if (!column) return null;
                  
                  return (
                    <div key={String(field)} className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {column.header}
                      </div>
                      <div className="text-fluid-sm">
                        {column.accessor ? column.accessor(item) : item[field]}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Campos secundários (mais compactos) */}
            {mobileSecondaryFields.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-border/50">
                {mobileSecondaryFields.map((field) => {
                  const column = columns.find(col => col.key === field);
                  if (!column) return null;
                  
                  return (
                    <div key={String(field)} className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {column.header}:
                      </span>
                      <span className="text-xs font-medium">
                        {column.accessor ? column.accessor(item) : item[field]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ações */}
            {actions && (
              <div className="flex justify-between items-center pt-2 border-t border-border/50">
                <div className="flex-1">
                  {actions(item)}
                </div>
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  );

  // Usar container query CSS quando possível, fallback para JS
  return (
    <div className="responsive-table-container">
      <div className="hidden lg:block">
        {renderTable()}
      </div>
      <div className="block lg:hidden">
        {renderCards()}
      </div>
    </div>
  );
}

// Componente auxiliar para status badge
export const StatusBadge = ({ status, variant }: { 
  status: string; 
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' 
}) => (
  <Badge variant={variant || 'secondary'} className="text-xs">
    {status}
  </Badge>
);

// Componente auxiliar para ações rápidas
export const QuickActions = ({ onEdit, onDelete }: {
  onEdit?: () => void;
  onDelete?: () => void;
}) => (
  <div className="flex gap-1">
    {onEdit && (
      <Button variant="ghost" size="sm" onClick={onEdit}>
        Editar
      </Button>
    )}
    {onDelete && (
      <Button variant="ghost" size="sm" onClick={onDelete}>
        Excluir
      </Button>
    )}
  </div>
);

export default ResponsiveTable;