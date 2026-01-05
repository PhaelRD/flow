
import React, { useEffect, useState } from 'react';
import { getTeacherStats, getCourses } from '../services/mockBackend';
import { SupportTicket, Course } from '../types';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, Users, Star, MessageSquare, Edit, PlusCircle } from 'lucide-react';
/* Fix: Using namespace import for react-router-dom to resolve export issues */
import * as ReactRouterDOM from 'react-router-dom';
const { useNavigate } = ReactRouterDOM as any;

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
        getTeacherStats(user.uid).then(setStats);
        getCourses().then(all => {
            setCourses(all.filter(c => c.teacherId === user.uid));
        });
    }
  }, [user]);

  const chartData = courses.map(c => ({
      name: c.title.length > 15 ? c.title.substring(0, 15) + '...' : c.title,
      revenue: c.totalRevenue || (c.totalStudents * c.price) || 0
  }));

  if (!stats) return <div className="p-8 text-center font-bold text-gray-400">Carregando painel do instrutor...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
            <h1 className="text-4xl font-black text-brand-deep tracking-tight">Painel do Instrutor</h1>
            <p className="text-gray-500 font-medium mt-1">Gestão de cursos e performance na <span className="text-brand-tech">Habilon Class</span></p>
        </div>
        <button 
            onClick={() => navigate('/teacher/create-course')}
            className="flex items-center gap-2 bg-brand-tech text-white px-6 py-3 rounded-2xl font-black shadow-xl shadow-brand-tech/30 hover:bg-brand-deep transition-all uppercase tracking-widest text-xs"
        >
            <PlusCircle className="w-5 h-5" /> Criar Novo Curso
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 group hover:border-brand-green/30 transition-colors">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Receita Total</p>
                    <p className="text-3xl font-black text-brand-deep">R$ {stats.totalSales.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-brand-green/10 rounded-2xl">
                    <DollarSign className="w-7 h-7 text-brand-green" />
                </div>
            </div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 group hover:border-brand-tech/30 transition-colors">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Alunos</p>
                    <p className="text-3xl font-black text-brand-deep">{stats.students.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-brand-tech/10 rounded-2xl">
                    <Users className="w-7 h-7 text-brand-tech" />
                </div>
            </div>
        </div>
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 group hover:border-yellow-500/30 transition-colors">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Média Avaliação</p>
                    <p className="text-3xl font-black text-brand-deep">{stats.rating}</p>
                </div>
                <div className="p-4 bg-yellow-500/10 rounded-2xl">
                    <Star className="w-7 h-7 text-yellow-500 fill-yellow-500" />
                </div>
            </div>
        </div>
         <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 group hover:border-red-500/30 transition-colors">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Suporte Aberto</p>
                    <p className="text-3xl font-black text-brand-deep">{stats.tickets.filter((t: SupportTicket) => t.status === 'open').length}</p>
                </div>
                <div className="p-4 bg-red-500/10 rounded-2xl">
                    <MessageSquare className="w-7 h-7 text-red-600" />
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-brand-deep mb-8 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-brand-tech rounded-full"></div>
                Faturamento por Treinamento
            </h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    {chartData.length > 0 ? (
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 11}} />
                            <Tooltip 
                                cursor={{fill: '#f2f4f7'}}
                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                formatter={(value) => [`R$ ${value}`, 'Receita']}
                            />
                            <Bar dataKey="revenue" fill="#1F6AE1" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                            Sem dados de faturamento ativos.
                        </div>
                    )}
                </ResponsiveContainer>
            </div>
        </div>

        {/* Support Tickets */}
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-black text-brand-deep">Mensagens</h3>
                 <button onClick={() => navigate('/teacher/inbox')} className="text-[10px] font-black text-brand-tech hover:text-brand-deep uppercase tracking-widest transition-colors">Inbox Completo</button>
            </div>
            
            <div className="space-y-4">
                {stats.tickets.slice(0, 5).map((ticket: SupportTicket) => (
                    <div onClick={() => navigate('/teacher/inbox')} key={ticket.id} className="p-5 bg-brand-neutral/40 rounded-2xl hover:bg-brand-tech/5 transition-all cursor-pointer border border-transparent hover:border-brand-tech/10">
                        <div className="flex justify-between items-start mb-2">
                             <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${ticket.status === 'open' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                 {ticket.status === 'open' ? 'Aberto' : 'Resolvido'}
                             </span>
                             <span className="text-[10px] font-bold text-gray-400">{ticket.createdAt}</span>
                        </div>
                        <h4 className="font-bold text-brand-deep text-sm mb-1 line-clamp-1">{ticket.subject}</h4>
                        <p className="text-[10px] text-gray-500 font-medium">De: {ticket.studentName}</p>
                    </div>
                ))}
                {stats.tickets.length === 0 && (
                     <div className="text-center text-gray-400 font-bold uppercase tracking-widest text-xs py-10">Tudo em dia! Sem novos tickets.</div>
                )}
            </div>
        </div>
      </div>

      {/* Course Performance Table */}
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
          <h3 className="text-xl font-black text-brand-deep mb-8">Estatísticas por Treinamento</h3>
          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                      <tr>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Curso</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Preço</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Alunos</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Faturamento</th>
                          <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                          <th className="px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                      {courses.map((course) => (
                          <tr key={course.id} className="hover:bg-brand-neutral/20 transition-colors">
                              <td className="px-6 py-5 whitespace-nowrap">
                                  <div className="flex items-center">
                                      <div className="h-10 w-10 flex-shrink-0">
                                          <img className="h-10 w-10 rounded-xl object-cover shadow-sm" src={course.thumbnailUrl} alt="" />
                                      </div>
                                      <div className="ml-4">
                                          <div className="text-sm font-bold text-brand-deep">{course.title}</div>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-500">
                                  R$ {course.price}
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap text-sm font-bold text-gray-500">
                                  {course.totalStudents}
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap text-sm font-black text-brand-green">
                                  R$ {(course.totalRevenue || (course.totalStudents * course.price) || 0).toLocaleString()}
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap">
                                  <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${course.status === 'published' ? 'bg-brand-green/10 text-brand-green' : 'bg-gray-100 text-gray-500'}`}>
                                      {course.status === 'published' ? 'Publicado' : 'Rascunho'}
                                  </span>
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                  <button 
                                      onClick={() => navigate(`/teacher/edit-course/${course.id}`)}
                                      className="text-brand-tech hover:text-brand-deep font-black uppercase tracking-widest text-[10px] flex items-center justify-end gap-2 ml-auto"
                                  >
                                      <Edit className="w-4 h-4" /> Editar
                                  </button>
                              </td>
                          </tr>
                      ))}
                      {courses.length === 0 && (
                          <tr>
                              <td colSpan={6} className="px-6 py-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                                  Você ainda não criou nenhum curso na Habilon.
                              </td>
                          </tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
