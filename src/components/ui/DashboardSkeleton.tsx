// src/components/ui/DashboardSkeleton.tsx
import React from "react";

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex flex-col flex-1 p-4 pb-24">
        <div className="max-w-7xl mx-auto w-full space-y-6">
          <div className="bg-background border-b border-border -mx-4 px-4 py-4 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-muted animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="w-40 h-4 rounded-md bg-muted animate-pulse" />
                <div className="w-24 h-3 rounded-md bg-muted/60 animate-pulse" />
                <div className="w-32 h-3 rounded-md bg-muted/40 animate-pulse" />
              </div>
            </div>
          </div>
          <div className="w-full h-11 rounded-xl bg-primary/20 border border-primary/10 animate-pulse" />
          <div className="space-y-3">
            <div className="w-16 h-3 rounded bg-muted animate-pulse ml-1" />
            <div className="flex gap-3 overflow-hidden">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="shrink-0 w-32 h-28 rounded-2xl bg-muted border border-border animate-pulse" />
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <div className="w-20 h-3 rounded bg-muted animate-pulse ml-1" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full h-24 rounded-2xl bg-muted border border-border animate-pulse" />
            ))}
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="w-8 h-8 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    </div>
  );
}
