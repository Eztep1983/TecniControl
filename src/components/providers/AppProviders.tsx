// src/components/providers/AppProviders.tsx
"use client";

import React from "react";
import QueryProvider from "@/components/providers/QueryProvider";
import CapacitorProvider from "@/components/providers/CapacitorProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { OfflineSyncProvider } from "@/components/providers/OfflineSyncProvider";
import { FirestoreSyncProvider } from "@/components/providers/FirestoreSyncProvider";
import { AuthGuard } from "@/components/auth/AuthGuard";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <CapacitorProvider>
        <AuthProvider>
          <OfflineSyncProvider>
            <FirestoreSyncProvider>
              <AuthGuard>{children}</AuthGuard>
            </FirestoreSyncProvider>
          </OfflineSyncProvider>
        </AuthProvider>
      </CapacitorProvider>
    </QueryProvider>
  );
}
