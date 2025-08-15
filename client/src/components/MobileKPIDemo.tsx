import React from 'react';
import { CompactKPICard } from './CompactKPICard';
import { KPICard } from './KPICard';
import { Home, Store, Handshake, FileCheck, TrendingUp, DollarSign } from 'lucide-react';
import { useResponsive } from '@/hooks/useMediaQuery';

// Demo component para mostrar os KPICards compactos vs normais
export function MobileKPIDemo() {
  const { isMobile } = useResponsive();

  const kpiData = [
    {
      title: "Propriedades Captadas",
      value: 12,
      icon: Home,
      iconBgColor: "hsl(159, 69%, 38%)", // verde
      progress: 75,
      subtitle: "3 novas este mês",
      onClick: () => console.log('Navigate to captacao')
    },
    {
      title: "No Mercado",
      value: 8,
      icon: Store,
      iconBgColor: "hsl(32, 81%, 46%)", // laranja
      progress: 60,
      subtitle: "2 com propostas pendentes",
      onClick: () => console.log('Navigate to mercado')
    },
    {
      title: "Contratos Ativos",
      value: 5,
      icon: Handshake,
      iconBgColor: "hsl(220, 91%, 51%)", // azul
      progress: 90,
      subtitle: "1 aguardando assinatura",
      onClick: () => console.log('Navigate to contratos')
    },
    {
      title: "Documentação",
      value: 3,
      icon: FileCheck,
      iconBgColor: "hsl(271, 81%, 56%)", // roxo
      progress: 45,
      subtitle: "2 documentos pendentes",
      onClick: () => console.log('Navigate to docs')
    },
    {
      title: "Vendas no Mês",
      value: 150000,
      icon: TrendingUp,
      iconBgColor: "hsl(142, 71%, 45%)", // verde escuro
      progress: 85,
      subtitle: "Meta: R$ 200.000",
      onClick: () => console.log('Navigate to vendas')
    },
    {
      title: "Comissões",
      value: 15000,
      icon: DollarSign,
      iconBgColor: "hsl(0, 72%, 51%)", // vermelho
      progress: 70,
      subtitle: "R$ 5.000 pendentes",
      onClick: () => console.log('Navigate to comissoes')
    }
  ];

  return (
    <div className="space-y-6 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          {isMobile ? 'KPI Cards Compactos (Mobile)' : 'KPI Cards Normais (Desktop)'}
        </h2>
        <p className="text-muted-foreground">
          {isMobile 
            ? 'Versão otimizada para mobile com expansão em duas etapas'
            : 'Versão completa para desktop'
          }
        </p>
      </div>

      <div className="grid gap-3">
        {kpiData.map((kpi, index) => 
          isMobile ? (
            <CompactKPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              icon={kpi.icon}
              iconBgColor={kpi.iconBgColor}
              progress={kpi.progress}
              subtitle={kpi.subtitle}
              onClick={kpi.onClick}
            />
          ) : (
            <KPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              icon={kpi.icon}
              iconBgColor={kpi.iconBgColor}
              progress={kpi.progress}
              subtitle={kpi.subtitle}
              onClick={kpi.onClick}
              forceListLayout={false}
            />
          )
        )}
      </div>

      {isMobile && (
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-semibold mb-2">📱 Como funciona:</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>1º clique:</strong> Expande o card para mostrar detalhes (valor, progresso, descrição)</p>
            <p><strong>2º clique:</strong> Navega para a seção correspondente</p>
            <p><strong>Visual:</strong> Ícones indicam o estado (seta para baixo = expandido, link externo = pronto para navegar)</p>
          </div>
        </div>
      )}
    </div>
  );
}