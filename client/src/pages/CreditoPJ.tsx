import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Filter, MoreHorizontal, Edit, Trash2, Eye, HelpCircle, Calculator } from "lucide-react";
import { Link } from "wouter";

export default function CreditoPJ() {
  return (
    <div className="min-h-screen w-full p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">Visão geral</h1>
        <Button variant="outline" size="sm" className="self-start sm:self-auto">
          <HelpCircle className="h-4 w-4 mr-2" />
          <span className="hidden xs:inline">Ajuda</span>
        </Button>
      </div>

      {/* Análise de Propostas */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Análise de Propostas</h2>
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="bg-amber-500 text-white border-0">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-amber-100 text-xs sm:text-sm mb-1 sm:mb-2">Propostas enviadas</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">0</p>
            </CardContent>
          </Card>
          
          <Card className="bg-green-500 text-white border-0">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-green-100 text-xs sm:text-sm mb-1 sm:mb-2">Propostas aprovadas</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">0</p>
            </CardContent>
          </Card>
          
          <Card className="bg-yellow-500 text-white border-0">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-yellow-100 text-xs sm:text-sm mb-1 sm:mb-2">Propostas pendentes</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">0</p>
            </CardContent>
          </Card>
          
          <Card className="bg-red-500 text-white border-0">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-red-100 text-xs sm:text-sm mb-1 sm:mb-2">Propostas negadas</p>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">0</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Ações Rápidas</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Link href="/simulador-credito-pj">
            <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-yellow-200 hover:border-yellow-400 bg-gradient-to-r from-yellow-50 to-amber-50">
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2">Simulador de Crédito</h3>
                <p className="text-xs sm:text-sm text-gray-600">Calcule propostas Pronampe e FGI</p>
              </CardContent>
            </Card>
          </Link>
          
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2">Acompanhamento</h3>
              <p className="text-xs sm:text-sm text-gray-600">Acompanhar propostas enviadas</p>
            </CardContent>
          </Card>
          
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <HelpCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2">Suporte</h3>
              <p className="text-xs sm:text-sm text-gray-600">Central de ajuda</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Métricas de venda */}
      <div className="space-y-3 sm:space-y-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Métricas de venda</h2>
        <Card>
          <CardContent className="p-3 sm:p-4 md:p-6">
            <div className="flex flex-col xl:flex-row gap-4 sm:gap-6">
              {/* Filtros */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Todos</span>
                  <div className="flex gap-1">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-amber-500 rounded-sm"></div>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-red-500 rounded-sm"></div>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-yellow-500 rounded-sm"></div>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-orange-500 rounded-sm"></div>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-gray-600 rounded-sm"></div>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-red-600 rounded-sm"></div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 mb-3 sm:mb-4">
                  <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                    <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="truncate">Jan 20, 2025 - Feb 09, 2025</span>
                  </Button>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">Filtrar</Button>
                  <Button variant="ghost" size="sm" className="w-full sm:w-auto">Limpar Filtro</Button>
                </div>
                
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Dados indisponíveis</p>
              </div>
              
              {/* Métricas */}
              <div className="flex-1 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      Propostas Enviadas <HelpCircle className="h-3 w-3" />
                    </p>
                    <p className="text-base sm:text-lg font-semibold">undefined</p>
                  </div>
                  
                  <div className="space-y-1 sm:space-y-2">
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      Conversão <HelpCircle className="h-3 w-3" />
                    </p>
                    <p className="text-base sm:text-lg font-semibold break-all sm:break-normal">undefined% (undefined/undefined)</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Últimas propostas */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Últimas propostas</h2>
          <Button variant="ghost" size="sm" className="self-start sm:self-auto text-amber-600 hover:text-amber-700">
            Ver mais
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">STATUS</th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">MÉTODO</th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">DATA DE CRIAÇÃO</th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">VALOR</th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">ID</th>
                    <th className="text-left p-3 sm:p-4 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="p-3 sm:p-4">
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                        Em espera
                      </Badge>
                    </td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100">PJ</td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">14/04/25 18:13</td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100">2850000</td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">2</td>
                    <td className="p-3 sm:p-4">
                      <div className="flex gap-1 sm:gap-2">
                        <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="p-3 sm:p-4">
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                        Em espera
                      </Badge>
                    </td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100">PJ</td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">14/04/25 15:51</td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100">1950000</td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">1</td>
                    <td className="p-3 sm:p-4">
                      <div className="flex gap-1 sm:gap-2">
                        <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}