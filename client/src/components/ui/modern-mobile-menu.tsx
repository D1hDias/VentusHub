import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Home, Plus, Calculator, User, Settings, FileText, Building, CreditCard, Banknote, Shield, TrendingUp,
  Search, DollarSign, ArrowRightLeft, Scale, Repeat, BarChart2, Target, PiggyBank, BarChart3, Circle, Building2, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetPortal, SheetOverlay } from '@/components/ui/sheet';
import { cn } from "@/lib/utils";

type IconComponentType = React.ElementType<{ className?: string }>;

interface ButtonPosition {
  x: number;
  width: number;
}

export interface SubmenuItem {
  label: string;
  icon: IconComponentType;
  href: string;
  description?: string;
}

export interface InteractiveMenuItem {
  label: string;
  icon: IconComponentType;
  href?: string;
  submenu?: SubmenuItem[];
  hasSubmenu?: boolean;
}

export interface InteractiveMenuProps {
  items?: InteractiveMenuItem[];
  accentColor?: string;
  onItemClick?: (item: InteractiveMenuItem, index: number) => void;
}

// Submenu items for "Novo"
const novoSubmenuItems: SubmenuItem[] = [
  {
    label: 'Captação',
    icon: FileText,
    href: '/captacao',
    description: 'Capturar novo imóvel'
  },
  {
    label: 'Proprietário',
    icon: Building,
    href: '/proprietario',
    description: 'Cadastrar proprietário'
  },
  {
    label: 'Financiamento',
    icon: CreditCard,
    href: '/credito/financiamento',
    description: 'Crédito habitacional'
  },
  {
    label: 'Crédito PJ',
    icon: Banknote,
    href: '/credito/pj',
    description: 'Crédito pessoa jurídica'
  },
  {
    label: 'Consórcio',
    icon: Shield,
    href: '/credito/consorcio',
    description: 'Consórcio imobiliário'
  },
  {
    label: 'CGI',
    icon: TrendingUp,
    href: '/credito/cgi',
    description: 'Certificado de garantia'
  }
];

// Submenu items for "Simuladores"
const simuladoresSubmenuItems: SubmenuItem[] = [
  {
    label: 'Valor de Registro',
    icon: FileText,
    href: '/simulador-valor-registro',
    description: 'Calcular custos de registro'
  },
  {
    label: 'Financiamento Imobiliário',
    icon: Home,
    href: '/simulador-financiamento',
    description: 'Simular financiamento'
  },
  {
    label: 'Avaliação Imobiliária',
    icon: Search,
    href: '/simulador-valor-imovel',
    description: 'Avaliar valor do imóvel'
  },
  {
    label: 'Poder de Compra',
    icon: DollarSign,
    href: '/simulador-poder-de-compra',
    description: 'Calcular poder de compra'
  },
  {
    label: 'Aluguel x Compra',
    icon: ArrowRightLeft,
    href: '/simulador-aluguel-x-compra',
    description: 'Comparar aluguel vs compra'
  },
  {
    label: 'Consórcio x Financiamento',
    icon: Scale,
    href: '/simulador-consorcio-x-financiamento',
    description: 'Comparar modalidades'
  },
  {
    label: 'SAC x PRICE',
    icon: Repeat,
    href: '/simulador-sac-x-price',
    description: 'Comparar sistemas de amortização'
  },
  {
    label: 'ROI Flipping',
    icon: BarChart2,
    href: '/simulador-roi-flipping',
    description: 'Calcular retorno sobre investimento'
  },
  {
    label: 'Potencial de Valorização',
    icon: TrendingUp,
    href: '/simulador-potencial-de-valorizacao',
    description: 'Analisar potencial de valorização'
  },
  {
    label: 'Comissão e Metas',
    icon: Target,
    href: '/simulador-comissao-e-metas',
    description: 'Calcular comissões e metas'
  },
  {
    label: 'Renda Passiva',
    icon: PiggyBank,
    href: '/simulador-renda-passiva',
    description: 'Simular renda com aluguéis'
  },
  {
    label: 'Crédito com Garantia',
    icon: Shield,
    href: '/simulador-cgi',
    description: 'Crédito garantido por imóvel'
  },
  {
    label: 'Preço por m²',
    icon: BarChart3,
    href: '/simulador-metro-quadrado',
    description: 'Calcular preço por metro quadrado'
  },
  {
    label: 'Liquidez do Imóvel',
    icon: Circle,
    href: '/simulador-liquidez-imovel',
    description: 'Analisar liquidez do imóvel'
  },
  {
    label: 'Crédito Empresarial',
    icon: Building2,
    href: '/simulador-credito-pj',
    description: 'Crédito para pessoa jurídica'
  }
];

const defaultItems: InteractiveMenuItem[] = [
  { label: 'Dashboard', icon: Home, href: '/dashboard' },
  {
    label: 'Novo',
    icon: Plus,
    hasSubmenu: true,
    submenu: novoSubmenuItems
  },
  {
    label: 'Simuladores',
    icon: Calculator,
    hasSubmenu: true,
    submenu: simuladoresSubmenuItems
  },
  { label: 'Perfil', icon: User, href: '/configuracoes' },
];

const defaultAccentColor = 'var(--component-active-color-default)';

const InteractiveMenu: React.FC<InteractiveMenuProps> = ({ items, accentColor, onItemClick }) => {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [isSubmenuOpen, setIsSubmenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<SubmenuItem[] | null>(null);
  const [submenuTitle, setSubmenuTitle] = useState('');
  const [buttonPosition, setButtonPosition] = useState<ButtonPosition | null>(null);

  const finalItems = useMemo(() => {
    const isValid = items && Array.isArray(items) && items.length >= 2 && items.length <= 5;
    if (!isValid) {
      console.warn("InteractiveMenu: 'items' prop is invalid or missing. Using default items.", items);
      return defaultItems;
    }
    return items;
  }, [items]);

  // Calculate active index based on current route
  const activeIndex = useMemo(() => {
    // Check if current route matches any main item
    let index = finalItems.findIndex(item => item.href && location === item.href);

    // If not found, check submenu items
    if (index < 0) {
      for (let i = 0; i < finalItems.length; i++) {
        const item = finalItems[i];
        if (item.submenu) {
          const submenuIndex = item.submenu.findIndex(subItem => location === subItem.href);
          if (submenuIndex >= 0) {
            index = i;
            break;
          }
        }
      }
    }

    return index >= 0 ? index : 0;
  }, [location, finalItems]);

  const textRefs = useRef<(HTMLElement | null)[]>([]);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const setLineWidth = () => {
      const activeItemElement = itemRefs.current[activeIndex];
      const activeTextElement = textRefs.current[activeIndex];

      if (activeItemElement && activeTextElement) {
        const textWidth = activeTextElement.offsetWidth;
        activeItemElement.style.setProperty('--lineWidth', `${textWidth}px`);
      }
    };

    setLineWidth();

    window.addEventListener('resize', setLineWidth);
    return () => {
      window.removeEventListener('resize', setLineWidth);
    };
  }, [activeIndex, finalItems]);

  const handleItemClick = (index: number, event?: React.MouseEvent<HTMLButtonElement>) => {
    const item = finalItems[index];

    if (item.hasSubmenu && item.submenu) {
      // Get button position for horizontal alignment
      if (event && event.currentTarget) {
        const rect = event.currentTarget.getBoundingClientRect();
        setButtonPosition({
          x: rect.left,
          width: rect.width
        });
      }

      // Open submenu
      setActiveSubmenu(item.submenu);
      setSubmenuTitle(item.label);
      setIsSubmenuOpen(true);
    } else if (item.href) {
      // Direct navigation
      setLocation(item.href);
    }

    if (onItemClick) {
      onItemClick(item, index);
    }
  };

  const handleSubmenuItemClick = (submenuItem: SubmenuItem) => {
    setLocation(submenuItem.href);
    setIsSubmenuOpen(false);
  };

  const closeSubmenu = () => {
    setIsSubmenuOpen(false);
    setButtonPosition(null);
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    return 'U';
  };

  const navStyle = useMemo(() => {
    const activeColor = accentColor || defaultAccentColor;
    return { '--component-active-color': activeColor } as React.CSSProperties;
  }, [accentColor]);


  return (
    <nav
      className="menu"
      role="navigation"
      style={navStyle}
    >
      {finalItems.map((item, index) => {
        const isActive = index === activeIndex;
        const isTextActive = isActive;
        const IconComponent = item.icon;

        const buttonContent = (
          <button
            className={`menu__item ${isActive ? 'active' : ''}`}
            onClick={(event) => handleItemClick(index, event)}
            ref={(el) => (itemRefs.current[index] = el)}
            style={{ '--lineWidth': '0px' } as React.CSSProperties}
          >
            <div className="menu__icon">
              {item.label === 'Perfil' ? (
                <Avatar className="h-6 w-6">
                  {user?.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={`${user?.firstName} ${user?.lastName}`} />
                  ) : null}
                  <AvatarFallback className={`text-[10px] font-bold ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <IconComponent className="icon" />
              )}
            </div>
            <strong
              className={`menu__text ${isTextActive ? 'active' : ''}`}
              ref={(el) => (textRefs.current[index] = el)}
            >
              {item.label}
            </strong>
          </button>
        );

        // If item has submenu, don't wrap with Link
        if (item.hasSubmenu) {
          return <div key={`submenu-${index}`}>{buttonContent}</div>;
        }

        // Regular navigation item with Link
        return (
          <Link key={item.href} href={item.href || '#'}>
            {buttonContent}
          </Link>
        );
      })}

      {/* Compact submenu that emerges from behind navigation */}
      <Sheet open={isSubmenuOpen} onOpenChange={setIsSubmenuOpen}>
        {/* Custom portal to control z-index ordering */}
        <SheetPortal>
          {/* Custom overlay with lower z-index */}
          <SheetOverlay
            className="fixed inset-0 z-[45] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
            onClick={closeSubmenu}
          />
          <div
            className="fixed z-[60] max-h-[50vh] p-0 border-t-0 bg-background shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom"
            style={{
              position: 'fixed',
              bottom: `calc(80px + env(safe-area-inset-bottom))`,
              left: buttonPosition ? `${Math.max(8, Math.min(buttonPosition.x + buttonPosition.width / 2 - 100, window.innerWidth - 208))}px` : '8px',
              width: '210px',
              transform: isSubmenuOpen
                ? 'translateY(0)'
                : `translateY(calc(50vh + 20px))`,
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px'
            }}
          >
            {/* Content container */}
            <div className="w-full h-full">
              {/* Ultra-Minimal Header */}
              <SheetHeader className="px-2 py-1 border-b bg-background/95 backdrop-blur-sm relative min-h-[28px] shrink-0">
                <SheetTitle className="text-sm font-medium text-center leading-none">
                  {submenuTitle}
                </SheetTitle>
                <button
                  onClick={closeSubmenu}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none p-0.5"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Close</span>
                </button>
              </SheetHeader>

              {/* Scrollable Content Area */}
              <div
                className="mobile-submenu-scroll flex-1 pl-1 pr-2 py-1 overscroll-contain"
                style={{
                  height: 'calc(50vh - 40px)',
                  maxHeight: '400px',
                  minHeight: '250px',
                  overflowY: 'scroll' as const,
                  overflowX: 'hidden' as const,
                  touchAction: 'auto' as const,
                  WebkitOverflowScrolling: 'touch' as const,
                  msOverflowStyle: 'auto' as const,
                  scrollbarWidth: 'thin' as const,
                  transform: 'translateZ(0)',
                  willChange: 'scroll-position' as const
                }}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <div className="grid gap-1 pb-4" style={{ minHeight: '320px' }}>
                  <AnimatePresence>
                    {activeSubmenu?.map((submenuItem, index) => {
                      const SubmenuIcon = submenuItem.icon;
                      return (
                        <motion.button
                          key={submenuItem.href}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.03 }}
                          onClick={() => handleSubmenuItemClick(submenuItem)}
                          className="mobile-submenu-item flex items-center gap-1 px-1 py-2 rounded-lg bg-card hover:bg-accent hover:text-accent-foreground transition-colors w-full text-left min-h-[40px]"
                        >
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <SubmenuIcon className="w-3 h-3 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="font-medium text-xs leading-tight text-ellipsis overflow-hidden whitespace-nowrap">
                              {submenuItem.label}
                            </div>
                            {submenuItem.description && (
                              <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight text-ellipsis overflow-hidden whitespace-nowrap">
                                {submenuItem.description}
                              </div>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </SheetPortal>
      </Sheet>
    </nav>
  );
};

export { InteractiveMenu }