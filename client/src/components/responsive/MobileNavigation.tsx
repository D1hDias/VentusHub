import React from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useResponsive } from '@/hooks/useMediaQuery';
import { 
  Home, 
  Building2, 
  Calculator, 
  FileText, 
  Settings,
  Bell,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUnreadCount } from '@/hooks/useNotifications';

// Itens principais para bottom nav
const bottomNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/captacao", label: "Captação", icon: Building2 },
  { href: "/simulador-financiamento", label: "Simulador", icon: Calculator },
  { href: "/contratos", label: "Contratos", icon: FileText },
];

// Componente de botão de notificações
const NotificationButton: React.FC = () => {
  const [location, setLocation] = useLocation();
  const unreadCount = useUnreadCount();
  const { prefersReducedMotion } = useResponsive();

  const handleNotificationClick = () => {
    setLocation('/notifications');
  };

  const isActive = location === '/notifications';

  return (
    <motion.div
      className={`flex flex-col items-center justify-center p-2 rounded-lg touch-target min-w-[60px] transition-colors cursor-pointer ${
        isActive 
          ? 'text-primary bg-primary/10' 
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      }`}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
      onClick={handleNotificationClick}
    >
      <div className="relative">
        <Bell className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] font-bold"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </div>
      <span className={`text-xs mt-1 font-medium ${isActive ? 'text-primary' : ''}`}>
        Avisos
      </span>
    </motion.div>
  );
};

// Bottom Navigation Bar
export const BottomNavigation: React.FC = () => {
  const [location] = useLocation();
  const { prefersReducedMotion } = useResponsive();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-inset-bottom">
      <nav className="flex items-center justify-around px-2 py-1 max-w-md mx-auto">
        {bottomNavItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                className={`flex flex-col items-center justify-center p-2 rounded-lg touch-target min-w-[60px] transition-colors ${
                  isActive 
                    ? 'text-primary bg-primary/10' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                <span className={`text-xs mt-1 font-medium ${isActive ? 'text-primary' : ''}`}>
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
        
        {/* Botão de notificações */}
        <NotificationButton />
      </nav>
    </div>
  );
};


// Header Mobile simplificado
export const MobileHeader: React.FC<{ 
  title?: string; 
  showBack?: boolean;
  onBackClick?: () => void;
  actions?: React.ReactNode;
}> = ({ 
  title, 
  showBack = false, 
  onBackClick,
  actions 
}) => {
  const { prefersReducedMotion } = useResponsive();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button
              variant="ghost"
              size="sm"
              className="touch-target"
              onClick={onBackClick}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
          {title && (
            <h1 className="text-lg font-semibold truncate">{title}</h1>
          )}
        </div>
        
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
};

// Hook para detectar se deve mostrar navegação mobile
export const useMobileNavigation = () => {
  const { isMobile } = useResponsive();
  
  return {
    showBottomNav: isMobile,
    showMobileHeader: isMobile,
    shouldHideSidebar: isMobile
  };
};

export default BottomNavigation;