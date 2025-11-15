import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, Target, CheckCircle, Globe } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { useDashboardStats, useWeekTrends, useLeads, useTarefas } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Reports() {
  const { stats, loading } = useDashboardStats();
  const { trends } = useWeekTrends();
  const { leads, loading: leadsLoading } = useLeads();
  const { tasks, loading: tasksLoading } = useTarefas();
  
  const [reunioesData, setReunioesData] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any[]>([]);
  const [leadsFromSite, setLeadsFromSite] = useState<number>(0);

  useEffect(() => {
    const fetchReunioesData = async () => {
      try {
        const { data } = await supabase
          .from('chats')
          .select('horario_reuniao, created_at')
          .not('horario_reuniao', 'is', null);
        
        if (data) {
          setReunioesData(data);
        }
      } catch (error) {
        console.error('Error fetching reunioes:', error);
      }
    };

    const fetchStatusDistribution = async () => {
      try {
        const { data: followupData } = await supabase
          .from('followup')
          .select('encerrado');
        
        if (followupData) {
          const ativos = followupData.filter(f => f.encerrado === false).length;
          const encerrados = followupData.filter(f => f.encerrado === true).length;
          
          setStatusDistribution([
            { name: 'Ativos', value: ativos },
            { name: 'Encerrados', value: encerrados },
          ]);
        }
      } catch (error) {
        console.error('Error fetching status distribution:', error);
      }
    };

    const fetchLeadsFromSite = async () => {
      try {
        // Primeiro tenta com "Site" (maiúsculo)
        const result1 = await supabase
          .from('chats')
          .select('id, Site')
          .eq('Site', true);
        
        if (result1.error && result1.error.message?.includes('column')) {
          // Se der erro, tenta com "site" (minúsculo)
          const result2 = await supabase
            .from('chats')
            .select('id, site')
            .eq('site', true);
          
          if (result2.error) {
            // Se ainda der erro, busca todos e filtra
            const allChats = await supabase
              .from('chats')
              .select('*');
            
            if (allChats.data) {
              const leadsSite = allChats.data.filter((chat: any) => 
                chat.Site === true || chat.site === true || chat.Site === 'true' || chat.site === 'true'
              );
              setLeadsFromSite(leadsSite.length);
              console.log('Leads do site (filtrado localmente):', leadsSite.length);
            }
          } else {
            setLeadsFromSite(result2.data?.length || 0);
            console.log('Leads do site (coluna "site"):', result2.data?.length || 0);
          }
        } else {
          setLeadsFromSite(result1.data?.length || 0);
          console.log('Leads do site (coluna "Site"):', result1.data?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching leads from site:', error);
      }
    };

    fetchReunioesData();
    fetchStatusDistribution();
    fetchLeadsFromSite();
  }, []);

  // Calcular métricas de desempenho
  const performanceRate = stats.totalLeads > 0 
    ? Math.round((stats.opportunities / stats.totalLeads) * 100) 
    : 0;

  // Calcular crescimento semanal de leads
  const leadsGrowth = trends.totalLeads.value;

  // Calcular tarefas por status
  const tasksByStatus = {
    concluida: tasks.filter(t => t.status === 'concluida' || t.Completed === true).length,
    pendente: tasks.filter(t => t.status === 'pendente' || (t.status !== 'concluida' && t.Completed !== true)).length,
    em_andamento: tasks.filter(t => t.status === 'em_andamento').length,
  };

  // Dados para gráfico de reuniões
  const reunioesByMonth = () => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentYear = new Date().getFullYear();
    
    return months.map(month => {
      const monthIndex = months.indexOf(month);
      const monthReunioes = reunioesData.filter(r => {
        const date = new Date(r.horario_reuniao);
        return date.getMonth() === monthIndex && date.getFullYear() === currentYear;
      }).length;
      
      return { name: month, reunioes: monthReunioes };
    });
  };

  // Dados para gráfico de tarefas por prioridade
  const tarefasByPrioridade = () => {
    const prioridades = ['alta', 'media', 'baixa'];
    return prioridades.map(prioridade => ({
      name: prioridade.charAt(0).toUpperCase() + prioridade.slice(1),
      quantidade: tasks.filter(t => t.Prioridade === prioridade).length
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise detalhada do desempenho e métricas
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Taxa de Conversão"
            value={`${stats.conversionRate.toFixed(1)}%`}
            icon={Target}
            trend={{ value: trends.conversionRate.value, positive: trends.conversionRate.positive }}
          />
          <StatsCard
            title="Crescimento Semanal"
            value={leadsGrowth}
            icon={TrendingUp}
            trend={{ value: "+5%", positive: true }}
          />
          <StatsCard
            title="Leads Totais"
            value={stats.totalLeads}
            icon={Users}
            trend={{ value: trends.totalLeads.value, positive: trends.totalLeads.positive }}
          />
          <StatsCard
            title="Tarefas Concluídas"
            value={tasksByStatus.concluida}
            icon={CheckCircle}
            trend={{ value: `${stats.completedTasks}`, positive: true }}
          />
        </div>

        {/* Report Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Gráfico de Reuniões Mensais */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Reuniões por Mês</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reunioesByMonth()}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="reunioes" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Gráfico de Tarefas por Prioridade */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tarefas por Prioridade</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tarefasByPrioridade()}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="quantidade" fill="#ec4899" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Distribuição de Status */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Status dos Follow-ups</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Leads do Site */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Leads do Site</h3>
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Globe className="h-12 w-12 text-primary" />
                </div>
                <div className="text-4xl font-bold mb-2">{leadsFromSite}</div>
                <div className="text-sm text-muted-foreground">
                  Leads que vieram do site
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  {stats.totalLeads > 0 
                    ? `${Math.round((leadsFromSite / stats.totalLeads) * 100)}% do total de leads`
                    : '0% do total de leads'}
                </div>
              </div>
            </div>
          </Card>

        </div>
      </div>
    </DashboardLayout>
  );
}
