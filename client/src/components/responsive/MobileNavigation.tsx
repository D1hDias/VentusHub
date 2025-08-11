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
  MoreHorizontal,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

// Itens principais para bottom nav
const bottomNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/captacao", label: "Captação", icon: Building2 },
  { href: "/simulador-financiamento", label: "Simulador", icon: Calculator },
  { href: "/contratos", label: "Contratos", icon: FileText },
];

// Itens completos da navegação para o sheet
const fullNavigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home, badge: null },
  { href: "/captacao", label: "Captação de Imóveis", icon: Building2, badge: null },
  { href: "/due-diligence", label: "Due Diligence", icon: Building2, badge: null },
  { href: "/mercado", label: "Imóveis no Mercado", icon: Building2, badge: null },
  { href: "/propostas", label: "Propostas", icon: FileText, badge: "3" },
  { href: "/contratos", label: "Contratos", icon: FileText, badge: null },
  { href: "/credito", label: "Crédito", icon: Calculator, badge: null },
  { href: "/instrumento", label: "Instrumento Definitivo", icon: FileText, badge: null },
  { href: "/timeline", label: "Acompanhamento", icon: Building2, badge: null },
  { href: "/settings", label: "Configurações", icon: Settings, badge: null },
];

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
        
        {/* Menu hamburger para mais opções */}
        <MobileMenuSheet />
      </nav>
    </div>
  );
};

// Sheet com menu completo
const MobileMenuSheet: React.FC = () => {
  const [location] = useLocation();
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <motion.div
          className="flex flex-col items-center justify-center p-2 rounded-lg touch-target min-w-[60px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-xs mt-1 font-medium">Menu</span>
        </motion.div>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">VentusHub</h2>
                <p className="text-sm text-muted-foreground">Plataforma Imobiliária</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {fullNavigationItems.map((item) => {
                const isActive = location === item.href;
                const Icon = item.icon;

                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg touch-target transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : ''}`} />
                      <span className={`flex-1 font-medium ${isActive ? 'text-primary' : ''}`}>
                        {item.label}
                      </span>
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="p-4 border-t border-border">
            <div className="text-xs text-muted-foreground text-center">
              VentusHub v1.0 • Navegação Mobile
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
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