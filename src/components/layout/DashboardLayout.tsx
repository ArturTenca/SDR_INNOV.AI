import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { useSidebar } from "@/contexts/SidebarContext";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen w-full flex">
      <AppSidebar />
      <div className={cn(
        "flex-1 transition-smooth",
        collapsed ? "ml-16" : "ml-64"
      )}>
        <Header />
        <main className={cn(
          "p-6 transition-smooth",
          collapsed ? "max-w-6xl mx-auto" : ""
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
