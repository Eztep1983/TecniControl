"use client";

import { motion, AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";

const TAB_ORDER = [
  "/ordenes",
  "/clientes",
  "/tareas-repuestos",
  "/configuracion"
];

function getTabIndex(path: string) {
  // Encontrar la coincidencia más larga para manejar subrutas correctamente
  let matchIndex = -1;
  let longestMatch = 0;
  
  TAB_ORDER.forEach((tab, index) => {
    if (path.startsWith(tab) && tab.length > longestMatch) {
      longestMatch = tab.length;
      matchIndex = index;
    }
  });
  
  return matchIndex === -1 ? 0 : matchIndex;
}

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const [direction, setDirection] = useState(1);

  // Determinar dirección ANTES de renderizar calculando en base al ref actual y el nuevo pathname
  const currentDirection = (() => {
    const prevIndex = getTabIndex(prevPathname.current);
    const currentIndex = getTabIndex(pathname);
    if (currentIndex > prevIndex) return 1;
    if (currentIndex < prevIndex) return -1;
    // Si estamos en la misma pestaña pero diferente ruta (ej. entrando a detalle)
    if (pathname.length > prevPathname.current.length) return 1;
    if (pathname.length < prevPathname.current.length) return -1;
    return 0; // Same path or fallback
  })();

  useEffect(() => {
    prevPathname.current = pathname;
  }, [pathname]);

  const variants = {
    initial: (dir: number) => ({
      x: dir > 0 ? 20 : dir < 0 ? -20 : 0,
      opacity: 0,
    }),
    animate: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -20 : dir < 0 ? 20 : 0,
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence mode="wait" custom={currentDirection}>
      <motion.div
        key={pathname}
        custom={currentDirection}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.15, ease: "easeInOut" }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
