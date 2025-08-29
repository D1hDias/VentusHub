/**
 * NOTIFICATION CENTER COMPONENT
 * 
 * Main notification dropdown that shows in the header
 * Integrates with the existing notification icon in Layout.tsx
 */

import { useState, useRef, useEffect } from 'react';
import { Bell, Settings, MoreVertical, Archive, Pin, Trash2, Check, CheckCheck, X, Circle, AlertCircle, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotifications } from '@/hooks/useNotifications';

// Simplified Notification type for the simple hook
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
import { cn } from '@/lib/utils';

// ======================================
// NOTIFICATION ITEM COMPONENT
// ======================================

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
}

const NotificationItem = ({ 
  notification, 
  onMarkAsRead
}: NotificationItemProps) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'urgent':
        return <AlertCircle className="h-4 w-4 text-red-600 animate-pulse" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = () => {
    switch (notification.priority) {
      case 1:
        return 'border-l-red-500 bg-red-50';
      case 2:
        return 'border-l-orange-500 bg-orange-50';
      case 3:
        return 'border-l-blue-500 bg-blue-50';
      case 4:
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-300 bg-gray-25';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const handleAction = (actionUrl?: string) => {
    if (actionUrl) {
      // Mark as read when user clicks action
      if (!notification.isRead) {
        onMarkAsRead(notification.id);
      }
      
      // Navigate to action URL
      if (actionUrl.startsWith('/')) {
        window.location.href = actionUrl;
      } else if (actionUrl.startsWith('http')) {
        window.open(actionUrl, '_blank');
      }
    }
  };

  return (
    <div 
      className={cn(
        "p-3 border-l-4 transition-all duration-200 hover:bg-gray-100",
        getPriorityColor(),
        !notification.isRead && "bg-opacity-100",
        notification.isRead && "bg-opacity-50"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={cn(
                  "text-sm font-medium truncate",
                  !notification.isRead && "font-semibold text-gray-900",
                  notification.isRead && "text-gray-700"
                )}>
                  {notification.title}
                </h4>
                
                
                {!notification.isRead && (
                  <Circle className="h-2 w-2 text-blue-500 fill-current flex-shrink-0" />
                )}
              </div>
              
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                {notification.message}
              </p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {formatDate(notification.createdAt)}
                </span>
                
                <div className="flex items-center gap-2">
                  {notification.actionUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handleAction(notification.actionUrl)}
                    >
                      {notification.actionLabel || 'Ver'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onMarkAsRead(notification.id)}>
                  <Check className="h-4 w-4 mr-2" />
                  {notification.isRead ? 'Marcar como não lida' : 'Marcar como lida'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
};

// ======================================
// MAIN NOTIFICATION CENTER COMPONENT
// ======================================

interface NotificationCenterProps {
  trigger?: React.ReactNode;
  className?: string;
}

export const NotificationCenter = ({ trigger, className }: NotificationCenterProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  const {
    notifications,
    unreadCount,
    urgentCount,
    hasUnread,
    hasUrgent,
    isLoadingNotifications,
    markAsRead,
    markAllAsRead,
    isConnected,
    openNotifications
  } = useNotifications();

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((notification: any) => {
    switch (activeTab) {
      case 'unread':
        return !notification.isRead;
      case 'urgent':
        return notification.priority <= 2;
      default:
        return true;
    }
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  // Default trigger if none provided
  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className={cn("relative p-2", className)}
    >
      <Bell className="h-5 w-5" />
      {hasUnread && (
        <Badge 
          variant={hasUrgent ? "destructive" : "default"}
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
      {!isConnected && (
        <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
      )}
    </Button>
  );

  // Load notifications when popover opens
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      openNotifications();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {trigger || defaultTrigger}
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-96 p-0 max-h-[600px] overflow-hidden" 
        align="end"
        sideOffset={5}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
                {hasUnread && (
                  <Badge variant="secondary" className="text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </CardTitle>
              
              <div className="flex items-center gap-2">
                {hasUnread && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs"
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Marcar todas como lidas
                  </Button>
                )}
                
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {!isConnected && (
              <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                <AlertTriangle className="h-3 w-3" />
                Reconectando...
              </div>
            )}
          </CardHeader>
          
          <Separator />
          
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="px-4 pt-3">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all" className="text-xs">
                    Todas
                  </TabsTrigger>
                  <TabsTrigger value="unread" className="text-xs">
                    Não lidas
                    {hasUnread && (
                      <Badge variant="secondary" className="ml-1 text-xs h-4 w-4 p-0">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="urgent" className="text-xs">
                    Urgentes
                    {hasUrgent && (
                      <Badge variant="destructive" className="ml-1 text-xs h-4 w-4 p-0">
                        {urgentCount > 9 ? '9+' : urgentCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value={activeTab} className="mt-0">
                <ScrollArea className="h-96">
                  {isLoadingNotifications ? (
                    <div className="p-8 text-center">
                      <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Carregando notificações...</p>
                    </div>
                  ) : filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-sm text-gray-500 mb-1">
                        {activeTab === 'unread' && 'Nenhuma notificação não lida'}
                        {activeTab === 'urgent' && 'Nenhuma notificação urgente'}
                        {activeTab === 'pinned' && 'Nenhuma notificação fixada'}
                        {activeTab === 'all' && 'Nenhuma notificação'}
                      </p>
                      <p className="text-xs text-gray-400">
                        Você está em dia! 🎉
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {filteredNotifications.map((notification: any) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={markAsRead}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;