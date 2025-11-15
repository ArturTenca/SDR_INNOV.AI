import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Função para formatar número de telefone
function formatPhoneNumber(phone: string): string {
  if (!phone) return 'N/A';
  
  let cleanPhone = phone.replace('@s.whatsapp.net', '');
  cleanPhone = cleanPhone.replace(/^5521\d+/, match => match.substring(4));
  cleanPhone = cleanPhone.replace(/^5511\d+/, match => match.substring(4));
  
  if (cleanPhone.startsWith('55') && cleanPhone.length > 10) {
    cleanPhone = cleanPhone.substring(2);
  }
  
  if (cleanPhone.length === 8) {
    cleanPhone = '9' + cleanPhone;
  }
  
  if (cleanPhone.length === 10 || cleanPhone.length === 11) {
    const match = cleanPhone.match(/^(\d{2})(\d{4,5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  
  return cleanPhone;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reunioes, setReunioes] = useState<any[]>([]);
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'week' | 'day'>('week');
  const [selectedReuniao, setSelectedReuniao] = useState<any | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Navegar meses
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Buscar reuniões e tarefas
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar reuniões
        const { data: reunioesData, error: reunioesError } = await supabase
          .from('chats')
          .select('*')
          .not('horario_reuniao', 'is', null);

        if (reunioesError) {
          console.error('Error fetching reunioes:', reunioesError);
        } else {
          setReunioes(reunioesData || []);
        }

        // Buscar tarefas com data de vencimento
        const { data: tarefasData, error: tarefasError } = await supabase
          .from('tarefas')
          .select('*')
          .not('data_vencimento', 'is', null);

        if (tarefasError) {
          console.error('Error fetching tarefas:', tarefasError);
        } else {
          setTarefas(tarefasData || []);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Obter dias do mês
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Dias do mês anterior
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(null);
    }
    
    // Dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  // Obter reuniões de um dia específico
  const getReunioesForDay = (day: number | null) => {
    if (day === null) return [];
    
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    return reunioes.filter(reuniao => {
      if (!reuniao.horario_reuniao) return false;
      
      const reuniaoDate = new Date(reuniao.horario_reuniao);
      return reuniaoDate.toDateString() === dayDate.toDateString();
    });
  };

  // Obter tarefas de um dia específico
  const getTarefasForDay = (day: number | null) => {
    if (day === null) return [];
    
    const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    
    return tarefas.filter(tarefa => {
      if (!tarefa.data_vencimento) return false;
      
      const tarefaDate = new Date(tarefa.data_vencimento);
      return tarefaDate.toDateString() === dayDate.toDateString();
    });
  };

  const days = getDaysInMonth(currentDate);
  const monthName = format(currentDate, "MMMM yyyy", { locale: ptBR });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold capitalize">{monthName}</h1>
            <p className="text-muted-foreground">
              Gerencie suas reuniões e compromissos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Hoje
            </Button>
            <div className="flex items-center gap-1 border rounded-md">
              <Button
                variant="ghost"
                size="icon"
                onClick={goToPreviousMonth}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={goToNextMonth}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-96 text-muted-foreground">
              Carregando calendário...
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-4">
              {/* Headers dos dias da semana */}
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="text-center font-semibold text-muted-foreground py-2">
                  {day}
                </div>
              ))}

              {/* Dias do calendário */}
              {days.map((day, index) => {
                const isToday = day && 
                  new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
                
                const dayReunioes = getReunioesForDay(day);
                const dayTarefas = getTarefasForDay(day);
                const totalEvents = dayReunioes.length + dayTarefas.length;
                
                return (
                  <div
                    key={index}
                    className={`min-h-[120px] p-2 border rounded-lg transition-colors ${
                      day === null ? 'bg-muted/30 opacity-50' : 'hover:bg-accent/50'
                    } ${isToday ? 'border-primary bg-primary/5' : ''}`}
                  >
                    {day !== null && (
                      <>
                        <div className={`text-sm font-semibold mb-2 ${isToday ? 'text-primary' : ''}`}>
                          {day}
                        </div>
                        <div className="space-y-1">
                          {/* Reuniões (azul) */}
                          {dayReunioes.slice(0, 3).map((reuniao, idx) => {
                            const hora = new Date(reuniao.horario_reuniao).toLocaleTimeString('pt-BR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            });
                            const phone = reuniao.remotejid || '';
                            const formattedPhone = formatPhoneNumber(phone);
                            
                            return (
                              <div
                                key={`reuniao-${idx}`}
                                onClick={() => {
                                  setSelectedReuniao({ ...reuniao, type: 'reuniao' });
                                  setIsDialogOpen(true);
                                }}
                                className="text-xs bg-primary text-primary-foreground rounded px-2 py-1 truncate cursor-pointer hover:opacity-80 transition-opacity"
                                title={`${hora} - ${formattedPhone}`}
                              >
                                {hora} {formattedPhone}
                              </div>
                            );
                          })}
                          
                          {/* Tarefas (rosa) */}
                          {dayTarefas.slice(0, 3 - dayReunioes.length).map((tarefa, idx) => (
                            <div
                              key={`tarefa-${idx}`}
                              onClick={() => {
                                setSelectedReuniao({ ...tarefa, type: 'tarefa' });
                                setIsDialogOpen(true);
                              }}
                              className="text-xs bg-pink-500 text-white rounded px-2 py-1 truncate cursor-pointer hover:opacity-80 transition-opacity"
                              title={tarefa.Titulo}
                            >
                              {tarefa.Titulo}
                            </div>
                          ))}
                          
                          {totalEvents > 3 && (
                            <Badge variant="secondary" className="text-xs w-full">
                              +{totalEvents - 3} mais
                            </Badge>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Lista de Reuniões e Tarefas de Hoje */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Eventos de Hoje</h2>
          {loading ? (
            <div className="text-center text-muted-foreground py-4">
              Carregando...
            </div>
          ) : (() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            // Filtrar reuniões de hoje
            const hojeReunioes = reunioes.filter(reuniao => {
              if (!reuniao.horario_reuniao) return false;
              const reuniaoDate = new Date(reuniao.horario_reuniao);
              reuniaoDate.setHours(0, 0, 0, 0);
              return reuniaoDate.toDateString() === today.toDateString();
            });

            // Filtrar tarefas de hoje
            const hojeTarefas = tarefas.filter(tarefa => {
              if (!tarefa.data_vencimento) return false;
              const tarefaDate = new Date(tarefa.data_vencimento);
              tarefaDate.setHours(0, 0, 0, 0);
              return tarefaDate.toDateString() === today.toDateString();
            });

            // Combinar todos os eventos de hoje
            const eventosHoje = [
              ...hojeReunioes.map(r => ({ ...r, type: 'reuniao' })),
              ...hojeTarefas.map(t => ({ ...t, type: 'tarefa' }))
            ].sort((a, b) => {
              const dateA = a.type === 'reuniao' ? new Date(a.horario_reuniao) : new Date(a.data_vencimento);
              const dateB = b.type === 'reuniao' ? new Date(b.horario_reuniao) : new Date(b.data_vencimento);
              return dateA.getTime() - dateB.getTime();
            });

            if (eventosHoje.length === 0) {
              return (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum evento agendado para hoje
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {eventosHoje.map((evento) => {
                  const isReuniao = evento.type === 'reuniao';
                  const horario = isReuniao 
                    ? new Date(evento.horario_reuniao)
                    : null;
                  const phone = evento.remotejid || '';
                  const formattedPhone = formatPhoneNumber(phone);
                  
                  return (
                    <div
                      key={evento.id}
                      className={`flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors ${
                        isReuniao ? '' : 'border-pink-500/30 bg-pink-500/5'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {isReuniao ? (
                          <div className="text-center min-w-[80px]">
                            <div className="text-2xl font-bold text-primary">
                              {horario?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center min-w-[80px]">
                            <div className="text-2xl font-bold text-pink-500">
                              📋
                            </div>
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold">
                            {isReuniao ? formattedPhone : evento.Titulo}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {isReuniao ? 'Reunião agendada' : `Tarefa - ${evento.Prioridade}`}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedReuniao(evento);
                          setIsDialogOpen(true);
                        }}
                      >
                        Detalhes
                      </Button>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </Card>

        {/* Dialog de Detalhes da Reunião */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes da Reunião</DialogTitle>
            </DialogHeader>
            {selectedReuniao && (
              <div className="space-y-4">
                {selectedReuniao.type === 'reuniao' ? (
                  <>
                    <div>
                      <h3 className="font-semibold mb-2">Lead</h3>
                      <p className="text-muted-foreground">
                        {formatPhoneNumber(selectedReuniao.remotejid)}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Horário da Reunião</h3>
                      <p className="text-muted-foreground">
                        {new Date(selectedReuniao.horario_reuniao).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Criado em</h3>
                      <p className="text-muted-foreground">
                        {new Date(selectedReuniao.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <h3 className="font-semibold mb-2">Título</h3>
                      <p className="text-muted-foreground">{selectedReuniao.Titulo}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Descrição</h3>
                      <p className="text-muted-foreground">{selectedReuniao.Descricao || 'Sem descrição'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Prioridade</h3>
                      <p className="text-muted-foreground capitalize">{selectedReuniao.Prioridade}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Responsável</h3>
                      <p className="text-muted-foreground">{selectedReuniao.Responsavel}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Data de Vencimento</h3>
                      <p className="text-muted-foreground">
                        {new Date(selectedReuniao.data_vencimento).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </>
                )}
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

