import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Calendar, User, Trash2, Edit, Link as LinkIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLeads, useTarefas } from "@/hooks/useSupabaseData";

interface Task {
  id: number;
  title: string;
  description: string;
  status: "pendente" | "em_andamento" | "concluida";
  priority: "baixa" | "media" | "alta";
  assignee: string;
  dueDate: string;
  completed: boolean;
  createdAt: string;
  linkedLead?: string;
}

const priorityColors: Record<string, string> = {
  baixa: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  media: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  alta: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusColors: Record<string, string> = {
  pendente: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  em_andamento: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  concluida: "bg-green-500/10 text-green-500 border-green-500/20",
};

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

export default function Tasks() {
  const { leads } = useLeads();
  const { tasks: dbTasks, loading, createTask, updateTask, deleteTask } = useTarefas();
  const [filter, setFilter] = useState<"all" | "pendente" | "em_andamento" | "concluida">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Converter dados do banco para formato da interface
  const tasks: Task[] = dbTasks.map((task: any) => {
    // Determinar status baseado no campo status ou completed
    const status = task.status || (task.Completed === true ? "concluida" : "pendente");
    
    return {
      id: task.id,
      title: task.Titulo || '',
      description: task.Descricao || '',
      status: status as "pendente" | "em_andamento" | "concluida",
      priority: (task.Prioridade as "baixa" | "media" | "alta") || "media",
      assignee: task.Responsavel || 'Você',
      dueDate: task.data_vencimento || new Date().toISOString().split('T')[0],
      completed: status === "concluida",
      createdAt: task.created_at,
      linkedLead: task.lead_vinc || undefined,
    };
  });
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "media" as "baixa" | "media" | "alta",
    assignee: "",
    dueDate: "",
    linkedLead: "",
  });

  const addTask = async () => {
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    try {
      await createTask({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        assignee: formData.assignee || "Você",
        dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
        linkedLead: formData.linkedLead || null,
      });
      
      resetForm();
      setIsDialogOpen(false);
      toast.success("Tarefa criada com sucesso!");
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast.error(error?.message || "Erro ao criar tarefa");
    }
  };

  const editTaskHandler = async () => {
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (!editingTask) return;

    try {
      await updateTask(editingTask.id, {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        assignee: formData.assignee || "Você",
        dueDate: formData.dueDate || editingTask.dueDate,
        linkedLead: formData.linkedLead || undefined,
      });
      
      resetForm();
      setIsDialogOpen(false);
      toast.success("Tarefa atualizada com sucesso!");
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error("Erro ao atualizar tarefa");
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await deleteTask(id);
      toast.success("Tarefa excluída com sucesso!");
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error("Erro ao excluir tarefa");
    }
  };

  const toggleTask = async (id: number) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;

      // Alternar status entre concluída e pendente
      const newStatus = task.status === "concluida" ? "pendente" : "concluida";
      
      await updateTask(id, {
        title: task.title,
        description: task.description,
        priority: task.priority,
        assignee: task.assignee,
        dueDate: task.dueDate,
        linkedLead: task.linkedLead,
        status: newStatus,
      });
      
      // Se marcou como concluída, aplicar filtro de concluídas
      if (newStatus === "concluida" && filter !== "concluida") {
        setFilter("concluida");
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      toast.error("Erro ao alterar status da tarefa");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      priority: "media",
      assignee: "",
      dueDate: "",
      linkedLead: "",
    });
    setEditingTask(null);
  };

  const openEditDialog = (task: Task) => {
    setFormData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      assignee: task.assignee,
      dueDate: task.dueDate,
      linkedLead: task.linkedLead || "",
    });
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  const filteredTasks = filter === "all" ? tasks : tasks.filter((task) => task.status === filter);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tarefas</h1>
            <p className="text-muted-foreground">
              Gerencie suas atividades e acompanhe o progresso
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="gradient-primary text-white border-0 hover:opacity-90"
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingTask ? "Editar Tarefa" : "Nova Tarefa"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ex: Fazer dashboard X"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva a tarefa..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select value={formData.priority} onValueChange={(value: "baixa" | "media" | "alta") => setFormData({ ...formData, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assignee">Responsável</Label>
                  <Input
                    id="assignee"
                    value={formData.assignee}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                    placeholder="Nome do responsável"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Data de Vencimento</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="linkedLead">Lead Vinculado (opcional)</Label>
                  <Select 
                    value={formData.linkedLead || "none"} 
                    onValueChange={(value) => setFormData({ ...formData, linkedLead: value === "none" ? "" : value })}
                  >
                    <SelectTrigger id="linkedLead">
                      <SelectValue placeholder="Selecione um lead" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {leads?.map((lead) => {
                        const phone = lead.remotejid || '';
                        const formattedPhone = formatPhoneNumber(phone);
                        return (
                          <SelectItem key={lead.id} value={formattedPhone}>
                            {formattedPhone}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={editingTask ? editTaskHandler : addTask}>
                  {editingTask ? "Salvar" : "Criar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            Todas ({tasks.length})
          </Button>
          <Button
            variant={filter === "pendente" ? "default" : "outline"}
            onClick={() => setFilter("pendente")}
          >
            Pendentes ({tasks.filter((t) => t.status === "pendente").length})
          </Button>
          <Button
            variant={filter === "em_andamento" ? "default" : "outline"}
            onClick={() => setFilter("em_andamento")}
          >
            Em Andamento ({tasks.filter((t) => t.status === "em_andamento").length})
          </Button>
          <Button
            variant={filter === "concluida" ? "default" : "outline"}
            onClick={() => setFilter("concluida")}
          >
            Concluídas ({tasks.filter((t) => t.status === "concluida").length})
          </Button>
        </div>

        {/* Task List */}
        <div className="grid gap-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando tarefas...
            </div>
          ) : filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <Card
                key={task.id}
                className="p-4 hover-lift transition-smooth"
              >
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <h3
                        className={`font-semibold ${
                          task.completed ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {task.title}
                      </h3>
                      <div className="flex gap-2">
                        <Badge variant="outline" className={priorityColors[task.priority]}>
                          {task.priority}
                        </Badge>
                        <Badge variant="outline" className={statusColors[task.status]}>
                          {task.status.replace("_", " ")}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(task)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    {task.linkedLead && (
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <LinkIcon className="h-3 w-3" />
                        <span className="font-medium">Linked: {task.linkedLead}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{task.assignee}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(task.dueDate).toLocaleDateString("pt-BR")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma tarefa encontrada
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
