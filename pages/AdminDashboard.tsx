
import React, { useEffect, useState } from 'react';
import { getAdminStats, getAllUsers, updateUserRole, deleteUser, getCourses, deleteCourse, getCoursesByStatus, approveCourse, getQuizById } from '../services/mockBackend';
import { User, Course, Role, Quiz, Lesson } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DollarSign, Users, AlertTriangle, Trash2, ShieldCheck, User as UserIcon, BookOpen, Layers, ClipboardCheck, ExternalLink, Check, Video, FileText, HelpCircle, ChevronDown, ChevronUp, Eye, ChevronRight, Loader2, Tag, CheckCircle2 } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'review' | 'users' | 'courses'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [reviewQueue, setReviewQueue] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  
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
    try {
        if (activeTab === 'overview') {
            const data = await getAdminStats();
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
    } catch (error) {
        console.error("Erro ao carregar dados do admin:", error);
    } finally {
        setLoading(false);
    }
  };

  const openReviewModal = async (course: Course) => {
      setSelectedReview(course);
      setReviewStep('content');
      setApprovalPrice(course.suggestedPrice?.toString() || course.price?.toString() || '0');
      
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
      try {
          await approveCourse(selectedReview.id, price);
          setSelectedReview(null);
          await loadData();
          alert("Curso publicado com sucesso!");
      } catch (error) {
          alert("Erro ao publicar curso.");
      } finally {
          setApproving(false);
      }
  };

  const handleRoleChange = async (userId: string, currentRole: Role) => {
      if(currentRole === 'admin') {
          alert("Não é possível alterar a função de um Admin através deste painel.");
          return;
      }
      const newRole: Role = currentRole === 'student' ? 'teacher' : 'student';
      if(window.confirm(`Mudar função para ${newRole}?`)) {
          setActionInProgress(userId);
          try {
              await updateUserRole(userId, newRole);
              await loadData();
          } catch (error) {
              alert("Erro ao alterar função do usuário.");
          } finally {
              setActionInProgress(null);
          }
      }
  };

  const handleDeleteUser = async (userId: string, role: Role) => {
      if(role === 'admin') return;
      if(window.confirm("Aviso: Excluir um professor removerá todos os seus cursos. Deseja continuar?")) {
          setActionInProgress(userId);
          try {
              const success = await deleteUser(userId);
              if (success) {
                  await loadData();
              } else {
                  alert("Falha ao excluir usuário.");
              }
          } catch (error) {
              alert("Erro ao excluir usuário.");
          } finally {
              setActionInProgress(null);
          }
      }
  };

  const handleDeleteCourse = async (courseId: string) => {
      if(window.confirm("Excluir curso definitivamente?")) {
          setActionInProgress(courseId);
          try {
              const success = await deleteCourse(courseId);
              if (success) {
                  await loadData();
              } else {
                  alert("Falha ao excluir curso.");
              }
          } catch (error) {
              alert("Erro ao excluir curso.");
          } finally {
              setActionInProgress(null);
          }
      }
  };

  const renderOverview = () => {
      if(!stats) return <div>Carregando estatísticas...</div>;
      const COLORS = ['#1F6AE1', '#6BCF8E', '#8b5cf6'];
      return (
        <div className="space-y-8 animate-fade-in">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Receita da Plataforma</p>
                            <p className="text-2xl font-bold text-gray-900">R$ {stats.revenue.toLocaleString()}</p>
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
                              <Tag className="w-3 h-3" /> {course.category || 'Sem Categoria'}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-3 mb-4">{course.description}</p>
                      </div>
                      <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                          <button 
                            onClick={() => openReviewModal(course)}
                            className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded-lg hover:bg-indigo-700 text-sm transition-colors flex items-center justify-center gap-2"
                          >
                              <Eye className="w-4 h-4" /> Revisar Conteúdo
                          </button>
                      </div>
                  </div>
              ))
          )}

          {selectedReview && (
              <div className="fixed inset-0 bg-brand-deep/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-hidden">
                  <div className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-gray-100 animate-in zoom-in-95 duration-300">
                      <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-brand-neutral/30">
                          <div>
                              <h3 className="text-2xl font-black text-brand-deep tracking-tight">Revisão Técnica Habilon</h3>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                {selectedReview.title} • Instrutor: {selectedReview.teacherName}
                              </p>
                          </div>
                          <button onClick={() => setSelectedReview(null)} className="p-2 text-gray-400 hover:text-brand-deep hover:bg-gray-100 rounded-full transition-all">&times;</button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-8 space-y-10">
                          {reviewStep === 'content' ? (
                              <div className="space-y-12">
                                  {/* Overview Section */}
                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                      <div className="lg:col-span-1">
                                          <img src={selectedReview.thumbnailUrl} className="w-full rounded-3xl shadow-lg border border-gray-100 aspect-video object-cover" alt="Thumbnail" />
                                          <div className="mt-4 p-4 bg-brand-neutral/50 rounded-2xl">
                                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Categoria do Curso</p>
                                              <p className="font-bold text-brand-deep">{selectedReview.category}</p>
                                          </div>
                                      </div>
                                      <div className="lg:col-span-2">
                                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Descrição Detalhada</h4>
                                          <div className="text-brand-graphite text-sm leading-relaxed whitespace-pre-wrap bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                              {selectedReview.description}
                                          </div>
                                      </div>
                                  </div>

                                  {/* Curriculum Detail */}
                                  <div>
                                      <h4 className="text-xl font-black text-brand-deep mb-6 flex items-center gap-3">
                                          <Layers className="w-6 h-6 text-brand-tech" /> Matriz Curricular Completa
                                      </h4>
                                      <div className="space-y-8">
                                          {selectedReview.modules.map((mod, mIdx) => (
                                              <div key={mod.id} className="bg-brand-neutral/30 rounded-[2rem] border border-gray-100 overflow-hidden">
                                                  <div className="bg-brand-deep px-6 py-4 flex justify-between items-center">
                                                      <h5 className="font-black text-white text-sm uppercase tracking-widest">
                                                          Módulo {mIdx + 1}: {mod.title}
                                                      </h5>
                                                      <span className="bg-brand-tech text-white px-3 py-1 rounded-full text-[10px] font-black">{mod.lessons.length} Aulas</span>
                                                  </div>
                                                  <div className="p-6 space-y-4">
                                                      {mod.lessons.map((lesson, lIdx) => (
                                                          <div key={lesson.id} className="bg-white p-5 rounded-2xl border border-gray-50 shadow-sm">
                                                              <div className="flex items-start gap-4 mb-4">
                                                                  <div className="p-2 bg-brand-neutral rounded-xl">
                                                                      {lesson.type === 'video' && <Video className="w-4 h-4 text-brand-tech" />}
                                                                      {lesson.type === 'text' && <FileText className="w-4 h-4 text-brand-green" />}
                                                                      {lesson.type === 'quiz' && <HelpCircle className="w-4 h-4 text-orange-500" />}
                                                                  </div>
                                                                  <div className="flex-1">
                                                                      <div className="flex justify-between items-center">
                                                                          <h6 className="font-black text-brand-deep text-sm">{lesson.title}</h6>
                                                                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{lesson.duration}</span>
                                                                      </div>
                                                                  </div>
                                                              </div>

                                                              {/* Visualização de Conteúdo Real */}
                                                              <div className="ml-12 pl-4 border-l-2 border-brand-neutral">
                                                                  {lesson.type === 'video' && (
                                                                      <div className="text-xs bg-brand-neutral/50 p-3 rounded-xl break-all">
                                                                          <p className="font-black text-gray-400 uppercase text-[9px] mb-1">🔗 Link da Videoaula</p>
                                                                          <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="text-brand-tech hover:underline font-bold">{lesson.videoUrl}</a>
                                                                      </div>
                                                                  )}
                                                                  {lesson.type === 'text' && (
                                                                      <div className="text-xs bg-brand-neutral/50 p-4 rounded-xl">
                                                                           <p className="font-black text-gray-400 uppercase text-[9px] mb-2">📄 Conteúdo Textual</p>
                                                                           <div className="text-brand-graphite font-medium whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto pr-2">
                                                                               {lesson.textContent}
                                                                           </div>
                                                                      </div>
                                                                  )}
                                                                  {lesson.type === 'quiz' && lesson.quizId && populatedQuizzes[lesson.quizId] && (
                                                                      <div className="bg-brand-neutral/50 p-4 rounded-xl space-y-4">
                                                                           <div className="flex justify-between items-center mb-2">
                                                                               <p className="font-black text-gray-400 uppercase text-[9px]">🧠 Avaliação de Performance</p>
                                                                               <span className="text-[10px] font-black text-brand-tech">Corte: {populatedQuizzes[lesson.quizId].passingScore}%</span>
                                                                           </div>
                                                                           <div className="space-y-4">
                                                                               {populatedQuizzes[lesson.quizId].questions.map((q, qIdx) => (
                                                                                   <div key={qIdx} className="bg-white p-3 rounded-xl border border-gray-100">
                                                                                       <p className="text-xs font-bold text-brand-deep mb-2">{qIdx + 1}. {q.text}</p>
                                                                                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                                           {q.options.map((opt, oIdx) => (
                                                                                               <div key={oIdx} className={`text-[10px] p-2 rounded-lg flex items-center justify-between ${opt.isCorrect ? 'bg-brand-green/10 text-brand-green border border-brand-green/20' : 'bg-gray-50 text-gray-400'}`}>
                                                                                                   <span>{opt.text}</span>
                                                                                                   {opt.isCorrect && <CheckCircle2 className="w-3 h-3" />}
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
                                                      ))}
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                          ) : (
                              <div className="py-20 max-w-md mx-auto space-y-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                                  <div className="w-24 h-24 bg-brand-tech/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                      <DollarSign className="w-12 h-12 text-brand-tech" />
                                  </div>
                                  <div>
                                      <h3 className="text-3xl font-black text-brand-deep tracking-tight">Precificação Final</h3>
                                      <p className="text-gray-500 mt-2 font-medium">Após validar o conteúdo técnico, defina o valor de mercado deste treinamento.</p>
                                  </div>
                                  
                                  <div className="space-y-4 text-left">
                                      <div className="p-5 bg-brand-neutral/50 rounded-3xl border border-gray-100 flex justify-between items-center">
                                          <div>
                                              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Sugestão do Instrutor</p>
                                              <p className="text-xl font-black text-brand-deep">R$ {selectedReview.suggestedPrice?.toFixed(2) || '0.00'}</p>
                                          </div>
                                          <div className="p-3 bg-brand-tech/10 rounded-2xl">
                                              <Tag className="w-6 h-6 text-brand-tech" />
                                          </div>
                                      </div>

                                      <div className="pt-4">
                                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Preço Habilon Class (R$)</label>
                                          <div className="relative group">
                                              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                                  <span className="text-brand-tech font-black text-xl">R$</span>
                                              </div>
                                              <input 
                                                  type="number" 
                                                  value={approvalPrice}
                                                  onChange={(e) => setApprovalPrice(e.target.value)}
                                                  className="bg-brand-neutral/30 w-full border-2 border-transparent focus:border-brand-tech rounded-3xl pl-16 pr-6 py-5 text-3xl font-black text-brand-deep focus:ring-0 outline-none transition-all shadow-inner"
                                                  placeholder="0,00"
                                                  autoFocus
                                              />
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          )}
                      </div>

                      <div className="p-8 bg-brand-neutral/30 border-t border-gray-100 flex justify-between items-center">
                          <button 
                            onClick={() => setSelectedReview(null)}
                            className="px-6 py-3 text-xs font-black text-gray-400 hover:text-brand-deep uppercase tracking-widest transition-colors"
                          >
                              Cancelar Revisão
                          </button>
                          
                          <div className="flex gap-4">
                              {reviewStep === 'content' ? (
                                  <button 
                                    onClick={() => setReviewStep('pricing')}
                                    className="bg-brand-deep text-white font-black px-10 py-4 rounded-2xl hover:bg-brand-tech transition-all shadow-xl shadow-brand-deep/20 text-xs uppercase tracking-[0.2em] flex items-center gap-2"
                                  >
                                      Próximo: Precificação <ChevronRight className="w-4 h-4" />
                                  </button>
                              ) : (
                                  <>
                                      <button 
                                        onClick={() => setReviewStep('content')}
                                        className="text-brand-tech font-black px-8 py-4 rounded-2xl hover:bg-brand-neutral transition-all text-xs uppercase tracking-widest"
                                      >
                                          Voltar ao Conteúdo
                                      </button>
                                      <button 
                                        onClick={handleApprove}
                                        disabled={approving}
                                        className="bg-brand-green text-white font-black px-12 py-4 rounded-2xl hover:bg-brand-deep transition-all shadow-xl shadow-brand-green/30 text-xs uppercase tracking-[0.2em] flex items-center gap-2"
                                      >
                                          {approving ? 'Publicando...' : (
                                              <>
                                                <ShieldCheck className="w-5 h-5" /> Aprovar e Publicar
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
                      <tr key={user.uid} className={actionInProgress === user.uid ? 'opacity-50' : ''}>
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
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              {user.role !== 'admin' && (
                                  <div className="flex justify-end gap-3">
                                    <button 
                                        onClick={() => handleRoleChange(user.uid, user.role)}
                                        disabled={!!actionInProgress}
                                        className="text-indigo-600 hover:text-indigo-900 disabled:text-gray-300 transition-colors"
                                    >
                                        {actionInProgress === user.uid ? 'Aguarde...' : 'Alternar Função'}
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteUser(user.uid, user.role)}
                                        disabled={!!actionInProgress}
                                        className="text-red-600 hover:text-red-900 disabled:text-gray-300 transition-colors"
                                    >
                                        Excluir
                                    </button>
                                  </div>
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
                      <tr key={course.id} className={actionInProgress === course.id ? 'opacity-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                  <div className="h-10 w-10 flex-shrink-0">
                                      <img className="h-10 w-10 rounded-full object-cover" src={course.thumbnailUrl} alt="" />
                                  </div>
                                  <div className="ml-4">
                                      <div className="text-sm font-medium text-gray-900">{course.title}</div>
                                      <div className="text-sm text-gray-500">R$ {course.price}</div>
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
                                disabled={!!actionInProgress}
                                className="text-red-600 hover:text-red-900 disabled:text-gray-300"
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
        <h1 className="text-2xl font-bold text-gray-900">Administração Habilon</h1>
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
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
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
          <div className="py-20 text-center text-gray-500 flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
              Carregando dados...
          </div>
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
