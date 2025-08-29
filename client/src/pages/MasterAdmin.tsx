import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { 
  Shield, 
  Users, 
  UserPlus, 
  Activity, 
  Settings, 
  LogOut,
  Building2,
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import logoMasterImage from '@/assets/logo_master.png';
import { CreateB2BUserForm } from '@/components/CreateB2BUserForm';

interface SystemStats {
  totalUsers: number;
  totalCorretores: number;
  totalImobiliarias: number;
  activeUsers: number;
  recentLogins: number;
  totalSessions: number;
}

interface ActivityLog {
  id: number;
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  createdAt: string;
  targetDetails?: {
    email?: string;
    name?: string;
    userType?: string;
  };
  metadata?: {
    reason?: string;
    duration?: number;
  };
}

interface B2BUser {
  id: string;
  name: string;
  email: string;
  userType: 'CORRETOR_AUTONOMO' | 'IMOBILIARIA';
  businessName?: string;
  document?: string;
  tradeName?: string;
  creci?: string;
  phone?: string;
  bank?: string;
  agency?: string;
  account?: string;
  pixKey?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  isActive: boolean;
  createdBy?: string;
  notes?: string;
  createdAt: string;
}

export default function MasterAdmin() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<B2BUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof B2BUser>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [editingUser, setEditingUser] = useState<B2BUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<B2BUser | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    // No need to check localStorage for token anymore
    // Session validation will check the httpOnly cookie
    validateSession();
  }, []);

  const validateSession = async () => {
    try {
      // Token is sent automatically via secure httpOnly cookie
      const response = await fetch('/api/master-admin/auth/validate', {
        credentials: 'include', // Include secure cookies
      });

      if (!response.ok) {
        throw new Error('Session invalid');
      }

      // Load initial data
      await loadDashboardData();
    } catch (err) {
      console.error('Session validation error:', err);
      // Clear any localStorage data and redirect
      localStorage.removeItem('masterAdminId');
      setLocation('/master-admin-login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      // Token sent automatically via secure httpOnly cookie
      const headers = { 'Content-Type': 'application/json' };

      // Load stats, activity logs, and users in parallel
      const [statsRes, logsRes, usersRes] = await Promise.all([
        fetch('/api/master-admin/dashboard/stats', { headers, credentials: 'include' }),
        fetch('/api/master-admin/logs?limit=20', { headers, credentials: 'include' }),
        fetch('/api/master-admin/users?limit=50', { headers, credentials: 'include' })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.data);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setActivityLogs(logsData.data);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.data);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Erro ao carregar dados do dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      // Logout request will clear the httpOnly cookie server-side
      await fetch('/api/master-admin/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear any remaining localStorage and redirect
      localStorage.removeItem('masterAdminId');
      setLocation('/master-admin-login');
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    await loadDashboardData();
    setIsLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN')) return <LogOut className="h-4 w-4" />;
    if (action.includes('CREATE')) return <UserPlus className="h-4 w-4" />;
    if (action.includes('UPDATE')) return <Settings className="h-4 w-4" />;
    if (action.includes('DELETE')) return <XCircle className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'FAILED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'PARTIAL': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleSort = (field: keyof B2BUser) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof B2BUser) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const handleEditUser = (user: B2BUser) => {
    setEditingUser({...user});
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: B2BUser) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      // Token sent automatically via secure httpOnly cookie
      const response = await fetch(`/api/master-admin/users/${deletingUser.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== deletingUser.id));
        setShowDeleteModal(false);
        setDeletingUser(null);
        await loadDashboardData(); // Refresh stats
      } else {
        setError('Erro ao excluir usuário');
      }
    } catch (err) {
      console.error('Delete user error:', err);
      setError('Erro interno do servidor');
    }
  };

  const saveEditedUser = async () => {
    if (!editingUser) return;

    try {
      // Token sent automatically via secure httpOnly cookie
      const response = await fetch(`/api/master-admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          businessName: editingUser.businessName,
          document: editingUser.document,
          tradeName: editingUser.tradeName,
          creci: editingUser.creci,
          phone: editingUser.phone,
          bank: editingUser.bank,
          agency: editingUser.agency,
          account: editingUser.account,
          pixKey: editingUser.pixKey,
          cep: editingUser.cep,
          street: editingUser.street,
          number: editingUser.number,
          complement: editingUser.complement,
          neighborhood: editingUser.neighborhood,
          city: editingUser.city,
          state: editingUser.state,
          isActive: editingUser.isActive,
          notes: editingUser.notes,
        }),
      });

      if (response.ok) {
        await loadDashboardData(); // Refresh data
        setShowEditModal(false);
        setEditingUser(null);
      } else {
        setError('Erro ao salvar alterações');
      }
    } catch (err) {
      console.error('Save user error:', err);
      setError('Erro interno do servidor');
    }
  };

  const filteredAndSortedUsers = users
    .filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.businessName && user.businessName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.document && user.document.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.creci && user.creci.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        const comparison = aValue === bValue ? 0 : aValue ? 1 : -1;
        return sortDirection === 'asc' ? comparison : -comparison;
      }
      
      return sortDirection === 'asc' 
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-lg font-medium">Carregando painel...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img src={logoMasterImage} alt="VentusHub Master Admin" className="h-8 w-auto" />
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-red-600" />
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Master Admin
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="create-user" className="flex items-center space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Criar Usuário</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>Atividades</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                  <Users className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Usuários ativos na plataforma
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Corretores Autônomos</CardTitle>
                  <UserCheck className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalCorretores || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Corretores independentes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Imobiliárias</CardTitle>
                  <Building2 className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalImobiliarias || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Empresas parceiras
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.activeUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Contas ativas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Logins Recentes</CardTitle>
                  <Clock className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.recentLogins || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Últimas 24 horas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sessões Ativas</CardTitle>
                  <Activity className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalSessions || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Sessões do painel admin
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Usuários B2B</CardTitle>
                    <CardDescription>
                      Gerenciar corretores autônomos e imobiliárias
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por nome, email, documento ou CRECI..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-80"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => handleSort('name')}
                        >
                          <div className="flex items-center">
                            Nome
                            {getSortIcon('name')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => handleSort('email')}
                        >
                          <div className="flex items-center">
                            Email
                            {getSortIcon('email')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => handleSort('userType')}
                        >
                          <div className="flex items-center">
                            Tipo
                            {getSortIcon('userType')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => handleSort('businessName')}
                        >
                          <div className="flex items-center">
                            Nome/Razão Social
                            {getSortIcon('businessName')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => handleSort('document')}
                        >
                          <div className="flex items-center">
                            CPF/CNPJ
                            {getSortIcon('document')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => handleSort('creci')}
                        >
                          <div className="flex items-center">
                            CRECI
                            {getSortIcon('creci')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => handleSort('isActive')}
                        >
                          <div className="flex items-center">
                            Status
                            {getSortIcon('isActive')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                          onClick={() => handleSort('createdAt')}
                        >
                          <div className="flex items-center">
                            Criado em
                            {getSortIcon('createdAt')}
                          </div>
                        </TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.userType === 'CORRETOR_AUTONOMO' ? 'default' : 'secondary'}>
                              {user.userType === 'CORRETOR_AUTONOMO' ? 'Corretor' : 'Imobiliária'}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.businessName || '-'}</TableCell>
                          <TableCell>{user.document || '-'}</TableCell>
                          <TableCell>{user.creci || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={user.isActive ? 'default' : 'destructive'}>
                              {user.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(user.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUser(user)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredAndSortedUsers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                            {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create User Tab */}
          <TabsContent value="create-user">
            <CreateB2BUserForm onUserCreated={refreshData} />
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Log de Atividades</CardTitle>
                <CardDescription>
                  Histórico de ações administrativas do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityLogs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0 mt-1">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {log.action.replace(/_/g, ' ')}
                          </p>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(log.status)}>
                              {log.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatDate(log.createdAt)}
                            </span>
                          </div>
                        </div>
                        {log.targetDetails && (
                          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {log.targetDetails.name && `Nome: ${log.targetDetails.name}`}
                            {log.targetDetails.email && ` | Email: ${log.targetDetails.email}`}
                            {log.targetDetails.userType && ` | Tipo: ${log.targetDetails.userType}`}
                          </div>
                        )}
                        {log.metadata?.reason && (
                          <div className="mt-1 text-xs text-gray-500">
                            Motivo: {log.metadata.reason}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {activityLogs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      Nenhuma atividade registrada
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit User Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuário B2B</DialogTitle>
            <DialogDescription>
              Modifique as informações do usuário abaixo.
            </DialogDescription>
          </DialogHeader>
          
          {editingUser && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {/* Dados Básicos */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Dados Básicos</h3>
                
                <div>
                  <Label htmlFor="businessName">Nome/Razão Social</Label>
                  <Input
                    id="businessName"
                    value={editingUser.businessName || ''}
                    onChange={(e) => setEditingUser({...editingUser, businessName: e.target.value})}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="document">CPF/CNPJ</Label>
                  <Input
                    id="document"
                    value={editingUser.document || ''}
                    onChange={(e) => setEditingUser({...editingUser, document: e.target.value})}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="tradeName">Nome Fantasia</Label>
                  <Input
                    id="tradeName"
                    value={editingUser.tradeName || ''}
                    onChange={(e) => setEditingUser({...editingUser, tradeName: e.target.value})}
                    className="mt-1"
                    placeholder="Opcional"
                  />
                </div>

                <div>
                  <Label htmlFor="creci">CRECI</Label>
                  <Input
                    id="creci"
                    value={editingUser.creci || ''}
                    onChange={(e) => setEditingUser({...editingUser, creci: e.target.value})}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Endereço</h3>
                
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={editingUser.cep || ''}
                    onChange={(e) => setEditingUser({...editingUser, cep: e.target.value})}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="street">Logradouro</Label>
                  <Input
                    id="street"
                    value={editingUser.street || ''}
                    onChange={(e) => setEditingUser({...editingUser, street: e.target.value})}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="number">Número</Label>
                    <Input
                      id="number"
                      value={editingUser.number || ''}
                      onChange={(e) => setEditingUser({...editingUser, number: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={editingUser.complement || ''}
                      onChange={(e) => setEditingUser({...editingUser, complement: e.target.value})}
                      className="mt-1"
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={editingUser.neighborhood || ''}
                    onChange={(e) => setEditingUser({...editingUser, neighborhood: e.target.value})}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={editingUser.city || ''}
                      onChange={(e) => setEditingUser({...editingUser, city: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">UF</Label>
                    <Input
                      id="state"
                      value={editingUser.state || ''}
                      onChange={(e) => setEditingUser({...editingUser, state: e.target.value})}
                      className="mt-1"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>

              {/* Informações Financeiras */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Informações Financeiras</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bank">Banco</Label>
                    <Input
                      id="bank"
                      value={editingUser.bank || ''}
                      onChange={(e) => setEditingUser({...editingUser, bank: e.target.value})}
                      className="mt-1"
                      placeholder="Ex: Banco do Brasil, Itaú..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="agency">Agência</Label>
                    <Input
                      id="agency"
                      value={editingUser.agency || ''}
                      onChange={(e) => setEditingUser({...editingUser, agency: e.target.value})}
                      className="mt-1"
                      placeholder="Ex: 1234"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="account">Conta</Label>
                    <Input
                      id="account"
                      value={editingUser.account || ''}
                      onChange={(e) => setEditingUser({...editingUser, account: e.target.value})}
                      className="mt-1"
                      placeholder="Ex: 12345-6"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pixKey">Chave PIX</Label>
                    <Input
                      id="pixKey"
                      value={editingUser.pixKey || ''}
                      onChange={(e) => setEditingUser({...editingUser, pixKey: e.target.value})}
                      className="mt-1"
                      placeholder="CPF, CNPJ, email, telefone..."
                    />
                  </div>
                </div>
              </div>

              {/* Observações e Status */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="font-semibold text-lg">Configurações</h3>
                
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={editingUser.notes || ''}
                    onChange={(e) => setEditingUser({...editingUser, notes: e.target.value})}
                    className="mt-1"
                    rows={3}
                    placeholder="Observações administrativas..."
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingUser.isActive}
                    onChange={(e) => setEditingUser({...editingUser, isActive: e.target.checked})}
                    className="rounded"
                  />
                  <Label htmlFor="isActive">Conta ativa</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Cancelar
            </Button>
            <Button onClick={saveEditedUser}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o usuário <strong>{deletingUser?.name}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          {deletingUser && (
            <div className="py-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-red-800 dark:text-red-200">
                      Dados que serão perdidos:
                    </p>
                    <ul className="mt-2 text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                      <li>Perfil do usuário: {deletingUser.name}</li>
                      <li>Email: {deletingUser.email}</li>
                      <li>Documento: {deletingUser.document}</li>
                      <li>Todas as informações de contato e endereço</li>
                      <li>Histórico de atividades relacionadas</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
            >
              Excluir Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}