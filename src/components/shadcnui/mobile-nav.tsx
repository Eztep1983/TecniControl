"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Package, Users, Plus, ClipboardList, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleNuevaOrden = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === '/ordenes') {
      window.dispatchEvent(new CustomEvent('open-nueva-orden'));
    } else {
      router.push('/ordenes?nueva=true');
    }
  };

  const navItems = [
    { name: "Órdenes", href: "/ordenes", icon: Package },
    { name: "Clientes", href: "/clientes", icon: Users },
  ];

  const rightItems = [
    { name: "Tareas", href: "/tareas-repuestos", icon: ClipboardList },
    { name: "Ajustes", href: "/configuracion", icon: Settings },
  ];

  return (
    <nav id="mobile-nav" className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 sm:hidden pb-safe">
      <div className="flex h-full items-center justify-around px-2 relative">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href) && item.href !== "/" || pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative",
                isActive ? "text-blue-500" : "text-gray-400 hover:text-gray-300"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
              {isActive && (
                <span className="absolute -top-[1px] w-8 h-1 bg-blue-500 rounded-b-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              )}
            </Link>
          );
        })}

        {/* Central FAB */}
        <div className="relative -top-5 flex justify-center w-full max-w-[80px]">
          <button
            onClick={handleNuevaOrden}
            className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-500/40 border-4 border-gray-900 transition-transform active:scale-95"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        {rightItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative",
                isActive ? "text-blue-500" : "text-gray-400 hover:text-gray-300"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.name}</span>
              {isActive && (
                <span className="absolute -top-[1px] w-8 h-1 bg-blue-500 rounded-b-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
