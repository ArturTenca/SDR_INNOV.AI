import { Search, Bell, Moon, Sun, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<{
    reunioes: number;
    tarefas: number;
  }>({ reunioes: 0, tarefas: 0 });
  
  // Usar localStorage para persistir notificações lidas
  const [readNotifications, setReadNotifications] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('readNotifications');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  
  const location = useLocation();

  const navigationItems = [
    { name: "Dashboard", path: "/", keywords: ["dashboard", "painel", "inicio", "início"] },
    { name: "Chats", path: "/leads", keywords: ["leads", "chats", "conversas", "contatos"] },
    { name: "Tarefas", path: "/tasks", keywords: ["tarefas", "tasks", "follow-ups", "followups"] },
    { name: "Relatórios", path: "/reports", keywords: ["relatórios", "reports", "graficos", "gráficos"] },
  ];

  // Buscar notificações de eventos de hoje e amanhã
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toDateString();
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toDateString();

        // Verificar reuniões de hoje e amanhã
        const { data: reunioesData } = await supabase
          .from('chats')
          .select('horario_reuniao, created_at')
          .not('horario_reuniao', 'is', null);

        const reunioesHoje = reunioesData?.filter(r => {
          if (!r.horario_reuniao) return false;
          const date = new Date(r.horario_reuniao);
          date.setHours(0, 0, 0, 0);
          return date.toDateString() === todayStr;
        }).length || 0;

        const reunioesAmanha = reunioesData?.filter(r => {
          if (!r.horario_reuniao) return false;
          const date = new Date(r.horario_reuniao);
          date.setHours(0, 0, 0, 0);
          return date.toDateString() === tomorrowStr;
        }).length || 0;

        // Verificar tarefas de hoje e amanhã
        const { data: tarefasData } = await supabase
          .from('tarefas')
          .select('data_vencimento')
          .not('data_vencimento', 'is', null);

        const tarefasHoje = tarefasData?.filter(t => {
          if (!t.data_vencimento) return false;
          const date = new Date(t.data_vencimento);
          date.setHours(0, 0, 0, 0);
          return date.toDateString() === todayStr;
        }).length || 0;

        const tarefasAmanha = tarefasData?.filter(t => {
          if (!t.data_vencimento) return false;
          const date = new Date(t.data_vencimento);
          date.setHours(0, 0, 0, 0);
          return date.toDateString() === tomorrowStr;
        }).length || 0;

        // Verificar reuniões criadas recentemente (últimas 24h)
        const { data: newReunioesData } = await supabase
          .from('chats')
          .select('id, created_at')
          .not('horario_reuniao', 'is', null);
        
        const agora = new Date();
        const vinteQuatroHorasAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
        
        const novasReunioes = newReunioesData?.filter(r => {
          if (!r.created_at) return false;
          const createdDate = new Date(r.created_at);
          return createdDate >= vinteQuatroHorasAtras;
        }).length || 0;

        setNotifications({ 
          reunioes: reunioesHoje + reunioesAmanha + novasReunioes, 
          tarefas: tarefasHoje + tarefasAmanha 
        });
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    
    // Atualizar a cada 2 minutos
    const interval = setInterval(fetchNotifications, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSearch = (query: string) => {
    setSearchValue(query);
    
    if (!query) {
      return;
    }

    const queryLower = query.toLowerCase();
    const filtered = navigationItems.filter(item =>
      item.name.toLowerCase().includes(queryLower) ||
      item.keywords.some(keyword => keyword.toLowerCase().includes(queryLower))
    );

    if (filtered.length > 0) {
      const exactMatch = filtered.find(item => 
        item.name.toLowerCase() === queryLower
      );
      
      if (exactMatch) {
        if (location.pathname !== exactMatch.path) {
          navigate(exactMatch.path);
          setOpen(false);
          setSearchValue("");
          toast.success(`Navegando para ${exactMatch.name}`);
        }
      }
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logout realizado com sucesso!");
      navigate("/login");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center gap-4 px-6">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar página..."
                className="pl-10 bg-secondary/50 border-0 cursor-pointer"
                readOnly
                onClick={() => setOpen(true)}
                value={searchValue}
                onChange={() => {}}
              />
            </div>
          </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Popover 
            open={notificationsOpen} 
            onOpenChange={setNotificationsOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground relative"
                onClick={() => {
                  // Quando abrir e tiver notificações, marcar como lidas
                  if (!readNotifications.has('all')) {
                    const newSet = new Set(['all']);
                    setReadNotifications(newSet);
                    localStorage.setItem('readNotifications', JSON.stringify(Array.from(newSet)));
                  }
                }}
              >
                <Bell className="h-5 w-5" />
                {!readNotifications.has('all') && (notifications.reunioes > 0 || notifications.tarefas > 0) && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {notifications.reunioes + notifications.tarefas}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Notificações</h3>
                  {(notifications.reunioes > 0 || notifications.tarefas > 0) && (
                    <Badge variant="secondary">
                      {notifications.reunioes + notifications.tarefas} novo{(notifications.reunioes + notifications.tarefas) > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                
                {(notifications.reunioes > 0 || notifications.tarefas > 0) ? (
                  <div className="space-y-2">
                    {notifications.reunioes > 0 && (
                      <div 
                        className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 cursor-pointer hover:bg-blue-500/20 transition-colors"
                        onClick={() => {
                          navigate('/calendar');
                          setNotificationsOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          <span className="font-medium">Reunião agendada</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Você tem {notifications.reunioes} {notifications.reunioes === 1 ? 'reunião' : 'reuniões'} próximas
                        </p>
                      </div>
                    )}
                    
                    {notifications.tarefas > 0 && (
                      <div 
                        className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20 cursor-pointer hover:bg-pink-500/20 transition-colors"
                        onClick={() => {
                          navigate('/tasks');
                          setNotificationsOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-pink-500"></div>
                          <span className="font-medium">Tarefa vencendo</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Você tem {notifications.tarefas} {notifications.tarefas === 1 ? 'tarefa' : 'tarefas'} próximas
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhuma notificação</p>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>

          <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-medium cursor-pointer hover-lift">
            {user?.email?.charAt(0).toUpperCase() || "U"}
          </div>
        </div>
      </div>
    </header>

    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput 
        placeholder="Buscar página..." 
        onValueChange={handleSearch}
      />
      <CommandList>
        <CommandEmpty>Nenhuma página encontrada.</CommandEmpty>
        <CommandGroup heading="Páginas">
          {navigationItems.map((item) => (
            <CommandItem
              key={item.path}
              value={item.name}
              onSelect={() => {
                navigate(item.path);
                setOpen(false);
                setSearchValue("");
                toast.success(`Navegando para ${item.name}`);
              }}
            >
              <Search className="mr-2 h-4 w-4" />
              {item.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
    </>
  );
}
