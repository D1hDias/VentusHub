import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from "framer-motion";
import { useSmoothtTransitions } from "@/hooks/useSmoothtTransitions";
import { useResponsive } from "@/hooks/useMediaQuery";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Building2, 
  Calendar,
  Download,
  Eye,
  Filter
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Relatorios() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const { getListVariants, getListItemVariants } = useSmoothtTransitions();
  const { isMobile } = useResponsive();

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <BarChart3 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Relatórios e Analytics
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Acompanhe o desempenho da sua imobiliária e equipe
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        variants={getListVariants()}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={getListItemVariants()}>
          <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 2.450.000</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+18.2%</span> em relação ao mês anterior
            </p>
          </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={getListItemVariants()}>
          <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Imóveis Vendidos</CardTitle>
            <Building2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">+2</span> novos fechamentos
            </p>
          </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={getListItemVariants()}>
          <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-purple-600">+12</span> novos clientes
            </p>
          </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={getListItemVariants()}>
          <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.4%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-orange-600">+1.2%</span> de melhoria
            </p>
          </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Reports Tabs */}
      <Tabs defaultValue="vendas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="equipe">Performance da Equipe</TabsTrigger>
          <TabsTrigger value="imoveis">Imóveis</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="space-y-6">
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            variants={getListVariants()}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={getListItemVariants()}>
              <Card>
              <CardHeader>
                <CardTitle>Vendas por Mês</CardTitle>
                <CardDescription>
                  Evolução das vendas nos últimos 12 meses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Gráfico de vendas mensais</p>
                    <p className="text-sm text-gray-400">Em desenvolvimento</p>
                  </div>
                </div>
              </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={getListItemVariants()}>
              <Card>
              <CardHeader>
                <CardTitle>Top Imóveis Vendidos</CardTitle>
                <CardDescription>
                  Imóveis com maior valor de venda este mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { tipo: 'Apartamento 3/4', valor: 'R$ 580.000', corretor: 'Maria Silva' },
                    { tipo: 'Casa 4/4', valor: 'R$ 450.000', corretor: 'João Santos' },
                    { tipo: 'Apartamento 2/4', valor: 'R$ 320.000', corretor: 'Ana Costa' },
                  ].map((imovel, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{imovel.tipo}</p>
                        <p className="text-sm text-gray-600">{imovel.corretor}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{imovel.valor}</p>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          Ver detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </TabsContent>

        <TabsContent value="equipe" className="space-y-6">
          <motion.div
            variants={getListItemVariants()}
            initial="hidden"
            animate="visible"
          >
            <Card>
            <CardHeader>
              <CardTitle>Performance da Equipe</CardTitle>
              <CardDescription>
                Ranking de performance dos corretores no mês atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { nome: 'Maria Silva', vendas: 5, valor: 'R$ 1.200.000', meta: '120%' },
                  { nome: 'João Santos', vendas: 4, valor: 'R$ 890.000', meta: '95%' },
                  { nome: 'Ana Costa', vendas: 3, valor: 'R$ 650.000', meta: '78%' },
                  { nome: 'Pedro Lima', vendas: 2, valor: 'R$ 480.000', meta: '65%' },
                ].map((corretor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{corretor.nome}</p>
                        <p className="text-sm text-gray-600">{corretor.vendas} vendas realizadas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{corretor.valor}</p>
                      <p className={`text-sm ${
                        parseFloat(corretor.meta) >= 100 ? 'text-green-600' : 
                        parseFloat(corretor.meta) >= 80 ? 'text-orange-600' : 'text-red-600'
                      }`}>
                        {corretor.meta} da meta
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="imoveis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Status dos Imóveis</CardTitle>
                <CardDescription>
                  Distribuição atual do portfólio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Em Captação</span>
                    <span className="font-bold">23</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>No Mercado</span>
                    <span className="font-bold">45</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Com Propostas</span>
                    <span className="font-bold">12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Em Contrato</span>
                    <span className="font-bold">8</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Vendidos</span>
                    <span className="font-bold text-green-600">34</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tempo Médio de Venda</CardTitle>
                <CardDescription>
                  Por tipo de imóvel (em dias)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Apartamentos</span>
                    <span className="font-bold">45 dias</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Casas</span>
                    <span className="font-bold">62 dias</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Terrenos</span>
                    <span className="font-bold">89 dias</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Comerciais</span>
                    <span className="font-bold">127 dias</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Comissões por Corretor</CardTitle>
                <CardDescription>
                  Comissões pagas no mês atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { nome: 'Maria Silva', comissao: 'R$ 36.000', percentual: '3%' },
                    { nome: 'João Santos', comissao: 'R$ 26.700', percentual: '3%' },
                    { nome: 'Ana Costa', comissao: 'R$ 19.500', percentual: '3%' },
                  ].map((corretor, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium">{corretor.nome}</span>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{corretor.comissao}</p>
                        <p className="text-sm text-gray-600">{corretor.percentual}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Receita vs Despesas</CardTitle>
                <CardDescription>
                  Resumo financeiro do mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <span className="font-medium">Receita Total</span>
                    <span className="font-bold text-green-600">R$ 245.000</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <span className="font-medium">Despesas</span>
                    <span className="font-bold text-red-600">R$ 120.000</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <span className="font-medium">Lucro Líquido</span>
                    <span className="font-bold text-blue-600">R$ 125.000</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Coming Soon Notice */}
      <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-green-900 dark:text-green-100">
              Relatórios Avançados em Desenvolvimento
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              Gráficos interativos, exportação em PDF/Excel, relatórios personalizados 
              e dashboard em tempo real estarão disponíveis em breve.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}