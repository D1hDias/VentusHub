import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Filter, MoreHorizontal, Edit, Trash2, Eye, HelpCircle } from "lucide-react";

export default function CreditoCGI() {
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
          <Card className="bg-emerald-500 text-white border-0">
            <CardContent className="p-4 sm:p-6 text-center">
              <p className="text-emerald-100 text-xs sm:text-sm mb-1 sm:mb-2">Propostas enviadas</p>
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
                    <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 bg-emerald-500 rounded-sm"></div>
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
          <Button variant="ghost" size="sm" className="self-start sm:self-auto text-emerald-600 hover:text-emerald-700">
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
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        Em espera
                      </Badge>
                    </td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100">CGI</td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">14/04/25 18:13</td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100">1520000</td>
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
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        Em espera
                      </Badge>
                    </td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100">CGI</td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">14/04/25 15:51</td>
                    <td className="p-3 sm:p-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100">740000</td>
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