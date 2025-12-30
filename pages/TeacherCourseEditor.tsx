import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Video, HelpCircle, FileText, CheckCircle, Circle, ArrowLeft } from 'lucide-react';
import { createCourse, createQuiz, getCourseById, getQuizById, updateCourse, updateQuiz } from '../services/mockBackend';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { Module, Lesson, QuizQuestion } from '../types';

const TeacherCourseEditor: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>(); // Get ID from URL if editing
  
  const [loading, setLoading] = useState(!!courseId);
  const [saving, setSaving] = useState(false);

  const [courseTitle, setCourseTitle] = useState('');
  const [coursePrice, setCoursePrice] = useState('0');
  const [thumbnailUrl, setThumbnailUrl] = useState('https://picsum.photos/400/225');
  const [description, setDescription] = useState('');
  
  const [modules, setModules] = useState<Module[]>([
    { id: 'mod-1', title: 'Módulo 1', lessons: [] }
  ]);

  // Load course data if editing
  useEffect(() => {
    if (courseId) {
      const loadCourse = async () => {
        try {
          const course = await getCourseById(courseId);
          if (course) {
            setCourseTitle(course.title);
            setCoursePrice(course.price.toString());
            setThumbnailUrl(course.thumbnailUrl);
            setDescription(course.description);
            
            // Deeply load quizzes into lessons
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
      title: type === 'video' ? 'Nova Videoaula' : type === 'quiz' ? 'Novo Quiz' : 'Nova Leitura',
      type: type,
      videoUrl: '',
      textContent: '',
      duration: type === 'text' ? '5 min de leitura' : '10:00',
      description: '',
      questions: [], // Initialize empty questions for quiz
      passingScore: 70
    });
    setModules(newModules);
  };

  // --- Quiz Helpers ---
  const addQuestion = (moduleIndex: number, lessonIndex: number) => {
    const newModules = [...modules];
    const lesson = newModules[moduleIndex].lessons[lessonIndex];
    if (!lesson.questions) lesson.questions = [];
    
    lesson.questions.push({
      id: `q-${Date.now()}`,
      text: '',
      options: [
        { text: 'Opção 1', isCorrect: false },
        { text: 'Opção 2', isCorrect: false }
      ]
    });
    setModules(newModules);
  };

  const updateQuestion = (mIdx: number, lIdx: number, qIdx: number, text: string) => {
    const newModules = [...modules];
    if (newModules[mIdx].lessons[lIdx].questions) {
        newModules[mIdx].lessons[lIdx].questions![qIdx].text = text;
        setModules(newModules);
    }
  };

  const removeQuestion = (mIdx: number, lIdx: number, qIdx: number) => {
    const newModules = [...modules];
    newModules[mIdx].lessons[lIdx].questions?.splice(qIdx, 1);
    setModules(newModules);
  };

  const addOption = (mIdx: number, lIdx: number, qIdx: number) => {
     const newModules = [...modules];
     newModules[mIdx].lessons[lIdx].questions?.[qIdx].options.push({ text: '', isCorrect: false });
     setModules(newModules);
  };

  const updateOption = (mIdx: number, lIdx: number, qIdx: number, oIdx: number, text: string) => {
    const newModules = [...modules];
    const options = newModules[mIdx].lessons[lIdx].questions?.[qIdx].options;
    if(options) {
        options[oIdx].text = text;
        setModules(newModules);
    }
  };

  const setCorrectOption = (mIdx: number, lIdx: number, qIdx: number, oIdx: number) => {
    const newModules = [...modules];
    const options = newModules[mIdx].lessons[lIdx].questions?.[qIdx].options;
    if(options) {
        options.forEach((opt, idx) => opt.isCorrect = idx === oIdx);
        setModules(newModules);
    }
  };

  const removeOption = (mIdx: number, lIdx: number, qIdx: number, oIdx: number) => {
     const newModules = [...modules];
     newModules[mIdx].lessons[lIdx].questions?.[qIdx].options.splice(oIdx, 1);
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
          // Deep copy modules to avoid mutating state during save preparation
          const modulesToSave = JSON.parse(JSON.stringify(modules));

          // 1. Process Quizzes: Create or Update separate Quiz documents
          for (const module of modulesToSave) {
              for (const lesson of module.lessons) {
                  if (lesson.type === 'quiz' && lesson.questions && lesson.questions.length > 0) {
                       const quizData = {
                           title: lesson.title,
                           passingScore: lesson.passingScore || 70,
                           questions: lesson.questions
                       };

                       if (lesson.quizId) {
                           // Update existing quiz
                           await updateQuiz(lesson.quizId, quizData);
                       } else {
                           // Create new quiz
                           const quizId = await createQuiz(quizData);
                           lesson.quizId = quizId;
                       }
                       
                       // Remove editor-only fields before saving course
                       delete lesson.questions;
                       delete lesson.passingScore;
                  }
              }
          }

          const courseData = {
              title: courseTitle,
              description: description || 'Sem descrição.',
              price: parseFloat(coursePrice) || 0,
              teacherId: user.uid,
              teacherName: user.name,
              thumbnailUrl: thumbnailUrl,
              status: 'published' as const,
              modules: modulesToSave
          };

          if (courseId) {
              await updateCourse(courseId, courseData);
              alert("Curso atualizado com sucesso!");
          } else {
              await createCourse(courseData);
              alert("Curso criado com sucesso!");
          }

          navigate('/teacher/dashboard');
      } catch (e) {
          console.error(e);
          alert("Falha ao salvar curso. Verifique o console para detalhes.");
      } finally {
          setSaving(false);
      }
  };

  if (loading) return <div className="p-8 text-center">Carregando editor de curso...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/teacher/dashboard')} className="mb-4 flex items-center text-sm text-gray-500 hover:text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao Painel
      </button>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{courseId ? 'Editar Curso' : 'Criar Novo Curso'}</h1>
        <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? 'Salvando...' : 'Salvar Curso'}
        </button>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Título do Curso</label>
          <input 
            type="text" 
            className="bg-white w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Ex: Padrões Avançados de React"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço ($)</label>
                <input 
                    type="number" 
                    className="bg-white w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={coursePrice}
                    onChange={(e) => setCoursePrice(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL da Miniatura</label>
                <input 
                    type="text" 
                    className="bg-white w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                />
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea 
                className="bg-white w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Currículo</h2>
          
          <div className="space-y-6">
            {modules.map((module, mIdx) => (
              <div key={mIdx} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <input 
                    value={module.title}
                    onChange={(e) => {
                      const newMods = [...modules];
                      newMods[mIdx].title = e.target.value;
                      setModules(newMods);
                    }}
                    className="bg-transparent font-medium text-gray-900 border-b border-dashed border-gray-400 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex items-center gap-2">
                     <button onClick={() => addLesson(mIdx, 'text')} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800">
                        <FileText className="w-3 h-3" /> Add Texto
                     </button>
                     <button onClick={() => addLesson(mIdx, 'video')} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800">
                        <Video className="w-3 h-3" /> Add Vídeo
                     </button>
                     <button onClick={() => addLesson(mIdx, 'quiz')} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-800">
                        <HelpCircle className="w-3 h-3" /> Add Quiz
                     </button>
                  </div>
                </div>

                <ul className="space-y-2">
                  {module.lessons.map((lesson, lIdx) => (
                    <li key={lIdx} className="flex flex-col gap-3 bg-white p-3 rounded border border-gray-100">
                      <div className="flex items-center gap-2 w-full">
                        {lesson.type === 'video' && <Video className="w-4 h-4 text-gray-400" />}
                        {lesson.type === 'quiz' && <HelpCircle className="w-4 h-4 text-gray-400" />}
                        {lesson.type === 'text' && <FileText className="w-4 h-4 text-gray-400" />}
                        
                        <input 
                            value={lesson.title}
                            onChange={(e) => {
                                const newMods = [...modules];
                                newMods[mIdx].lessons[lIdx].title = e.target.value;
                                setModules(newMods);
                            }}
                            className="bg-white text-sm border-none focus:ring-0 p-0 font-medium flex-1"
                            placeholder="Título da Aula"
                        />

                        <Trash2 
                          className="w-4 h-4 text-gray-300 hover:text-red-500 cursor-pointer" 
                          onClick={() => {
                              const newMods = [...modules];
                              newMods[mIdx].lessons.splice(lIdx, 1);
                              setModules(newMods);
                          }}
                        />
                      </div>
                      
                      {lesson.type === 'video' && (
                          <input 
                            value={lesson.videoUrl}
                            onChange={(e) => {
                                const newMods = [...modules];
                                newMods[mIdx].lessons[lIdx].videoUrl = e.target.value;
                                setModules(newMods);
                            }}
                            className="bg-white text-xs border border-gray-200 rounded px-2 py-1 w-full"
                            placeholder="URL do Vídeo (ex: Link Embed do YouTube)"
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
                            className="bg-white text-xs border border-gray-200 rounded px-2 py-2 w-full font-mono text-gray-600"
                            placeholder="Digite o conteúdo da aula aqui... (Texto simples ou Markdown)"
                            rows={4}
                          />
                      )}

                      {lesson.type === 'quiz' && (
                        <div className="mt-2 border-t border-gray-100 pt-3 space-y-4">
                            <div className="flex items-center gap-3">
                                <label className="text-xs font-medium text-gray-600">Nota para Aprovação (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={lesson.passingScore || 70}
                                    onChange={(e) => {
                                        const newMods = [...modules];
                                        newMods[mIdx].lessons[lIdx].passingScore = parseInt(e.target.value);
                                        setModules(newMods);
                                    }}
                                    className="bg-white w-16 text-xs border border-gray-300 rounded px-2 py-1"
                                />
                            </div>
                            
                            <div className="space-y-3">
                                {lesson.questions?.map((q, qIdx) => (
                                    <div key={q.id} className="bg-gray-50 p-3 rounded border border-gray-200 relative">
                                        <button 
                                            onClick={() => removeQuestion(mIdx, lIdx, qIdx)}
                                            className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                                            title="Remover Questão"
                                        >
                                            <Trash2 size={14}/>
                                        </button>
                                        
                                        <div className="mb-2 pr-6">
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Questão {qIdx + 1}</label>
                                            <input
                                                placeholder="Digite a pergunta..."
                                                value={q.text}
                                                onChange={(e) => updateQuestion(mIdx, lIdx, qIdx, e.target.value)}
                                                className="bg-white w-full text-sm border border-gray-300 p-1.5 rounded focus:border-indigo-500 focus:outline-none"
                                            />
                                        </div>
                                        
                                        <div className="space-y-2 pl-2">
                                            {q.options.map((opt, oIdx) => (
                                                <div key={oIdx} className="flex items-center gap-2">
                                                    <button 
                                                        onClick={() => setCorrectOption(mIdx, lIdx, qIdx, oIdx)}
                                                        className={`flex-shrink-0 w-4 h-4 rounded-full border flex items-center justify-center ${opt.isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
                                                        title="Marcar como resposta correta"
                                                    >
                                                        {opt.isCorrect && <div className="w-2 h-2 rounded-full bg-green-500" />}
                                                    </button>
                                                    <input
                                                        placeholder={`Opção ${oIdx+1}`}
                                                        value={opt.text}
                                                        onChange={(e) => updateOption(mIdx, lIdx, qIdx, oIdx, e.target.value)}
                                                        className={`bg-white flex-1 text-xs border p-1 rounded ${opt.isCorrect ? 'border-green-300 bg-green-50' : 'border-gray-300'}`}
                                                    />
                                                    <button onClick={() => removeOption(mIdx, lIdx, qIdx, oIdx)}>
                                                        <Trash2 size={12} className="text-gray-300 hover:text-red-400"/>
                                                    </button>
                                                </div>
                                            ))}
                                            <button 
                                                onClick={() => addOption(mIdx, lIdx, qIdx)}
                                                className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-1"
                                            >
                                                <Plus size={12} /> Add Opção
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button 
                                onClick={() => addQuestion(mIdx, lIdx)} 
                                className="w-full py-2 border border-dashed border-indigo-300 text-indigo-600 text-sm font-medium rounded hover:bg-indigo-50 flex items-center justify-center gap-2"
                            >
                                <HelpCircle size={14} /> Add Questão
                            </button>
                        </div>
                      )}
                    </li>
                  ))}
                  {module.lessons.length === 0 && (
                    <li className="text-sm text-gray-400 italic">Nenhuma aula ainda.</li>
                  )}
                </ul>
              </div>
            ))}
          </div>

          <button onClick={addModule} className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
            <Plus className="w-4 h-4" /> Add Módulo
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherCourseEditor;