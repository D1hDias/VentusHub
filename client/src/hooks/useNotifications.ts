import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequestLegacy as apiRequest } from '@/lib/queryClient';

interface Notification {
  id: number;
  userId: number;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  category: 'property' | 'contract' | 'document' | 'system';
  relatedId?: number;
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export function useNotifications(page = 1, limit = 10) {
  const queryClient = useQueryClient();

  // Query para buscar notificações
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications', page, limit],
    queryFn: async (): Promise<NotificationsResponse> => {
      const response = await apiRequest('GET', `/api/notifications?page=${page}&limit=${limit}`);
      return await response.json();
    },
    staleTime: 30 * 1000, // 30 segundos
  });

  // Mutation para marcar como lida
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await apiRequest('PATCH', `/api/notifications/${notificationId}/read`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mutation para marcar todas como lidas
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('PATCH', '/api/notifications/read-all');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    pagination: data?.pagination,
    isLoading,
    error,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
}

// Hook para buscar apenas o contador de não lidas
export function useUnreadCount() {
  const { data } = useQuery({
    queryKey: ['notifications', 1, 1],
    queryFn: async (): Promise<NotificationsResponse> => {
      const response = await apiRequest('GET', '/api/notifications?page=1&limit=1');
      return await response.json();
    },
    staleTime: 10 * 1000, // 10 segundos
    refetchInterval: 30 * 1000, // Atualizar a cada 30 segundos
  });

  return data?.unreadCount || 0;
}