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
  X
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
