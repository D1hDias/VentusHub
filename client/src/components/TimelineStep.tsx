import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineStepProps {
  step: number;
  title: string;
  description: string;
  status: "completed" | "active" | "pending";
  badge: string;
  badgeVariant: "default" | "secondary" | "destructive" | "outline";
}

export function TimelineStep({ step, title, description, status, badge, badgeVariant }: TimelineStepProps) {
  const getStepIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "active":
        return <Clock className="h-4 w-4" />;
      case "pending":
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getStepColor = () => {
    switch (status) {
      case "completed":
        return "bg-green-500 text-white";
      case "active":
        return "bg-primary text-white";
      case "pending":
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="flex items-center gap-4 py-4 border-b last:border-b-0">
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm",
        getStepColor()
      )}>
        {status === "completed" ? getStepIcon() : step}
      </div>
      
      <div className="flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h6 className="font-medium mb-1">{title}</h6>
            <p className="text-sm text-muted-foreground mb-1">{description}</p>
            <div className="flex items-center gap-2">
              {getStepIcon()}
              <span className="text-xs text-muted-foreground">
                {status === "completed" && "Concluído"}
                {status === "active" && "Em andamento"}
                {status === "pending" && "Pendente"}
              </span>
            </div>
          </div>
          <Badge variant={badgeVariant}>{badge}</Badge>
        </div>
      </div>
    </div>
  );
}
