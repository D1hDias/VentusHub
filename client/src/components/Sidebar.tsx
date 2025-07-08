import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Home, 
  Search, 
  Store, 
  Handshake, 
  File, 
  Stamp, 
  Clock, 
  Settings, 
  LogOut,
  Menu,
  X,
  Banknote,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Shield,
  Calculator
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigationItems = [
  { path: "/", label: "Dashboard", icon: BarChart3 },
  { path: "/captacao", label: "Captação de Imóveis", icon: Home },
  { path: "/diligence", label: "Due Diligence", icon: Search },
  { path: "/mercado", label: "Imóveis no Mercado", icon: Store },
  { path: "/propostas", label: "Propostas", icon: Handshake },
  { path: "/contratos", label: "Contratos", icon: File },
  { 
    path: "/credito", 
    label: "Crédito", 
    icon: Banknote,
    hasSubmenu: true,
    submenu: [
      { path: "/credito/financiamento", label: "Financiamento", icon: Calculator, color: "text-purple-700" },
      { path: "/credito/consorcio", label: "Consórcio", icon: CreditCard, color: "text-blue-700" },
      { path: "/credito/cgi", label: "CGI", icon: Shield, tooltip: "Crédito com Garantia de Imóvel", color: "text-indigo-700" }
    ]
  },
  { path: "/instrumento", label: "Instrumento Definitivo", icon: Stamp },
  { path: "/timeline", label: "Acompanhamento", icon: Clock },
];

const bottomItems = [
  { path: "/configuracoes", label: "Configurações", icon: Settings },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFinanciamentoSubmenu, setShowFinanciamentoSubmenu] = useState(false);
  const [location] = useLocation();

  return (
    <>
      {/* Mobile backdrop */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}
      
      <nav className={cn(
        "fixed top-0 left-0 h-screen bg-gradient-to-b from-[#001f3f] to-[#05498f] transition-all duration-300 z-50",
        isExpanded ? "w-60" : "w-16",
        "lg:translate-x-0",
        !isExpanded && "-translate-x-full lg:translate-x-0",
        className
      )}>
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10 min-h-[70px]">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10 shrink-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          
          <div className={cn(
            "flex items-center gap-2 transition-opacity",
            isExpanded ? "opacity-100" : "opacity-0 lg:opacity-0"
          )}>
            <img 
              src="https://i.ibb.co/jPmggGSj/4-1.png" 
              alt="Ventus Hub" 
              className="w-[120px] h-auto"
            />
            <span className="text-white font-semibold text-lg">
            </span>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;

            if (item.hasSubmenu && item.submenu) {
              return (
                <div key={item.path}>
                  <button
                    className={cn(
                      "w-full flex items-center justify-start text-white/80 hover:text-white hover:bg-white/10 h-12 px-3 rounded-md transition-colors",
                      (isActive || location.startsWith(item.path)) && "bg-white/15 text-white",
                      !isExpanded && "px-3"
                    )}
                    onClick={() => setShowFinanciamentoSubmenu(!showFinanciamentoSubmenu)}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className={cn(
                      "ml-3 whitespace-nowrap transition-opacity flex-1 text-left",
                      isExpanded ? "opacity-100" : "opacity-0 lg:opacity-0"
                    )}>
                      {item.label}
                    </span>
                    {isExpanded && (
                      <div className="ml-auto">
                        {showFinanciamentoSubmenu ? (
                          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                        ) : (
                          <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                        )}
                      </div>
                    )}
                  </button>

                  <div
                    style={{
                      maxHeight: showFinanciamentoSubmenu ? `${item.submenu.length * 44}px` : '0px',
                      overflow: 'hidden',
                      transition: 'max-height 0.3s ease-in-out',
                      backgroundColor: showFinanciamentoSubmenu ? '#f3f4f6' : 'transparent'
                    }}
                  >
                    <div className="ml-4 mr-2 mt-1 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-inner border border-gray-200 dark:border-gray-700 p-1">
                      {item.submenu.map(subItem => {
                        const SubIcon = subItem.icon;
                        return (
                          <Link key={subItem.path} href={subItem.path}>
                            <button 
                              className={cn(
                                "w-full flex items-center justify-start h-10 text-sm px-3 rounded",
                                subItem.color,
                                `hover:bg-${subItem.color.split('-')[1]}-50`
                              )}
                              title={subItem.tooltip}
                            >
                              <SubIcon className="h-4 w-4 shrink-0" />
                              <span className="ml-3">{subItem.label}</span>
                            </button>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-white/80 hover:text-white hover:bg-white/10 h-12",
                    isActive && "bg-white/15 text-white",
                    !isExpanded && "px-3"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className={cn(
                    "ml-3 whitespace-nowrap transition-opacity",
                    isExpanded ? "opacity-100" : "opacity-0 lg:opacity-0"
                  )}>
                    {item.label}
                  </span>
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-1 border-t border-white/10">
          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;

            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-white/80 hover:text-white hover:bg-white/10 h-12",
                    isActive && "bg-white/15 text-white",
                    !isExpanded && "px-3"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className={cn(
                    "ml-3 whitespace-nowrap transition-opacity",
                    isExpanded ? "opacity-100" : "opacity-0 lg:opacity-0"
                  )}>
                    {item.label}
                  </span>
                </Button>
              </Link>
            );
          })}

          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-white/80 hover:text-white hover:bg-white/10 h-12",
              !isExpanded && "px-3"
            )}
            onClick={() => window.location.href = "/api/logout"}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={cn(
              "ml-3 whitespace-nowrap transition-opacity",
              isExpanded ? "opacity-100" : "opacity-0 lg:opacity-0"
            )}>
              Sair
            </span>
          </Button>
        </div>
      </nav>
    </>
  );
}
