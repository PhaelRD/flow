
import React, { useState, useEffect, useRef } from 'react';
import { Message, SupportTicket } from '../types';
import { Send, UserCircle, ShieldCheck } from 'lucide-react';

interface TicketChatProps {
  ticket: SupportTicket;
  currentUserId: string;
  currentUserName: string;
  onSendMessage: (text: string) => Promise<void>;
  onCloseTicket?: () => Promise<void>;
  isTeacher?: boolean;
}

const TicketChat: React.FC<TicketChatProps> = ({ ticket, currentUserId, currentUserName, onSendMessage, onCloseTicket, isTeacher }) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [ticket.messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    await onSendMessage(newMessage);
    setNewMessage('');
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-50 bg-brand-neutral/30 flex justify-between items-center">
        <div>
          <h2 className="font-black text-brand-deep leading-tight">{ticket.subject}</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
             {ticket.courseName} • Aberto por {ticket.studentName}
          </p>
        </div>
        <div className="flex items-center gap-4">
            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${ticket.status === 'open' ? 'bg-brand-green text-white' : 'bg-gray-200 text-gray-600'}`}>
                {ticket.status === 'open' ? 'Ativo' : 'Encerrado'}
            </span>
            {isTeacher && ticket.status === 'open' && onCloseTicket && (
                <button 
                    onClick={onCloseTicket}
                    className="text-[10px] font-black text-red-600 hover:text-white hover:bg-red-600 border border-red-200 px-4 py-2 rounded-xl transition-all uppercase tracking-widest"
                >
                    Fechar Chamado
                </button>
            )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-brand-neutral/10">
        {ticket.messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-[1.5rem] p-5 shadow-sm ${isMe ? 'bg-brand-tech text-white rounded-br-none' : 'bg-white border border-gray-100 text-brand-graphite rounded-bl-none'}`}>
                <div className="flex items-center gap-2 mb-2">
                   {!isMe && <UserCircle className="w-3.5 h-3.5 opacity-50" />}
                   <span className={`text-[10px] font-black uppercase tracking-widest ${isMe ? 'text-brand-light' : 'text-gray-400'}`}>{msg.senderName}</span>
                   <span className={`text-[9px] font-bold ${isMe ? 'text-white/60' : 'text-gray-300'}`}>
                       {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </span>
                </div>
                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {ticket.status === 'open' ? (
          <form onSubmit={handleSubmit} className="p-6 bg-white border-t border-gray-50 flex gap-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua resposta tecnológica..."
              className="bg-brand-neutral/50 flex-1 border-0 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-brand-tech text-brand-deep font-medium placeholder-gray-400 transition-all shadow-inner"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-brand-tech text-white p-4 rounded-2xl hover:bg-brand-deep disabled:opacity-50 transition-all shadow-xl shadow-brand-tech/20"
            >
              <Send className="w-6 h-6" />
            </button>
          </form>
      ) : (
          <div className="p-8 bg-brand-neutral/20 border-t border-gray-50 text-center">
              <div className="inline-flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                <ShieldCheck className="w-4 h-4" /> Atendimento Concluído Habilon Class
              </div>
          </div>
      )}
    </div>
  );
};

export default TicketChat;
