import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTicketsByStudent, getCourses, createTicket, sendMessage } from '../services/mockBackend';
import { SupportTicket, Course } from '../types';
import TicketChat from '../components/TicketChat';
import { Plus, MessageSquare, Book } from 'lucide-react';

const StudentSupport: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketCourseId, setNewTicketCourseId] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const [userTickets, allCourses] = await Promise.all([
            getTicketsByStudent(user.uid),
            getCourses()
        ]);
        setTickets(userTickets);
        // Only show courses the student is enrolled in for the dropdown
        setCourses(allCourses.filter(c => user.enrolledCourses.includes(c.id)));
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    const ticket = await createTicket(user.uid, user.name, newTicketCourseId, newTicketSubject, newTicketMessage);
    if (ticket) {
        setTickets([ticket, ...tickets]);
        setIsCreating(false);
        setSelectedTicketId(ticket.id);
        // Reset form
        setNewTicketSubject('');
        setNewTicketCourseId('');
        setNewTicketMessage('');
    }
    setLoading(false);
  };

  const handleSendMessage = async (text: string) => {
    if (!user || !selectedTicketId) return;
    const newMessage = await sendMessage(selectedTicketId, user.uid, user.name, text);
    
    // Update local state to show message immediately
    setTickets(prev => prev.map(t => {
        if (t.id === selectedTicketId) {
            return { ...t, messages: [...t.messages, newMessage], lastUpdated: Date.now() };
        }
        return t;
    }));
  };

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  if (loading && !tickets.length) return <div className="p-8">Carregando central de suporte...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)]">
      <div className="flex h-full gap-6">
        {/* Sidebar List */}
        <div className={`w-full md:w-1/3 flex flex-col bg-white rounded-lg shadow border border-gray-200 ${selectedTicketId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-900">Tickets de Suporte</h1>
                <button 
                    onClick={() => { setIsCreating(true); setSelectedTicketId(null); }}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
                    title="Novo Ticket"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {tickets.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>Nenhum ticket ainda.</p>
                        <button onClick={() => setIsCreating(true)} className="text-indigo-600 text-sm mt-2 hover:underline">Faça uma pergunta</button>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {tickets.map(ticket => (
                            <li key={ticket.id}>
                                <button 
                                    onClick={() => { setSelectedTicketId(ticket.id); setIsCreating(false); }}
                                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selectedTicketId === ticket.id ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-200' : ''}`}
                                >
                                    <div className="flex justify-between mb-1">
                                        <span className="font-semibold text-gray-900 truncate pr-2">{ticket.subject}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${ticket.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {ticket.status === 'open' ? 'ABERTO' : 'FECHADO'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                        <Book className="w-3 h-3" />
                                        <span className="truncate">{ticket.courseName}</span>
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
        <div className={`w-full md:w-2/3 ${!selectedTicketId && !isCreating ? 'hidden md:flex' : 'flex'} flex-col`}>
             {isCreating ? (
                 <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                     <h2 className="text-2xl font-bold mb-6 text-gray-900">Criar Novo Ticket de Suporte</h2>
                     <form onSubmit={handleCreateTicket} className="space-y-4">
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Selecionar Curso</label>
                             <select 
                                required
                                value={newTicketCourseId} 
                                onChange={(e) => setNewTicketCourseId(e.target.value)}
                                className="bg-white w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                             >
                                 <option value="">-- Selecione um curso --</option>
                                 {courses.map(c => (
                                     <option key={c.id} value={c.id}>{c.title}</option>
                                 ))}
                             </select>
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Assunto</label>
                             <input 
                                required
                                type="text"
                                value={newTicketSubject}
                                onChange={(e) => setNewTicketSubject(e.target.value)}
                                className="bg-white w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Ex: Problema com o quiz no Módulo 2"
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem</label>
                             <textarea 
                                required
                                value={newTicketMessage}
                                onChange={(e) => setNewTicketMessage(e.target.value)}
                                rows={6}
                                className="bg-white w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Descreva seu problema ou dúvida em detalhes..."
                             ></textarea>
                         </div>
                         <div className="flex gap-3 pt-4">
                             <button 
                                type="button" 
                                onClick={() => setIsCreating(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                             >
                                 Cancelar
                             </button>
                             <button 
                                type="submit"
                                disabled={loading} 
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                             >
                                 {loading ? 'Enviando...' : 'Enviar Ticket'}
                             </button>
                         </div>
                     </form>
                 </div>
             ) : selectedTicket && user ? (
                 <div className="h-full flex flex-col">
                     <button onClick={() => setSelectedTicketId(null)} className="md:hidden mb-2 text-sm text-indigo-600 font-medium self-start">
                        ← Voltar para Lista
                     </button>
                     <TicketChat 
                        ticket={selectedTicket} 
                        currentUserId={user.uid}
                        currentUserName={user.name}
                        onSendMessage={handleSendMessage}
                     />
                 </div>
             ) : (
                 <div className="flex-1 bg-gray-50 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                     Selecione um ticket para ver a conversa ou criar um novo.
                 </div>
             )}
        </div>
      </div>
    </div>
  );
};

export default StudentSupport;