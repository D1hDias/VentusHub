import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import logoImage from "@/assets/logo.png";
import {
  Home,
  Building2,
  Search,
  Store,
  HandHeart,
  FileText,
  FileCheck,
  Clock,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  Moon,
  Sun,
  Calculator,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Shield,
  BarChart3,
  Circle,
  DollarSign,
  ArrowRightLeft,
  Scale,
  BarChart2,
  TrendingUp,
  Target,
  PiggyBank,
  Repeat,
  BadgeCent
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback, AvatarImage  } from "@/components/ui/avatar";
import { useNotifications } from "@/hooks/useNotifications";
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/captacao", label: "Captação de Imóveis", icon: Building2 },
  { href: "/due-diligence", label: "Due Diligence", icon: Search },
  { href: "/mercado", label: "Imóveis no Mercado", icon: Store },
  { href: "/propostas", label: "Propostas", icon: HandHeart },
  { href: "/contratos", label: "Contratos", icon: FileText },
  { href: "/credito", label: "Crédito", icon: Calculator },
  { href: "/instrumento", label: "Instrumento Definitivo", icon: FileCheck },
  { href: "/timeline", label: "Acompanhamento", icon: Clock },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showFinanciamentoSubmenu, setShowFinanciamentoSubmenu] = useState(false);
  const [showCreditoSidebar, setShowCreditoSidebar] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(1, 5);
  const [isSimulatorsOpen, setIsSimulatorsOpen] = useState(false);

  // Auto-abrir sidebar de crédito quando estivermos nas rotas de crédito
  React.useEffect(() => {
    if (location === "/credito/financiamento" || location === "/credito/consorcio") {
      if (!showCreditoSidebar) {
        setSidebarCollapsed(true);
        setShowCreditoSidebar(true);
      }
    } else {
      if (showCreditoSidebar) {
        setSidebarCollapsed(false);
        setShowCreditoSidebar(false);
      }
    }
  }, [location]);

  // Função para obter as cores baseadas na rota atual
  const getCurrentTheme = () => {
    if (location === "/credito/financiamento") {
      return {
        primary: "#3b82f6",
        primaryRgb: "59, 130, 246",
        name: "Financiamento",
        classes: {
          border: "border-blue-200",
          headerBg: "from-blue-50 to-white",
          buttonText: "text-blue-600",
          buttonHover: "hover:bg-blue-100",
          dotBg: "bg-blue-500",
          titleGradient: "from-blue-600 to-blue-800",
          itemActive: "from-blue-500 to-blue-600 border-blue-500",
          itemHover: "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300",
          iconBg: "bg-blue-100 hover:bg-blue-200",
          iconText: "text-blue-600",
          footerBg: "from-blue-50 to-blue-100",
          footerBorder: "border-blue-200",
          footerText: "text-blue-700",
          footerSubtext: "text-blue-500",
          footerDots: "bg-blue-400"
        }
      };
    } else if (location === "/credito/consorcio") {
      return {
        primary: "#ef4444",
        primaryRgb: "239, 68, 68",
        name: "Consórcio",
        classes: {
          border: "border-red-200",
          headerBg: "from-red-50 to-white",
          buttonText: "text-red-600",
          buttonHover: "hover:bg-red-100",
          dotBg: "bg-red-500",
          titleGradient: "from-red-600 to-red-800",
          itemActive: "from-red-500 to-red-600 border-red-500",
          itemHover: "hover:bg-red-50 hover:text-red-700 hover:border-red-300",
          iconBg: "bg-red-100 hover:bg-red-200",
          iconText: "text-red-600",
          footerBg: "from-red-50 to-red-100",
          footerBorder: "border-red-200",
          footerText: "text-red-700",
          footerSubtext: "text-red-500",
          footerDots: "bg-red-400"
        }
      };
    }
    // Default (financiamento)
    return {
      primary: "#3b82f6",
      primaryRgb: "59, 130, 246",
      name: "Financiamento",
      classes: {
        border: "border-blue-200",
        headerBg: "from-blue-50 to-white",
        buttonText: "text-blue-600",
        buttonHover: "hover:bg-blue-100",
        dotBg: "bg-blue-500",
        titleGradient: "from-blue-600 to-blue-800",
        itemActive: "from-blue-500 to-blue-600 border-blue-500",
        itemHover: "hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300",
        iconBg: "bg-blue-100 hover:bg-blue-200",
        iconText: "text-blue-600",
        footerBg: "from-blue-50 to-blue-100",
        footerBorder: "border-blue-200",
        footerText: "text-blue-700",
        footerSubtext: "text-blue-500",
        footerDots: "bg-blue-400"
      }
    };
  };

  const currentTheme = getCurrentTheme();

  // Items da nova sidebar de Crédito
  const creditoItems = [
    { href: "/credito/financiamento", label: "Visão geral", icon: Home },
    { href: "/credito/clientes", label: "Clientes", icon: User },
    { href: "/credito/imoveis", label: "Imóveis", icon: Building2 },
    { href: "/credito/propostas", label: "Propostas", icon: HandHeart },
    { href: "/credito/usuarios", label: "Usuários", icon: User },
    { href: "/credito/bancos", label: "Bancos", icon: CreditCard },
    { href: "/credito/imobiliarias", label: "Imobiliárias", icon: Store },
    { href: "/credito/relatorios", label: "Relatórios", icon: FileText },
  ];

  const getNotificationIcon = (type: string, category: string) => {
    if (category === 'property') return Building2;
    if (category === 'contract') return FileText;
    if (category === 'document') return FileCheck;
    if (type === 'warning') return Clock;
    return Bell;
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning': return 'yellow';
      case 'error': return 'red';
      case 'success': return 'green';
      default: return 'blue';
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const getUserInitials = () => {
    if (!user?.firstName || !user?.lastName) return "U";
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background flex transition-colors duration-200">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-[#001f3f] to-[#004286] transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${
        sidebarCollapsed ? "w-14 shadow-2xl shadow-black/40" : "w-60 shadow-lg"
        }`}
        style={sidebarCollapsed ? {
          boxShadow: '6px 0 25px rgba(0, 0, 0, 0.5), 3px 0 15px rgba(0, 0, 0, 0.3), 1px 0 5px rgba(0, 0, 0, 0.2)',
          zIndex: 60
        } : {}}
      >
        <div className={`flex items-center h-16 border-b border-white/10 ${sidebarCollapsed ? "px-2" : "px-3"}`}>
          {sidebarCollapsed ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 w-full flex justify-center hover:shadow-lg transition-all duration-200"
              style={{ 
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
              }}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          ) : (
            <div className="flex items-center space-x-2 w-full">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 shrink-0"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <img 
                src={logoImage} 
                alt="Ventus Hub" 
                className="w-[120px] h-auto"
              />
            </div>
          )}
        </div>

        <nav className={`mt-6 ${sidebarCollapsed ? "px-1" : "px-3"}`}>
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              // Special handling for Crédito
              if (item.href === "/credito") {
                return (
                  <div key={item.href}>
                    {/* Crédito Button */}
                    <div
                      className={`flex items-center py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${sidebarCollapsed ? "px-2" : "px-3"} ${
                        isActive || location.startsWith("/credito")
                          ? "bg-white/20 text-white border-r-2 border-white"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      } ${sidebarCollapsed ? "justify-center hover:bg-white/20 hover:shadow-lg" : ""}`}
                      style={sidebarCollapsed ? { 
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
                      } : {}}
                      title={sidebarCollapsed ? item.label : ""}
                      onClick={() => setShowFinanciamentoSubmenu(!showFinanciamentoSubmenu)}
                    >
                      <Icon className={`h-5 w-5 ${sidebarCollapsed ? "" : "mr-3"}`} />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {showFinanciamentoSubmenu ? (
                            <ChevronDown className="h-4 w-4 ml-auto" />
                          ) : (
                            <ChevronRight className="h-4 w-4 ml-auto" />
                          )}
                        </>
                      )}
                    </div>

                    {/* Submenu - Efeito Moderno */}
                    {!sidebarCollapsed && (
                      <div
                        className={`overflow-hidden transition-all duration-500 ease-out transform ${
                          showFinanciamentoSubmenu 
                            ? "max-h-52 opacity-100 translate-y-0 scale-y-100" 
                            : "max-h-0 opacity-0 -translate-y-2 scale-y-95"
                        }`}
                        style={{
                          transformOrigin: 'top',
                        }}
                      >
                        <div className="relative ml-6 mr-2 mt-3 mb-4">
                          {/* Linha conectora */}
                          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-blue-300 via-blue-400 to-transparent"></div>
                          
                          {/* Container dos itens com efeito glass */}
                          <div className="relative bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 dark:border-gray-700/50 p-3 ml-4">
                            {/* Efeito de brilho */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10 pointer-events-none"></div>
                            
                            <div className="relative space-y-2">
                              {/* Financiamento */}
                              <Link href="/credito/financiamento">
                                <div
                                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${
                                    location === "/credito/financiamento"
                                      ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                                      : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-800 dark:hover:to-gray-750 hover:text-blue-700 dark:hover:text-blue-400"
                                  }`}
                                  onClick={() => {
                                    // Fechar o submenu após clique
                                    setShowFinanciamentoSubmenu(false);
                                    // A sidebar será aberta automaticamente pelo useEffect quando a rota mudar
                                  }}
                                >
                                  <div className={`p-1 rounded-md mr-2 transition-all duration-300 ${
                                    location === "/credito/financiamento"
                                      ? "bg-white/20"
                                      : "bg-blue-100 dark:bg-gray-700 group-hover:bg-blue-200 dark:group-hover:bg-gray-600"
                                  }`}>
                                    <CreditCard className="h-3 w-3" />
                                  </div>
                                  <span className="font-medium text-xs">Financiamento</span>
                                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <ChevronRight className="h-2.5 w-2.5" />
                                  </div>
                                </div>
                              </Link>

                              {/* Consórcio */}
                              <Link href="/credito/consorcio">
                                <div
                                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${
                                    location === "/credito/consorcio"
                                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25"
                                      : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-50 dark:hover:from-gray-800 dark:hover:to-gray-750 hover:text-red-700 dark:hover:text-red-400"
                                  }`}
                                >
                                  <div className={`p-1 rounded-md mr-2 transition-all duration-300 ${
                                    location === "/credito/consorcio"
                                      ? "bg-white/20"
                                      : "bg-red-100 dark:bg-gray-700 group-hover:bg-red-200 dark:group-hover:bg-gray-600"
                                  }`}>
                                    <BadgeCent className="h-3 w-3" />
                                  </div>
                                  <span className="font-medium text-xs">Consórcio</span>
                                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <ChevronRight className="h-2.5 w-2.5" />
                                  </div>
                                </div>
                              </Link>

                              {/* CGI */}
                              <Link href="/credito/cgi">
                                <div
                                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${
                                    location === "/credito/cgi"
                                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
                                      : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-gray-800 dark:hover:to-gray-750 hover:text-emerald-700 dark:hover:text-emerald-400"
                                  }`}
                                  title="Crédito com Garantia de Imóvel"
                                >
                                  <div className={`p-1 rounded-md mr-2 transition-all duration-300 ${
                                    location === "/credito/cgi"
                                      ? "bg-white/20"
                                      : "bg-emerald-100 dark:bg-gray-700 group-hover:bg-emerald-200 dark:group-hover:bg-gray-600"
                                  }`}>
                                    <Shield className="h-3 w-3" />
                                  </div>
                                  <span className="font-medium text-xs">CGI</span>
                                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <ChevronRight className="h-2.5 w-2.5" />
                                  </div>
                                </div>
                              </Link>
                            </div>
                            
                            {/* Indicador de submenu ativo */}
                            <div className="absolute -left-4 top-1/2 transform -translate-y-1/2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50 animate-pulse"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              // Regular navigation items
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${sidebarCollapsed ? "px-2" : "px-3"} ${
                    isActive
                        ? "bg-white/20 text-white border-r-2 border-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    } ${
                    sidebarCollapsed ? "justify-center hover:bg-white/20 hover:shadow-lg" : ""
                    }`}
                    style={sidebarCollapsed ? { 
                      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
                    } : {}}
                    title={sidebarCollapsed ? item.label : ""}
                  >
                    <Icon className={`h-5 w-5 ${sidebarCollapsed ? "" : "mr-3"}`} />
                    {!sidebarCollapsed && item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className={`absolute bottom-4 left-0 right-0 ${sidebarCollapsed ? "px-1" : "px-3"}`}>
          <div className={`flex items-center py-2 text-sm text-white/80 cursor-pointer hover:bg-white/10 rounded-md ${sidebarCollapsed ? "px-2" : "px-3"} ${
            sidebarCollapsed ? "justify-center hover:bg-white/20 hover:shadow-lg" : ""
          }`}
          style={sidebarCollapsed ? { 
            filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
          } : {}}
          title={sidebarCollapsed ? "Configurações" : ""}
          >
            <Settings className={`h-5 w-5 ${sidebarCollapsed ? "" : "mr-3"}`} />
            {!sidebarCollapsed && "Configurações"}
          </div>
        </div>
      </div>

      {/* Nova Sidebar de Crédito */}
      <AnimatePresence>
        {showCreditoSidebar && (
          <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className={`fixed inset-y-0 left-14 z-30 w-56 bg-gradient-to-b from-white to-gray-50 border-r ${currentTheme.classes.border} shadow-lg`}
            style={{
              boxShadow: `inset 4px 0 10px rgba(${currentTheme.primaryRgb}, 0.08), 0 0 20px rgba(${currentTheme.primaryRgb}, 0.05), inset 0 0 0 1px rgba(${currentTheme.primaryRgb}, 0.1)`
            }}
          >
            {/* Header da nova sidebar */}
            <div className={`flex items-center h-16 px-4 border-b ${currentTheme.classes.border} bg-gradient-to-r ${currentTheme.classes.headerBg}`}>
              <Button
                variant="ghost"
                size="icon"
                className={`${currentTheme.classes.buttonText} ${currentTheme.classes.buttonHover} mr-3 transition-colors duration-200`}
                onClick={() => {
                  setSidebarCollapsed(false);
                  setShowCreditoSidebar(false);
                }}
              >
                <X className="h-5 w-5" />
              </Button>
              <div className="flex items-center">
                <div className={`w-2 h-2 ${currentTheme.classes.dotBg} rounded-full mr-2 animate-pulse`}></div>
                <h2 className={`text-lg font-semibold bg-gradient-to-r ${currentTheme.classes.titleGradient} bg-clip-text text-transparent`}>{currentTheme.name}</h2>
              </div>
            </div>

            {/* Navegação da sidebar de crédito */}
            <nav className="mt-6 px-3">
              <div className="space-y-1">
                {creditoItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <motion.div
                        whileHover={{ scale: 1.02, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer ${
                          isActive
                            ? `bg-gradient-to-r ${currentTheme.classes.itemActive} text-white shadow-lg border-r-2`
                            : `text-gray-700 ${currentTheme.classes.itemHover} hover:border-l-2`
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg mr-3 transition-all duration-300 ${
                          isActive 
                            ? "bg-white/20" 
                            : currentTheme.classes.iconBg
                        }`}>
                          <Icon className={`h-4 w-4 ${isActive ? "text-white" : currentTheme.classes.iconText}`} />
                        </div>
                        <span className="flex-1">{item.label}</span>
                        {isActive && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-2 h-2 bg-white rounded-full ml-auto"
                          />
                        )}
                      </motion.div>
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Footer da sidebar de crédito */}
            <div className="absolute bottom-4 left-0 right-0 px-3">
              <div className={`bg-gradient-to-r ${currentTheme.classes.footerBg} rounded-lg px-3 py-2 text-center border ${currentTheme.classes.footerBorder}`}>
                <div className={`text-xs ${currentTheme.classes.footerText} font-medium`}>Sistema de Crédito</div>
                <div className={`text-[10px] ${currentTheme.classes.footerSubtext} mt-0.5 flex items-center justify-center`}>
                  <div className={`w-1 h-1 ${currentTheme.classes.footerDots} rounded-full mr-1`}></div>
                  {currentTheme.name}
                  <div className={`w-1 h-1 ${currentTheme.classes.footerDots} rounded-full ml-1`}></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      {/* Header */}
      <header className={cn("fixed top-0 right-0 z-40 bg-gradient-to-r from-[#001f3f] to-[#004286] border-b border-white/10 shadow-sm transition-all duration-300 ease-in-out h-16", 
        showCreditoSidebar ? "lg:left-[280px]" : (sidebarCollapsed ? "lg:left-14" : "lg:left-60")
      )}>
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <h1 className="ml-4 text-2xl font-semibold text-white lg:ml-0">
              {navigationItems.find(item => item.href === location)?.label || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
          {/* Simulators Dropdown */}
          <DropdownMenu onOpenChange={setIsSimulatorsOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-auto px-2 text-white hover:bg-white/10 flex items-center gap-2"
              >
                <motion.div layout>
                  <Calculator className="h-4 w-4" />
                </motion.div>
                <AnimatePresence>
                  {isSimulatorsOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0, marginRight: 0 }}
                      animate={{ opacity: 1, width: 'auto', marginRight: '8px' }}
                      exit={{ opacity: 0, width: 0, marginRight: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-sm font-medium whitespace-nowrap"
                    >
                      SIMULADORES DE
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-64 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 shadow-xl rounded-xl p-2 relative"
            >
              {/* Efeito de brilho */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10 pointer-events-none"></div>
              
              <div className="relative space-y-1">
                <DropdownMenuItem asChild className="p-0">
                  <Link href="/simulador-valor-registro" className="group">
                    <div className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-800 dark:hover:to-gray-750 hover:text-blue-700 dark:hover:text-blue-400">
                      <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/50 mr-2 transition-all duration-300 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50">
                        <FileText className="h-2.5 w-2.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="font-medium text-xs">Valor de Registro</span>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ChevronRight className="h-2.5 w-2.5" />
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="p-0">
                  <Link href="/simulador-financiamento" className="group">
                    <div className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 dark:hover:from-gray-800 dark:hover:to-gray-750 hover:text-green-700 dark:hover:text-green-400">
                      <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/50 mr-2 transition-all duration-300 group-hover:bg-green-200 dark:group-hover:bg-green-800/50">
                        <Home className="h-2.5 w-2.5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="font-medium text-xs">Financiamento Imobiliário</span>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ChevronRight className="h-2.5 w-2.5" />
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="p-0">
                  <Link href="/simulador-valor-imovel" className="group">
                    <div className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-gray-800 dark:hover:to-gray-750 hover:text-purple-700 dark:hover:text-purple-400">
                      <div className="p-1 rounded-full bg-purple-100 dark:bg-purple-900/50 mr-2 transition-all duration-300 group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50">
                        <Search className="h-2.5 w-2.5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="font-medium text-xs">Avaliação Imobiliária</span>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ChevronRight className="h-2.5 w-2.5" />
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="p-0">
                  <Link href="/simulador-poder-de-compra" className="group">
                    <div className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 dark:hover:from-gray-800 dark:hover:to-gray-750 hover:text-orange-700 dark:hover:text-orange-400">
                      <div className="p-1 rounded-full bg-orange-100 dark:bg-orange-900/50 mr-2 transition-all duration-300 group-hover:bg-orange-200 dark:group-hover:bg-orange-800/50">
                        <DollarSign className="h-2.5 w-2.5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="font-medium text-xs">Poder de Compra</span>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ChevronRight className="h-2.5 w-2.5" />
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="p-0">
                  <Link href="/simulador-aluguel-x-compra" className="group">
                    <div className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 dark:hover:from-gray-800 dark:hover:to-gray-750 hover:text-cyan-700 dark:hover:text-cyan-400">
                      <div className="p-1 rounded-full bg-cyan-100 dark:bg-cyan-900/50 mr-2 transition-all duration-300 group-hover:bg-cyan-200 dark:group-hover:bg-cyan-800/50">
                        <ArrowRightLeft className="h-2.5 w-2.5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <span className="font-medium text-xs">Aluguel x Compra</span>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ChevronRight className="h-2.5 w-2.5" />
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="p-0">
                  <Link href="/simulador-consorcio-x-financiamento" className="group">
                    <div className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-teal-50 hover:to-green-50 dark:hover:from-gray-800 dark:hover:to-gray-750 hover:text-teal-700 dark:hover:text-teal-400">
                      <div className="p-1 rounded-full bg-teal-100 dark:bg-teal-900/50 mr-2 transition-all duration-300 group-hover:bg-teal-200 dark:group-hover:bg-teal-800/50">
                        <Scale className="h-2.5 w-2.5 text-teal-600 dark:text-teal-400" />
                      </div>
                      <span className="font-medium text-xs">Consórcio x Financiamento</span>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ChevronRight className="h-2.5 w-2.5" />
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="p-0">
                  <Link href="/simulador-sac-x-price" className="group">
                    <div className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 dark:hover:from-gray-800 dark:hover:to-gray-750 hover:text-yellow-700 dark:hover:text-yellow-400">
                      <div className="p-1 rounded-full bg-yellow-100 dark:bg-yellow-900/50 mr-2 transition-all duration-300 group-hover:bg-yellow-200 dark:group-hover:bg-yellow-800/50">
                        <Repeat className="h-2.5 w-2.5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <span className="font-medium text-xs">SAC x PRICE</span>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ChevronRight className="h-2.5 w-2.5" />
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="p-0">
                  <Link href="/simulador-roi-flipping" className="group">
                    <div className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 dark:hover:from-gray-800 dark:hover:to-gray-750 hover:text-rose-700 dark:hover:text-rose-400">
                      <div className="p-1 rounded-full bg-rose-100 dark:bg-rose-900/50 mr-2 transition-all duration-300 group-hover:bg-rose-200 dark:group-hover:bg-rose-800/50">
                        <BarChart2 className="h-2.5 w-2.5 text-rose-600 dark:text-rose-400" />
                      </div>
                      <span className="font-medium text-xs">ROI Flipping</span>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ChevronRight className="h-2.5 w-2.5" />
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="p-0">
                  <Link href="/simulador-potencial-de-valorizacao" className="group">
                    <div className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 dark:hover:from-gray-800 dark:hover:to-gray-750 hover:text-emerald-700 dark:hover:text-emerald-400">
                      <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 mr-2 transition-all duration-300 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50">
                        <TrendingUp className="h-2.5 w-2.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="font-medium text-xs">Potencial de Valorização</span>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ChevronRight className="h-2.5 w-2.5" />
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="p-0">
                  <Link href="/simulador-comissao-e-metas" className="group">
                    <div className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-750 hover:text-indigo-700 dark:hover:text-indigo-400">
                      <div className="p-1 rounded-full bg-indigo-100 dark:bg-indigo-900/50 mr-2 transition-all duration-300 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50">
                        <Target className="h-2.5 w-2.5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="font-medium text-xs">Comissão e Metas</span>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ChevronRight className="h-2.5 w-2.5" />
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="p-0">
                  <Link href="/simulador-renda-passiva" className="group">
                    <div className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 dark:hover:from-gray-800 dark:hover:to-gray-750 hover:text-violet-700 dark:hover:text-violet-400">
                      <div className="p-1 rounded-full bg-violet-100 dark:bg-violet-900/50 mr-2 transition-all duration-300 group-hover:bg-violet-200 dark:group-hover:bg-violet-800/50">
                        <PiggyBank className="h-2.5 w-2.5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <span className="font-medium text-xs">Renda Passiva (Aluguéis)</span>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ChevronRight className="h-2.5 w-2.5" />
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="p-0">
                  <Link href="/simulador-cgi" className="group">
                    <div className="flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-300 cursor-pointer transform hover:scale-[1.02] text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 dark:hover:from-gray-800 dark:hover:to-gray-750 hover:text-amber-700 dark:hover:text-amber-400">
                      <div className="p-1 rounded-full bg-amber-100 dark:bg-amber-900/50 mr-2 transition-all duration-300 group-hover:bg-amber-200 dark:group-hover:bg-amber-800/50">
                        <Shield className="h-2.5 w-2.5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="font-medium text-xs">Crédito com Garantia de Imóvel</span>
                      <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ChevronRight className="h-2.5 w-2.5" />
                      </div>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme toggle */}
          <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-8 w-8 text-white hover:bg-white/10"
          >
              {theme === "dark" ? (
              <Sun className="h-4 w-4" />
              ) : (
              <Moon className="h-4 w-4" />
              )}
          </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative text-white hover:bg-white/10">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <h3 className="font-medium">Notificações</h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAllAsRead()}
                      className="text-xs"
                    >
                      Marcar todas como lidas
                    </Button>
                  )}
                </div>
                
                <div className="max-h-96 overflow-y-auto dropdown-scroll">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma notificação</p>
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type, notification.category);
                      const color = getNotificationColor(notification.type);
                      
                      return (
                        <DropdownMenuItem
                          key={notification.id}
                          className={`flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer ${
                            !notification.isRead ? 'bg-primary/5' : ''
                          }`}
                          onClick={() => {
                            if (!notification.isRead) {
                              markAsRead(notification.id);
                            }
                            if (notification.actionUrl) {
                              window.location.href = notification.actionUrl;
                            }
                          }}
                        >
                          <div className={`bg-${color}-100 dark:bg-${color}-900/30 p-1.5 rounded-full flex-shrink-0`}>
                            <Icon className={`h-3 w-3 text-${color}-600 dark:text-${color}-400`} />
                          </div>
                          <div className="flex-1 space-y-1 min-w-0">
                            <p className="text-sm font-medium line-clamp-2">
                              {notification.title}
                            </p>
                            <p className="text-xs leading-none text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="h-2 w-2 bg-primary rounded-full flex-shrink-0 mt-2" />
                          )}
                        </DropdownMenuItem>
                      );
                    })
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <div className="border-t p-2">
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      Ver todas as notificações
                    </Button>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

          {/* User menu - atualizado para mostrar avatar */}
          <DropdownMenu>
          <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-white/10">
              <Avatar className="h-8 w-8">
                  {user?.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
                  ) : null}
                  <AvatarFallback className="bg-white/20 text-white text-sm border border-white/20">
                  {getUserInitials()}
                  </AvatarFallback>
              </Avatar>
              </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                  {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                  </p>
                  {user?.creci && (
                  <p className="text-xs leading-none text-muted-foreground">
                      CRECI: {user.creci}
                  </p>
                  )}
              </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
              <Link href="/configuracoes" className="w-full cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
              </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
              <Link href="/configuracoes" className="w-full cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configurações</span>
              </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
              </DropdownMenuItem>
          </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className={cn("flex-1 overflow-auto pt-16 transition-all duration-300", 
        showCreditoSidebar ? "lg:ml-[280px]" : (sidebarCollapsed ? "lg:ml-14" : "lg:ml-60")
      )}>
        {children}
      </main>
    </div>
  );
}