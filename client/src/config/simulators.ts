import { LucideIcon } from "lucide-react";
import {
  FileText, Home, Search, DollarSign, ArrowRightLeft, Scale, Repeat, BarChart2,
  TrendingUp, Target, PiggyBank, Shield, Briefcase, BarChart3, Circle
} from "lucide-react";

interface SimulatorConfig {
  id: string;
  href: string;
  label: string;
  icon: LucideIcon;
  bgColor: string;
  darkBgColor: string;
  textColor: string;
  darkTextColor: string;
  iconBg: string;
  darkIconBg: string;
  iconBgHover: string;
  darkIconBgHover: string;
  iconColor: string;
  darkIconColor: string;
}

export const simulatorsConfig: SimulatorConfig[] = [
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
    id: 'simulador-credito-pj',
    href: '/simulador-credito-pj',
    label: 'Crédito PJ',
    icon: Briefcase,
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
  }
];
