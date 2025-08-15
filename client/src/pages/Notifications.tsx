import React from 'react';
import { motion } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  XCircle,
  Building2,
  FileText,
  Settings,
  Monitor
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NotificationIcon = ({ type }: { type: string }) => {
  const iconProps = { className: "h-4 w-4" };
  
  switch (type) {
    case 'success': return <CheckCircle2 {...iconProps} className="h-4 w-4 text-green-500" />;
    case 'warning': return <AlertTriangle {...iconProps} className="h-4 w-4 text-yellow-500" />;
    case 'error': return <XCircle {...iconProps} className="h-4 w-4 text-red-500" />;
    default: return <Info {...iconProps} className="h-4 w-4 text-blue-500" />;
  }
};

const CategoryIcon = ({ category }: { category: string }) => {
  const iconProps = { className: "h-4 w-4 text-muted-foreground" };
  
  switch (category) {
    case 'property': return <Building2 {...iconProps} />;
    case 'contract': return <FileText {...iconProps} />;
    case 'system': return <Monitor {...iconProps} />;
    default: return <Settings {...iconProps} />;
  }
};

export default function Notifications() {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead,
    isMarkingAsRead,
    isMarkingAllAsRead
  } = useNotifications();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Notificações</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive">
              {unreadCount} não lida{unreadCount !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => markAllAsRead()}
            disabled={isMarkingAllAsRead}
          >
            {isMarkingAllAsRead ? 'Marcando...' : 'Marcar todas como lidas'}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Todas as Notificações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center text-muted-foreground">
              Carregando notificações...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma notificação encontrada</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="divide-y">
                {notifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                      !notification.isRead ? 'bg-muted/20 border-l-4 border-primary' : ''
                    }`}
                    onClick={() => {
                      if (!notification.isRead) {
                        markAsRead(notification.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 flex items-center gap-2">
                        <NotificationIcon type={notification.type} />
                        <CategoryIcon category={notification.category} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className={`font-medium ${
                            !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {notification.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </span>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                            )}
                          </div>
                        </div>
                        
                        <p className={`text-sm mt-1 ${
                          !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {notification.category === 'property' && 'Imóvel'}
                            {notification.category === 'contract' && 'Contrato'}
                            {notification.category === 'document' && 'Documento'}
                            {notification.category === 'system' && 'Sistema'}
                          </Badge>
                          
                          {notification.actionUrl && (
                            <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                              Ver detalhes
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}