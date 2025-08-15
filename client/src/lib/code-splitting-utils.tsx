import { Suspense, lazy, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';
import { useDeviceInfo } from '@/hooks/use-mobile';

// Tipos para melhor TypeScript support
interface ResponsiveComponentOptions {
  mobilePath: string;
  desktopPath: string;
  fallback?: React.ComponentType;
  exportName?: string;
}

interface LazyComponentLoader {
  mobile: ComponentType<any>;
  desktop: ComponentType<any>;
  fallback: ComponentType;
}

/**
 * Loading component padrão para code splitting
 */
export const DefaultSuspenseFallback = ({ message = "Carregando..." }: { message?: string }) => (
  <div className="flex items-center justify-center min-h-[200px] p-6">
    <div className="text-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  </div>
);

/**
 * Cria lazy components para mobile e desktop com fallback
 */
export const createResponsiveLazyComponents = ({
  mobilePath,
  desktopPath,
  fallback = DefaultSuspenseFallback,
  exportName = 'default'
}: ResponsiveComponentOptions): LazyComponentLoader => {
  
  const mobile = lazy(() => {
    return import(mobilePath).then(module => ({
      default: exportName === 'default' ? module.default : module[exportName]
    }));
  });

  const desktop = lazy(() => {
    return import(desktopPath).then(module => ({
      default: exportName === 'default' ? module.default : module[exportName]
    }));
  });

  return {
    mobile,
    desktop,
    fallback
  };
};

/**
 * Hook para renderizar componente responsivo com code splitting
 */
export const useResponsiveLazyComponent = (
  lazyComponents: LazyComponentLoader,
  props: any = {}
) => {
  const { isMobile } = useDeviceInfo();
  const { mobile: Mobile, desktop: Desktop, fallback: Fallback } = lazyComponents;

  return (
    <Suspense fallback={<Fallback />}>
      {isMobile ? <Mobile {...props} /> : <Desktop {...props} />}
    </Suspense>
  );
};

/**
 * HOC para transformar um componente em responsivo com code splitting
 */
export const withResponsiveLazyLoading = <P extends object>(
  options: ResponsiveComponentOptions
) => {
  return (props: P) => {
    const lazyComponents = createResponsiveLazyComponents(options);
    return useResponsiveLazyComponent(lazyComponents, props);
  };
};

/**
 * Utilitário para criar loaders específicos por página
 */
export const createPageLoader = (pageName: string, customMessage?: string) => {
  const message = customMessage || `Carregando ${pageName}...`;
  
  return () => (
    <div className="container-mobile">
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-blue-600" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              {message}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Otimizando para seu dispositivo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Preload de componentes para melhor performance
 */
export const preloadResponsiveComponents = (
  mobilePath: string,
  desktopPath: string
) => {
  // Preload baseado no dispositivo atual
  const { isMobile } = useDeviceInfo();
  
  const preloadPath = isMobile ? mobilePath : desktopPath;
  
  // Preload do componente necessário
  import(preloadPath).catch(() => {
    // Silent fail - o lazy loading vai tentar novamente quando necessário
  });
  
  // Preload do componente alternativo com baixa prioridade
  setTimeout(() => {
    const alternativePath = isMobile ? desktopPath : mobilePath;
    import(alternativePath).catch(() => {
      // Silent fail
    });
  }, 1000);
};