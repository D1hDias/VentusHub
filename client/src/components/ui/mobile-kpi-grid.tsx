import { ReactNode } from "react";
import { motion } from "framer-motion";

interface MobileKPIGridProps {
  children: ReactNode;
  variants?: any;
  itemVariants?: any;
}

export function MobileKPIGrid({ children, variants, itemVariants }: MobileKPIGridProps) {
  return (
    <motion.div 
      variants={variants}
      className="grid grid-cols-2 gap-2 w-full"
    >
      {children}
    </motion.div>
  );
}

interface MobileKPIItemProps {
  children: ReactNode;
  variants?: any;
  index?: number;
}

export function MobileKPIItem({ children, variants, index }: MobileKPIItemProps) {
  return (
    <motion.div
      variants={variants}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}