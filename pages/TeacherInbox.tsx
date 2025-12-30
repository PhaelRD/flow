import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTicketsByTeacher, sendMessage, updateTicketStatus } from '../services/mockBackend';
import { SupportTicket } from '../types';
import TicketChat from '../components/TicketChat';
import { MessageSquare, User } from 'lucide-react';

const TeacherInbox: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      getTicketsByTeacher(user.uid).then(t => {
          setTickets(t);
          setLoading(false);
      });
    }
  }, [user]);

  const handleSendMessage = async (text: string) => {
    if (!user || !selectedTicketId) return;
    const newMessage = await sendMessage(selectedTicketId, user.uid, user.name, text);
    
    setTickets(prev => prev.map(t => {
        if (t.id === selectedTicketId) {
            return { ...t, messages: [...t.messages, newMessage], lastUpdated: Date.now() };
        }
        return t;
    }));
  };

  const handleCloseTicket = async () => {
      if(!selectedTicketId) return;
      await updateTicketStatus(selectedTicketId, 'closed');
      setTickets(prev => prev.map(t => {
          if (t.id === selectedTicketId) return { ...t, status: 'closed' };
          return t;
      }));
  }

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  if (loading) return <div className="p-8">Carregando caixa de entrada...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)]">
      <div className="flex h-full gap-6">
        {/* Sidebar List */}
        <div className={`w-full md:w-1/3 flex flex-col bg-white rounded-lg shadow border border-gray-200 ${selectedTicketId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-gray-200">
                <h1 className="text-xl font-bold text-gray-900">Perguntas dos Alunos</h1>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {tickets.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>Nenhum ticket atribuído a você.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {tickets.map(ticket => (
                            <li key={ticket.id}>
                                <button 
                                    onClick={() => setSelectedTicketId(ticket.id)}
                                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selectedTicketId === ticket.id ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-200' : ''}`}
                                >
                                    <div className="flex justify-between mb-1">
                                        <span className="font-semibold text-gray-900 truncate pr-2">{ticket.subject}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${ticket.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {ticket.status === 'open' ? 'ABERTO' : 'FECHADO'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                        <User className="w-3 h-3" />
                                        <span className="truncate">{ticket.studentName}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 truncate">
                                        {ticket.messages[ticket.messages.length - 1]?.text}
                                    </p>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>

        {/* Main Content */}
        <div className={`w-full md:w-2/3 ${!selectedTicketId ? 'hidden md:flex' : 'flex'} flex-col`}>
             {selectedTicket && user ? (
                 <div className="h-full flex flex-col">
                     <button onClick={() => setSelectedTicketId(null)} className="md:hidden mb-2 text-sm text-indigo-600 font-medium self-start">
                        ← Voltar para Lista
                     </button>
                     <TicketChat 
                        ticket={selectedTicket} 
                        currentUserId={user.uid}
                        currentUserName={user.name}
                        onSendMessage={handleSendMessage}
                        onCloseTicket={handleCloseTicket}
                        isTeacher={true}
                     />
                 </div>
             ) : (
                 <div className="flex-1 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                     Selecione um ticket para responder.
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default TeacherInbox;