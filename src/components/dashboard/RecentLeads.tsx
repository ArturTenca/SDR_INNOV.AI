import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRecentFollowups } from "@/hooks/useSupabaseData";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const recentLeads = [
  { id: 1, name: "João Silva", company: "Tech Corp", status: "novo", initials: "JS" },
  { id: 2, name: "Maria Santos", company: "Innovation Labs", status: "contato", initials: "MS" },
  { id: 3, name: "Pedro Oliveira", company: "Digital Solutions", status: "qualificado", initials: "PO" },
  { id: 4, name: "Ana Costa", company: "Start Hub", status: "proposta", initials: "AC" },
  { id: 5, name: "Carlos Mendes", company: "Future Tech", status: "novo", initials: "CM" },
];

const statusColors: Record<string, string> = {
  ativo: "bg-green-500/10 text-green-500",
  pendente: "bg-purple-500/10 text-purple-500",
  aguardando: "bg-orange-500/10 text-orange-500",
  encerrado: "bg-gray-500/10 text-gray-500",
  novo: "bg-blue-500/10 text-blue-500",
  contato: "bg-yellow-500/10 text-yellow-500",
  qualificado: "bg-purple-500/10 text-purple-500",
  proposta: "bg-green-500/10 text-green-500",
};

// Função para limpar e formatar número de WhatsApp
function formatPhoneNumber(phone: string): string {
  if (!phone) return 'N/A';
  
  // Remove @s.whatsapp.net
  let cleanPhone = phone.replace('@s.whatsapp.net', '');
  
  // Remove código do país (55) e DDD (11)
  cleanPhone = cleanPhone.replace(/^5521\d+/, match => match.substring(4)); // Remove 5521
  cleanPhone = cleanPhone.replace(/^5511\d+/, match => match.substring(4)); // Remove 5511
  
  // Se ainda tiver o código do país, remove
  if (cleanPhone.startsWith('55') && cleanPhone.length > 10) {
    cleanPhone = cleanPhone.substring(2);
  }
  
  // Se tiver 8 dígitos, formata com 9 na frente (celular)
  if (cleanPhone.length === 8) {
    cleanPhone = '9' + cleanPhone;
  }
  
  // Formata como (XX) XXXXX-XXXX se tiver 10 dígitos
  if (cleanPhone.length === 10 || cleanPhone.length === 11) {
    const match = cleanPhone.match(/^(\d{2})(\d{4,5})(\d{4})$/);
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
  }
  
  return cleanPhone;
}

export function RecentLeads() {
  const { followups, loading } = useRecentFollowups();
  const [recentFollowups, setRecentFollowups] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (followups && followups.length > 0) {
      // Processar os 5 followups mais recentes
      const recent = followups.map(followup => {
        const phoneNumber = followup.remotejid || '';
        const formattedPhone = formatPhoneNumber(phoneNumber);
        
        // Determinar status baseado em encerrado
        let status = 'pendente';
        if (followup.encerrado === true) {
          status = 'encerrado';
        } else if (followup.encerrado === false) {
          status = 'pendente';
        }
        
        return {
          id: followup.id,
          name: formattedPhone,
          company: followup.chatID || followup.remotejid || formattedPhone,
          status: status,
          initials: formattedPhone.substring(0, 2).toUpperCase()
        };
      });
      setRecentFollowups(recent);
    } else {
      setRecentFollowups([]);
    }
  }, [followups]);
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Leads Recentes</h3>
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-4 text-muted-foreground">
            Carregando leads...
          </div>
        ) : recentFollowups.length > 0 ? (
          recentFollowups.map((followup) => (
            <div
              key={followup.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-smooth cursor-pointer"
              onClick={() => navigate('/leads')}
            >
              <Avatar>
                <AvatarFallback className="gradient-primary text-white text-sm">
                  {followup.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{followup.name}</p>
                <p className="text-sm text-muted-foreground truncate">{followup.company}</p>
              </div>
              <Badge className={statusColors[followup.status]} variant="secondary">
                {followup.status}
              </Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            Nenhum lead encontrado
          </div>
        )}
      </div>
    </Card>
  );
}
