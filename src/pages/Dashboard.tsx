import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentLeads } from "@/components/dashboard/RecentLeads";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { Users, Target, CheckCircle, TrendingUp, Database, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { testSupabaseConnection } from "@/utils/supabaseTest";
import { useDashboardStats, useWeekTrends } from "@/hooks/useSupabaseData";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [dbStatus, setDbStatus] = useState<{
    loading: boolean;
    success: boolean;
    message: string;
    type: string;
  }>({
    loading: true,
    success: false,
    message: 'Testing connection...',
    type: 'loading'
  });

  const { stats, loading: statsLoading, error: statsError } = useDashboardStats();
  const { trends } = useWeekTrends();

  useEffect(() => {
    const testConnection = async () => {
      const result = await testSupabaseConnection();
      setDbStatus({
        loading: false,
        success: result.success,
        message: result.message || (result.success ? 'Connected to Supabase' : result.error),
        type: result.type
      });
    };
    
    testConnection();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Bem-vindo ao painel de controle
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar Dados
          </Button>
        </div>

        {/* Database Status */}
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Database className={`h-5 w-5 ${dbStatus.success ? 'text-green-500' : 'text-red-500'}`} />
            <div>
              <h3 className="font-semibold">Database Status</h3>
              <p className={`text-sm ${dbStatus.success ? 'text-green-600' : 'text-red-600'}`}>
                {dbStatus.loading ? '🔄 Testing...' : dbStatus.message}
              </p>
              {dbStatus.type === 'rls_active' && (
                <p className="text-xs text-muted-foreground mt-1">
                  ℹ️ RLS is active - tables are empty but connection is working
                </p>
              )}
              {dbStatus.type === 'tables_not_created' && (
                <p className="text-xs text-muted-foreground mt-1">
                  ℹ️ Database is ready - you can now create tables and start using the app
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total de Chats"
            value={statsLoading ? "..." : stats.totalLeads}
            icon={Users}
            trend={trends.totalLeads}
          />
          <StatsCard
            title="Followups Ativos"
            value={statsLoading ? "..." : stats.opportunities}
            icon={Target}
            trend={trends.opportunities}
          />
          <StatsCard
            title="Followups Encerrados"
            value={statsLoading ? "..." : stats.completedTasks}
            icon={CheckCircle}
            trend={trends.completedTasks}
          />
          <StatsCard
            title="Taxa de Conversão"
            value={statsLoading ? "..." : `${stats.conversionRate}%`}
            icon={TrendingUp}
            trend={trends.conversionRate}
          />
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ActivityChart />
          </div>
          <div>
            <RecentLeads />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
