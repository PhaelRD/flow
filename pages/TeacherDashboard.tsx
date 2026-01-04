
import React, { useEffect, useState } from 'react';
import { getTeacherStats, getCourses } from '../services/mockBackend';
import { SupportTicket, Course } from '../types';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, Users, Star, MessageSquare, Edit } from 'lucide-react';
// Corrected import for useNavigate from react-router-dom
import { useNavigate } from 'react-router-dom';

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

  // Derived chart data for Revenue per Course
  const chartData = courses.map(c => ({
      name: c.title.length > 15 ? c.title.substring(0, 15) + '...' : c.title,
      revenue: c.totalRevenue || (c.totalStudents * c.price) || 0
  }));

  if (!stats) return <div className="p-8">Carregando painel...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Painel do Instrutor</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">Receita Total</p>
                    <p className="text-2xl font-bold text-gray-900">${stats.totalSales.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="w-6 h-6 text-green-600" />
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">Total de Alunos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.students.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="w-6 h-6 text-blue-600" />
                </div>
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">Avaliação Média</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.rating}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                    <Star className="w-6 h-6 text-yellow-600" />
                </div>
            </div>
        </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">Tickets Abertos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.tickets.filter((t: SupportTicket) => t.status === 'open').length}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                    <MessageSquare className="w-6 h-6 text-red-600" />
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Receita por Curso</h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    {chartData.length > 0 ? (
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`$${value}`, 'Receita']}/>
                            <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            Nenhum dado disponível para o gráfico.
                        </div>
                    )}
                </ResponsiveContainer>
            </div>
        </div>

        {/* Support Tickets */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-gray-900">Tickets Recentes</h3>
                 <button onClick={() => navigate('/teacher/inbox')} className="text-sm text-indigo-600 hover:text-indigo-800">Ver Todos</button>
            </div>
            
            <div className="space-y-4">
                {stats.tickets.slice(0, 5).map((ticket: SupportTicket) => (
                    <div onClick={() => navigate('/teacher/inbox')} key={ticket.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="flex justify-between items-start mb-2">
                             <span className={`text-xs px-2 py-1 rounded-full ${ticket.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}>
                                 {ticket.status.toUpperCase() === 'OPEN' ? 'ABERTO' : 'FECHADO'}
                             </span>
                             <span className="text-xs text-gray-400">{ticket.createdAt}</span>
                        </div>
                        <h4 className="font-medium text-gray-900 text-sm mb-1">{ticket.subject}</h4>
                        <p className="text-xs text-gray-500">De: {ticket.studentName}</p>
                    </div>
                ))}
                {stats.tickets.length === 0 && (
                     <div className="text-center text-gray-400 text-sm py-4">Nenhum ticket ainda.</div>
                )}
            </div>
        </div>
      </div>

      {/* Course Performance Table */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Desempenho dos Cursos</h3>
          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                      <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome do Curso</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alunos</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receita Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                      </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                      {courses.map((course) => (
                          <tr key={course.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                      <div className="h-8 w-8 flex-shrink-0">
                                          <img className="h-8 w-8 rounded-full object-cover" src={course.thumbnailUrl} alt="" />
                                      </div>
                                      <div className="ml-4">
                                          <div className="text-sm font-medium text-gray-900">{course.title}</div>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  ${course.price}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {course.totalStudents}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                                  ${(course.totalRevenue || (course.totalStudents * course.price) || 0).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${course.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                      {course.status === 'published' ? 'Publicado' : 'Rascunho'}
                                  </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <button 
                                      onClick={() => navigate(`/teacher/edit-course/${course.id}`)}
                                      className="text-indigo-600 hover:text-indigo-900 flex items-center justify-end gap-1 ml-auto"
                                  >
                                      <Edit className="w-4 h-4" /> Editar
                                  </button>
                              </td>
                          </tr>
                      ))}
                      {courses.length === 0 && (
                          <tr>
                              <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                  Nenhum curso encontrado.
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
