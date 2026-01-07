
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Send, Video, HelpCircle, FileText, CheckCircle, Circle, ArrowLeft, Clock, PlusCircle, Layout, Tag, DollarSign, XCircle } from 'lucide-react';
import { createCourse, createQuiz, getCourseById, getQuizById, updateCourse, updateQuiz } from '../services/mockBackend';
import { useAuth } from '../context/AuthContext';
/* Fix: Using namespace import for react-router-dom to resolve export issues */
import * as ReactRouterDOM from 'react-router-dom';
const { useNavigate, useParams } = ReactRouterDOM as any;
import { Module, Lesson, QuizQuestion, COURSE_CATEGORIES } from '../types';

const TeacherCourseEditor: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { courseId } = useParams(); 
  
  const [loading, setLoading] = useState(!!courseId);
  const [saving, setSaving] = useState(false);

  const [courseTitle, setCourseTitle] = useState('');
  const [category, setCategory] = useState(COURSE_CATEGORIES[0]);
  const [suggestedPrice, setSuggestedPrice] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [thumbnailUrl, setThumbnailUrl] = useState('https://picsum.photos/400/225');
  const [description, setDescription] = useState('');
  const [currentStatus, setCurrentStatus] = useState<'draft' | 'published' | 'review'>('draft');
  
  const [modules, setModules] = useState<Module[]>([
    { id: 'mod-1', title: 'Módulo 1', lessons: [] }
  ]);

  useEffect(() => {
    if (courseId) {
      const loadCourse = async () => {
        try {
          const course = await getCourseById(courseId);
          if (course) {
            setCourseTitle(course.title);
            setCategory(course.category || COURSE_CATEGORIES[0]);
            setSuggestedPrice(course.suggestedPrice || course.price || 0);
            setPrice(course.price || 0);
            setThumbnailUrl(course.thumbnailUrl);
            setDescription(course.description);
            setCurrentStatus(course.status);
            
            const populatedModules = await Promise.all(course.modules.map(async (mod) => {
              const populatedLessons = await Promise.all(mod.lessons.map(async (lesson) => {
                 if (lesson.type === 'quiz' && lesson.quizId) {
                    const quiz = await getQuizById(lesson.quizId);
                    if (quiz) {
                        return { 
                            ...lesson, 
                            questions: quiz.questions, 
                            passingScore: quiz.passingScore 
                        };
                    }
                 }
                 return lesson;
              }));
              return { ...mod, lessons: populatedLessons };
            }));

            setModules(populatedModules);
          } else {
            alert("Curso não encontrado");
            navigate('/teacher/dashboard');
          }
        } catch (e) {
          console.error(e);
          alert("Erro ao carregar curso");
        } finally {
          setLoading(false);
        }
      };
      loadCourse();
    }
  }, [courseId, navigate]);

  const addModule = () => {
    setModules([...modules, { id: `mod-${Date.now()}`, title: `Módulo ${modules.length + 1}`, lessons: [] }]);
  };

  const addLesson = (moduleIndex: number, type: 'video' | 'quiz' | 'text') => {
    const newModules = [...modules];
    newModules[moduleIndex].lessons.push({
      id: `lesson-${Date.now()}`,
      title: type === 'video' ? 'Nova Videoaula' : type === 'quiz' ? 'Novo Quiz de Verificação' : 'Novo Conteúdo Textual',
      type: type,
      videoUrl: '',
      textContent: '',
      duration: type === 'text' ? '5 min' : '10:00',
      description: '',
      questions: type === 'quiz' ? [{ id: 'q-initial', text: 'Pergunta 1', options: [{text: 'Opção 1', isCorrect: true}, {text: 'Opção 2', isCorrect: false}] }] : [], 
      passingScore: 70
    });
    setModules(newModules);
  };

  // Helper functions for Quiz Management
  const addQuestion = (mIdx: number, lIdx: number) => {
    const newModules = [...modules];
    if (!newModules[mIdx].lessons[lIdx].questions) newModules[mIdx].lessons[lIdx].questions = [];
    newModules[mIdx].lessons[lIdx].questions!.push({
      id: `q-${Date.now()}`,
      text: '',
      options: [
        { text: 'Opção A', isCorrect: true },
        { text: 'Opção B', isCorrect: false }
      ]
    });
    setModules(newModules);
  };

  const removeQuestion = (mIdx: number, lIdx: number, qIdx: number) => {
    const newModules = [...modules];
    newModules[mIdx].lessons[lIdx].questions?.splice(qIdx, 1);
    setModules(newModules);
  };

  const updateQuestion = (mIdx: number, lIdx: number, qIdx: number, text: string) => {
    const newModules = [...modules];
    if (newModules[mIdx].lessons[lIdx].questions) {
        newModules[mIdx].lessons[lIdx].questions![qIdx].text = text;
        setModules(newModules);
    }
  };

  const addOption = (mIdx: number, lIdx: number, qIdx: number) => {
    const newModules = [...modules];
    newModules[mIdx].lessons[lIdx].questions![qIdx].options.push({ text: '', isCorrect: false });
    setModules(newModules);
  };

  const updateOption = (mIdx: number, lIdx: number, qIdx: number, oIdx: number, text: string) => {
    const newModules = [...modules];
    newModules[mIdx].lessons[lIdx].questions![qIdx].options[oIdx].text = text;
    setModules(newModules);
  };

  const removeOption = (mIdx: number, lIdx: number, qIdx: number, oIdx: number) => {
    const newModules = [...modules];
    newModules[mIdx].lessons[lIdx].questions![qIdx].options.splice(oIdx, 1);
    setModules(newModules);
  };

  const toggleCorrectOption = (mIdx: number, lIdx: number, qIdx: number, oIdx: number) => {
    const newModules = [...modules];
    const options = newModules[mIdx].lessons[lIdx].questions![qIdx].options;
    options.forEach((opt, idx) => opt.isCorrect = (idx === oIdx));
    setModules(newModules);
  };

  const updatePassingScore = (mIdx: number, lIdx: number, score: number) => {
    const newModules = [...modules];
    newModules[mIdx].lessons[lIdx].passingScore = score;
    setModules(newModules);
  };

  const handleSave = async () => {
      if(!user) return;
      if(!courseTitle.trim()) {
          alert("Por favor, insira um título para o curso.");
          return;
      }
      
      setSaving(true);
      try {
          const modulesToSave = JSON.parse(JSON.stringify(modules));

          for (const module of modulesToSave) {
              for (const lesson of module.lessons) {
                  if (lesson.type === 'quiz' && lesson.questions && lesson.questions.length > 0) {
                       const quizData = {
                           title: lesson.title,
                           passingScore: lesson.passingScore || 70,
                           questions: lesson.questions
                       };

                       if (lesson.quizId) {
                           await updateQuiz(lesson.quizId, quizData);
                       } else {
                           const quizId = await createQuiz(quizData);
                           lesson.quizId = quizId;
                       }
                       
                       delete lesson.questions;
                       delete lesson.passingScore;
                  }
              }
          }

          const courseData = {
              title: courseTitle,
              category: category,
              suggestedPrice: suggestedPrice,
              description: description || 'Sem descrição.',
              price: price, 
              teacherId: user.uid,
              teacherName: user.name,
              thumbnailUrl: thumbnailUrl,
              status: 'review' as const,
              modules: modulesToSave
          };

          if (courseId) {
              await updateCourse(courseId, courseData);
              alert("Atualizado! Aguarde a nova revisão do administrador Habilon.");
          } else {
              await createCourse(courseData);
              alert("Curso enviado para revisão tecnológica!");
          }

          navigate('/teacher/dashboard');
      } catch (e) {
          console.error(e);
          alert("Falha ao salvar curso.");
      } finally {
          setSaving(false);
      }
  };

  if (loading) return <div className="p-8 text-center text-gray-400 font-black uppercase tracking-widest text-sm">Preparando estúdio de gravação...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <button onClick={() => navigate('/teacher/dashboard')} className="mb-6 flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-tech transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Painel Instrutor
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
            <h1 className="text-4xl font-black text-brand-deep tracking-tight">{courseId ? 'Editar Conteúdo' : 'Novo Treinamento'}</h1>
            {currentStatus === 'published' && (
                <p className="text-[10px] text-red-600 font-black uppercase tracking-widest flex items-center gap-1.5 mt-2 bg-red-50 px-3 py-1 rounded-lg border border-red-100 w-fit">
                    <Clock className="w-3 h-3" /> Ao salvar, o curso voltará para aprovação.
                </p>
            )}
        </div>
        <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-3 bg-brand-tech text-white px-8 py-4 rounded-2xl shadow-xl shadow-brand-tech/30 hover:bg-brand-deep disabled:opacity-50 transition-all uppercase tracking-widest font-black text-xs"
        >
          <Send className="w-5 h-5" /> {saving ? 'Processando...' : 'Enviar para Revisão'}
        </button>
      </div>

      <div className="space-y-8 bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nome do Curso</label>
                    <input 
                        type="text" 
                        className="bg-brand-neutral/50 w-full border-0 rounded-2xl px-5 py-4 text-brand-deep font-bold focus:ring-2 focus:ring-brand-tech transition-all placeholder-gray-400"
                        placeholder="Ex: Formação Fullstack Habilon"
                        value={courseTitle}
                        onChange={(e) => setCourseTitle(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Tag className="w-3 h-3" /> Categoria
                    </label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="bg-brand-neutral/50 w-full border-0 rounded-2xl px-5 py-4 text-brand-deep font-bold focus:ring-2 focus:ring-brand-tech transition-all"
                    >
                        {COURSE_CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <DollarSign className="w-3 h-3" /> Sugerir Preço (R$)
                    </label>
                    <input 
                        type="number" 
                        className="bg-brand-neutral/50 w-full border-0 rounded-2xl px-5 py-4 text-brand-deep font-bold focus:ring-2 focus:ring-brand-tech transition-all"
                        value={suggestedPrice}
                        onChange={(e) => setSuggestedPrice(parseFloat(e.target.value))}
                    />
                  </div>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Miniatura (URL)</label>
                    <input 
                        type="text" 
                        className="bg-brand-neutral/50 w-full border-0 rounded-2xl px-5 py-4 text-brand-deep font-bold focus:ring-2 focus:ring-brand-tech transition-all"
                        value={thumbnailUrl}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                    />
                </div>
            </div>
            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Descrição de Alto Impacto</label>
                <textarea 
                    className="bg-brand-neutral/50 w-full border-0 rounded-2xl px-5 py-4 text-brand-deep font-bold focus:ring-2 focus:ring-brand-tech transition-all min-h-[220px]"
                    placeholder="Descreva o que o aluno irá aprender..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>
        </div>

        <div className="border-t border-gray-50 pt-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-brand-deep flex items-center gap-3">
                <Layout className="w-7 h-7 text-brand-tech" />
                Matriz Curricular
            </h2>
            <button onClick={addModule} className="flex items-center gap-2 text-[10px] font-black text-brand-tech hover:text-brand-deep uppercase tracking-widest transition-colors">
                <PlusCircle className="w-4 h-4" /> Adicionar Módulo
            </button>
          </div>
          
          <div className="space-y-8">
            {modules.map((module, mIdx) => (
              <div key={mIdx} className="bg-brand-neutral/30 p-8 rounded-[2rem] border border-gray-100">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <span className="bg-brand-deep text-brand-light w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs">{mIdx + 1}</span>
                    <input 
                        value={module.title}
                        onChange={(e) => {
                        const newMods = [...modules];
                        newMods[mIdx].title = e.target.value;
                        setModules(newMods);
                        }}
                        placeholder="Nome do Módulo"
                        className="bg-transparent font-black text-brand-deep text-lg border-b-2 border-brand-tech/20 focus:outline-none focus:border-brand-tech transition-all w-full md:w-80"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 bg-white/50 p-2 rounded-xl backdrop-blur-sm">
                     <button onClick={() => addLesson(mIdx, 'text')} className="text-[10px] font-black flex items-center gap-1.5 text-gray-500 hover:text-brand-tech uppercase tracking-widest transition-colors">
                        <FileText className="w-3.5 h-3.5" /> Texto
                     </button>
                     <div className="w-px h-4 bg-gray-200"></div>
                     <button onClick={() => addLesson(mIdx, 'video')} className="text-[10px] font-black flex items-center gap-1.5 text-gray-500 hover:text-brand-tech uppercase tracking-widest transition-colors">
                        <Video className="w-3.5 h-3.5" /> Vídeo
                     </button>
                     <div className="w-px h-4 bg-gray-200"></div>
                     <button onClick={() => addLesson(mIdx, 'quiz')} className="text-[10px] font-black flex items-center gap-1.5 text-gray-500 hover:text-brand-tech uppercase tracking-widest transition-colors">
                        <HelpCircle className="w-3.5 h-3.5" /> Quiz
                     </button>
                  </div>
                </div>

                <ul className="space-y-4">
                  {module.lessons.map((lesson, lIdx) => (
                    <li key={lIdx} className="flex flex-col gap-4 bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-50 group">
                      <div className="flex items-center gap-4 w-full">
                        <div className="p-2 bg-brand-neutral rounded-xl text-brand-tech">
                            {lesson.type === 'video' && <Video className="w-4 h-4" />}
                            {lesson.type === 'quiz' && <HelpCircle className="w-4 h-4" />}
                            {lesson.type === 'text' && <FileText className="w-4 h-4" />}
                        </div>
                        
                        <input 
                            value={lesson.title}
                            onChange={(e) => {
                                const newMods = [...modules];
                                newMods[mIdx].lessons[lIdx].title = e.target.value;
                                setModules(newMods);
                            }}
                            className="bg-transparent text-sm border-none focus:ring-0 p-0 font-bold text-brand-deep flex-1"
                            placeholder="Título da Atividade"
                        />

                        <button 
                            onClick={() => {
                                const newMods = [...modules];
                                newMods[mIdx].lessons.splice(lIdx, 1);
                                setModules(newMods);
                            }}
                            className="p-2 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      {lesson.type === 'video' && (
                          <input 
                            value={lesson.videoUrl}
                            onChange={(e) => {
                                const newMods = [...modules];
                                newMods[mIdx].lessons[lIdx].videoUrl = e.target.value;
                                setModules(newMods);
                            }}
                            className="bg-brand-neutral/50 text-[10px] font-bold border-0 rounded-xl px-4 py-3 w-full text-brand-tech"
                            placeholder="🔗 Link da Videoaula (YouTube/Vimeo)"
                          />
                      )}
                      
                      {lesson.type === 'text' && (
                          <textarea 
                            value={lesson.textContent || ''}
                            onChange={(e) => {
                                const newMods = [...modules];
                                newMods[mIdx].lessons[lIdx].textContent = e.target.value;
                                setModules(newMods);
                            }}
                            className="bg-brand-neutral/50 text-sm border-0 rounded-xl px-4 py-4 w-full font-medium text-brand-graphite min-h-[120px]"
                            placeholder="Desenvolva o conteúdo textual aqui..."
                          />
                      )}

                      {lesson.type === 'quiz' && (
                        <div className="mt-4 border-t border-gray-100 pt-6 space-y-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nota de Corte para Aprovação (%)</label>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="number"
                                            value={lesson.passingScore || 70}
                                            onChange={(e) => updatePassingScore(mIdx, lIdx, parseInt(e.target.value))}
                                            className="bg-brand-neutral/50 border-0 rounded-xl px-4 py-2 text-brand-deep font-black w-24 focus:ring-2 focus:ring-brand-tech outline-none"
                                            min="0"
                                            max="100"
                                        />
                                        <span className="text-xs font-bold text-gray-400">O aluno precisa desta nota para concluir a aula.</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => addQuestion(mIdx, lIdx)}
                                    className="flex items-center gap-2 bg-brand-tech/10 text-brand-tech hover:bg-brand-tech hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                >
                                    <Plus className="w-3 h-3" /> Adicionar Pergunta
                                </button>
                            </div>

                            <div className="space-y-6">
                                {lesson.questions?.map((question, qIdx) => (
                                    <div key={question.id} className="bg-brand-neutral/30 p-6 rounded-[2rem] border border-gray-100 relative group/q">
                                        <button 
                                            onClick={() => removeQuestion(mIdx, lIdx, qIdx)}
                                            className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover/q:opacity-100"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>

                                        <div className="mb-6">
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pergunta {qIdx + 1}</label>
                                            <input 
                                                type="text"
                                                value={question.text}
                                                onChange={(e) => updateQuestion(mIdx, lIdx, qIdx, e.target.value)}
                                                placeholder="Qual o conceito principal desta aula?"
                                                className="bg-white w-full border-0 rounded-2xl px-5 py-3 text-brand-deep font-bold focus:ring-2 focus:ring-brand-tech transition-all placeholder-gray-300"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Alternativas (Marque a correta)</label>
                                                <button 
                                                    onClick={() => addOption(mIdx, lIdx, qIdx)}
                                                    className="text-[9px] font-black text-brand-tech uppercase tracking-widest hover:underline"
                                                >
                                                    + Alternativa
                                                </button>
                                            </div>
                                            
                                            {question.options.map((option, oIdx) => (
                                                <div key={oIdx} className="flex items-center gap-3 group/opt">
                                                    <button 
                                                        onClick={() => toggleCorrectOption(mIdx, lIdx, qIdx, oIdx)}
                                                        className={`p-1.5 rounded-lg transition-all ${option.isCorrect ? 'bg-brand-green text-white shadow-lg shadow-brand-green/20' : 'bg-gray-100 text-gray-300 hover:bg-gray-200'}`}
                                                    >
                                                        {option.isCorrect ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                                                    </button>
                                                    
                                                    <input 
                                                        type="text"
                                                        value={option.text}
                                                        onChange={(e) => updateOption(mIdx, lIdx, qIdx, oIdx, e.target.value)}
                                                        placeholder={`Alternativa ${oIdx + 1}`}
                                                        className={`flex-1 bg-white border-0 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 transition-all ${option.isCorrect ? 'ring-2 ring-brand-green/30' : 'focus:ring-brand-tech/30'}`}
                                                    />

                                                    {question.options.length > 2 && (
                                                        <button 
                                                            onClick={() => removeOption(mIdx, lIdx, qIdx, oIdx)}
                                                            className="p-1.5 text-gray-200 hover:text-red-400 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {(!lesson.questions || lesson.questions.length === 0) && (
                                    <div className="text-center py-10 bg-brand-neutral/20 rounded-[2rem] border-2 border-dashed border-gray-100">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nenhuma pergunta adicionada.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherCourseEditor;