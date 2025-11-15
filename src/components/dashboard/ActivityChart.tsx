import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useActivityData } from "@/hooks/useSupabaseData";

export function ActivityChart() {
  const { activityData, loading } = useActivityData();
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Atividade Semanal</h3>
      <ResponsiveContainer width="100%" height={300}>
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Carregando dados...
          </div>
        ) : (
          <BarChart data={activityData}>
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
            <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} name="Chats" />
            <Bar dataKey="tarefas" fill="#ec4899" radius={[8, 8, 0, 0]} name="Tarefas" />
          </BarChart>
        )}
      </ResponsiveContainer>
    </Card>
  );
}
