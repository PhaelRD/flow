import React, { useEffect, useState } from 'react';
import { getAdminStats, getAllUsers, updateUserRole, deleteUser, getCourses, deleteCourse } from '../services/mockBackend';
import { User, Course, Role } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DollarSign, Users, AlertTriangle, Trash2, ShieldCheck, User as UserIcon, BookOpen, Layers } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'courses'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data based on active tab
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'overview') {
        const data = await getAdminStats();
        // Translate chart labels
        if(data && data.roleDistribution) {
             data.roleDistribution = data.roleDistribution.map((item: any) => ({
                 ...item,
                 name: item.name === 'Students' ? 'Estudantes' : item.name === 'Teachers' ? 'Professores' : item.name === 'Admins' ? 'Admins' : item.name
             }));
        }
        setStats(data);
    } else if (activeTab === 'users') {
        const data = await getAllUsers();
        setUsers(data);
    } else if (activeTab === 'courses') {
        const data = await getCourses();
        setCourses(data);
    }
    setLoading(false);
  };

  const handleRoleChange = async (userId: string, currentRole: Role) => {
      // Toggle logic for simplicity: Student <-> Teacher
      // Admin should probably stay admin or handle carefully
      if(currentRole === 'admin') {
          alert("Não é possível alterar a função de um Admin através deste painel.");
          return;
      }

      const newRole: Role = currentRole === 'student' ? 'teacher' : 'student';
      const roleName = currentRole === 'student' ? 'Estudante' : 'Professor';
      const newRoleName = newRole === 'student' ? 'Estudante' : 'Professor';

      if(window.confirm(`Tem certeza que deseja alterar este usuário de ${roleName} para ${newRoleName}?`)) {
          await updateUserRole(userId, newRole);
          loadData(); // Refresh list
      }
  };

  const handleDeleteUser = async (userId: string, role: Role) => {
      if(role === 'admin') {
          alert("Não é possível excluir o Admin principal.");
          return;
      }
      
      const message = role === 'teacher' 
        ? "Aviso: Excluir um professor também EXCLUIRÁ TODOS OS SEUS CURSOS. Esta ação não pode ser desfeita." 
        : "Tem certeza que deseja excluir este usuário?";

      if(window.confirm(message)) {
          await deleteUser(userId);
          loadData();
      }
  };

  const handleDeleteCourse = async (courseId: string) => {
      if(window.confirm("Tem certeza que deseja excluir este curso? Os alunos matriculados perderão o acesso.")) {
          await deleteCourse(courseId);
          loadData();
      }
  };

  const renderOverview = () => {
      if(!stats) return <div>Carregando estatísticas...</div>;
      
      const chartData = stats.roleDistribution || [];
      const COLORS = ['#10b981', '#f59e0b', '#8b5cf6']; // Green, Yellow, Purple

      return (
        <div className="space-y-8 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Receita da Plataforma</p>
                            <p className="text-2xl font-bold text-gray-900">${stats.revenue.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-indigo-100 rounded-full">
                            <DollarSign className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total de Usuários</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-full">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Aprovações Pendentes</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.pendingApprovals}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-full">
                            <AlertTriangle className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Distribuição de Funções de Usuário</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      );
  };

  const renderUsers = () => (
      <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                  <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                      <tr key={user.uid}>
                          <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{user.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                  ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                                    user.role === 'teacher' ? 'bg-yellow-100 text-yellow-800' : 
                                    'bg-green-100 text-green-800'}`}>
                                  {user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Professor' : 'Estudante'}
                              </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                              {user.role !== 'admin' && (
                                  <>
                                    <button 
                                        onClick={() => handleRoleChange(user.uid, user.role)}
                                        className="text-indigo-600 hover:text-indigo-900"
                                    >
                                        {user.role === 'student' ? 'Tornar Professor' : 'Tornar Estudante'}
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteUser(user.uid, user.role)}
                                        className="text-red-600 hover:text-red-900 flex items-center gap-1 float-right ml-4"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                              )}
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
  );

  const renderCourses = () => (
      <div className="bg-white shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                  <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instrutor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receita</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {courses.length === 0 ? (
                      <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Nenhum curso disponível.</td>
                      </tr>
                  ) : courses.map((course) => (
                      <tr key={course.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                  <div className="h-10 w-10 flex-shrink-0">
                                      <img className="h-10 w-10 rounded-full object-cover" src={course.thumbnailUrl} alt="" />
                                  </div>
                                  <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{course.title}</div>
                                      <div className="text-sm text-gray-500">${course.price}</div>
                                  </div>
                              </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{course.teacherName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                              ${(course.totalRevenue || 0).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                  ${course.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {course.status === 'published' ? 'Publicado' : 'Rascunho'}
                              </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button 
                                onClick={() => handleDeleteCourse(course.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                  Excluir
                              </button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Administração da Plataforma</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
            <button
                onClick={() => setActiveTab('overview')}
                className={`${activeTab === 'overview' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
                <Layers className="w-4 h-4" />
                Visão Geral
            </button>
            <button
                onClick={() => setActiveTab('users')}
                className={`${activeTab === 'users' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
                <UserIcon className="w-4 h-4" />
                Gestão de Usuários
            </button>
            <button
                onClick={() => setActiveTab('courses')}
                className={`${activeTab === 'courses' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
                <BookOpen className="w-4 h-4" />
                Gestão de Cursos
            </button>
        </nav>
      </div>

      {loading ? (
          <div className="py-20 text-center text-gray-500">Carregando dados...</div>
      ) : (
          <div>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'users' && renderUsers()}
              {activeTab === 'courses' && renderCourses()}
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;