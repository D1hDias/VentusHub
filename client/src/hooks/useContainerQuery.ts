import { useEffect, useRef, useState } from 'react';

/**
 * Hook para container queries usando ResizeObserver
 * @param breakpoints - Objeto com breakpoints { sm: 400, md: 600, lg: 800 }
 * @returns [ref, currentBreakpoint, width]
 */
export function useContainerQuery<T extends Record<string, number>>(
  breakpoints: T
) {
  const ref = useRef<HTMLElement>(null);
  const [width, setWidth] = useState(0);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<keyof T | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        setWidth(newWidth);

        // Determinar breakpoint atual
        let current: keyof T | null = null;
        const sortedBreakpoints = Object.entries(breakpoints)
          .sort(([, a], [, b]) => (b as number) - (a as number));

        for (const [name, value] of sortedBreakpoints) {
          if (newWidth >= (value as number)) {
            current = name;
            break;
          }
        }

        setCurrentBreakpoint(current);
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [breakpoints]);

  return [ref, currentBreakpoint, width] as const;
}

/**
 * Hook simplificado para container queries comuns
 */
export function useContainerBreakpoints() {
  return useContainerQuery({
    sm: 400,
    md: 600,
    lg: 800,
    xl: 1000,
  });
}

/**
 * Hook para detectar se container é pequeno/grande
 */
export function useContainerSize(threshold = 500) {
  const ref = useRef<HTMLElement>(null);
  const [isSmall, setIsSmall] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setIsSmall(width < threshold);
      }
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [threshold]);

  return [ref, isSmall] as const;
}