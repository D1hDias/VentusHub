import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface LoadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function LoadingModal({ isOpen, onClose, message = "Processando..." }: LoadingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="flex items-center justify-center space-x-4 py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">{message}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}