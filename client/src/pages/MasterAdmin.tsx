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
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import logoImage from '@/assets/logo.png';
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
  organizationName?: string;
  creci?: string;
  cnpj?: string;
  phone?: string;
  isActive: boolean;
  lastLoginAt?: string;
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

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('masterAdminToken');
    if (!token) {
      setLocation('/master-admin-login');
      return;
    }

    validateSession();
  }, []);

  const validateSession = async () => {
    try {
      const token = localStorage.getItem('masterAdminToken');
      const response = await fetch('/api/master-admin/auth/validate', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Session invalid');
      }

      // Load initial data
      await loadDashboardData();
    } catch (err) {
      console.error('Session validation error:', err);
      localStorage.removeItem('masterAdminToken');
      localStorage.removeItem('masterAdminId');
      setLocation('/master-admin-login');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('masterAdminToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Load stats, activity logs, and users in parallel
      const [statsRes, logsRes, usersRes] = await Promise.all([
        fetch('/api/master-admin/dashboard/stats', { headers }),
        fetch('/api/master-admin/logs?limit=20', { headers }),
        fetch('/api/master-admin/users?limit=50', { headers })
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
      const token = localStorage.getItem('masterAdminToken');
      await fetch('/api/master-admin/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('masterAdminToken');
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

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.organizationName && user.organizationName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
              <img src={logoImage} alt="VentusHub" className="h-8 w-auto" />
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
                      placeholder="Buscar usuários..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback>
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          {user.organizationName && (
                            <div className="text-sm text-blue-600">{user.organizationName}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.userType === 'CORRETOR_AUTONOMO' ? 'default' : 'secondary'}>
                          {user.userType === 'CORRETOR_AUTONOMO' ? 'Corretor' : 'Imobiliária'}
                        </Badge>
                        <Badge variant={user.isActive ? 'default' : 'destructive'}>
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                    </div>
                  )}
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
    </div>
  );
}