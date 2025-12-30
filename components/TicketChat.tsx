import React, { useState, useEffect, useRef } from 'react';
import { Message, SupportTicket } from '../types';
import { Send, UserCircle } from 'lucide-react';

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
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="font-bold text-gray-800">{ticket.subject}</h2>
          <p className="text-xs text-gray-500">
             {ticket.courseName} • Iniciado por {ticket.studentName} em {ticket.createdAt}
          </p>
        </div>
        <div className="flex items-center gap-3">
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${ticket.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                {ticket.status === 'open' ? 'ABERTO' : 'FECHADO'}
            </span>
            {isTeacher && ticket.status === 'open' && onCloseTicket && (
                <button 
                    onClick={onCloseTicket}
                    className="text-xs text-red-600 hover:text-red-800 font-medium border border-red-200 px-3 py-1 rounded bg-white"
                >
                    Fechar Ticket
                </button>
            )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {ticket.messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                <div className="flex items-center gap-2 mb-1">
                   {!isMe && <UserCircle className="w-3 h-3 opacity-50" />}
                   <span className={`text-xs font-bold ${isMe ? 'text-indigo-200' : 'text-gray-500'}`}>{msg.senderName}</span>
                   <span className={`text-[10px] ${isMe ? 'text-indigo-300' : 'text-gray-400'}`}>
                       {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                   </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {ticket.status === 'open' ? (
          <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-200 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="bg-white flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
      ) : (
          <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-500 italic">
              Este ticket foi encerrado.
          </div>
      )}
    </div>
  );
};

export default TicketChat;