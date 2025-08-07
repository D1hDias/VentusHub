import React from 'react';
import { useDeviceInfo } from '@/hooks/use-mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MobileTableProps {
  data: Array<Record<string, any>>;
  columns: Array<{
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
    mobileLabel?: string;
    hideOnMobile?: boolean;
  }>;
  keyField: string;
  onRowClick?: (row: any) => void;
}

export function MobileTable({ data, columns, keyField, onRowClick }: MobileTableProps) {
  const { isMobile } = useDeviceInfo();

  if (!isMobile) {
    // Desktop table
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {columns.map((column) => (
                <th key={column.key} className="text-left p-3 font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr 
                key={row[keyField]} 
                className={`border-b hover:bg-accent/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td key={column.key} className="p-3">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Mobile cards
  return (
    <div className="space-y-3">
      {data.map((row) => (
        <Card 
          key={row[keyField]} 
          className={`mobile-card ${onRowClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
          onClick={() => onRowClick?.(row)}
        >
          <CardContent className="p-4">
            <div className="space-y-2">
              {columns
                .filter(column => !column.hideOnMobile)
                .map((column) => (
                  <div key={column.key} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground font-medium">
                      {column.mobileLabel || column.label}:
                    </span>
                    <span className="text-sm font-medium">
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Status Badge Component for mobile tables
export function StatusBadge({ status, variant = "default" }: { status: string; variant?: "default" | "secondary" | "outline" | "destructive" }) {
  return (
    <Badge variant={variant} className="text-xs">
      {status}
    </Badge>
  );
}