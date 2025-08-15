import React from 'react';
import { BarChart3, RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';
import { useIndicadoresMercado } from '@/hooks/useIndicadoresMercado';

type IndicadorKey = 'selic' | 'cdi' | 'igpM' | 'ipca' | 'itbiRegistro' | 'irGanhoCapital' | 'corretagem' | 'valorizacao';

interface IndicadoresMercadoProps {
  className?: string;
  indicadoresVisiveis?: IndicadorKey[];
  forceStatic?: boolean;
  showControls?: boolean;
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

const INDICADORES_COLORS = {
  api: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-900', textSub: 'text-blue-700' },
  estatico: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-900', textSub: 'text-blue-700' },
  carregando: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-900', textSub: 'text-blue-700' }
};

export default function IndicadoresMercado({ 
  className = '', 
  indicadoresVisiveis = ['selic', 'cdi', 'itbiRegistro', 'irGanhoCapital'],
  forceStatic = false,
  showControls = true
}: IndicadoresMercadoProps) {
  const { indicadores, isLoading, refresh, getFormatted } = useIndicadoresMercado({ 
    forceStatic,
    autoRefresh: true,
    updateInterval: 15 * 60 * 1000 // 15 minutos
  });

  const indicadoresFormatados = getFormatted();
  const colors = INDICADORES_COLORS[indicadores.fonte];

  const formatarTempoDecorrido = (data: Date | string): string => {
    const agora = new Date();
    const dataObj = typeof data === 'string' ? new Date(data) : data;
    
    // Verificar se a data é válida
    if (isNaN(dataObj.getTime())) {
      return 'data inválida';
    }
    
    const diffMs = agora.getTime() - dataObj.getTime();
    const diffMinutos = Math.floor(diffMs / 60000);
    
    if (diffMinutos < 1) return 'agora';
    if (diffMinutos < 60) return `${diffMinutos}min atrás`;
    const diffHoras = Math.floor(diffMinutos / 60);
    if (diffHoras < 24) return `${diffHoras}h atrás`;
    const diffDias = Math.floor(diffHoras / 24);
    return `${diffDias}d atrás`;
  };

  const getFonteIcon = () => {
    switch (indicadores.fonte) {
      case 'api':
        return <Wifi className="h-4 w-4" />;
      case 'estatico':
        return <WifiOff className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4 animate-spin" />;
    }
  };

  const getFonteTexto = () => {
    switch (indicadores.fonte) {
      case 'api':
        return 'Tempo Real';
      case 'estatico':
        return 'Dados Estáticos';
      default:
        return 'Carregando...';
    }
  };

  return (
    <div className={`${colors.bg} border-l-4 ${colors.border} rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-lg font-semibold ${colors.text} flex items-center`}>
          <BarChart3 className="h-5 w-5 mr-2" />
          📊 Indicadores de Referência
        </h3>
        
        {showControls && (
          <div className="flex items-center gap-2">
            {/* Indicador de fonte */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors.bg} border ${colors.border}`}>
              {getFonteIcon()}
              <span className={colors.text}>{getFonteTexto()}</span>
            </div>
            
            {/* Botão de refresh */}
            <button
              onClick={refresh}
              disabled={isLoading}
              className={`p-1.5 rounded-full hover:bg-gray-200 transition-colors ${colors.text} ${isLoading ? 'animate-spin' : ''}`}
              title="Atualizar indicadores"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      <div className={`grid grid-cols-2 md:grid-cols-${Math.min(indicadoresVisiveis.length, 4)} gap-3 text-sm`}>
        {indicadoresVisiveis.map((key) => (
          <div key={key} className="flex justify-between">
            <span className={colors.textSub}>{INDICADORES_LABELS[key]}:</span>
            <span className={`font-medium ${colors.text}`}>{indicadoresFormatados[key]}</span>
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-between mt-2 text-xs">
        <p className={colors.textSub}>
          *Valores {indicadores.fonte === 'api' ? 'atualizados em tempo real' : 'padrão do mercado'}
        </p>
        
        <div className={`flex items-center gap-1 ${colors.textSub}`}>
          <Clock className="h-3 w-3" />
          <span>Atualizado {formatarTempoDecorrido(indicadores.ultimaAtualizacao)}</span>
        </div>
      </div>
      
      {/* Mostrar erro se houver */}
      {indicadores.erro && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          <strong>Aviso:</strong> {indicadores.erro}
        </div>
      )}
    </div>
  );
}