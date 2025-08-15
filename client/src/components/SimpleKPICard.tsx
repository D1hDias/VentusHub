import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SimpleKPICardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconBgColor: string;
  subtitle?: string;
}

export function SimpleKPICard({ title, value, icon: Icon, iconBgColor, subtitle }: SimpleKPICardProps) {
  return (
    <Card className="border-0 shadow-sm h-full">
      <CardContent className="p-2.5">
        <div className="flex items-center gap-2.5">
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: iconBgColor }}
          >
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground truncate leading-tight">{title}</p>
            <p className="text-base font-bold truncate leading-tight mt-0.5" style={{ color: iconBgColor }}>{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}