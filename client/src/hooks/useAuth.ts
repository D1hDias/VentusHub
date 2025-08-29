import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  createdAt: string;
  updatedAt: string;
  // Campos adicionais para o sistema
  role?: 'ADMIN' | 'MANAGER' | 'AGENT' | 'CLIENT';
  organizationId?: string;
  permissions?: string[];
  // Legacy fields for backwards compatibility
  firstName?: string;
  lastName?: string;
  creci?: string;
  avatarUrl?: string;
  // Campos B2B
  b2bProfile?: {
    id: string;
    userType: 'CORRETOR_AUTONOMO' | 'IMOBILIARIA';
    businessName: string;
    document: string;
    creci?: string;
    tradeName?: string;
    phone?: string;
    bank?: string;
    agency?: string;
    account?: string;
    pixKey?: string;
    isActive: boolean;
    permissions?: string[];
  };
}

export interface Organization {
  id: string;
  nome: string;
  tipo: 'IMOBILIARIA' | 'CONSTRUTORA' | 'CLIENTE';
  ativo: boolean;
  settings?: any;
}

export interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isManager: boolean;
  // B2B methods
  isB2BUser: boolean;
  isCorretor: boolean;
  isImobiliaria: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);

  // Check if we're on a Master Admin page (don't need regular auth)
  const isMasterAdminPage = typeof window !== 'undefined' && 
    (window.location.pathname.startsWith('/master-admin'));

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      // Skip auth check for Master Admin pages
      if (isMasterAdminPage) {
        return null;
      }
      
      try {
        const response = await fetch('/api/auth/session-temp');
        if (!response.ok) {
          if (response.status === 401) return null;
          throw new Error('Failed to fetch user');
        }
        const sessionData = await response.json();
        const userData = sessionData.user;
        
        // Se o usuário não tem role OU tem role "USER" (não MASTER_ADMIN/ADMIN), verificar se deve promover
        if (!userData.role || userData.role === 'USER') {
          // Verificar se é o primeiro usuário apenas se não tem role definido
          if (!userData.role) {
            const isFirstUserResponse = await fetch('/api/setup/is-first-user');
            const { isFirstUser } = await isFirstUserResponse.json();
            
            if (isFirstUser) {
              const promoteResponse = await fetch('/api/setup/promote-to-master-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userData.id })
              });
              
              if (promoteResponse.ok) {
                userData.role = 'MASTER_ADMIN';
              }
            }
          }
        }
        
        return userData;
      } catch (error) {
        // Only log non-401 errors (401 is expected when not logged in)
        if (error instanceof Error && !error.message.includes('401')) {
          console.log('User fetch error:', error);
        }
        return null;
      }
    },
    enabled: !isMasterAdminPage, // Disable query on Master Admin pages
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Organização mockada já que os dados estão no banco
  const organization = user?.organizationId ? {
    id: user.organizationId,
    nome: 'Dias Consultor Imobiliário',
    tipo: 'IMOBILIARIA',
    ativo: true,
    settings: { theme: 'default', locale: 'pt-BR' }
  } : null;

  // Helper para criar organização padrão
  const createDefaultOrganization = async () => {
    try {
      const response = await fetch('/api/auth/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: 'Minha Imobiliária',
          tipo: 'IMOBILIARIA',
          settings: {
            theme: 'default',
            locale: 'pt-BR'
          }
        })
      });
      
      if (response.ok) {
        const org = await response.json();
        // Vincular usuário à organização
        await fetch('/api/auth/organizations/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organizationId: org.id,
            role: 'ADMIN'
          })
        });
        
        // Revalidar usuário
        queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
        return org;
      }
    } catch (error) {
      console.error('Error creating organization:', error);
    }
    
    return {
      id: 'default',
      nome: 'Minha Imobiliária',
      tipo: 'IMOBILIARIA',
      ativo: true
    };
  };

  // Helper para fazer primeiro usuário admin
  const makeFirstUserAdmin = async (userId: string) => {
    try {
      const response = await fetch('/api/auth/make-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      }
    } catch (error) {
      console.error('Error making user admin:', error);
    }
  };

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch('/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async ({ email, password, name }: { email: string; password: string; name: string }) => {
      // Primeiro, verificar se é o primeiro usuário
      const isFirstUserResponse = await fetch('/api/setup/is-first-user');
      const { isFirstUser } = await isFirstUserResponse.json();
      
      
      const response = await fetch('/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          name,
          callbackURL: '/'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }

      const result = await response.json();
      
      // Se foi o primeiro usuário e o registro foi bem sucedido, promover a MASTER_ADMIN
      if (isFirstUser && result.user?.id) {
        try {
          await fetch('/api/setup/promote-to-master-admin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: result.user.id })
          });
        } catch (promoteError) {
          // Silently handle promotion error - registration was successful
        }
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      
      // Verificar de onde veio o login para redirecionar corretamente
      const loginSource = localStorage.getItem('loginSource');
      
      // Limpar o localStorage
      localStorage.removeItem('loginSource');
      
      // Redirecionar para a página de login apropriada
      if (loginSource === 'b2b') {
        window.location.href = '/b2b';
      } else {
        window.location.href = '/login';
      }
    },
  });

  // Update loading state
  useEffect(() => {
    setIsLoading(userLoading);
  }, [userLoading]);

  // Helper functions
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.permissions?.includes(permission) || user.permissions?.includes('*') || false;
  };

  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER' || isAdmin;
  const isAuthenticated = !!user;
  
  // B2B helper functions
  const isB2BUser = !!user?.b2bProfile;
  const isCorretor = user?.b2bProfile?.userType === 'CORRETOR_AUTONOMO';
  const isImobiliaria = user?.b2bProfile?.userType === 'IMOBILIARIA';

  // B2B signIn method (returns success/error)
  const signIn = async (email: string, password: string) => {
    try {
      await loginMutation.mutateAsync({ email, password });
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro ao fazer login' 
      };
    }
  };

  const authContextValue = React.useMemo(() => ({
    user,
    organization,
    isLoading,
    isAuthenticated,
    isAdmin,
    isManager,
    isB2BUser,
    isCorretor,
    isImobiliaria,
    hasPermission,
    signIn,
    login: async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password });
    },
    register: async (email: string, password: string, name: string) => {
      await registerMutation.mutateAsync({ email, password, name });
    },
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
  }), [user, organization, isLoading, isAuthenticated, isAdmin, isManager, isB2BUser, isCorretor, isImobiliaria, hasPermission, loginMutation, registerMutation, logoutMutation]);

  return React.createElement(AuthContext.Provider, { value: authContextValue }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}