// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider"; 
import { Toaster } from "@/components/ui/basic/toaster";
import { cn } from "@/lib/utils";
// import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthGuard } from "@/components/auth/AuthGuard";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "TecniControl - Gestión de Servicios",
  description: "Gestiona tus órdenes de servicio con facilidad.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={cn(
          "h-full font-body antialiased",
          inter.variable
        )}
      >
        <AuthProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}