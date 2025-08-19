/**
 * NOTIFICATION HOOK
 * 
 * Simple and reliable notification system using polling
 * Optimized for VentusHub's alerting and pendency management needs
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from './use-toast';

interface Notification {
  id: number;
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'urgent';
  category: 'property' | 'client' | 'document' | 'system' | 'reminder' | 'pendency';
  title: string;
  message: string;
  isRead: boolean;
  priority: number;
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationSummary {
  summary: Array<{
    status: string;
    priority: number;
    category: string;
    count: number;
  }>;
  totals: {
    unread: number;
    urgent: number;
  };
}

export const useNotifications = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notification summary for header badge (with polling)
  const {
    data: summaryData,
    isLoading: isLoadingSummary,
    error: summaryError
  } = useQuery({
    queryKey: ['notifications', 'summary'],
    queryFn: async (): Promise<NotificationSummary> => {
      const response = await fetch('/api/notifications/summary', {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          // User not authenticated, return empty summary
          return {
            summary: [],
            totals: { unread: 0, urgent: 0 }
          };
        }
        throw new Error(`Failed to fetch notification summary: ${response.status}`);
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
    cacheTime: 60000, // 1 minute
    refetchOnWindowFocus: true,
    refetchInterval: 90000, // Poll every 90 seconds (otimizado)
    retry: (failureCount, error: any) => {
      // Don't retry on 401 errors
      if (error?.message?.includes('401')) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // Fetch notifications list
  const {
    data: notificationsData,
    isLoading: isLoadingNotifications,
    error: notificationsError,
    refetch: refetchNotifications
  } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: async () => {
      const response = await fetch('/api/notifications?limit=20&sortBy=createdAt&sortOrder=desc', {
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          return { notifications: [], pagination: null };
        }
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      return response.json();
    },
    staleTime: 30000,
    cacheTime: 60000,
    refetchOnWindowFocus: true,
    enabled: false, // Only fetch when needed (when dropdown is opened)
    refetchInterval: false // Disable auto-polling for list, only on-demand
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async ({ id, isRead }: { id: number; isRead: boolean }) => {
      const response = await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isRead })
      });

      if (!response.ok) {
        throw new Error('Failed to update notification');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Mark all notifications as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "Sucesso",
        description: "Todas as notificações foram marcadas como lidas"
      });
    }
  });

  // Helper functions
  const markAsRead = (id: number) => {
    markAsReadMutation.mutate({ id, isRead: true });
  };

  const markAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const openNotifications = () => {
    refetchNotifications();
  };

  // Stub implementations for enhanced features (for compatibility)
  const archiveNotification = (id: number) => {
    console.log(`Archive notification ${id} - feature not implemented in simplified version`);
  };

  const togglePin = (id: number) => {
    console.log(`Toggle pin notification ${id} - feature not implemented in simplified version`);
  };

  // Computed values
  const notifications = notificationsData?.notifications || [];
  const unreadCount = summaryData?.totals?.unread || 0;
  const urgentCount = summaryData?.totals?.urgent || 0;
  const hasUnread = unreadCount > 0;
  const hasUrgent = urgentCount > 0;

  return {
    // Data
    notifications,
    summaryData,
    unreadCount,
    urgentCount,
    hasUnread,
    hasUrgent,
    
    // Loading states
    isLoadingNotifications,
    isLoadingSummary,
    
    // Error states  
    notificationsError,
    summaryError,
    
    // Connection state (always true for simplified version)
    isConnected: true,
    
    // Actions
    markAsRead,
    markAllAsRead,
    refetchNotifications,
    openNotifications,
    archiveNotification,
    togglePin,
    
    // Mutation states
    isMarkingAsRead: markAsReadMutation.isPending,
    isMarkingAllAsRead: markAllAsReadMutation.isPending,
  };
};