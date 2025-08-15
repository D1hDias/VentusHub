import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileSearch,
  Plus,
  Filter,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  FileCheck,
  FileText,
  Building,
  Calendar,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Interface para cartórios
interface Cartorio {
  id: number;
  numero: string;
  nome: string;
  nomeCompleto?: string;
  cidade: string;
  estado: string;
  site?: string;
  ativo: boolean;
}

// Interface para os registros
interface Registro {
  id: number;
  numeroProtocolo: string;
  propertyId: number;
  propertyAddress: string;
  cartorio: string;
  status: 'pronto_para_registro' | 'em_analise' | 'em_registro' | 'exigencia' | 'registrado';
  dataEnvio: string;
  dataRegistro?: string;
  valorEmolumentos: number;
  observacoes?: string;
}

// Mock data para demonstração
const mockRegistros: Registro[] = [
  {
    id: 1,
    numeroProtocolo: 'REG-2024-001',
    propertyId: 1,
    propertyAddress: 'Rua das Flores, 123 - Centro',
    cartorio: '1º RGI',
    status: 'em_analise',
    dataEnvio: '2024-01-15',
    valorEmolumentos: 1200.50,
    observacoes: 'Aguardando análise dos documentos'
  },
  {
    id: 2,
    numeroProtocolo: 'REG-2024-002',
    propertyId: 2,
    propertyAddress: 'Av. Principal, 456 - Zona Sul',
    cartorio: '2º RGI',
    status: 'registrado',
    dataEnvio: '2024-01-10',
    dataRegistro: '2024-01-20',
    valorEmolumentos: 2400.75,
    observacoes: 'Registro concluído com sucesso'
  },
  {
    id: 3,
    numeroProtocolo: 'REG-2024-003',
    propertyId: 3,
    propertyAddress: 'Rua do Mercado, 789 - Centro',
    cartorio: '3º RGI',
    status: 'pronto_para_registro',
    dataEnvio: '2024-01-18',
    valorEmolumentos: 850.00,
    observacoes: 'Documentação completa, pronto para envio'
  },
  {
    id: 4,
    numeroProtocolo: 'REG-2024-004',
    propertyId: 4,
    propertyAddress: 'Av. Atlântica, 1000 - Copacabana',
    cartorio: '4º RGI',
    status: 'exigencia',
    dataEnvio: '2024-01-12',
    valorEmolumentos: 3200.00,
    observacoes: 'Exigência: Falta certidão negativa de débitos'
  },
  {
    id: 5,
    numeroProtocolo: 'REG-2024-005',
    propertyId: 5,
    propertyAddress: 'Rua das Palmeiras, 250 - Tijuca',
    cartorio: '5º RGI',
    status: 'em_registro',
    dataEnvio: '2024-01-20',
    valorEmolumentos: 1680.25,
    observacoes: 'Em processo de registro no cartório'
  }
];

const statusConfig = {
  pronto_para_registro: {
    label: 'Pronto para Registro',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: FileCheck
  },
  em_analise: {
    label: 'Em Análise',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: FileSearch
  },
  em_registro: {
    label: 'Em Registro',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Settings
  },
  exigencia: {
    label: 'Exigência',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: AlertCircle
  },
  registrado: {
    label: 'Registrado',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle
  }
};

// Cartórios estáticos como fallback garantido
const cartoriosEstaticos: Cartorio[] = [
  { id: 1, numero: '1º', nome: '1º RGI', cidade: 'Rio de Janeiro', estado: 'RJ', ativo: true },
  { id: 2, numero: '2º', nome: '2º RGI', cidade: 'Rio de Janeiro', estado: 'RJ', ativo: true },
  { id: 3, numero: '3º', nome: '3º RGI', cidade: 'Rio de Janeiro', estado: 'RJ', ativo: true },
  { id: 4, numero: '4º', nome: '4º RGI', cidade: 'Rio de Janeiro', estado: 'RJ', ativo: true },
  { id: 5, numero: '5º', nome: '5º RGI', cidade: 'Rio de Janeiro', estado: 'RJ', ativo: true },
  { id: 6, numero: '6º', nome: '6º RGI', cidade: 'Rio de Janeiro', estado: 'RJ', ativo: true },
  { id: 7, numero: '7º', nome: '7º RGI', cidade: 'Rio de Janeiro', estado: 'RJ', ativo: true },
  { id: 8, numero: '8º', nome: '8º RGI', cidade: 'Rio de Janeiro', estado: 'RJ', ativo: true },
  { id: 9, numero: '9º', nome: '9º RGI', cidade: 'Rio de Janeiro', estado: 'RJ', ativo: true },
  { id: 10, numero: '10º', nome: '10º RGI', cidade: 'Rio de Janeiro', estado: 'RJ', ativo: true },
  { id: 11, numero: '11º', nome: '11º RGI', cidade: 'Rio de Janeiro', estado: 'RJ', ativo: true },
  { id: 12, numero: '12º', nome: '12º RGI', cidade: 'Rio de Janeiro', estado: 'RJ', ativo: true }
];

const Registro: React.FC = () => {
  const [registros] = useState<Registro[]>(mockRegistros);
  const [cartorios, setCartorios] = useState<Cartorio[]>(cartoriosEstaticos);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [cartorioFilter, setCartorioFilter] = useState<string>('todos');
  const [loading, setLoading] = useState(true);

  // Buscar cartórios da API (com fallback para dados estáticos)
  useEffect(() => {
    const fetchCartorios = async () => {
      try {
        console.log('🔄 Tentando carregar cartórios da API...');
        const response = await fetch('/api/cartorios');

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Cartórios carregados da API:', data.length);
          if (data.length > 0) {
            setCartorios(data);
          }
        } else {
          console.log('⚠️ API indisponível, usando cartórios estáticos');
        }
      } catch (error) {
        console.log('⚠️ Erro na API, usando cartórios estáticos');
      } finally {
        setLoading(false);
      }
    };

    // Carregar dados estáticos imediatamente
    setLoading(false);

    // Tentar carregar da API em background
    fetchCartorios();
  }, []);

  const filteredRegistros = registros.filter(registro => {
    const matchesSearch =
      registro.numeroProtocolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registro.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      registro.cartorio.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'todos' || registro.status === statusFilter;
    const matchesCartorio = cartorioFilter === 'todos' || registro.cartorio === cartorioFilter;

    return matchesSearch && matchesStatus && matchesCartorio;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="p-6 space-y-6 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Gerencie os registros de imóveis nos cartórios
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Novo Registro
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por protocolo, endereço ou cartório..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pronto_para_registro">Pronto para Registro</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="em_registro">Em Registro</SelectItem>
                <SelectItem value="exigencia">Exigência</SelectItem>
                <SelectItem value="registrado">Registrado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={cartorioFilter} onValueChange={setCartorioFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Cartório" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Cartórios</SelectItem>
                {cartorios.map((cartorio) => (
                  <SelectItem key={cartorio.id} value={cartorio.nome}>
                    {cartorio.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Registros List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRegistros.map((registro) => {
          const StatusIcon = statusConfig[registro.status].icon;

          return (
            <motion.div
              key={registro.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-semibold">
                      {registro.numeroProtocolo}
                    </CardTitle>
                    <Badge className={statusConfig[registro.status].color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusConfig[registro.status].label}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Building className="h-4 w-4" />
                      <span className="truncate">{registro.propertyAddress}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="h-4 w-4" />
                      <span>{registro.cartorio}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Enviado em {formatDate(registro.dataEnvio)}</span>
                    </div>

                    {registro.dataRegistro && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>Registrado em {formatDate(registro.dataRegistro)}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Emolumentos:</span>
                        <span className="text-sm font-bold text-blue-600">
                          {formatCurrency(registro.valorEmolumentos)}
                        </span>
                      </div>
                    </div>

                    {registro.observacoes && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        {registro.observacoes}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredRegistros.length === 0 && (
        <div className="text-center py-12">
          <FileSearch className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum registro encontrado
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || statusFilter !== 'todos' || cartorioFilter !== 'todos'
              ? 'Tente ajustar os filtros para encontrar registros.'
              : 'Comece criando seu primeiro registro de imóvel.'}
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Novo Registro
          </Button>
        </div>
      )}
    </div>
  );
};

export default Registro;