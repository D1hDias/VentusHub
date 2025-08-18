import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { PageLoader } from './PageLoader';

interface PageLoadingWrapperProps {
  children: React.ReactNode;
  loadingDuration?: number;
  showOnNavigation?: boolean;
}

export function PageLoadingWrapper({ 
  children, 
  loadingDuration = 1000,
  showOnNavigation = true 
}: PageLoadingWrapperProps) {
  const [location] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Carregando...');

  useEffect(() => {
    if (!showOnNavigation) return;

    // Definir mensagem baseada na rota
    const getLoadingMessage = (path: string) => {
      if (path.includes('/dashboard')) return 'Carregando dashboard...';
      if (path.includes('/properties') || path.includes('/property')) return 'Carregando propriedades...';
      if (path.includes('/clients') || path.includes('/clientes')) return 'Carregando clientes...';
      if (path.includes('/timeline')) return 'Carregando timeline...';
      if (path.includes('/contracts') || path.includes('/contratos')) return 'Carregando contratos...';
      if (path.includes('/proposals') || path.includes('/propostas')) return 'Carregando propostas...';
      if (path.includes('/simulador')) return 'Carregando simulador...';
      if (path.includes('/financiamento')) return 'Carregando simulador de financiamento...';
      if (path.includes('/settings') || path.includes('/configuracoes')) return 'Carregando configurações...';
      if (path.includes('/notifications') || path.includes('/notificacoes')) return 'Carregando notificações...';
      return 'Carregando página...';
    };

    setLoadingMessage(getLoadingMessage(location));
    setIsLoading(true);

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, loadingDuration);

    return () => clearTimeout(timer);
  }, [location, loadingDuration, showOnNavigation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <PageLoader 
          size="lg" 
          message={loadingMessage}
        />
      </div>
    );
  }

  return <>{children}</>;
}

// Hook personalizado para controlar o loading manualmente
export function usePageLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Carregando...');

  const showLoading = (loadingMessage?: string) => {
    if (loadingMessage) setMessage(loadingMessage);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  const LoadingComponent = () => {
    if (!isLoading) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center z-50">
        <PageLoader 
          size="lg" 
          message={message}
        />
      </div>
    );
  };

  return {
    isLoading,
    showLoading,
    hideLoading,
    LoadingComponent
  };
}