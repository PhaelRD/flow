
import React, { useEffect, useState } from 'react';
import { getAdminStats, getAllUsers, updateUserRole, deleteUser, getCourses, deleteCourse, getCoursesByStatus, approveCourse, getQuizById } from '../services/mockBackend';
import { User, Course, Role, Quiz, Lesson } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DollarSign, Users, AlertTriangle, Trash2, ShieldCheck, User as UserIcon, BookOpen, Layers, ClipboardCheck, ExternalLink, Check, Video, FileText, HelpCircle, ChevronDown, ChevronUp, Eye, ChevronRight } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'review' | 'users' | 'courses'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [reviewQueue, setReviewQueue] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Review Modal state
  const [selectedReview, setSelectedReview] = useState<Course | null>(null);
  const [populatedQuizzes, setPopulatedQuizzes] = useState<Record<string, Quiz>>({});
  const [approvalPrice, setApprovalPrice] = useState<string>('0');
  const [approving, setApproving] = useState(false);
  const [reviewStep, setReviewStep] = useState<'content' | 'pricing'>('content');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'overview') {
        const data = await getAdminStats();
        if(data && data.roleDistribution) {
             data.roleDistribution = data.roleDistribution.map((item: any) => ({
                 ...item,
                 name: item.name === 'Students' ? 'Estudantes' : item.name === 'Teachers' ? 'Professores' : item.name === 'Admins' ? 'Admins' : item.name
             }));
        }
        setStats(data);
    } else if (activeTab === 'review') {
        const data = await getCoursesByStatus('review');
        setReviewQueue(data);
    } else if (activeTab === 'users') {
        const data = await getAllUsers();
        setUsers(data);
    } else if (activeTab === 'courses') {
        const data = await getCourses();
        setCourses(data);
    }
    setLoading(false);
  };

  const openReviewModal = async (course: Course) => {
      setSelectedReview(course);
      setReviewStep('content');
      setApprovalPrice(course.price?.toString() || '0');
      
      // Load Quizzes for this course to show in preview
      const quizMap: Record<string, Quiz> = {};
      for (const mod of course.modules) {
          for (const lesson of mod.lessons) {
              if (lesson.type === 'quiz' && lesson.quizId) {
                  const q = await getQuizById(lesson.quizId);
                  if (q) quizMap[lesson.quizId] = q;
              }
          }
      }
      setPopulatedQuizzes(quizMap);
  };

  const handleApprove = async () => {
      if(!selectedReview) return;
      const price = parseFloat(approvalPrice);
      if(isNaN(price) || price < 0) {
          alert("Preço inválido.");
          return;
      }

      setApproving(true);
      await approveCourse(selectedReview.id, price);
      setApproving(false);
      setSelectedReview(null);
      loadData();
      alert("Curso publicado com sucesso!");
  };

  const handleRoleChange = async (userId: string, currentRole: Role) => {
      if(currentRole === 'admin') {
          alert("Não é possível alterar a função de um Admin através deste painel.");
          return;
      }
      const newRole: Role = currentRole === 'student' ? 'teacher' : 'student';
      if(window.confirm(`Mudar função para ${newRole}?`)) {
          await updateUserRole(userId, newRole);
          loadData();
      }
  };

  const handleDeleteUser = async (userId: string, role: Role) => {
      if(role === 'admin') return;
      if(window.confirm("Aviso: Excluir um professor removerá todos os seus cursos.")) {
          await deleteUser(userId);
          loadData();
      }
  };

  const handleDeleteCourse = async (courseId: string) => {
      if(window.confirm("Excluir curso definitivamente?")) {
          await deleteCourse(courseId);
          loadData();
      }
  };

  const renderOverview = () => {
      if(!stats) return <div>Carregando...</div>;
      const COLORS = ['#10b981', '#f59e0b', '#8b5cf6'];
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
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer" onClick={() => setActiveTab('review')}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Aguardando Revisão</p>
                            <p className={`text-2xl font-bold ${stats.pendingApprovals > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                {stats.pendingApprovals}
                            </p>
                        </div>
                        <div className={`p-3 rounded-full ${stats.pendingApprovals > 0 ? 'bg-red-100' : 'bg-yellow-100'}`}>
                            <AlertTriangle className={`w-6 h-6 ${stats.pendingApprovals > 0 ? 'text-red-600' : 'text-yellow-600'}`} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Distribuição de Funções</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats.roleDistribution || []}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {(stats.roleDistribution || []).map((entry: any, index: number) => (
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

  const renderReview = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviewQueue.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-white rounded-xl border-2 border-dashed border-gray-200">
                  <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Não há cursos pendentes para revisão.</p>
              </div>
          ) : (
              reviewQueue.map(course => (
                  <div key={course.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                      <div className="h-32 bg-gray-100 relative">
                          <img src={course.thumbnailUrl} className="w-full h-full object-cover opacity-80" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                              <span className="bg-yellow-400 text-yellow-950 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Pendente</span>
                          </div>
                      </div>
                      <div className="p-4 flex-1">
                          <h4 className="font-bold text-gray-900 mb-1 line-clamp-1">{course.title}</h4>
                          <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                              Instrutor: <span className="font-semibold">{course.teacherName}</span>
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-3 mb-4">{course.description}</p>
                      </div>
                      <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                          <button 
                            onClick={() => openReviewModal(course)}
                            className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700 text-sm transition-colors flex items-center justify-center gap-2"
                          >
                              <Eye className="w-4 h-4" /> Revisar e Publicar
                          </button>
                      </div>
                  </div>
              ))
          )}

          {/* Expanded Review Modal */}
          {selectedReview && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                          <div>
                              <h3 className="text-xl font-bold text-gray-900">Revisão de Conteúdo</h3>
                              <p className="text-sm text-gray-500">{selectedReview.title} — Por {selectedReview.teacherName}</p>
                          </div>
                          <button onClick={() => setSelectedReview(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-6">
                          {reviewStep === 'content' ? (
                              <div className="space-y-8">
                                  {/* Course Bio */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                      <div className="md:col-span-1">
                                          <img src={selectedReview.thumbnailUrl} className="w-full rounded-lg shadow-sm border border-gray-200" alt="Thumbnail" />
                                      </div>
                                      <div className="md:col-span-2 space-y-2">
                                          <h4 className="font-bold text-gray-700 uppercase text-xs tracking-wider">Descrição do Curso</h4>
                                          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border border-gray-100">
                                              {selectedReview.description}
                                          </p>
                                      </div>
                                  </div>

                                  {/* Curriculum Inspection */}
                                  <div>
                                      <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                          <Layers className="w-5 h-5 text-indigo-500" /> Estrutura de Módulos
                                      </h4>
                                      <div className="space-y-4">
                                          {selectedReview.modules.map((mod, mIdx) => (
                                              <div key={mod.id} className="border border-gray-200 rounded-xl overflow-hidden">
                                                  <div className="bg-gray-100 px-4 py-3 font-bold text-gray-700 flex justify-between items-center">
                                                      <span>Módulo {mIdx + 1}: {mod.title}</span>
                                                      <span className="text-xs font-normal text-gray-500">{mod.lessons.length} aulas</span>
                                                  </div>
                                                  <div className="divide-y divide-gray-100">
                                                      {mod.lessons.map((lesson, lIdx) => (
                                                          <div key={lesson.id} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                                                              <div className="flex items-start gap-3">
                                                                  <div className="mt-1">
                                                                      {lesson.type === 'video' && <Video className="w-4 h-4 text-blue-500" />}
                                                                      {lesson.type === 'text' && <FileText className="w-4 h-4 text-orange-500" />}
                                                                      {lesson.type === 'quiz' && <HelpCircle className="w-4 h-4 text-purple-500" />}
                                                                  </div>
                                                                  <div className="flex-1">
                                                                      <div className="flex justify-between">
                                                                          <h5 className="text-sm font-bold text-gray-900">{lesson.title}</h5>
                                                                          <span className="text-xs text-gray-400">{lesson.duration}</span>
                                                                      </div>
                                                                      
                                                                      {/* Lesson Specific Content Preview */}
                                                                      <div className="mt-3 text-xs">
                                                                          {lesson.type === 'video' && (
                                                                              <div className="bg-blue-50 text-blue-700 p-2 rounded border border-blue-100 font-mono">
                                                                                  URL: {lesson.videoUrl || 'Não informada'}
                                                                              </div>
                                                                          )}
                                                                          {lesson.type === 'text' && (
                                                                              <div className="bg-orange-50 text-orange-800 p-3 rounded border border-orange-100 italic line-clamp-4">
                                                                                  {lesson.textContent || 'Sem conteúdo de texto.'}
                                                                              </div>
                                                                          )}
                                                                          {lesson.type === 'quiz' && lesson.quizId && populatedQuizzes[lesson.quizId] && (
                                                                              <div className="bg-purple-50 text-purple-900 p-4 rounded-lg border border-purple-100 space-y-4">
                                                                                  <p className="font-bold border-b border-purple-200 pb-2">Quiz: {populatedQuizzes[lesson.quizId].title} (Min: {populatedQuizzes[lesson.quizId].passingScore}%)</p>
                                                                                  <div className="space-y-4">
                                                                                      {populatedQuizzes[lesson.quizId].questions.map((q, qIdx) => (
                                                                                          <div key={q.id}>
                                                                                              <p className="font-medium text-purple-800 mb-2">{qIdx + 1}. {q.text}</p>
                                                                                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                                                  {q.options.map((opt, oIdx) => (
                                                                                                      <div key={oIdx} className={`p-2 rounded text-[11px] flex items-center gap-2 ${opt.isCorrect ? 'bg-green-100 border border-green-200 text-green-800 font-bold' : 'bg-white border border-purple-100'}`}>
                                                                                                          {opt.isCorrect ? <Check className="w-3 h-3" /> : <div className="w-3 h-3 border rounded-full" />}
                                                                                                          {opt.text}
                                                                                                      </div>
                                                                                                  ))}
                                                                                              </div>
                                                                                          </div>
                                                                                      ))}
                                                                                  </div>
                                                                              </div>
                                                                          )}
                                                                      </div>
                                                                  </div>
                                                              </div>
                                                          </div>
                                                      ))}
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                          ) : (
                              <div className="py-10 max-w-md mx-auto space-y-6">
                                  <div className="text-center">
                                      <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                          <DollarSign className="w-10 h-10 text-indigo-600" />
                                      </div>
                                      <h3 className="text-2xl font-bold text-gray-900">Preço e Publicação</h3>
                                      <p className="text-gray-500 mt-2">Defina o valor final que os alunos pagarão por este curso na plataforma.</p>
                                  </div>
                                  
                                  <div className="space-y-4">
                                      <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                          <p className="text-xs text-indigo-600 font-bold uppercase mb-1">Resumo do Curso</p>
                                          <p className="text-sm font-bold text-gray-800">{selectedReview.title}</p>
                                          <p className="text-xs text-gray-500 mt-1">Instrutor: {selectedReview.teacherName}</p>
                                      </div>

                                      <div>
                                          <label className="block text-sm font-bold text-gray-700 mb-2">Preço de Venda ($)</label>
                                          <div className="relative">
                                              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                  <span className="text-gray-400 font-bold text-xl">$</span>
                                              </div>
                                              <input 
                                                  type="number" 
                                                  value={approvalPrice}
                                                  onChange={(e) => setApprovalPrice(e.target.value)}
                                                  className="bg-white w-full border-2 border-indigo-100 rounded-2xl pl-10 pr-4 py-4 text-2xl font-black text-indigo-600 focus:border-indigo-500 focus:ring-0 outline-none transition-all shadow-inner"
                                                  placeholder="0.00"
                                                  autoFocus
                                              />
                                          </div>
                                          <p className="text-xs text-gray-400 mt-3 italic flex items-center gap-1">
                                              <AlertTriangle className="w-3 h-3" /> Este valor será o preço oficial de listagem.
                                          </p>
                                      </div>
                                  </div>
                              </div>
                          )}
                      </div>

                      <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                          <button 
                            onClick={() => setSelectedReview(null)}
                            className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                          >
                              Cancelar
                          </button>
                          
                          <div className="flex gap-4">
                              {reviewStep === 'content' ? (
                                  <button 
                                    onClick={() => setReviewStep('pricing')}
                                    className="bg-indigo-600 text-white font-bold px-8 py-3 rounded-xl hover:bg-indigo-700 text-sm transition-all shadow-lg flex items-center gap-2"
                                  >
                                      Próximo: Definir Preço <ChevronRight className="w-4 h-4" />
                                  </button>
                              ) : (
                                  <>
                                      <button 
                                        onClick={() => setReviewStep('content')}
                                        className="text-indigo-600 font-bold px-6 py-3 rounded-xl hover:bg-indigo-50 text-sm transition-all"
                                      >
                                          Voltar ao Conteúdo
                                      </button>
                                      <button 
                                        onClick={handleApprove}
                                        disabled={approving}
                                        className="bg-green-600 text-white font-bold px-10 py-3 rounded-xl hover:bg-green-700 text-sm transition-all shadow-lg flex items-center gap-2"
                                      >
                                          {approving ? 'Publicando...' : (
                                              <>
                                                <ShieldCheck className="w-4 h-4" /> Finalizar e Publicar
                                              </>
                                          )}
                                      </button>
                                  </>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </div>
  );

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
                                        Alternar Função
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteUser(user.uid, user.role)}
                                        className="text-red-600 hover:text-red-900 ml-4"
                                    >
                                        Excluir
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                  </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                  {courses.map((course) => (
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
                          <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                  ${course.status === 'published' ? 'bg-green-100 text-green-800' : 
                                    course.status === 'review' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                  {course.status === 'published' ? 'Publicado' : 
                                   course.status === 'review' ? 'Em Revisão' : 'Rascunho'}
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
        <h1 className="text-2xl font-bold text-gray-900">Administração</h1>
      </div>

      <div className="border-b border-gray-200 mb-8 overflow-x-auto">
        <nav className="-mb-px flex space-x-8 min-w-max">
            <button
                onClick={() => setActiveTab('overview')}
                className={`${activeTab === 'overview' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
                <Layers className="w-4 h-4" /> Visão Geral
            </button>
            <button
                onClick={() => setActiveTab('review')}
                className={`${activeTab === 'review' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 relative`}
            >
                <ClipboardCheck className="w-4 h-4" /> Fila de Revisão
                {stats?.pendingApprovals > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                        {stats.pendingApprovals}
                    </span>
                )}
            </button>
            <button
                onClick={() => setActiveTab('users')}
                className={`${activeTab === 'users' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
                <UserIcon className="w-4 h-4" /> Usuários
            </button>
            <button
                onClick={() => setActiveTab('courses')}
                className={`${activeTab === 'courses' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
            >
                <BookOpen className="w-4 h-4" /> Cursos
            </button>
        </nav>
      </div>

      {loading ? (
          <div className="py-20 text-center text-gray-500">Carregando...</div>
      ) : (
          <div>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'review' && renderReview()}
              {activeTab === 'users' && renderUsers()}
              {activeTab === 'courses' && renderCourses()}
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;
