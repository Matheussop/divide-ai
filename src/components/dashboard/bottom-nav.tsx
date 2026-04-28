"use client";

import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export function BottomNav() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/70 bg-background/90 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 backdrop-blur-xl supports-backdrop-filter:bg-background/75 md:hidden">
      <DashboardNav className="mx-auto max-w-md" compact />
    </div>
  );
}
