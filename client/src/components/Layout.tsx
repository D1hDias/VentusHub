import React, { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
// import { useOrganization } from "@/hooks/useOrganization";
// import { OrganizationSelector, NoOrganizationSelected } from "@/components/OrganizationSelector";
import logoImage from "@/assets/logo.png";
import { BottomNavigation, useMobileNavigation } from "@/components/responsive/MobileNavigation";
import { useResponsive } from "@/hooks/useMediaQuery";
import { NotificationCenter } from "@/components/NotificationCenter";
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
  BadgeCent,
  CalculatorIcon,
  Users,
  ScrollText,
  FileSearch,
  PenTool
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNotifications } from "@/hooks/useNotifications";
import { useDeviceInfo } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from 'framer-motion';

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/captacao", label: "Captação de Imóveis", icon: Building2 },
  { href: "/due-diligence", label: "Due Diligence", icon: Search },
  { href: "/mercado", label: "Imóveis no Mercado", icon: Store },
  { href: "/propostas", label: "Propostas", icon: HandHeart },
  { href: "/contratos", label: "Contratos", icon: FileText },
  { href: "/credito", label: "Crédito", icon: Calculator },
  { href: "/instrumento", label: "Instrumento Definitivo", icon: FileCheck },
  { href: "/registro", label: "Registro", icon: FileSearch },
  { href: "/timeline", label: "Acompanhamento", icon: Clock },
];

// Admin navigation items removed - functionalities not needed


// Lista completa de simuladores com suas configurações
const simulatorsConfig = [
  {
    id: 'simulador-valor-registro',
    href: '/simulador-valor-registro',
    label: 'Valor de Registro',
    icon: FileText,
    bgColor: 'from-blue-50 to-indigo-50',
    darkBgColor: 'from-gray-800 to-gray-750',
    textColor: 'text-blue-700',
    darkTextColor: 'text-blue-400',
    iconBg: 'bg-blue-100',
    darkIconBg: 'bg-blue-900/50',
    iconBgHover: 'bg-blue-200',
    darkIconBgHover: 'bg-blue-800/50',
    iconColor: 'text-blue-600',
    darkIconColor: 'text-blue-400'
  },
  {
    id: 'simulador-financiamento',
    href: '/simulador-financiamento',
    label: 'Financiamento Imobiliário',
    icon: Home,
    bgColor: 'from-green-50 to-emerald-50',
    darkBgColor: 'from-gray-800 to-gray-750',
    textColor: 'text-green-700',
    darkTextColor: 'text-green-400',
    iconBg: 'bg-green-100',
    darkIconBg: 'bg-green-900/50',
    iconBgHover: 'bg-green-200',
    darkIconBgHover: 'bg-green-800/50',
    iconColor: 'text-green-600',
    darkIconColor: 'text-green-400'
  },
  {
    id: 'simulador-valor-imovel',
    href: '/simulador-valor-imovel',
    label: 'Avaliação Imobiliária',
    icon: Search,
    bgColor: 'from-purple-50 to-indigo-50',
    darkBgColor: 'from-gray-800 to-gray-750',
    textColor: 'text-purple-700',
    darkTextColor: 'text-purple-400',
    iconBg: 'bg-purple-100',
    darkIconBg: 'bg-purple-900/50',
    iconBgHover: 'bg-purple-200',
    darkIconBgHover: 'bg-purple-800/50',
    iconColor: 'text-purple-600',
    darkIconColor: 'text-purple-400'
  },
  {
    id: 'simulador-poder-de-compra',
    href: '/simulador-poder-de-compra',
    label: 'Poder de Compra',
    icon: DollarSign,
    bgColor: 'from-orange-50 to-red-50',
    darkBgColor: 'from-gray-800 to-gray-750',
    textColor: 'text-orange-700',
    darkTextColor: 'text-orange-400',
    iconBg: 'bg-orange-100',
    darkIconBg: 'bg-orange-900/50',
    iconBgHover: 'bg-orange-200',
    darkIconBgHover: 'bg-orange-800/50',
    iconColor: 'text-orange-600',
    darkIconColor: 'text-orange-400'
  },
  {
    id: 'simulador-aluguel-x-compra',
    href: '/simulador-aluguel-x-compra',
    label: 'Aluguel x Compra',
    icon: ArrowRightLeft,
    bgColor: 'from-cyan-50 to-blue-50',
    darkBgColor: 'from-gray-800 to-gray-750',
    textColor: 'text-cyan-700',
    darkTextColor: 'text-cyan-400',
    iconBg: 'bg-cyan-100',
    darkIconBg: 'bg-cyan-900/50',
    iconBgHover: 'bg-cyan-200',
    darkIconBgHover: 'bg-cyan-800/50',
    iconColor: 'text-cyan-600',
    darkIconColor: 'text-cyan-400'
  },
  {
    id: 'simulador-consorcio-x-financiamento',
    href: '/simulador-consorcio-x-financiamento',
    label: 'Consórcio x Financiamento',
    icon: Scale,
    bgColor: 'from-teal-50 to-green-50',
    darkBgColor: 'from-gray-800 to-gray-750',
    textColor: 'text-teal-700',
    darkTextColor: 'text-teal-400',
    iconBg: 'bg-teal-100',
    darkIconBg: 'bg-teal-900/50',
    iconBgHover: 'bg-teal-200',
    darkIconBgHover: 'bg-teal-800/50',
    iconColor: 'text-teal-600',
    darkIconColor: 'text-teal-400'
  },
  {
    id: 'simulador-sac-x-price',
    href: '/simulador-sac-x-price',
    label: 'SAC x PRICE',
    icon: Repeat,
    bgColor: 'from-yellow-50 to-orange-50',
    darkBgColor: 'from-gray-800 to-gray-750',
    textColor: 'text-yellow-700',
    darkTextColor: 'text-yellow-400',
    iconBg: 'bg-yellow-100',
    darkIconBg: 'bg-yellow-900/50',
    iconBgHover: 'bg-yellow-200',
    darkIconBgHover: 'bg-yellow-800/50',
    iconColor: 'text-yellow-600',
    darkIconColor: 'text-yellow-400'
  },
  {
    id: 'simulador-roi-flipping',
    href: '/simulador-roi-flipping',
    label: 'ROI Flipping',
    icon: BarChart2,
    bgColor: 'from-rose-50 to-pink-50',
    darkBgColor: 'from-gray-800 to-gray-750',
    textColor: 'text-rose-700',
    darkTextColor: 'text-rose-400',
    iconBg: 'bg-rose-100',
    darkIconBg: 'bg-rose-900/50',
    iconBgHover: 'bg-rose-200',
    darkIconBgHover: 'bg-rose-800/50',
    iconColor: 'text-rose-600',
    darkIconColor: 'text-rose-400'
  },
  {
    id: 'simulador-potencial-de-valorizacao',
    href: '/simulador-potencial-de-valorizacao',
    label: 'Potencial de Valorização',
    icon: TrendingUp,
    bgColor: 'from-emerald-50 to-teal-50',
    darkBgColor: 'from-gray-800 to-gray-750',
    textColor: 'text-emerald-700',
    darkTextColor: 'text-emerald-400',
    iconBg: 'bg-emerald-100',
    darkIconBg: 'bg-emerald-900/50',
    iconBgHover: 'bg-emerald-200',
    darkIconBgHover: 'bg-emerald-800/50',
    iconColor: 'text-emerald-600',
    darkIconColor: 'text-emerald-400'
  },
  {
    id: 'simulador-comissao-e-metas',
    href: '/simulador-comissao-e-metas',
    label: 'Comissão e Metas',
    icon: Target,
    bgColor: 'from-indigo-50 to-purple-50',
    darkBgColor: 'from-gray-800 to-gray-750',
    textColor: 'text-indigo-700',
    darkTextColor: 'text-indigo-400',
    iconBg: 'bg-indigo-100',
    darkIconBg: 'bg-indigo-900/50',
    iconBgHover: 'bg-indigo-200',
    darkIconBgHover: 'bg-indigo-800/50',
    iconColor: 'text-indigo-600',
    darkIconColor: 'text-indigo-400'
  },
  {
    id: 'simulador-renda-passiva',
    href: '/simulador-renda-passiva',
    label: 'Renda Passiva (Aluguéis)',
    icon: PiggyBank,
    bgColor: 'from-violet-50 to-purple-50',
    darkBgColor: 'from-gray-800 to-gray-750',
    textColor: 'text-violet-700',
    darkTextColor: 'text-violet-400',
    iconBg: 'bg-violet-100',
    darkIconBg: 'bg-violet-900/50',
    iconBgHover: 'bg-violet-200',
    darkIconBgHover: 'bg-violet-800/50',
    iconColor: 'text-violet-600',
    darkIconColor: 'text-violet-400'
  },
  {
    id: 'simulador-cgi',
    href: '/simulador-cgi',
    label: 'Crédito com Garantia de Imóvel',
    icon: Shield,
    bgColor: 'from-amber-50 to-orange-50',
    darkBgColor: 'from-gray-800 to-gray-750',
    textColor: 'text-amber-700',
    darkTextColor: 'text-amber-400',
    iconBg: 'bg-amber-100',
    darkIconBg: 'bg-amber-900/50',
    iconBgHover: 'bg-amber-200',
    darkIconBgHover: 'bg-amber-800/50',
    iconColor: 'text-amber-600',
    darkIconColor: 'text-amber-400'
  },
  {
    id: 'simulador-metro-quadrado',
    href: '/simulador-metro-quadrado',
    label: 'Preço por Metro Quadrado',
    icon: BarChart3,
    bgColor: 'from-slate-50 to-zinc-50',
    darkBgColor: 'from-gray-800 to-gray-750',
    textColor: 'text-slate-700',
    darkTextColor: 'text-slate-400',
    iconBg: 'bg-slate-100',
    darkIconBg: 'bg-slate-900/50',
    iconBgHover: 'bg-slate-200',
    darkIconBgHover: 'bg-slate-800/50',
    iconColor: 'text-slate-600',
    darkIconColor: 'text-slate-400'
  },
  {
    id: 'simulador-liquidez-imovel',
    href: '/simulador-liquidez-imovel',
    label: 'Liquidez do Imóvel',
    icon: Circle,
    bgColor: 'from-sky-50 to-blue-50',
    darkBgColor: 'from-gray-800 to-gray-750',
    textColor: 'text-sky-700',
    darkTextColor: 'text-sky-400',
    iconBg: 'bg-sky-100',
    darkIconBg: 'bg-sky-900/50',
    iconBgHover: 'bg-sky-200',
    darkIconBgHover: 'bg-sky-800/50',
    iconColor: 'text-sky-600',
    darkIconColor: 'text-sky-400'
  },
  {
    id: 'simulador-credito-pj',
    href: '/simulador-credito-pj',
    label: 'Crédito Empresarial',
    icon: Building2,
    bgColor: 'from-yellow-50 to-amber-50',
    darkBgColor: 'from-gray-800 to-gray-750',
    textColor: 'text-yellow-700',
    darkTextColor: 'text-yellow-400',
    iconBg: 'bg-yellow-100',
    darkIconBg: 'bg-yellow-900/50',
    iconBgHover: 'bg-yellow-200',
    darkIconBgHover: 'bg-yellow-800/50',
    iconColor: 'text-yellow-600',
    darkIconColor: 'text-yellow-400'
  }
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showFinanciamentoSubmenu, setShowFinanciamentoSubmenu] = useState(false);
  const [showCreditoSidebar, setShowCreditoSidebar] = useState(false);
  const [showCreditoHorizontalNav, setShowCreditoHorizontalNav] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();
  // const { currentOrganization } = useOrganization();
  const { unreadCount, hasUnread, hasUrgent } = useNotifications();
  const [isSimulatorsOpen, setIsSimulatorsOpen] = useState(false);
  const { isMobile, isSmallMobile, isTouchDevice } = useDeviceInfo();
  const { showBottomNav, shouldHideSidebar } = useMobileNavigation();
  const { prefersReducedMotion } = useResponsive();
  const calculatorButtonRef = useRef<HTMLButtonElement>(null);
  const mouseLeaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [dynamicPageTitle, setDynamicPageTitle] = useState<string | null>(null);

  // Função para obter a chave de uso no localStorage baseada no usuário
  const getUsageKey = () => user?.id ? `simulator_usage_${user.id}` : 'simulator_usage_guest';

  // Função para carregar dados de uso do localStorage
  const loadUsageData = () => {
    try {
      const data = localStorage.getItem(getUsageKey());
      return data ? JSON.parse(data) : {};
    } catch (error: any) {
      console.error('Erro ao carregar dados de uso:', error);
      return {};
    }
  };

  // Função para salvar dados de uso no localStorage
  const saveUsageData = (usageData: Record<string, any>) => {
    try {
      localStorage.setItem(getUsageKey(), JSON.stringify(usageData));
    } catch (error: any) {
      console.error('Erro ao salvar dados de uso:', error);
    }
  };

  // Função para registrar uso de um simulador
  const trackSimulatorUsage = (simulatorId: string) => {
    const usageData = loadUsageData();
    const currentTime = Date.now();

    if (!usageData[simulatorId]) {
      usageData[simulatorId] = {
        count: 0,
        lastUsed: currentTime,
        firstUsed: currentTime
      };
    }

    usageData[simulatorId].count += 1;
    usageData[simulatorId].lastUsed = currentTime;

    saveUsageData(usageData);
  };

  // Função para ordenar simuladores baseado no uso
  const getSortedSimulators = () => {
    const usageData = loadUsageData();

    return [...simulatorsConfig].sort((a, b) => {
      const aUsage = usageData[a.id] || { count: 0, lastUsed: 0 };
      const bUsage = usageData[b.id] || { count: 0, lastUsed: 0 };

      // Primeiro critério: número de usos (decrescente)
      if (aUsage.count !== bUsage.count) {
        return bUsage.count - aUsage.count;
      }

      // Segundo critério: último uso (mais recente primeiro)
      if (aUsage.lastUsed !== bUsage.lastUsed) {
        return bUsage.lastUsed - aUsage.lastUsed;
      }

      // Terceiro critério: ordem alfabética (fallback)
      return a.label.localeCompare(b.label);
    });
  };

  // Função para lidar com clique em simulador
  const handleSimulatorClick = (simulatorId: string) => {
    trackSimulatorUsage(simulatorId);
  };

  // Limpar timeouts ao desmontar
  React.useEffect(() => {
    return () => {
      if (mouseLeaveTimeoutRef.current) {
        clearTimeout(mouseLeaveTimeoutRef.current);
      }
    };
  }, []);

  // Escutar evento customizado para atualização dinâmica do título
  React.useEffect(() => {
    const handleUpdatePageTitle = (event: CustomEvent) => {
      setDynamicPageTitle(event.detail.title);
    };

    window.addEventListener('updatePageTitle', handleUpdatePageTitle as EventListener);

    return () => {
      window.removeEventListener('updatePageTitle', handleUpdatePageTitle as EventListener);
    };
  }, []);

  // Limpar título dinâmico quando sair de páginas específicas
  React.useEffect(() => {
    if (!location.startsWith('/property/')) {
      setDynamicPageTitle(null);
    }
  }, [location]);

  // Função para lidar com hover da sidebar principal - DESABILITADA
  const handleSidebarMouseEnter = () => {
    // Hover desabilitado - sidebar só expande/colapsa no clique do hamburger
  };

  const handleSidebarMouseLeave = () => {
    // Hover desabilitado - sidebar só expande/colapsa no clique do hamburger
  };



  // Função para obter as cores baseadas na rota atual
  const getCurrentTheme = () => {
    if (location === "/credito/financiamento" || location === "/simulador-financiamento") {
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
    } else if (location === "/credito/cgi" || location === "/simulador-cgi") {
      return {
        primary: "#10b981",
        primaryRgb: "16, 185, 129",
        name: "CGI",
        classes: {
          border: "border-emerald-200",
          headerBg: "from-emerald-50 to-white",
          buttonText: "text-emerald-600",
          buttonHover: "hover:bg-emerald-100",
          dotBg: "bg-emerald-500",
          titleGradient: "from-emerald-600 to-emerald-800",
          itemActive: "from-emerald-500 to-emerald-600 border-emerald-500",
          itemHover: "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300",
          iconBg: "bg-emerald-100 hover:bg-emerald-200",
          iconText: "text-emerald-600",
          footerBg: "from-emerald-50 to-emerald-100",
          footerBorder: "border-emerald-200",
          footerText: "text-emerald-700",
          footerSubtext: "text-emerald-500",
          footerDots: "bg-emerald-400"
        }
      };
    } else if (location === "/credito/pj" || location === "/simulador-credito-pj") {
      return {
        primary: "#eab308",
        primaryRgb: "234, 179, 8",
        name: "Crédito PJ",
        classes: {
          border: "border-yellow-200",
          headerBg: "from-yellow-50 to-white",
          buttonText: "text-yellow-600",
          buttonHover: "hover:bg-yellow-100",
          dotBg: "bg-yellow-500",
          titleGradient: "from-yellow-600 to-yellow-800",
          itemActive: "from-yellow-500 to-yellow-600 border-yellow-500",
          itemHover: "hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-300",
          iconBg: "bg-yellow-100 hover:bg-yellow-200",
          iconText: "text-yellow-600",
          footerBg: "from-yellow-50 to-yellow-100",
          footerBorder: "border-yellow-200",
          footerText: "text-yellow-700",
          footerSubtext: "text-yellow-500",
          footerDots: "bg-yellow-400"
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

  // Auto-mostrar navegação horizontal de crédito e submenu para rotas relacionadas
  React.useEffect(() => {
    const isCreditRoute = location.startsWith("/credito/") ||
      location.startsWith("/simulador-financiamento") ||
      location.startsWith("/simulador-cgi") ||
      location.startsWith("/simulador-credito-pj");

    if (isCreditRoute) {
      setShowCreditoHorizontalNav(true);
      setShowCreditoSidebar(true); // Mostrar submenu quando estiver numa rota de crédito
      setSidebarCollapsed(false);
    } else {
      setShowCreditoHorizontalNav(false);
      setShowCreditoSidebar(false);
    }
  }, [location]);

  // Items da navegação horizontal de Crédito baseados na rota
  const getCreditoItems = () => {
    if (location === "/credito/financiamento" || location === "/simulador-financiamento") {
      return [
        { href: "/credito/financiamento", label: "Visão geral", icon: Home },
        { href: "/simulador-financiamento", label: "Simulação", icon: Calculator },
        { href: "/credito/Aprovação", label: "Aprovação", icon: FileCheck },
        { href: "/credito/propostas", label: "Propostas", icon: PenTool },
        { href: "/credito/usuarios", label: "Acompanhamento", icon: FileSearch },
        { href: "/credito/imobiliarias", label: "Equipe", icon: Users },
        { href: "/credito/relatorios", label: "Relatórios", icon: ScrollText },
      ];
    } else if (location === "/credito/consorcio") {
      return [
        { href: "/credito/consorcio", label: "Visão geral", icon: Home },
        { href: "/credito/consorcio/simulacao", label: "Simulação", icon: Calculator },
        { href: "/credito/consorcio/aprovacao", label: "Aprovação", icon: FileCheck },
        { href: "/credito/consorcio/propostas", label: "Propostas", icon: PenTool },
        { href: "/credito/consorcio/acompanhamento", label: "Acompanhamento", icon: FileSearch },
        { href: "/credito/consorcio/equipe", label: "Equipe", icon: Users },
        { href: "/credito/consorcio/relatorios", label: "Relatórios", icon: ScrollText },
      ];
    } else if (location === "/credito/cgi" || location === "/simulador-cgi") {
      return [
        { href: "/credito/cgi", label: "Visão geral", icon: Home },
        { href: "/simulador-cgi", label: "Simulação", icon: Calculator },
        { href: "/credito/cgi/aprovacao", label: "Aprovação", icon: FileCheck },
        { href: "/credito/cgi/propostas", label: "Propostas", icon: PenTool },
        { href: "/credito/cgi/acompanhamento", label: "Acompanhamento", icon: FileSearch },
        { href: "/credito/cgi/equipe", label: "Equipe", icon: Users },
        { href: "/credito/cgi/relatorios", label: "Relatórios", icon: ScrollText },
      ];
    } else if (location === "/credito/pj" || location === "/simulador-credito-pj") {
      return [
        { href: "/credito/pj", label: "Visão geral", icon: Home },
        { href: "/simulador-credito-pj", label: "Simulação", icon: Calculator },
        { href: "/credito/pj/aprovacao", label: "Aprovação", icon: FileCheck },
        { href: "/credito/pj/propostas", label: "Propostas", icon: PenTool },
        { href: "/credito/pj/acompanhamento", label: "Acompanhamento", icon: FileSearch },
        { href: "/credito/pj/equipe", label: "Equipe", icon: Users },
        { href: "/credito/pj/relatorios", label: "Relatórios", icon: ScrollText },
      ];
    }
    return [];
  };


  const handleLogout = async () => {
    try {
      await logout();
    } catch (error: any) {
      console.error("Error logging out:", error);
    }
  };

  const getUserInitials = () => {
    if (!user?.firstName || !user?.lastName) return "U";
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  // Função para obter título e classe responsiva
  const getTitleInfo = () => {
    // Se há um título dinâmico (para páginas como PropertyDetails), usar ele
    if (dynamicPageTitle) {
      return { title: dynamicPageTitle, class: getTitleClass(dynamicPageTitle) };
    }

    // Verificar se é uma rota de detalhes de propriedade
    if (location.startsWith('/property/')) {
      // Para rotas de propriedade, usar título genérico até o dinâmico carregar
      return { title: "Detalhes do Imóvel", class: getTitleClass("Detalhes do Imóvel") };
    }


    // Primeiro, verificar se é uma rota do navigationItems
    const navItem = navigationItems.find((item: any) => item.href === location);
    if (navItem) return { title: navItem.label, class: getTitleClass(navItem.label) };

    // Admin routes removed


    // Se não, verificar se é um simulador
    const simulator = simulatorsConfig.find((sim: any) => sim.href === location);
    if (simulator) return { title: simulator.label, class: getTitleClass(simulator.label) };

    // Default para Dashboard
    return { title: "Dashboard", class: getTitleClass("Dashboard") };
  };

  // Função para determinar o tamanho da fonte do título padronizado
  const getTitleClass = (title: string) => {
    // Usar classe customizada para evitar override do CSS global
    return "header-title-sm font-semibold text-white truncate";
  };

  return (
    <div className="min-h-screen bg-background flex transition-colors duration-200">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-[#001f3f] to-[#004286] transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } ${sidebarCollapsed ? "w-14 shadow-2xl shadow-black/40" : "w-60 shadow-lg"
          } ${showCreditoSidebar ? 'sidebar-smooth-transition' : 'sidebar-smooth-transition-fast'}`}
        style={sidebarCollapsed ? {
          boxShadow: '6px 0 25px rgba(0, 0, 0, 0.5), 3px 0 15px rgba(0, 0, 0, 0.3), 1px 0 5px rgba(0, 0, 0, 0.2)',
          zIndex: 60
        } : {}}
      >
        <div className={`flex items-center h-16 border-b border-white/10 ${showCreditoSidebar ? 'sidebar-content-transition' : 'sidebar-content-transition-fast'} ${sidebarCollapsed ? "px-2" : "px-3"}`}>
          <div className={`flex items-center w-full ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
            {/* Logo - condicional baseado no estado da sidebar */}
            {!sidebarCollapsed && (
              <div className="flex items-center">
                {/* Logo completa - apenas quando sidebar expandida */}
                <>
                  {/* Imagem principal */}
                  <img
                    src={logoImage}
                    alt="Ventus Hub"
                    className="w-[120px] h-auto max-h-12"
                    title="Ventus Hub"
                    onLoad={() => console.log('✅ Logo carregada com sucesso')}
                    onError={(e) => {
                      console.error('❌ Erro ao carregar logo:', e);
                    }}
                  />

                  {/* Fallback texto - sempre presente como backup */}
                  <div
                    className="px-3 py-1 bg-white/20 rounded text-white text-sm font-bold opacity-0"
                    style={{ position: 'absolute', pointerEvents: 'none' }}
                    title="Ventus Hub"
                  >
                    VENTUS HUB
                  </div>
                </>
              </div>
            )}

            {/* Hamburger Menu - posição dinâmica: centro quando colapsada, direita quando expandida */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white hover:bg-white/10 transition-all duration-200 hidden lg:flex group"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={sidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
            >
              <Menu className="h-4 w-4 transition-colors duration-200 group-hover:text-[#fdd700]" />
            </Button>

            {/* Botão de fechar apenas para mobile */}
            {!sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10 shrink-0 lg:hidden transition-all duration-300 ease-in-out"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        <nav className={`mt-6 ${showCreditoSidebar ? 'sidebar-content-transition' : 'sidebar-content-transition-fast'} ${sidebarCollapsed ? "px-1" : "px-3"}`}>
          <div className={isMobile ? "space-y-2" : "space-y-1"}>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;

              // Special handling for Crédito with submenu
              if (item.href === "/credito") {
                return (
                  <div key={item.href}>
                    <div
                      className={`flex items-center rounded-md transition-all duration-300 ease-in-out cursor-pointer ${sidebarCollapsed ? "px-2 py-2" : "px-3"} ${isActive || location.startsWith("/credito") || location.includes("simulador-financiamento") || location.includes("simulador-cgi") || location.includes("simulador-credito-pj")
                        ? "bg-white/20 text-white border-r-2 border-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                        } ${sidebarCollapsed ? "justify-center hover:bg-white/20 hover:shadow-lg" : ""} ${isMobile ? "py-3 text-base font-medium" : "py-2 text-sm font-medium"}`}
                      style={sidebarCollapsed ? {
                        filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
                      } : {}}
                      title={sidebarCollapsed ? item.label : ""}
                      onClick={() => {
                        if (sidebarCollapsed) {
                          // Se sidebar está colapsada, expandir primeiro
                          setSidebarCollapsed(false);
                        } else {
                          // Toggle do submenu de crédito
                          setShowCreditoSidebar(!showCreditoSidebar);
                        }

                        // Fechar sidebar no mobile após clicar
                        if (window.innerWidth < 1024) {
                          setSidebarOpen(false);
                        }
                      }}
                    >
                      <Icon className={`h-5 w-5 ${sidebarCollapsed ? "" : "mr-3"}`} />
                      {!sidebarCollapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showCreditoSidebar ? 'rotate-180' : ''}`} />
                        </>
                      )}
                    </div>

                    {/* Submenu de Crédito */}
                    <AnimatePresence>
                      {showCreditoSidebar && !sidebarCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="ml-6 mt-2 space-y-1 border-l border-white/20 pl-4">
                            <Link href="/credito/financiamento">
                              <div className={`flex items-center px-3 py-2 text-sm rounded-md transition-all duration-200 cursor-pointer ${location === "/credito/financiamento" || location === "/simulador-financiamento"
                                ? "bg-blue-600/20 text-blue-200 border-r-2 border-blue-400"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                                }`}>
                                <div className="w-2 h-2 bg-blue-400 rounded-full mr-3"></div>
                                <span>Financiamento</span>
                              </div>
                            </Link>

                            <Link href="/credito/consorcio">
                              <div className={`flex items-center px-3 py-2 text-sm rounded-md transition-all duration-200 cursor-pointer ${location === "/credito/consorcio"
                                ? "bg-red-600/20 text-red-200 border-r-2 border-red-400"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                                }`}>
                                <div className="w-2 h-2 bg-red-400 rounded-full mr-3"></div>
                                <span>Consórcio</span>
                              </div>
                            </Link>

                            <Link href="/credito/cgi">
                              <div className={`flex items-center px-3 py-2 text-sm rounded-md transition-all duration-200 cursor-pointer ${location === "/credito/cgi" || location === "/simulador-cgi"
                                ? "bg-emerald-600/20 text-emerald-200 border-r-2 border-emerald-400"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                                }`}>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></div>
                                <span>CGI</span>
                              </div>
                            </Link>

                            <Link href="/credito/pj">
                              <div className={`flex items-center px-3 py-2 text-sm rounded-md transition-all duration-200 cursor-pointer ${location === "/credito/pj" || location === "/simulador-credito-pj"
                                ? "bg-yellow-600/20 text-yellow-200 border-r-2 border-yellow-400"
                                : "text-white/70 hover:bg-white/10 hover:text-white"
                                }`}>
                                <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3"></div>
                                <span>Crédito PJ</span>
                              </div>
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              }

              // Regular navigation items
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center rounded-md transition-all duration-300 ease-in-out cursor-pointer ${sidebarCollapsed ? "px-2 py-2" : "px-3"} ${isActive
                      ? "bg-white/20 text-white border-r-2 border-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                      } ${sidebarCollapsed ? "justify-center hover:bg-white/20 hover:shadow-lg" : ""
                      } ${isMobile ? "py-3 text-base font-medium" : "py-2 text-sm font-medium"}`}
                    style={sidebarCollapsed ? {
                      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
                    } : {}}
                    title={sidebarCollapsed ? item.label : ""}
                    onClick={() => {
                      // Fechar sidebar no mobile após clicar
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }
                    }}
                  >
                    <Icon className={`h-5 w-5 ${sidebarCollapsed ? "" : "mr-3"}`} />
                    {!sidebarCollapsed && item.label}
                  </div>
                </Link>
              );
            })}

            {/* Admin Section removed - functionalities not needed */}

          </div>
        </nav>

        <div className={`absolute bottom-4 left-0 right-0 ${showCreditoSidebar ? 'sidebar-content-transition' : 'sidebar-content-transition-fast'} ${sidebarCollapsed ? "px-1" : "px-3"}`}>
          <Link href="/configuracoes">
            <div className={`flex items-center text-white/80 cursor-pointer hover:bg-white/10 rounded-md transition-all duration-300 ease-in-out ${sidebarCollapsed ? "px-2 py-2" : "px-3"} ${sidebarCollapsed ? "justify-center hover:bg-white/20 hover:shadow-lg" : ""
              } ${isMobile ? "py-3 text-base" : "py-2 text-sm"}`}
              style={sidebarCollapsed ? {
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))'
              } : {}}
              title={sidebarCollapsed ? "Configurações" : ""}
            >
              <Settings className={`h-5 w-5 ${sidebarCollapsed ? "" : "mr-3"}`} />
              {!sidebarCollapsed && "Configurações"}
            </div>
          </Link>
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
      <header
        className={cn(
          `fixed top-0 z-40 bg-gradient-to-r from-[#001f3f] to-[#004286] border-b border-white/10 shadow-sm h-16`,
          'layout-transition-fast',
          // Mobile: sempre de left-0 a right-0
          "left-0 right-0",
          // Desktop: ajuste baseado no estado da sidebar
          "lg:left-auto lg:right-0",
          sidebarCollapsed ? "lg:left-14" : "lg:left-60"
        )}
      >
        <div className="flex items-center justify-between h-full px-4 lg:px-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-white/10 p-2"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5 text-white" />
            </Button>

            {/* Separador visual apenas no mobile */}
            <div className="lg:hidden w-px h-6 bg-white/20 mx-3"></div>

            {(() => {
              // Verificar se é uma página de crédito para mostrar título especial
              if (location.startsWith('/credito/') || location.startsWith('/simulador-')) {
                const theme = getCurrentTheme();
                return (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 ${theme.classes.dotBg} rounded-full animate-pulse`}></div>
                      <span className="text-sm font-semibold text-white">
                        {theme.name}
                      </span>
                    </div>
                  </div>
                );
              }

              // Título padrão para outras páginas
              const titleInfo = getTitleInfo();
              return (
                <div className="flex items-center space-x-3">
                  <h1 className={titleInfo.class}>
                    {titleInfo.title}
                  </h1>
                </div>
              );
            })()}
          </div>

          <div className="flex items-center space-x-4">
            {/* Simulators Dropdown - Hidden on mobile */}
            <div
              className="hidden lg:block"
              onMouseEnter={() => {
                // Cancelar timeout se o mouse voltar
                if (mouseLeaveTimeoutRef.current) {
                  clearTimeout(mouseLeaveTimeoutRef.current);
                  mouseLeaveTimeoutRef.current = null;
                }
              }}
              onMouseLeave={() => {
                // Só fechar se o dropdown estiver aberto, com delay
                if (isSimulatorsOpen) {
                  mouseLeaveTimeoutRef.current = setTimeout(() => {
                    setIsSimulatorsOpen(false);
                  }, 800); // 800ms de delay para dar tempo do usuário entrar no menu
                }
              }}
            >
              <DropdownMenu open={isSimulatorsOpen} onOpenChange={(open) => {
                // Permitir apenas abertura manual via clique do botão
                if (!open) {
                  setIsSimulatorsOpen(false);
                }
              }}>
                <DropdownMenuTrigger asChild>
                  <Button
                    ref={calculatorButtonRef}
                    variant="ghost"
                    size={isMobile ? "default" : "sm"}
                    className={`${isMobile ? 'h-10 min-w-[44px]' : 'h-8'} w-auto px-2 text-white hover:bg-white/10 flex items-center gap-2 ${isTouchDevice ? 'touch-target' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setIsSimulatorsOpen(!isSimulatorsOpen);
                    }}
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
                          SIMULADORES
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-80 max-h-[600px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 shadow-xl rounded-xl p-1 relative"
                >
                  {/* Efeito de brilho */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10 pointer-events-none"></div>

                  <div className="relative space-y-0.5">
                    {getSortedSimulators().map((simulator) => {
                      const Icon = simulator.icon;
                      return (
                        <DropdownMenuItem
                          key={simulator.id}
                          className="p-0 focus:bg-transparent"
                          onSelect={(e) => {
                            e.preventDefault();
                            handleSimulatorClick(simulator.id);
                            setIsSimulatorsOpen(false);
                            // Navegar após fechar
                            setTimeout(() => {
                              setLocation(simulator.href);
                            }, 100);
                          }}
                        >
                          <div className="group w-full"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSimulatorClick(simulator.id);
                              setIsSimulatorsOpen(false);
                              // Navegar após fechar
                              setTimeout(() => {
                                setLocation(simulator.href);
                              }, 100);
                            }}
                          >
                            <div className={`flex items-center px-2 py-1.5 text-sm font-medium rounded-md transition-all duration-300 cursor-pointer transform hover:scale-[1.01] text-gray-700 dark:text-gray-300 hover:bg-gradient-to-r hover:${simulator.bgColor} dark:hover:${simulator.darkBgColor} hover:${simulator.textColor} dark:hover:${simulator.darkTextColor} hover:shadow-sm`}>
                              <div className={`p-1 rounded-full ${simulator.iconBg} dark:${simulator.darkIconBg} mr-2 transition-all duration-300 group-hover:${simulator.iconBgHover} dark:group-hover:${simulator.darkIconBgHover}`}>
                                <Icon className={`h-2.5 w-2.5 ${simulator.iconColor} dark:${simulator.darkIconColor}`} />
                              </div>
                              <span className="font-medium text-xs flex-1">{simulator.label}</span>
                              <div className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <ChevronRight className="h-2.5 w-2.5" />
                              </div>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      );
                    })}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Mobile-only icons: Search and Bell */}
            <div className="flex items-center space-x-3 lg:hidden">
              {/* Search Icon */}
              <Button
                variant="ghost"
                size="sm"
                className="h-10 w-10 min-w-[44px] text-white hover:bg-white/10 touch-target"
                onClick={() => {
                  // TODO: Implementar funcionalidade de busca
                  console.log('Busca clicada');
                }}
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Mobile Notification Center */}
              <NotificationCenter
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative h-10 w-10 min-w-[44px] text-white hover:bg-white/10 touch-target"
                  >
                    <Bell className="h-5 w-5" />
                    {hasUnread && (
                      <span className={`absolute -top-1 -right-1 h-4 w-4 ${hasUrgent ? 'bg-red-500' : 'bg-blue-500'} rounded-full text-xs text-white flex items-center justify-center`}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>
                }
              />
            </div>

            {/* Organization Selector - Temporarily disabled */}
            {/* <div className="hidden lg:block">
              <OrganizationSelector 
                variant="dropdown"
                showRole={true}
                showPlan={false}
                className="h-9 text-white border-white/20 hover:bg-white/10"
              />
            </div> */}

            {/* Documentos Úteis Button */}
            <div className="hidden lg:block">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size={isMobile ? "default" : "sm"}
                      className={`${isMobile ? 'h-10 w-10 min-w-[44px]' : 'h-8 w-8'} text-white hover:bg-white/10 ${isTouchDevice ? 'touch-target' : ''}`}
                      onClick={() => {
                        setLocation('/documentos-uteis');
                      }}
                    >
                      <FileText className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Documentos Úteis</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Desktop Notifications */}
            <div className="hidden lg:block">
              <NotificationCenter
                trigger={
                  <Button
                    variant="ghost"
                    size={isMobile ? "default" : "sm"}
                    className={`relative ${isMobile ? 'h-10 w-10 min-w-[44px]' : 'h-8 w-8'} text-white hover:bg-white/10 ${isTouchDevice ? 'touch-target' : ''}`}
                  >
                    <Bell className="h-5 w-5" />
                    {hasUnread && (
                      <span className={`absolute -top-1 -right-1 h-4 w-4 ${hasUrgent ? 'bg-red-500' : 'bg-blue-500'} rounded-full text-xs text-white flex items-center justify-center`}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>
                }
              />
            </div>

            {/* User menu - atualizado para mostrar avatar - Hidden on mobile */}
            <div className="hidden lg:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`relative ${isMobile ? 'h-10 w-10 min-w-[44px]' : 'h-8 w-8'} rounded-full hover:bg-white/10 ${isTouchDevice ? 'touch-target' : ''}`}
                  >
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
        </div>
      </header>

      {/* Horizontal Credit Navigation - Compact Design */}
      <AnimatePresence>
        {showCreditoHorizontalNav && (
          <motion.nav
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={cn(
              "fixed z-30 bg-white/97 backdrop-blur-md border-b shadow-sm",
              "left-0 right-0 top-16",
              "lg:left-auto lg:right-0",
              sidebarCollapsed ? "lg:left-14" : "lg:left-60"
            )}
            style={{
              background: `linear-gradient(135deg, rgba(${currentTheme.primaryRgb}, 0.03) 0%, rgba(255, 255, 255, 0.97) 100%)`,
              borderBottomColor: `rgba(${currentTheme.primaryRgb}, 0.15)`,
              backdropFilter: 'blur(12px)'
            }}
          >
            <div className="px-3 lg:px-4 py-1.5">
              {/* Navigation Items */}
              <div className="-mx-1">
                {/* Desktop: Horizontal scroll */}
                <div className="hidden lg:block">
                  <div className="flex items-center space-x-0.5 overflow-x-auto scrollbar-hide">
                    {getCreditoItems().map((item) => {
                      const Icon = item.icon;
                      const isActive = location === item.href;

                      return (
                        <Link key={item.href} href={item.href}>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            className={cn(
                              "flex items-center px-2.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer whitespace-nowrap group",
                              isActive
                                ? `bg-gradient-to-r ${currentTheme.classes.itemActive} text-white shadow-md`
                                : `text-gray-600 hover:text-gray-800 hover:bg-gray-50/80 border border-transparent hover:border-gray-200/50`
                            )}
                          >
                            <div className={cn(
                              "p-0.5 rounded mr-1.5 transition-all duration-200",
                              isActive
                                ? "bg-white/20"
                                : "bg-gray-100/50 group-hover:bg-gray-200/60"
                            )}>
                              <Icon className={cn(
                                "h-3 w-3",
                                isActive ? "text-white" : `text-gray-500 group-hover:${currentTheme.classes.iconText}`
                              )} />
                            </div>
                            <span className="font-medium text-xs">{item.label}</span>
                            {isActive && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="w-1 h-1 bg-white rounded-full ml-1.5"
                              />
                            )}
                          </motion.div>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile: Compact grid layout */}
                <div className="lg:hidden">
                  <div className="grid grid-cols-2 gap-1.5">
                    {getCreditoItems().map((item) => {
                      const Icon = item.icon;
                      const isActive = location === item.href;

                      return (
                        <Link key={item.href} href={item.href}>
                          <motion.div
                            whileTap={{ scale: 0.96 }}
                            className={cn(
                              "flex items-center px-2 py-2 text-xs font-medium rounded-md transition-all duration-200 cursor-pointer",
                              isActive
                                ? `bg-gradient-to-r ${currentTheme.classes.itemActive} text-white shadow-md`
                                : `text-gray-600 hover:text-gray-800 bg-gray-50/50 border border-gray-200/50`
                            )}
                            onClick={() => {
                              // Auto-hide on mobile after selection
                              setTimeout(() => setShowCreditoHorizontalNav(false), 300);
                            }}
                          >
                            <div className={cn(
                              "p-0.5 rounded mr-1.5 transition-all duration-200",
                              isActive
                                ? "bg-white/20"
                                : "bg-gray-200/50"
                            )}>
                              <Icon className={cn(
                                "h-3 w-3",
                                isActive ? "text-white" : "text-gray-500"
                              )} />
                            </div>
                            <span className="text-xs font-medium truncate">{item.label}</span>
                            {isActive && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-1 h-1 bg-white rounded-full ml-auto"
                              />
                            )}
                          </motion.div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Page content */}
      <main className={cn(
        "flex-1 overflow-auto transition-all duration-300",
        // Padding-top: base header + compact horizontal nav if visible
        showCreditoHorizontalNav ? "pt-[88px]" : "pt-16",
        // Mobile: sem margem lateral, Desktop: margem baseada no estado da sidebar
        "ml-0",
        sidebarCollapsed ? "lg:ml-14" : "lg:ml-60",
        isMobile ? "mobile-padding" : "",
        showBottomNav ? "pb-20" : ""
      )}>
        <div className={isMobile ? "mobile-bottom-safe" : ""}>
          {/* Verificar se tem organização selecionada - Temporarily disabled */}
          {/* {!currentOrganization ? (
            <NoOrganizationSelected />
          ) : (
            children
          )} */}
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {showBottomNav && (
        <motion.div
          initial={prefersReducedMotion ? undefined : { y: 100 }}
          animate={prefersReducedMotion ? undefined : { y: 0 }}
          transition={prefersReducedMotion ? undefined : { duration: 0.3 }}
        >
          <BottomNavigation />
        </motion.div>
      )}

    </div>
  );
}