import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useResponsive } from '@/hooks/useMediaQuery';
import { useAuth } from '@/hooks/useAuth';
import { 
  Home, 
  Plus,
  Calculator,
  User,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InteractiveMenu } from '@/components/ui/modern-mobile-menu';

/**
 * Modern Bottom Navigation Bar with Submenu Support
 * 
 * Features:
 * - Interactive animated menu with icons and labels
 * - Support for 2-5 menu items with automatic validation
 * - Sliding bottom sheet submenu for "Novo" section
 * - Customizable accent colors matching VentusHub brand
 * - Bounce animations for icons on activation
 * - Avatar support for user profile
 * - Mobile-only display (controlled by Layout component via showBottomNav)
 * - Clean modern design with smooth transitions
 * - Touch-optimized submenu with proper safe area handling
 * 
 * Navigation Structure:
 * - Dashboard: Direct navigation to /dashboard
 * - Novo: Shows submenu with 6 options (Captação, Proprietário, etc.)
 * - Simuladores: Direct navigation (to be updated with submenu later)
 * - Perfil: Direct navigation to settings
 * 
 * Integration: Uses InteractiveMenu component from modern-mobile-menu.tsx
 * The submenu system uses shadcn/ui Sheet component with bottom slide animation
 */
export const BottomNavigation: React.FC = () => {
  const handleItemClick = (item: any, index: number) => {
    // Optional callback for analytics or additional behavior
    // Currently used for development logging
    console.log(`Mobile navigation: ${item.label} selected`, item);
  };

  return (
    <InteractiveMenu 
      onItemClick={handleItemClick}
      accentColor="var(--primary)" // Uses VentusHub primary blue color
    />
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
// Note: Este hook está sendo usado em Layout.tsx
export function useMobileNavigation() {
  const { isMobile } = useResponsive();
  
  return {
    showBottomNav: isMobile,
    showMobileHeader: isMobile,
    shouldHideSidebar: isMobile
  };
}

// Remove default export to fix HMR issues
// Use named export instead: import { BottomNavigation } from './MobileNavigation'