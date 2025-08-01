import { Card, CardContent } from "@/components/ui/card";
import { BadgeCent, Clock } from "lucide-react";

export default function CreditoConsorcio() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg">
            <BadgeCent className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Consórcio - Sistema de Consórcios
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Sistema de simulação e contratação de consórcios imobiliários e de veículos
            </p>
          </div>
        </div>
      </div>

      <Card className="bg-card dark:bg-card border border-border dark:border-border">
        <CardContent className="p-12 text-center">
          <div className="flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-6">
            <Clock className="w-10 h-10 text-red-600 dark:text-red-400 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Página sendo criada...
          </h2>
          <p className="text-muted-foreground text-lg mb-6">
            Esta funcionalidade está em desenvolvimento e será disponibilizada em breve.
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-red-700 dark:text-red-300">
              ⏳ Aguarde por atualizações
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}