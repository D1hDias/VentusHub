import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Settings, 
  Filter, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  XCircle,
  Clock,
  Building2,
  FileText,
  Users,
  Monitor,
  Pin,
  Archive,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';

// Simple notification interfaces for the simplified system
interface Notification {
  id: number;
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'urgent';
  category: 'property' | 'client' | 'document' | 'system' | 'reminder' | 'pendency';
  subcategory?: string;
  title: string;
  message: string;
  isRead: boolean;
  priority: number;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  isPinned?: boolean;
  richContent?: {
    html?: string;
    links?: Array<{ text: string; url: string }>;
    attachments?: Array<{ name: string; url: string; type: string }>;
  };
  createdAt: string;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationFilters {
  category?: string;
  type?: string;
  isRead?: boolean;
  priority?: number;
}

// Notification type icons
const NotificationIcon = ({ type, severity }: { type: string; severity: string }) => {
  const getIconProps = () => {
    const baseProps = { className: "h-4 w-4" };
    
    switch (type) {
      case 'success':
        return { ...baseProps, className: "h-4 w-4 text-green-500" };
      case 'warning':
        return { ...baseProps, className: "h-4 w-4 text-yellow-500" };
      case 'error':
        return { ...baseProps, className: "h-4 w-4 text-red-500" };
      case 'reminder':
        return { ...baseProps, className: "h-4 w-4 text-blue-500" };
      default:
        return { ...baseProps, className: "h-4 w-4 text-blue-500" };
    }
  };

  const iconProps = getIconProps();

  switch (type) {
    case 'success':
      return <CheckCircle2 {...iconProps} />;
    case 'warning':
      return <AlertTriangle {...iconProps} />;
    case 'error':
      return <XCircle {...iconProps} />;
    case 'reminder':
      return <Clock {...iconProps} />;
    default:
      return <Info {...iconProps} />;
  }
};

// Category icons
const CategoryIcon = ({ category }: { category: string }) => {
  const iconProps = { className: "h-4 w-4 text-muted-foreground" };
  
  switch (category) {
    case 'property':
      return <Building2 {...iconProps} />;
    case 'contract':
      return <FileText {...iconProps} />;
    case 'client':
      return <Users {...iconProps} />;
    case 'system':
      return <Monitor {...iconProps} />;
    default:
      return <Bell {...iconProps} />;
  }
};

// Severity styling
const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case 'critical':
      return 'border-l-red-500 bg-red-50/50 dark:bg-red-950/20';
    case 'high':
      return 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20';
    case 'normal':
      return 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20';
    case 'low':
      return 'border-l-gray-500 bg-gray-50/50 dark:bg-gray-950/20';
    default:
      return 'border-l-gray-500';
  }
};

// Rich notification content renderer
const RichNotificationContent = ({ content }: { content: Record<string, any> }) => {
  if (!content) return null;

  return (
    <div className="mt-3 p-3 bg-muted/30 rounded-lg">
      {content.image && (
        <img 
          src={content.image} 
          alt="" 
          className="w-full h-32 object-cover rounded mb-2"
        />
      )}
      {content.html && (
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: content.html }}
        />
      )}
      {content.list && (
        <ul className="list-disc list-inside space-y-1">
          {content.list.map((item: string, index: number) => (
            <li key={index} className="text-sm text-muted-foreground">{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Individual notification item component
interface NotificationItemProps {
  notification: Notification;
  onRead: (id: number) => void;
  onArchive: (id: number) => void;
  onTogglePin: (id: number, pinned: boolean) => void;
  onAction?: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onRead,
  onArchive,
  onTogglePin,
  onAction
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleClick = useCallback(() => {
    if (!notification.isRead) {
      onRead(notification.id);
    }
    if (onAction) {
      onAction(notification);
    }
  }, [notification.id, notification.isRead, onRead, onAction]);

  const handleActionClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.actionUrl) {
      window.location.href = notification.actionUrl;
    }
  }, [notification.actionUrl]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "p-4 border-l-4 transition-all cursor-pointer hover:bg-muted/30",
        getSeverityStyles(notification.severity || 'medium'),
        !notification.isRead && "bg-muted/20"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <NotificationIcon type={notification.type} severity={notification.severity || 'medium'} />
            <CategoryIcon category={notification.category} />
            
            <Badge variant="outline" className="text-xs">
              {notification.category}
            </Badge>
            
            {notification.subcategory && (
              <Badge variant="secondary" className="text-xs">
                {notification.subcategory}
              </Badge>
            )}
            
            {notification.isPinned && (
              <Pin className="h-3 w-3 text-primary" />
            )}
            
            <Badge 
              variant={notification.severity === 'critical' ? 'destructive' : 'outline'}
              className="text-xs ml-auto"
            >
              {notification.severity}
            </Badge>
          </div>
          
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className={cn(
                "font-medium mb-1 line-clamp-2",
                !notification.isRead ? "text-foreground" : "text-muted-foreground"
              )}>
                {notification.title}
              </h4>
              
              <p className={cn(
                "text-sm mb-2 line-clamp-3",
                !notification.isRead ? "text-foreground/80" : "text-muted-foreground"
              )}>
                {notification.message}
              </p>

              {notification.richContent && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
                >
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                  {isExpanded ? 'Mostrar menos' : 'Mostrar mais'}
                </button>
              )}
              
              <AnimatePresence>
                {isExpanded && notification.richContent && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <RichNotificationContent content={notification.richContent} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
              <span>
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: ptBR
                })}
              </span>
              {!notification.isRead && (
                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-2" />
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              {notification.actionUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 text-xs"
                  onClick={handleActionClick}
                >
                  Ver detalhes
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(notification.id, !notification.isPinned);
                }}
              >
                <Pin className={cn(
                  "h-3 w-3",
                  notification.isPinned ? "text-primary" : "text-muted-foreground"
                )} />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(notification.id);
                }}
              >
                <Archive className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Main notification center component
interface EnhancedNotificationCenterProps {
  className?: string;
}

export const EnhancedNotificationCenter: React.FC<EnhancedNotificationCenterProps> = ({
  className
}) => {
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const {
    notifications,
    totalCount,
    unreadCount,
    hasNextPage,
    isLoading,
    isFetchingNextPage,
    isConnected,
    error,
    fetchNextPage,
    refetch,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    togglePin,
    isMarkingAllAsRead
  } = useNotifications();

  // Filter notifications based on search and active tab
  const filteredNotifications = notifications.filter((notification: any) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!notification.title.toLowerCase().includes(query) && 
          !notification.message.toLowerCase().includes(query)) {
        return false;
      }
    }

    switch (activeTab) {
      case 'unread':
        return !notification.isRead;
      case 'pinned':
        return notification.isPinned;
      case 'critical':
        return notification.severity === 'critical';
      default:
        return true;
    }
  });

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Auto-load more when scrolling near bottom
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      handleLoadMore();
    }
  }, [handleLoadMore]);

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-6 w-6 text-primary" />
            {!isConnected && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full animate-pulse" />
            )}
          </div>
          
          <div>
            <h1 className="text-2xl font-bold">Notificações</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {unreadCount} não lida{unreadCount !== 1 ? 's' : ''} de {totalCount} total
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isConnected ? "bg-green-500" : "bg-yellow-500"
            )} />
            {isConnected ? 'Conectado' : 'Reconectando...'}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Atualizar
          </Button>
          
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => markAllAsRead()}
              disabled={isMarkingAllAsRead}
            >
              {isMarkingAllAsRead ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Marcar todas como lidas
            </Button>
          )}
        </div>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar notificações..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex gap-2">
              <Select
                value={filters.category || ''}
                onValueChange={(value: any) => setFilters(prev => ({ ...prev, category: value || undefined }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="property">Imóveis</SelectItem>
                  <SelectItem value="client">Clientes</SelectItem>
                  <SelectItem value="contract">Contratos</SelectItem>
                  <SelectItem value="system">Sistema</SelectItem>
                </SelectContent>
              </Select>
              
              <Select
                value={filters.type || ''}
                onValueChange={(value: any) => setFilters(prev => ({ ...prev, type: value || undefined }))}
              >
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Sucesso</SelectItem>
                  <SelectItem value="warning">Aviso</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                  <SelectItem value="reminder">Lembrete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">
            Todas ({totalCount})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Não lidas ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="pinned">
            Fixadas
          </TabsTrigger>
          <TabsTrigger value="critical">
            Críticas
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Notification List */}
      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6 text-center">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-destructive">Erro ao carregar notificações</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">
                Tentar novamente
              </Button>
            </div>
          ) : isLoading ? (
            <div className="p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Carregando notificações...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || activeTab !== 'all' 
                  ? 'Nenhuma notificação encontrada com os filtros aplicados' 
                  : 'Nenhuma notificação encontrada'
                }
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]" onScrollCapture={handleScroll}>
              <div className="divide-y">
                <AnimatePresence>
                  {filteredNotifications.map((notification: any) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={markAsRead}
                      onArchive={archiveNotification}
                      onTogglePin={togglePin}
                    />
                  ))}
                </AnimatePresence>
                
                {isFetchingNextPage && (
                  <div className="p-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </div>
                )}
                
                {hasNextPage && !isFetchingNextPage && (
                  <div className="p-4 text-center">
                    <Button variant="outline" onClick={handleLoadMore}>
                      Carregar mais notificações
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedNotificationCenter;