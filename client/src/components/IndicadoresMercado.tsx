import React from 'react';
import { BarChart3 } from 'lucide-react';
import { getIndicadoresFormatados } from '@/lib/indicadores-mercado';

interface IndicadoresMercadoProps {
  className?: string;
}

export default function IndicadoresMercado({ className = '' }: IndicadoresMercadoProps) {
  const indicadores = getIndicadoresFormatados();

  return (
    <div className={`bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
        <BarChart3 className="h-5 w-5 mr-2" />
        📊 Indicadores de Referência
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div className="flex justify-between">
          <span className="text-blue-800">SELIC:</span>
          <span className="font-medium text-blue-900">{indicadores.selic}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-800">CDI:</span>
          <span className="font-medium text-blue-900">{indicadores.cdi}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-800">ITBI+Registro:</span>
          <span className="font-medium text-blue-900">{indicadores.itbiRegistro}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-blue-800">IR Ganho:</span>
          <span className="font-medium text-blue-900">{indicadores.irGanhoCapital}</span>
        </div>
      </div>
      <p className="text-xs text-blue-700 mt-2">
        *Valores padrão do mercado - podem ser personalizados no formulário
      </p>
    </div>
  );
}