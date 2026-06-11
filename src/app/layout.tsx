// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
// @ts-ignore: side-effect import of CSS - handled by Next.js
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider"; 
import { AuthGuard } from "@/components/auth/AuthGuard";
import QueryProvider from "@/components/providers/QueryProvider";
import CapacitorProvider from "@/components/providers/CapacitorProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "TecniControl - Gestión de Servicios",
  description: "Gestiona tus órdenes de servicio con facilidad.",
  icons: {
    icon: "data:,",
  },
};

import { FirestoreSyncProvider } from "@/components/providers/FirestoreSyncProvider";
import { OfflineSyncProvider } from "@/components/providers/OfflineSyncProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body className="h-full">
        <QueryProvider>
          <CapacitorProvider>
            <AuthProvider>
              <OfflineSyncProvider>
                <FirestoreSyncProvider>
                  <AuthGuard>
                    {children}
                  </AuthGuard>
                </FirestoreSyncProvider>
              </OfflineSyncProvider>
            </AuthProvider>
          </CapacitorProvider>
        </QueryProvider>
      </body>
    </html>
  )
}