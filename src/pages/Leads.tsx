import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, MessageCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLeads } from "@/hooks/useSupabaseData";

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

const statusColors: Record<string, string> = {
  ativo: "bg-green-500/10 text-green-500 border-green-500/20",
  pendente: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  aguardando: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  encerrado: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  novo: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  contato: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  qualificado: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  proposta: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  ganho: "bg-green-500/10 text-green-500 border-green-500/20",
  perdido: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function Leads() {
  const { leads, loading } = useLeads();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Processar leads reais
  const processedLeads = leads.map(lead => {
    const phone = lead.remotejid || '';
    const formattedPhone = formatPhoneNumber(phone);
    
    // Última mensagem
    const ultimaMensagem = lead.lastMessage || 'Sem mensagens';
    
    // Determinar status baseado em encerrado
    let status = 'ativo';
    if (lead.encerrado === true) {
      status = 'encerrado';
    } else if (lead.encerrado === false) {
      status = 'pendente';
    }
    
    return {
      id: lead.id,
      name: formattedPhone,
      ultimaMensagem: ultimaMensagem,
      phone: phone,
      status: status,
      created: new Date(lead.created_at).toLocaleDateString("pt-BR"),
    };
  });

  const filteredLeads = processedLeads.filter((lead) => {
    // Filtro de busca
    const searchMatch =
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.ultimaMensagem.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro de status
    const statusMatch = statusFilter === "all" || lead.status === statusFilter;

    return searchMatch && statusMatch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Leads</h1>
            <p className="text-muted-foreground">
              Gerencie seus leads e oportunidades
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por telefone ou mensagem..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("all")}
              >
                Todos ({processedLeads.length})
              </Button>
              <Button
                variant={statusFilter === "ativo" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("ativo")}
              >
                Ativos ({processedLeads.filter(l => l.status === "ativo").length})
              </Button>
              <Button
                variant={statusFilter === "encerrado" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("encerrado")}
              >
                Encerrados ({processedLeads.filter(l => l.status === "encerrado").length})
              </Button>
              <Button
                variant={statusFilter === "pendente" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pendente")}
              >
                Pendentes ({processedLeads.filter(l => l.status === "pendente").length})
              </Button>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome/Telefone</TableHead>
                <TableHead>Última Mensagem</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Carregando leads...
                  </TableCell>
                </TableRow>
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <TableRow key={lead.id} className="hover:bg-secondary/50">
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell className="max-w-md truncate" title={lead.ultimaMensagem}>
                      {lead.ultimaMensagem}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[lead.status]}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.created}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // Navegar para chats e passar o session_id como state
                          navigate('/chats', { 
                            state: { selectedPhone: lead.phone } 
                          });
                        }}
                        className="text-primary hover:text-primary-foreground hover:bg-primary"
                        title="Abrir conversa com este lead"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Abrir Chat
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum lead encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </DashboardLayout>
  );
}
