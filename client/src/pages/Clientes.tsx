import { useLocation } from "wouter";
import { Plus, Search, Filter, X, Eye, Edit, MoreHorizontal, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClientModal } from "@/components/ClientModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Client {
  id?: string;
  fullName: string;
  cpf: string;
  birthDate?: string;
  email: string;
  phonePrimary: string;
  phoneSecondary?: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement?: string;
  addressNeighborhood: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  maritalStatus: 'Solteiro' | 'Casado' | 'Divorciado' | 'Viúvo';
  profession?: string;
  monthlyIncome?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface ClientActionsProps {
  client: Client;
  onEdit: (client: Client) => void;
}

const ClientActions = ({ client, onEdit }: ClientActionsProps) => {
  const [, setLocation] = useLocation();

  const handleViewDetails = () => {
    setLocation(`/client/${client.id}`);
  };

  const handleEdit = () => {
    onEdit(client);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleViewDetails}
        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
      >
        <Eye className="h-4 w-4 mr-1" />
        Ver Detalhes
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleEdit}
        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
      >
        <Edit className="h-4 w-4 mr-1" />
        Editar
      </Button>
    </div>
  );
};

export default function Clientes() {
  const queryClient = useQueryClient();
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    maritalStatus: [] as string[],
    city: [] as string[],
    state: [] as string[],
    hasIncome: "all"
  });

  const { data: clientsResponse, isLoading, error } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const response = await fetch("/api/clients");
      if (!response.ok) throw new Error("Failed to fetch clients");
      return response.json();
    },
  });

  // Extrair o array de clientes da resposta da API
  const clients = clientsResponse?.clients || [];

  const getMaritalStatusBadge = (status: string) => {
    const statusMap = {
      'Solteiro': { color: 'blue', label: 'Solteiro' },
      'Casado': { color: 'green', label: 'Casado' },
      'Divorciado': { color: 'orange', label: 'Divorciado' },
      'Viúvo': { color: 'gray', label: 'Viúvo' }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { color: 'gray', label: status };

    return (
      <Badge
        variant="outline"
        className={`text-${statusInfo.color}-600 border-${statusInfo.color}-600`}
      >
        <User className="h-3 w-3 mr-1" />
        {statusInfo.label}
      </Badge>
    );
  };

  const filteredClients = (clients && Array.isArray(clients)) ? clients.filter((client: Client) => {
    const matchesSearch = searchTerm === "" ||
      client.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.cpf?.includes(searchTerm) ||
      client.phonePrimary?.includes(searchTerm);

    const matchesMaritalStatus = filters.maritalStatus.length === 0 ||
      filters.maritalStatus.includes(client.maritalStatus);

    const matchesCityFilter = filters.city.length === 0 ||
      filters.city.includes(client.addressCity);

    const matchesStateFilter = filters.state.length === 0 ||
      filters.state.includes(client.addressState);

    const matchesIncomeFilter = (() => {
      if (filters.hasIncome === "all") return true;
      if (filters.hasIncome === "with") return client.monthlyIncome && client.monthlyIncome > 0;
      if (filters.hasIncome === "without") return !client.monthlyIncome || client.monthlyIncome === 0;
      return true;
    })();

    return matchesSearch && matchesMaritalStatus && matchesCityFilter &&
      matchesStateFilter && matchesIncomeFilter;
  }) : [];

  const uniqueMaritalStatuses = [...new Set((clients || []).map((c: Client) => c.maritalStatus))].filter(Boolean);
  const uniqueCities = [...new Set((clients || []).map((c: Client) => c.addressCity))].filter(Boolean);
  const uniqueStates = [...new Set((clients || []).map((c: Client) => c.addressState))].filter(Boolean);

  const handleFilterChange = (filterType: string, value: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: checked
        ? [...prev[filterType as keyof typeof prev] as string[], value]
        : (prev[filterType as keyof typeof prev] as string[]).filter(item => item !== value)
    }));
  };

  const clearFilters = () => {
    setFilters({
      maritalStatus: [],
      city: [],
      state: [],
      hasIncome: "all"
    });
  };

  const hasActiveFilters = filters.maritalStatus.length > 0 || filters.city.length > 0 ||
    filters.state.length > 0 || filters.hasIncome !== "all";

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  };

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground">
            Gerencie e acompanhe seus clientes e contatos
          </p>
        </div>
        <Button
          onClick={() => setShowClientModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome, email, CPF ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filtros
                    {hasActiveFilters && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                        {filters.maritalStatus.length + filters.city.length + filters.state.length +
                          (filters.hasIncome !== "all" ? 1 : 0)}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80">
                  <div className="p-4 space-y-4">
                    {/* Marital Status Filter */}
                    <div>
                      <h4 className="font-medium mb-2 text-gray-900">Estado Civil</h4>
                      <div className="space-y-2">
                        {uniqueMaritalStatuses.map((status) => (
                          <div key={status} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`marital-${status}`}
                              checked={filters.maritalStatus.includes(status)}
                              onChange={(e) => handleFilterChange('maritalStatus', status, e.target.checked)}
                              className="rounded border-gray-300 h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor={`marital-${status}`} className="text-sm text-gray-700">
                              {status}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* City Filter */}
                    <div>
                      <h4 className="font-medium mb-2 text-gray-900">Cidade</h4>
                      <div className="space-y-2">
                        {uniqueCities.map((city) => (
                          <div key={city} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`city-${city}`}
                              checked={filters.city.includes(city)}
                              onChange={(e) => handleFilterChange('city', city, e.target.checked)}
                              className="rounded border-gray-300 h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor={`city-${city}`} className="text-sm text-gray-700">{city}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* State Filter */}
                    <div>
                      <h4 className="font-medium mb-2 text-gray-900">Estado</h4>
                      <div className="space-y-2">
                        {uniqueStates.map((state) => (
                          <div key={state} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`state-${state}`}
                              checked={filters.state.includes(state)}
                              onChange={(e) => handleFilterChange('state', state, e.target.checked)}
                              className="rounded border-gray-300 h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor={`state-${state}`} className="text-sm text-gray-700">{state}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Income Filter */}
                    <div>
                      <h4 className="font-medium mb-2 text-gray-900">Renda Informada</h4>
                      <select
                        value={filters.hasIncome}
                        onChange={(e) => setFilters(prev => ({ ...prev, hasIncome: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">Todos</option>
                        <option value="with">Com renda informada</option>
                        <option value="without">Sem renda informada</option>
                      </select>
                    </div>

                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        onClick={clearFilters}
                        className="w-full"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Limpar Filtros
                      </Button>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clientes Cadastrados ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-2">Erro ao carregar clientes</div>
              <div className="text-gray-500 text-sm">{error.message}</div>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Tentar Novamente
              </Button>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-600 mb-2">
                {clients.length === 0 ? "Nenhum cliente cadastrado" : "Nenhum cliente encontrado"}
              </div>
              <div className="text-gray-500 text-sm">
                {clients.length === 0
                  ? "Comece cadastrando seu primeiro cliente"
                  : "Tente ajustar os filtros de busca"
                }
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="px-4 py-3 text-gray-900 font-medium">Cliente</TableHead>
                    <TableHead className="px-4 py-3 text-gray-900 font-medium">Contato</TableHead>
                    <TableHead className="px-4 py-3 text-gray-900 font-medium">Endereço</TableHead>
                    <TableHead className="px-4 py-3 text-gray-900 font-medium">Estado Civil</TableHead>
                    <TableHead className="px-4 py-3 text-gray-900 font-medium">Renda</TableHead>
                    <TableHead className="px-4 py-3 text-gray-900 font-medium">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client: Client, index: number) => (
                    <TableRow key={client.id || Math.random()} className="border-gray-200 row-hover">
                      <TableCell className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">
                            {client.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            CPF: {formatCPF(client.cpf)}
                          </div>
                          {client.profession && (
                            <div className="text-sm text-gray-500">
                              {client.profession}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">
                            {formatPhone(client.phonePrimary)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {client.email}
                          </div>
                          {client.phoneSecondary && (
                            <div className="text-sm text-gray-500">
                              Alt: {formatPhone(client.phoneSecondary)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="font-medium text-gray-900">
                            {client.addressStreet}, {client.addressNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {client.addressNeighborhood}
                          </div>
                          <div className="text-sm text-gray-500">
                            {client.addressCity} - {client.addressState}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {getMaritalStatusBadge(client.maritalStatus)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        {client.monthlyIncome ? (
                          <div className="text-sm font-medium text-green-600">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL'
                            }).format(client.monthlyIncome)}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            Não informado
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <ClientActions
                          client={client}
                          onEdit={(clientToEdit) => {
                            setSelectedClient(clientToEdit);
                            setShowClientModal(true);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Modal */}
      <ClientModal
        open={showClientModal}
        onOpenChange={(open) => {
          setShowClientModal(open);
          if (!open) {
            setSelectedClient(null);
            // Revalidar a lista de clientes quando o modal for fechado
            queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
          }
        }}
        client={selectedClient}
      />
    </div>
  );
}