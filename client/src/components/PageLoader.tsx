import { motion } from "framer-motion";
import { FileText, Calculator, Building2, Search } from "lucide-react";
import { useResponsive } from "@/hooks/useMediaQuery";

interface PageLoaderProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: {
    container: "space-y-3",
    mainIcon: "h-8 w-8",
    orbitalIcon: "h-3 w-3",
    orbitalPositions: {
      calculator: "-top-1 -right-1",
      building: "-bottom-1 -left-1", 
      search: "top-0 -left-2"
    },
    text: "text-xs"
  },
  md: {
    container: "space-y-4",
    mainIcon: "h-12 w-12",
    orbitalIcon: "h-4 w-4",
    orbitalPositions: {
      calculator: "-top-1.5 -right-1.5",
      building: "-bottom-1.5 -left-1.5",
      search: "top-0 -left-3"
    },
    text: "text-sm"
  },
  lg: {
    container: "space-y-6",
    mainIcon: "h-16 w-16",
    orbitalIcon: "h-6 w-6",
    orbitalPositions: {
      calculator: "-top-2 -right-2",
      building: "-bottom-2 -left-2",
      search: "top-0 -left-4"
    },
    text: "text-base"
  }
};

export function PageLoader({ 
  message = "Carregando...", 
  size = "md", 
  className = "" 
}: PageLoaderProps) {
  const { prefersReducedMotion } = useResponsive();
  const sizeConfig = sizeClasses[size];
  
  // Force animations for loading indicator (override user preference for better UX)
  const forceAnimations = true;

  return (
    <div className={`flex flex-col items-center justify-center ${sizeConfig.container} ${className}`}>
      {/* Animated Icon System */}
      <div className="relative">
        {/* Main Central Icon */}
        <motion.div
          animate={prefersReducedMotion && !forceAnimations ? undefined : { rotate: 360 }}
          transition={prefersReducedMotion && !forceAnimations ? undefined : { 
            duration: 2, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="relative"
        >
          <FileText className={`${sizeConfig.mainIcon} text-primary`} />
        </motion.div>

        {/* Orbital Icon 1: Calculator */}
        <motion.div
          animate={prefersReducedMotion && !forceAnimations ? undefined : { rotate: -360 }}
          transition={prefersReducedMotion && !forceAnimations ? undefined : { 
            duration: 3, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className={`absolute ${sizeConfig.orbitalPositions.calculator}`}
        >
          <Calculator className={`${sizeConfig.orbitalIcon} text-green-600`} />
        </motion.div>

        {/* Orbital Icon 2: Building */}
        <motion.div
          animate={prefersReducedMotion && !forceAnimations ? undefined : { rotate: -360 }}
          transition={prefersReducedMotion && !forceAnimations ? undefined : { 
            duration: 4, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className={`absolute ${sizeConfig.orbitalPositions.building}`}
        >
          <Building2 className={`${sizeConfig.orbitalIcon} text-blue-600`} />
        </motion.div>

        {/* Orbital Icon 3: Search */}
        <motion.div
          animate={prefersReducedMotion && !forceAnimations ? undefined : { rotate: -360 }}
          transition={prefersReducedMotion && !forceAnimations ? undefined : { 
            duration: 3.5, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className={`absolute ${sizeConfig.orbitalPositions.search}`}
        >
          <Search className={`${sizeConfig.orbitalIcon} text-orange-600`} />
        </motion.div>
      </div>

      {/* Loading Message */}
      {message && (
        <motion.p
          initial={prefersReducedMotion && !forceAnimations ? undefined : { opacity: 0, y: 10 }}
          animate={prefersReducedMotion && !forceAnimations ? undefined : { opacity: 1, y: 0 }}
          transition={prefersReducedMotion && !forceAnimations ? undefined : { 
            duration: 0.3,
            delay: 0.1 
          }}
          className={`text-center font-medium text-gray-700 dark:text-gray-200 ${sizeConfig.text}`}
        >
          {message}
        </motion.p>
      )}

      {/* Subtle pulse indicator */}
      <motion.div
        animate={prefersReducedMotion && !forceAnimations ? undefined : { 
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5] 
        }}
        transition={prefersReducedMotion && !forceAnimations ? undefined : { 
          duration: 1.5, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="h-1 w-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
      />
    </div>
  );
}