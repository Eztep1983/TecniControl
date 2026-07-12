"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/basic/avatar";
import { Button } from "@/components/ui/basic/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/basic/dropdown-menu";
import { LogOut, User, Settings } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";

export function UserProfile() {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 hover:bg-transparent focus-visible:ring-1 focus-visible:ring-blue-500 transition-all hover:scale-105 active:scale-95">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 p-[1.5px] shadow-lg shadow-blue-500/20">
            <Avatar className="h-full w-full border-2 dark:border-gray-800 border-gray-200">
              <AvatarImage src={user.photoURL ?? ""} alt={user.displayName ?? "User"} className="object-cover" />
              <AvatarFallback className="dark:bg-gray-800 bg-gray-200 text-blue-400 font-bold text-xs">
                {getInitials(user.displayName)}
              </AvatarFallback>
            </Avatar>
          </div>
          {/* Status online indicator */}
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 dark:border-gray-800 border-gray-200 bg-green-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 dark:bg-gray-900/95 bg-gray-100/95 dark:border-gray-700 border-gray-300 dark:text-gray-200 text-gray-800 shadow-2xl" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border dark:border-gray-700 border-gray-300 shadow-inner">
                <AvatarImage src={user.photoURL ?? ""} alt={user.displayName ?? "User"} />
                <AvatarFallback className="dark:bg-gray-800 bg-gray-200 text-blue-400">{getInitials(user.displayName)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <p className="text-sm font-semibold leading-none truncate dark:text-white text-gray-900">{user.displayName}</p>
                <p className="text-xs leading-none dark:text-gray-400 text-gray-600 truncate mt-1">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator className="dark:bg-gray-800 bg-gray-200" />
        
        <DropdownMenuGroup className="p-1">
          <Link href="/configuracion">
            <DropdownMenuItem className="cursor-pointer focus:dark:bg-gray-800 focus:bg-gray-200 focus:dark:text-white focus:text-gray-900 rounded-md transition-colors py-2 px-3 group">
              <User className="mr-2 h-4 w-4 text-blue-400 transition-transform group-hover:scale-110" />
              <span className="font-medium text-sm">Mi Perfil</span>
            </DropdownMenuItem>
          </Link>

        </DropdownMenuGroup>
        
        <DropdownMenuSeparator className="dark:bg-gray-800 bg-gray-200" />
        
        <div className="p-1">
          <DropdownMenuItem 
            onClick={logout} 
            className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400 rounded-md py-2 px-3 font-medium transition-all"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span className="text-sm">Cerrar sesión</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
