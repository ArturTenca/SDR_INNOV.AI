import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  ChevronLeft,
  ChevronRight,
  BarChart3,
  MessageCircle,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/contexts/SidebarContext";
import innovLogo from "@/assets/INNOV.AI.png";
import groupLogo from "@/assets/Group 2.png";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Chats", href: "/chats", icon: MessageCircle },
  { name: "Leads", href: "/leads", icon: Users },
  { name: "Tarefas", href: "/tasks", icon: CheckSquare },
  { name: "Calendário", href: "/calendar", icon: Calendar },
  { name: "Relatórios", href: "/reports", icon: BarChart3 },
];

export function AppSidebar() {
  const { collapsed, setCollapsed } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen gradient-primary transition-smooth",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
          {!collapsed && (
            <h1 className="text-xl font-bold text-white animate-fade-in">
              SDR System
            </h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-white hover:bg-white/10"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-smooth",
                  "text-white/80 hover:bg-white/10 hover:text-white",
                  isActive && "bg-white/20 text-white shadow-md"
                )
              }
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <span className="animate-fade-in">{item.name}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* INNOV.AI Branding */}
        <div className="border-t border-white/10 p-4">
          {!collapsed ? (
            <div className="flex items-center justify-start gap-2 animate-fade-in">
              <img 
                src={groupLogo} 
                alt="Group 2" 
                className="h-6 w-auto object-contain"
              />
              <img 
                src={innovLogo} 
                alt="INNOV.AI" 
                className="h-4 w-auto object-contain"
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <img 
                src={groupLogo} 
                alt="Group 2" 
                className="h-6 w-auto object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
