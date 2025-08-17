import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

interface SimpleKPICardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  iconBgColor: string;
  subtitle?: string;
}

export function SimpleKPICard({ title, value, icon: Icon, iconBgColor, subtitle }: SimpleKPICardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="h-full"
    >
      <Card className="border-0 h-full kpi-card-ultra-shadow">
      <CardContent className="p-2.5">
        <div className="flex items-center gap-2.5">
          <div 
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: iconBgColor }}
          >
            <Icon className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0 flex-1 flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs font-medium text-muted-foreground truncate leading-tight">{title}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">{subtitle}</p>
              )}
            </div>
            <div className="w-8 flex justify-center ml-2">
              <p className="text-base font-bold truncate leading-tight" style={{ color: iconBgColor }}>{value}</p>
            </div>
          </div>
        </div>
      </CardContent>
      </Card>
    </motion.div>
  );
}