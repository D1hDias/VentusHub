import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  cpf?: string;
  creci?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  isActive?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UserSettings {
  id: number;
  userId: number;
  theme: string;
  language: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  weeklyReports: boolean;
  reminderDeadlines: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  settings: UserSettings | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  updateSettings: (data: Partial<UserSettings>) => Promise<void>;
  refetchUser: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const queryClient = useQueryClient();

  // Query para buscar o usuário atual
  const { data: userData, isLoading, refetch } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/user');
        return await response.json();
      } catch (error) {
        // Se der erro 401 (não autorizado), retorna null
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Atualizar o estado do usuário quando os dados mudarem
  useEffect(() => {
    setUser(userData || null);
  }, [userData]);

  // Mutation para login
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      return await response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(['auth', 'user'], data.user);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      // Forçar reload para evitar loop
      window.location.href = "/dashboard";
    },
  });

  // Mutation para logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/logout');
    },
    onSuccess: () => {
      setUser(null);
      setSettings(null);
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.clear();
      window.location.href = '/login';
    },
  });

  // Mutation para atualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const response = await apiRequest('PATCH', '/api/profile', data);
      return await response.json();
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.setQueryData(['auth', 'user'], updatedUser);
    },
  });

  // Mutation para upload de avatar
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Erro ao fazer upload do avatar');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      if (user) {
        const updatedUser = { ...user, avatarUrl: data.avatarUrl };
        setUser(updatedUser);
        queryClient.setQueryData(['auth', 'user'], updatedUser);
      }
    },
  });

  // Mutation para atualizar configurações
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: Partial<UserSettings>) => {
      const response = await apiRequest('PATCH', '/api/profile/settings', data);
      return await response.json();
    },
    onSuccess: (updatedSettings) => {
      setSettings(updatedSettings);
      queryClient.setQueryData(['profile', 'settings'], updatedSettings);
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const updateProfile = async (data: Partial<User>) => {
    await updateProfileMutation.mutateAsync(data);
  };

  const uploadAvatar = async (file: File) => {
    await uploadAvatarMutation.mutateAsync(file);
  };

  const updateSettings = async (data: Partial<UserSettings>) => {
    await updateSettingsMutation.mutateAsync(data);
  };

  const refetchUser = () => {
    refetch();
  };

  const value: AuthContextType = {
    user,
    settings,
    isLoading,
    login,
    logout,
    updateProfile,
    uploadAvatar,
    updateSettings,
    refetchUser,
  };

  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}