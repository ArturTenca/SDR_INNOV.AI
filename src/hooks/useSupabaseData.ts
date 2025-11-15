import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Hook para buscar estatísticas do dashboard
export function useDashboardStats() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    opportunities: 0,
    completedTasks: 0,
    conversionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching dashboard stats from Supabase...');
        
        // Buscar total de chats
        const { data: chatsData, error: chatsError } = await supabase
          .from('chats')
          .select('id', { count: 'exact' });
        
        console.log('📊 Chats count result:', { chatsData, chatsError });
        
        // Buscar chats ativos da tabela followup onde encerrado = false
        const { data: activeFollowupsData, error: activeFollowupsError } = await supabase
          .from('followup')
          .select('id', { count: 'exact' })
          .eq('encerrado', false);
        
        console.log('📊 Active followups count result (encerrado = false):', { activeFollowupsData, activeFollowupsError });
        
        // Buscar followups encerrados (encerrado = true)
        const { data: closedFollowupsData, error: closedFollowupsError } = await supabase
          .from('followup')
          .select('id', { count: 'exact' })
          .eq('encerrado', true);
        
        console.log('📊 Closed followups count result:', { closedFollowupsData, closedFollowupsError });
        
        // Buscar total de followups para calcular taxa de conversão
        const { data: totalFollowupsData, error: totalFollowupsError } = await supabase
          .from('followup')
          .select('id', { count: 'exact' });
        
        console.log('📊 Total followups count result:', { totalFollowupsData, totalFollowupsError });
        
        // Calcular taxa de conversão: (followups encerrados / total followups) * 100
        const totalFollowups = totalFollowupsData?.length || 0;
        const closedFollowups = closedFollowupsData?.length || 0;
        const conversionRate = totalFollowups > 0 ? 
          ((closedFollowups / totalFollowups) * 100) : 0;

        // Log detalhado dos dados
        console.log('📊 Detailed stats data:', {
          totalChats: { count: chatsData?.length || 0, data: chatsData },
          activeFollowups: { count: activeFollowupsData?.length || 0, data: activeFollowupsData },
          closedFollowups: { count: closedFollowupsData?.length || 0, data: closedFollowupsData },
          totalFollowups: { count: totalFollowupsData?.length || 0, data: totalFollowupsData },
          conversionRate: Number(conversionRate.toFixed(1))
        });

        if (chatsError || activeFollowupsError || closedFollowupsError || totalFollowupsError) {
          console.log('⚠️ Stats fetch completed with some errors:', { 
            chatsError, 
            activeFollowupsError, 
            closedFollowupsError, 
            totalFollowupsError 
          });
          setStats({
            totalLeads: 0,
            opportunities: 0,
            completedTasks: 0,
            conversionRate: 0
          });
        } else {
          const finalStats = {
            totalLeads: chatsData?.length || 0,
            opportunities: activeFollowupsData?.length || 0,
            completedTasks: closedFollowupsData?.length || 0,
            conversionRate: Number(conversionRate.toFixed(1))
          };
          
          console.log('✅ Stats fetched successfully:', finalStats);
          
          setStats(finalStats);
        }
        
        setError(null);
      } catch (err) {
        console.error('💥 Error fetching dashboard stats:', err);
        setError('Erro ao carregar estatísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}

// Hook para calcular variações semanais
export function useWeekTrends() {
  const [trends, setTrends] = useState({
    totalLeads: { value: "0%", positive: true },
    opportunities: { value: "0%", positive: true },
    completedTasks: { value: "0%", positive: true },
    conversionRate: { value: "0%", positive: true },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);

        // Períodos
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        const fourteenDaysAgo = new Date(today);
        fourteenDaysAgo.setDate(today.getDate() - 14);

        // Total de chats - esta semana
        const { data: currentWeekChats } = await supabase
          .from('chats')
          .select('id', { count: 'exact' })
          .gte('created_at', sevenDaysAgo.toISOString());

        // Total de chats - semana passada
        const { data: lastWeekChats } = await supabase
          .from('chats')
          .select('id', { count: 'exact' })
          .gte('created_at', fourteenDaysAgo.toISOString())
          .lt('created_at', sevenDaysAgo.toISOString());

        // Followups ativos - esta semana
        const { data: currentWeekActiveFollowups } = await supabase
          .from('followup')
          .select('id', { count: 'exact' })
          .eq('encerrado', false)
          .gte('created_at', sevenDaysAgo.toISOString());

        // Followups ativos - semana passada
        const { data: lastWeekActiveFollowups } = await supabase
          .from('followup')
          .select('id', { count: 'exact' })
          .eq('encerrado', false)
          .gte('created_at', fourteenDaysAgo.toISOString())
          .lt('created_at', sevenDaysAgo.toISOString());

        // Followups encerrados - esta semana
        const { data: currentWeekClosedFollowups } = await supabase
          .from('followup')
          .select('id', { count: 'exact' })
          .eq('encerrado', true)
          .gte('created_at', sevenDaysAgo.toISOString());

        // Followups encerrados - semana passada
        const { data: lastWeekClosedFollowups } = await supabase
          .from('followup')
          .select('id', { count: 'exact' })
          .eq('encerrado', true)
          .gte('created_at', fourteenDaysAgo.toISOString())
          .lt('created_at', sevenDaysAgo.toISOString());

        // Total followups - esta semana
        const { data: currentWeekTotalFollowups } = await supabase
          .from('followup')
          .select('id', { count: 'exact' })
          .gte('created_at', sevenDaysAgo.toISOString());

        // Total followups - semana passada
        const { data: lastWeekTotalFollowups } = await supabase
          .from('followup')
          .select('id', { count: 'exact' })
          .gte('created_at', fourteenDaysAgo.toISOString())
          .lt('created_at', sevenDaysAgo.toISOString());

        // Calcular percentuais de variação
        const calculateTrend = (current: number, last: number, isConversionRate: boolean = false) => {
          console.log('📊 Trend calculation:', { current, last, isConversionRate });
          
          if (last === 0) {
            if (isConversionRate) {
              // Para taxa de conversão, se não há dados, mostrar "0%"
              return { value: "0%", positive: true };
            }
            const result = current > 0 ? { value: "100%", positive: true } : { value: "0%", positive: true };
            return result;
          }
          
          const percent = ((current - last) / last) * 100;
          const result = {
            value: `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`,
            positive: percent >= 0,
          };
          
          console.log('📊 Trend result:', result);
          return result;
        };

        const totalLeadsTrend = calculateTrend(currentWeekChats?.length || 0, lastWeekChats?.length || 0);
        const opportunitiesTrend = calculateTrend(currentWeekActiveFollowups?.length || 0, lastWeekActiveFollowups?.length || 0);
        const completedTasksTrend = calculateTrend(currentWeekClosedFollowups?.length || 0, lastWeekClosedFollowups?.length || 0);
        
        // Taxa de conversão: encerrados / total * 100
        const currentConversions = currentWeekClosedFollowups?.length || 0;
        const currentTotal = currentWeekTotalFollowups?.length || 0;
        const lastConversions = lastWeekClosedFollowups?.length || 0;
        const lastTotal = lastWeekTotalFollowups?.length || 0;
        
        const currentRate = currentTotal > 0 ? (currentConversions / currentTotal) * 100 : 0;
        const lastRate = lastTotal > 0 ? (lastConversions / lastTotal) * 100 : 0;
        
        const conversionRateTrend = calculateTrend(currentRate, lastRate, true);

        console.log('📊 All trends:', {
          totalLeads: totalLeadsTrend,
          opportunities: opportunitiesTrend,
          completedTasks: completedTasksTrend,
          conversionRate: conversionRateTrend
        });

        setTrends({
          totalLeads: totalLeadsTrend,
          opportunities: opportunitiesTrend,
          completedTasks: completedTasksTrend,
          conversionRate: conversionRateTrend,
        });

      } catch (err) {
        console.error('Error fetching trends:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, []);

  return { trends, loading };
}

// Hook para buscar leads com mensagens e followups
export function useLeads() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        console.log('🔍 Fetching chats with messages and followups from Supabase...');
        
        // Buscar chats
        const { data: chatsData, error: chatsError } = await supabase
          .from('chats')
          .select('*')
          .order('created_at', { ascending: false });

        console.log('📊 Chats query result:', { chatsData, chatsError });

        if (chatsError) {
          console.log('⚠️ Chats fetch error:', chatsError.message);
          setLeads([]);
        } else {
          // Buscar mensagens mais recentes para cada chat
          const leadsWithData = await Promise.all(
            (chatsData || []).map(async (chat) => {
              // Buscar TODAS as mensagens deste chat
              const { data: allMessagesData } = await supabase
                .from('n8n_chat_histories_innova')
                .select('*')
                .eq('session_id', chat.remotejid)
                .order('id', { ascending: false });

              // Buscar followup relacionado
              const { data: followupData } = await supabase
                .from('followup')
                .select('encerrado')
                .eq('remotejid', chat.remotejid)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

              // Encontrar a última mensagem do tipo "human"
              let lastMessageText = 'Sem mensagens';
              if (allMessagesData && allMessagesData.length > 0) {
                // Filtrar mensagens do tipo human e pegar a mais recente (primeira da lista ordenada)
                const humanMessages = allMessagesData.filter(msg => 
                  msg.message && 
                  typeof msg.message === 'object' && 
                  msg.message.type === 'human'
                );
                
                if (humanMessages.length > 0 && humanMessages[0].message) {
                  lastMessageText = humanMessages[0].message.content || 'Sem mensagens';
                }
              }
              
              return {
                ...chat,
                lastMessage: lastMessageText,
                encerrado: followupData?.encerrado || false,
              };
            })
          );

          console.log('✅ Leads fetched successfully:', leadsWithData.length);
          setLeads(leadsWithData);
        }
        
        setError(null);
      } catch (err) {
        console.error('💥 Error fetching chats:', err);
        setError('Erro ao carregar chats');
        setLeads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  return { leads, loading, error, refetch: () => fetchLeads() };
}

// Hook para buscar tarefas da tabela tarefas
export function useTarefas() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('tarefas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Tarefas fetch error:', error.message);
        setTasks([]);
      } else {
        setTasks(data || []);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching tarefas:', err);
      setError('Erro ao carregar tarefas');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const createTask = async (taskData: any) => {
    // Preparar dados para inserção
    let dataVencimento = null;
    
    // Se tiver data de vencimento, ajustar para meia-noite no timezone local
    if (taskData.dueDate) {
      // Criar data no timezone local (meia-noite)
      const dateStr = taskData.dueDate; // formato: YYYY-MM-DD
      const [year, month, day] = dateStr.split('-').map(Number);
      const localDate = new Date(year, month - 1, day, 0, 0, 0);
      dataVencimento = localDate.toISOString();
    }
    
    const insertData: any = {
      Titulo: taskData.title,
      Descricao: taskData.description || null,
      Prioridade: taskData.priority,
      Responsavel: taskData.assignee || null,
      data_vencimento: dataVencimento,
      status: taskData.status || 'pendente',
    };
    
    // Só adiciona lead_vinc se tiver valor
    if (taskData.linkedLead) {
      insertData.lead_vinc = taskData.linkedLead;
    }
    
    const { data, error } = await supabase
      .from('tarefas')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating task:', error);
      throw new Error(error.message);
    }
    
    await fetchTasks();
    return data;
  };

  const updateTask = async (id: number, taskData: any) => {
    // Ajustar data de vencimento para timezone local
    let dataVencimento = null;
    
    if (taskData.dueDate) {
      const dateStr = taskData.dueDate; // formato: YYYY-MM-DD
      const [year, month, day] = dateStr.split('-').map(Number);
      const localDate = new Date(year, month - 1, day, 0, 0, 0);
      dataVencimento = localDate.toISOString();
    }
    
    const updateData: any = {
      Titulo: taskData.title,
      Descricao: taskData.description,
      Prioridade: taskData.priority,
      Responsavel: taskData.assignee,
      data_vencimento: dataVencimento,
    };
    
    // Adicionar lead_vinc se tiver valor
    if (taskData.linkedLead) {
      updateData.lead_vinc = taskData.linkedLead;
    }
    
    // Adicionar status se tiver
    if (taskData.status) {
      updateData.status = taskData.status;
    }
    
    const { data, error } = await supabase
      .from('tarefas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating task:', error);
      throw error;
    }
    
    await fetchTasks();
    return data;
  };

  const deleteTask = async (id: number) => {
    const { error } = await supabase
      .from('tarefas')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
    
    await fetchTasks();
  };

  return { 
    tasks, 
    loading, 
    error, 
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  };
}

// Hook para buscar followups (mantido para compatibilidade)
export function useTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('followup')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.log('Followups fetch error (table may not exist):', error.message);
          setTasks([]);
        } else {
          setTasks(data || []);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching followups:', err);
        setError('Erro ao carregar followups');
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  return { tasks, loading, error, refetch: () => fetchTasks() };
}

// Hook para buscar followups recentes
export function useRecentFollowups() {
  const [followups, setFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFollowups = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('followup')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.log('Recent followups fetch error:', error.message);
          setFollowups([]);
        } else {
          setFollowups(data || []);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching recent followups:', err);
        setError('Erro ao carregar followups recentes');
        setFollowups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowups();
  }, []);

  return { followups, loading, error };
}

// Hook para buscar dados do gráfico de atividade
export function useActivityData() {
  const [activityData, setActivityData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivityData = async () => {
      try {
        setLoading(true);
        
        // Buscar dados dos últimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const { data: chatsData, error: chatsError } = await supabase
          .from('chats')
          .select('created_at')
          .gte('created_at', sevenDaysAgo.toISOString());
        
        // Buscar tarefas dos últimos 7 dias
        const { data: tarefasData, error: tarefasError } = await supabase
          .from('tarefas')
          .select('created_at')
          .gte('created_at', sevenDaysAgo.toISOString());

        if (chatsError || tarefasError) {
          console.log('Activity data fetch error (tables may not exist)');
          // Dados padrão se as tabelas não existem
          setActivityData([
            { name: "Seg", leads: 0, tarefas: 0 },
            { name: "Ter", leads: 0, tarefas: 0 },
            { name: "Qua", leads: 0, tarefas: 0 },
            { name: "Qui", leads: 0, tarefas: 0 },
            { name: "Sex", leads: 0, tarefas: 0 },
            { name: "Sáb", leads: 0, tarefas: 0 },
            { name: "Dom", leads: 0, tarefas: 0 },
          ]);
        } else {
          // Processar dados reais dos últimos 7 dias
          const today = new Date();
          const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
          
          console.log('📊 Activity data - chats count:', chatsData?.length || 0);
          
          const activityData = days.map((day, index) => {
            const dayDate = new Date(today);
            dayDate.setDate(today.getDate() - (6 - index));
            
            // Contar chats criados neste dia
            const chatsCount = chatsData?.filter(chat => {
              if (!chat || !chat.created_at) return false;
              const chatDate = new Date(chat.created_at);
              return chatDate.toDateString() === dayDate.toDateString();
            }).length || 0;
            
            // Contar tarefas criadas neste dia
            const tarefasCount = tarefasData?.filter(tarefa => {
              if (!tarefa || !tarefa.created_at) return false;
              const tarefaDate = new Date(tarefa.created_at);
              return tarefaDate.toDateString() === dayDate.toDateString();
            }).length || 0;
            
            return {
              name: day,
              leads: chatsCount,
              tarefas: tarefasCount
            };
          });
          
          console.log('📊 Final activity data:', activityData);
          setActivityData(activityData);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching activity data:', err);
        setError('Erro ao carregar dados de atividade');
        setActivityData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, []);

  return { activityData, loading, error };
}
