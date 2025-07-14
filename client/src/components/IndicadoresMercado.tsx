import React from 'react';
import { BarChart3 } from 'lucide-react';
import { getIndicadoresFormatados } from '@/lib/indicadores-mercado';

type IndicadorKey = 'selic' | 'cdi' | 'igpM' | 'ipca' | 'itbiRegistro' | 'irGanhoCapital' | 'corretagem' | 'valorizacao';

interface IndicadoresMercadoProps {
  className?: string;
  indicadoresVisiveis?: IndicadorKey[];
}

const INDICADORES_LABELS: Record<IndicadorKey, string> = {
  selic: 'SELIC',
  cdi: 'CDI',
  igpM: 'IGP-M',
  ipca: 'IPCA',
  itbiRegistro: 'ITBI+Registro',
  irGanhoCapital: 'IR Ganho',
  corretagem: 'Corretagem',
  valorizacao: 'Valorização'
};

export default function IndicadoresMercado({ 
  className = '', 
  indicadoresVisiveis = ['selic', 'cdi', 'itbiRegistro', 'irGanhoCapital'] 
}: IndicadoresMercadoProps) {
  const indicadores = getIndicadoresFormatados();

  return (
    <div className={`bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 ${className}`}>
      <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
        <BarChart3 className="h-5 w-5 mr-2" />
        📊 Indicadores de Referência
      </h3>
      <div className={`grid grid-cols-2 md:grid-cols-${Math.min(indicadoresVisiveis.length, 4)} gap-3 text-sm`}>
        {indicadoresVisiveis.map((key) => (
          <div key={key} className="flex justify-between">
            <span className="text-blue-800">{INDICADORES_LABELS[key]}:</span>
            <span className="font-medium text-blue-900">{indicadores[key]}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-blue-700 mt-2">
        *Valores padrão do mercado - podem ser personalizados no formulário
      </p>
    </div>
  );
}