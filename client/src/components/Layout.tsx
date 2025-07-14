import { useState } from "react";
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
  BarChart3
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
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(1, 5);
  const [isSimulatorsOpen, setIsSimulatorsOpen] = useState(false);

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
        className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-[#001f3f] to-[#004286] shadow-lg transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${
        sidebarCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="flex items-center h-16 px-3 border-b border-white/10">
          {sidebarCollapsed ? (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 w-full flex justify-center"
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

        <nav className="mt-6 px-3">
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
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                        isActive || location.startsWith("/credito")
                          ? "bg-white/20 text-white border-r-2 border-white"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      } ${sidebarCollapsed ? "justify-center" : ""}`}
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
                                      ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25"
                                      : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 dark:hover:from-gray-800 dark:hover:to-gray-750 hover:text-purple-700 dark:hover:text-purple-400"
                                  }`}
                                >
                                  <div className={`p-1 rounded-md mr-2 transition-all duration-300 ${
                                    location === "/credito/financiamento"
                                      ? "bg-white/20"
                                      : "bg-purple-100 dark:bg-gray-700 group-hover:bg-purple-200 dark:group-hover:bg-gray-600"
                                  }`}>
                                    <Calculator className="h-3 w-3" />
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
                                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25"
                                      : "text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 dark:hover:from-gray-800 dark:hover:to-gray-750 hover:text-blue-700 dark:hover:text-blue-400"
                                  }`}
                                >
                                  <div className={`p-1 rounded-md mr-2 transition-all duration-300 ${
                                    location === "/credito/consorcio"
                                      ? "bg-white/20"
                                      : "bg-blue-100 dark:bg-gray-700 group-hover:bg-blue-200 dark:group-hover:bg-gray-600"
                                  }`}>
                                    <CreditCard className="h-3 w-3" />
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
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    isActive
                        ? "bg-white/20 text-white border-r-2 border-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    } ${
                    sidebarCollapsed ? "justify-center" : ""
                    }`}
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

        <div className="absolute bottom-4 left-0 right-0 px-3">
          <div className={`flex items-center px-3 py-2 text-sm text-white/80 cursor-pointer hover:bg-white/10 rounded-md ${
            sidebarCollapsed ? "justify-center" : ""
          }`}
          title={sidebarCollapsed ? "Configurações" : ""}
          >
            <Settings className={`h-5 w-5 ${sidebarCollapsed ? "" : "mr-3"}`} />
            {!sidebarCollapsed && "Configurações"}
          </div>
        </div>
      </div>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      {/* Header */}
      <header className={cn("fixed top-0 right-0 z-40 bg-gradient-to-r from-[#001f3f] to-[#004286] border-b border-white/10 shadow-sm transition-all duration-300 ease-in-out h-16", sidebarCollapsed ? "lg:left-16" : "lg:left-64")}>
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
                      <Calculator className="h-3 w-3 mr-2" />
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
                      <Calculator className="h-3 w-3 mr-2" />
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
                      <Calculator className="h-3 w-3 mr-2" />
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
                      <Calculator className="h-3 w-3 mr-2" />
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
                      <Calculator className="h-3 w-3 mr-2" />
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
                      <Calculator className="h-3 w-3 mr-2" />
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
                      <Calculator className="h-3 w-3 mr-2" />
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
                      <Calculator className="h-3 w-3 mr-2" />
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
                      <Calculator className="h-3 w-3 mr-2" />
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
                      <Calculator className="h-3 w-3 mr-2" />
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
                      <Calculator className="h-3 w-3 mr-2" />
                      <span className="font-medium text-xs">Renda Passiva (Aluguéis)</span>
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
      <main className={cn("flex-1 overflow-auto pt-16", sidebarCollapsed ? "lg:ml-16" : "lg:ml-64")}>
        {children}
      </main>
    </div>
  );
}