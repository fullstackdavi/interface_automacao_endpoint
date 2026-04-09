import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MoreVertical, 
  Paperclip, 
  Smile, 
  Mic, 
  Send, 
  CheckCheck,
  ArrowLeft
} from 'lucide-react';

// Types
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Configuração dos endpoints
  const BASE_URL = 'https://backend-automacao-tfxu.onrender.com';
  const SEND_ENDPOINT = `${BASE_URL}/api/send`;
  const RECEIVE_ENDPOINT = `${BASE_URL}/api/receive`;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(RECEIVE_ENDPOINT);
      if (res.ok) {
        const data = await res.json();
        
        setMessages(prev => {
          // Se recebemos novas mensagens do agente, paramos de mostrar "digitando..."
          if (prev.length > 0 && data.length > prev.length) {
            const lastMsg = data[data.length - 1];
            if (lastMsg.sender === 'agent') {
              setIsTyping(false);
            }
          }
          
          return data.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
        });
      }
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
    }
  };

  // Busca inicial e polling a cada 2 segundos
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText;
    setInputText('');
    setIsTyping(true);

    // Atualização otimista na UI
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, newUserMsg]);

    try {
      // 1. Endpoint de Envio (POST /api/send)
      await fetch(SEND_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });
      
      // Busca imediatamente após enviar para garantir sincronia
      fetchMessages();
    } catch (error) {
      console.error('Erro ao comunicar com o agente:', error);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: '⚠️ Erro de conexão com o servidor do agente.',
        sender: 'agent',
        timestamp: new Date(),
      }]);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-screen w-full bg-[#e0e0e0] overflow-hidden font-sans">
      {/* Container Principal */}
      <div className="flex w-full max-w-[1600px] mx-auto h-full shadow-lg bg-white relative">
        
        {/* Barra verde de fundo (estilo WhatsApp Web) */}
        <div className="absolute top-0 left-0 w-full h-[127px] bg-[#00a884] -z-10 hidden sm:block"></div>

        <div className="flex w-full h-full p-0 sm:p-4">
          <div className="flex w-full h-full bg-white sm:rounded-lg overflow-hidden sm:shadow-xl sm:border border-gray-200">
            
            {/* Sidebar (Lista de Chats) */}
            <div className={`${isMobileChatOpen ? 'hidden md:flex' : 'flex'} w-full md:w-[30%] md:min-w-[300px] md:max-w-[415px] flex-col border-r border-gray-200 bg-white`}>
              {/* Header Sidebar */}
              <div className="h-[60px] bg-[#f0f2f5] flex items-center justify-between px-4 py-2 border-b border-gray-200 shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                  <img src="https://picsum.photos/seed/user/100/100" alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <div className="flex gap-4 text-[#54656f]">
                  <button className="hover:bg-gray-200 p-2 rounded-full transition-colors"><MoreVertical size={20} /></button>
                </div>
              </div>

              {/* Search */}
              <div className="p-2 bg-white border-b border-gray-200">
                <div className="bg-[#f0f2f5] rounded-lg flex items-center px-3 py-1.5">
                  <Search size={18} className="text-[#54656f] mr-3" />
                  <input 
                    type="text" 
                    placeholder="Pesquisar ou começar uma nova conversa" 
                    className="bg-transparent border-none outline-none w-full text-sm text-[#111b21] placeholder:text-[#54656f]"
                  />
                </div>
              </div>

              {/* Chat List */}
              <div className="flex-1 overflow-y-auto bg-white">
                <div 
                  className="flex items-center px-3 py-3 hover:bg-[#f5f6f6] cursor-pointer transition-colors bg-[#f0f2f5]"
                  onClick={() => setIsMobileChatOpen(true)}
                >
                  <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden mr-3 shrink-0">
                    <img src="https://picsum.photos/seed/agent/100/100" alt="Agent" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 border-b border-gray-100 pb-3">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-[#111b21] font-normal text-base">Agente Virtual</h3>
                      <span className="text-xs text-[#111b21]">
                        {messages.length > 0 ? formatTime(messages[messages.length - 1].timestamp) : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-[#54656f] truncate pr-4">
                        {isTyping ? <span className="text-[#00a884]">digitando...</span> : (messages[messages.length - 1]?.text || 'Inicie uma conversa')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Chat Area */}
            <div className={`${isMobileChatOpen ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[#efeae2] relative w-full`}>
              {/* Background Pattern */}
              <div 
                className="absolute inset-0 opacity-[0.06] pointer-events-none"
                style={{
                  backgroundImage: 'url("https://static.whatsapp.net/rsrc.php/v3/yl/r/gi_DcbOATKY.png")',
                  backgroundRepeat: 'repeat'
                }}
              ></div>

              {/* Chat Header */}
              <div className="h-[60px] bg-[#f0f2f5] flex items-center justify-between px-4 py-2 border-b border-gray-200 shrink-0 z-10">
                <div className="flex items-center cursor-pointer">
                  <button 
                    className="md:hidden mr-2 text-[#54656f] hover:bg-gray-200 p-1 rounded-full transition-colors"
                    onClick={() => setIsMobileChatOpen(false)}
                  >
                    <ArrowLeft size={24} />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden mr-3">
                    <img src="https://picsum.photos/seed/agent/100/100" alt="Agent" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h2 className="text-[#111b21] font-normal text-base">Agente Virtual</h2>
                    <p className="text-xs text-[#54656f]">
                      {isTyping ? 'digitando...' : 'online'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 text-[#54656f]">
                  <button className="hover:bg-gray-200 p-2 rounded-full transition-colors"><Search size={20} /></button>
                  <button className="hover:bg-gray-200 p-2 rounded-full transition-colors"><MoreVertical size={20} /></button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 z-10 flex flex-col gap-2">
                {/* Date Badge */}
                <div className="flex justify-center mb-4">
                  <span className="bg-white text-[#54656f] text-xs px-3 py-1 rounded-lg shadow-sm uppercase tracking-wide">
                    Hoje
                  </span>
                </div>

                {/* Encryption Notice */}
                <div className="flex justify-center mb-4">
                  <div className="bg-[#ffeecd] text-[#54656f] text-xs px-4 py-2 rounded-lg shadow-sm text-center max-w-md">
                    <p>As mensagens são enviadas para os endpoints configurados. O agente processará e retornará a resposta.</p>
                  </div>
                </div>

                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-1`}
                  >
                    <div 
                      className={`relative max-w-[65%] px-3 pt-2 pb-1 rounded-lg shadow-sm text-[15px] leading-snug ${
                        msg.sender === 'user' 
                          ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-none' 
                          : 'bg-white text-[#111b21] rounded-tl-none'
                      }`}
                    >
                      <span className="break-words">{msg.text}</span>
                      <div className="flex items-center justify-end gap-1 mt-1 -mb-1 float-right ml-3">
                        <span className="text-[11px] text-[#667781]">
                          {formatTime(msg.timestamp)}
                        </span>
                        {msg.sender === 'user' && (
                          <CheckCheck 
                            size={14} 
                            className={msg.status === 'read' ? 'text-[#53bdeb]' : 'text-[#8696a0]'} 
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Footer (Input) */}
              <div className="min-h-[62px] bg-[#f0f2f5] flex items-end px-4 py-2.5 z-10">
                <div className="flex gap-2 text-[#54656f] mb-2">
                  <button className="hover:bg-gray-200 p-2 rounded-full transition-colors"><Smile size={24} /></button>
                  <button className="hover:bg-gray-200 p-2 rounded-full transition-colors"><Paperclip size={24} /></button>
                </div>
                
                <form onSubmit={handleSend} className="flex-1 mx-2 relative flex items-end">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Mensagem"
                    className="w-full bg-white rounded-lg pl-4 pr-4 py-2.5 text-[15px] text-[#111b21] focus:outline-none resize-none overflow-hidden min-h-[40px] max-h-[100px]"
                    rows={1}
                    style={{ height: 'auto' }}
                  />
                </form>

                <div className="flex text-[#54656f] mb-2">
                  {inputText.trim() ? (
                    <button 
                      onClick={handleSend}
                      className="hover:bg-gray-200 p-2 rounded-full transition-colors text-[#00a884]"
                    >
                      <Send size={24} />
                    </button>
                  ) : (
                    <button className="hover:bg-gray-200 p-2 rounded-full transition-colors">
                      <Mic size={24} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
