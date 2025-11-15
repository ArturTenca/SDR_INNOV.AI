import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useLeads } from "@/hooks/useSupabaseData";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

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

function getInitials(name: string): string {
  if (!name) return 'N/A';
  return name.substring(0, 2).toUpperCase();
}

export default function Chats() {
  const { leads, loading } = useLeads();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // Verificar se veio de uma navegação com lead específico
  const navigate = useNavigate();
  const location = useLocation();

  // Selecionar o lead se vier de navegação
  useEffect(() => {
    if (location.state?.selectedPhone && leads.length > 0) {
      const leadToSelect = processedLeads.find(l => l.phone === location.state.selectedPhone);
      if (leadToSelect && !selectedChat) {
        setSelectedChat(leadToSelect);
      }
    }
  }, [location.state, leads]);

  // Processar leads reais
  const processedLeads = leads.map(lead => {
    const phone = lead.remotejid || '';
    const formattedPhone = formatPhoneNumber(phone);
    
    return {
      id: lead.id,
      name: formattedPhone,
      phone: phone,
      lastMessage: lead.lastMessage || 'Sem mensagens',
      status: lead.status || 'ativo',
      created: new Date(lead.created_at).toLocaleDateString("pt-BR"),
      encerrado: lead.encerrado || false,
    };
  });

  const filteredLeads = processedLeads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Buscar mensagens do chat selecionado
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat) {
        setMessages([]);
        return;
      }

      try {
        setLoadingMessages(true);
        
        console.log('🔍 Fetching messages for remotejid:', selectedChat.phone);
        
        // Buscar mensagens usando session_id
        const { data, error } = await supabase
          .from('n8n_chat_histories_innova')
          .select('*')
          .eq('session_id', selectedChat.phone)
          .order('id', { ascending: true });
        
        console.log('📋 Messages from table:', data);

        console.log('📊 Messages query result:', { data, error });

        if (error) {
          console.error('❌ Error fetching messages:', error);
          // Continuar mesmo com erro para não quebrar a UI
          setMessages([]);
        } else {
          console.log('✅ Messages fetched successfully:', data?.length || 0);
          setMessages(data || []);
        }
      } catch (err) {
        console.error('💥 Error fetching messages:', err);
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchMessages();
  }, [selectedChat]);

  // Verificar se há chat selecionado
  const hasSelectedChat = selectedChat !== null;

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-120px)] flex gap-4">
        {/* Lista de Chats */}
        <Card className="w-80 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold mb-4">Conversas</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar conversa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">
                Carregando chats...
              </div>
            ) : filteredLeads.length > 0 ? (
              <div className="p-2">
                {filteredLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedChat(lead)}
                    className={`p-3 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors mb-1 ${
                      selectedChat?.id === lead.id ? 'bg-secondary' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar>
                        <AvatarFallback className="gradient-primary text-white">
                          {getInitials(lead.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{lead.name}</p>
                          <span className="text-xs text-muted-foreground">
                            {lead.created}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {lead.lastMessage}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                Nenhum chat encontrado
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Área de Mensagens */}
        <Card className="flex-1 flex flex-col">
          {!hasSelectedChat ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-muted-foreground">
                  Selecione uma conversa para visualizar as mensagens
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Header do Chat */}
              <div className="p-4 border-b flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="gradient-primary text-white">
                    {getInitials(selectedChat.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{selectedChat.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {selectedChat.status}
                  </Badge>
                </div>
              </div>

              {/* Mensagens */}
              <ScrollArea className="flex-1 p-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Carregando mensagens...</p>
                  </div>
                ) : messages.length > 0 ? (
                  <div className="flex flex-col gap-4">
                      {messages.map((message, index) => {
                      // Filtro inline para mensagens sem conteúdo válido
                      if (!message.content && !message.message && !message.text) {
                        return null;
                      }
                      
                      // Só fazer log da primeira mensagem para não poluir
                      if (index === 0) {
                        console.log('📝 First message structure:', message);
                        console.log('📝 Message keys:', Object.keys(message));
                      }
                      
                      // Detectar se é humano ou IA através do objeto message.message
                      const isHuman = message.message?.type === 'human';
                      const isAI = message.message?.type === 'ai' || message.message?.type === 'assistant';
                      
                      // Inverter: IA vai para direita, humano para esquerda
                      const isAIMessage = isAI;
                      
                      // Extrair conteúdo do objeto message
                      let content = '';
                      
                      // message.message é um objeto com type e content
                      if (message.message && typeof message.message === 'object') {
                        if (typeof message.message.content === 'string') {
                          content = message.message.content;
                        }
                      } else if (typeof message.content === 'string') {
                        content = message.content;
                      }
                      
                      // Se content estiver vazio, pular esta mensagem
                      if (!content) {
                        console.log('⚠️ Message without content, skipping');
                        return null;
                      }
                      
                      return (
                        <div
                          key={index}
                          className={`flex ${isAIMessage ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              isAIMessage
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-secondary-foreground'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{content}</p>
                            <p className={`text-xs opacity-70 mt-1 ${isAIMessage ? 'text-right' : 'text-left'}`}>
                              {message.created_at ? 
                                new Date(message.created_at).toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }) : ''
                              }
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">Nenhuma mensagem encontrada</p>
                  </div>
                )}
              </ScrollArea>

              {/* Input de Mensagem */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite uma mensagem..."
                    className="flex-1"
                  />
                  <Button>Enviar</Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

