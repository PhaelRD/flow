
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { getCourseById, getQuizById, submitQuizAttempt, markLessonComplete, getUserCourseProgress, getUserRating, submitCourseRating } from '../services/mockBackend';
import { useAuth } from '../context/AuthContext';
import { Course, Lesson, Quiz, Module } from '../types';
import { ChevronLeft, ChevronRight, CheckCircle, Lock, PlayCircle, HelpCircle, FileText, Circle, Star } from 'lucide-react';

// Fix: ReactPlayer type definitions can be inconsistent in some environments; 
// casting to any ensures 'url' and other props are accepted correctly.
const Player = ReactPlayer as any;

const CoursePlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  
  // Progress & Rating State
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [userRating, setUserRating] = useState<number>(0);
  const [isRatingHover, setIsRatingHover] = useState<number>(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (id && user) {
      // 1. Load Course Data
      getCourseById(id).then(c => {
        if (c) {
          setCourse(c);
          // Default to first lesson
          if (c.modules.length > 0 && c.modules[0].lessons.length > 0) {
            handleLessonChange(0, 0, c.modules[0].lessons[0]);
          }
        }
      });

      // 2. Load Progress Data
      getUserCourseProgress(user.uid, id).then(progress => {
        if (progress) {
          setCompletedLessonIds(new Set(progress.completedLessons));
        }
      });

      // 3. Load User Rating
      getUserRating(user.uid, id).then(r => {
          if (r !== null) setUserRating(r);
      });
    }
  }, [id, user]);

  /**
   * Formata a URL para utilizar o formato padrão youtube.com/watch?v=
   * Isso melhora a compatibilidade com as ferramentas de compartilhamento padrão e o ReactPlayer.
   */
  const formatVideoUrl = (url: string | undefined) => {
    if (!url) return "";
    
    // Se for YouTube, garantimos o formato watch?v=
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('youtube-nocookie.com')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            // Retorna o formato padrão solicitado
            return `https://www.youtube.com/watch?v=${match[2]}`;
        }
    }
    return url;
  };

  const activeModule = course?.modules[activeModuleIndex];
  const activeLesson = activeModule?.lessons[activeLessonIndex];
  const isLessonCompleted = activeLesson ? completedLessonIds.has(activeLesson.id) : false;

  const handleLessonChange = async (modIndex: number, lessonIndex: number, lesson: Lesson) => {
    setActiveModuleIndex(modIndex);
    setActiveLessonIndex(lessonIndex);
    setQuizSubmitted(false);
    setQuizAnswers({});
    setActiveQuiz(null);

    if (lesson.type === 'quiz' && lesson.quizId) {
      const q = await getQuizById(lesson.quizId);
      if (q) setActiveQuiz(q);
    }
  };

  const handleMarkComplete = async () => {
     if(!user || !course || !activeLesson) return;
     
     const newSet = new Set(completedLessonIds);
     newSet.add(activeLesson.id);
     setCompletedLessonIds(newSet);

     await markLessonComplete(user.uid, course.id, activeLesson.id);

     const currentModule = course.modules[activeModuleIndex];
     if(activeLessonIndex < currentModule.lessons.length - 1) {
         handleLessonChange(activeModuleIndex, activeLessonIndex + 1, currentModule.lessons[activeLessonIndex + 1]);
     } else if (activeModuleIndex < course.modules.length - 1) {
         const nextModule = course.modules[activeModuleIndex + 1];
         if(nextModule.lessons.length > 0) {
            handleLessonChange(activeModuleIndex + 1, 0, nextModule.lessons[0]);
         }
     }
  };

  const handleRating = async (rating: number) => {
      if(!user || !course) return;
      setUserRating(rating);
      await submitCourseRating(user.uid, course.id, rating);
  }

  const submitQuiz = async () => {
    if (!activeQuiz || !user || !course || !activeLesson) return;
    
    let correctCount = 0;
    activeQuiz.questions.forEach(q => {
      const selectedOptionIndex = quizAnswers[q.id];
      if (selectedOptionIndex !== undefined && q.options[selectedOptionIndex].isCorrect) {
        correctCount++;
      }
    });

    const score = (correctCount / activeQuiz.questions.length) * 100;
    const passed = score >= activeQuiz.passingScore;
    
    setQuizScore(score);
    setQuizSubmitted(true);

    await submitQuizAttempt({
      userId: user.uid,
      quizId: activeQuiz.id,
      score,
      passed,
      timestamp: Date.now()
    });

    if (passed) {
       await markLessonComplete(user.uid, course.id, activeLesson.id);
       const newSet = new Set(completedLessonIds);
       newSet.add(activeLesson.id);
       setCompletedLessonIds(newSet);
    }
  };

  if (!course || !activeModule || !activeLesson) return <div className="p-8 text-center">Carregando Conteúdo...</div>;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-100">
      {/* Sidebar - Course Content */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto hidden md:block">
        <div className="p-4 border-b border-gray-200">
            <button onClick={() => navigate('/dashboard')} className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-2">
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar ao Painel
            </button>
            <h2 className="font-bold text-gray-800 line-clamp-2 mb-2">{course.title}</h2>
            
            <div className="flex items-center gap-1 mb-1">
                <span className="text-xs text-gray-500 mr-2">Avaliar:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onMouseEnter={() => setIsRatingHover(star)}
                        onMouseLeave={() => setIsRatingHover(0)}
                        onClick={() => handleRating(star)}
                        className="focus:outline-none"
                    >
                        <Star 
                            className={`w-4 h-4 transition-colors ${
                                star <= (isRatingHover || userRating) 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-gray-300'
                            }`} 
                        />
                    </button>
                ))}
            </div>
        </div>
        <div>
          {course.modules.map((mod, mIdx) => (
            <div key={mod.id}>
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 font-medium text-sm text-gray-700">
                Módulo {mIdx + 1}: {mod.title}
              </div>
              <ul>
                {mod.lessons.map((lesson, lIdx) => {
                  const isActive = mIdx === activeModuleIndex && lIdx === activeLessonIndex;
                  const isCompleted = completedLessonIds.has(lesson.id);
                  
                  return (
                    <li key={lesson.id}>
                      <button
                        onClick={() => handleLessonChange(mIdx, lIdx, lesson)}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 text-sm hover:bg-gray-50 transition-colors ${isActive ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'}`}
                      >
                         <div className="mt-0.5">
                            {isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : lesson.type === 'video' ? (
                                <PlayCircle className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} /> 
                            ) : lesson.type === 'quiz' ? (
                                <HelpCircle className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} /> 
                            ) : (
                                <FileText className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
                            )}
                         </div>
                         
                         <div className={`flex-1 ${isActive ? 'text-indigo-900 font-medium' : 'text-gray-600'}`}>
                             {lesson.title}
                             <div className="text-xs text-gray-400 mt-1">{lesson.duration}</div>
                         </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto flex flex-col">
        {activeLesson.type === 'video' ? (
          <div className="flex-1 bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-4xl aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-2xl relative">
              <Player
                url={formatVideoUrl(activeLesson.videoUrl)}
                width="100%"
                height="100%"
                controls={true}
                pip={true}
                config={{
                  youtube: {
                    playerVars: { 
                      modestbranding: 1,
                      rel: 0,
                      showinfo: 0,
                      iv_load_policy: 3,
                      // FUNDAMENTAL: Informa ao YouTube o domínio atual
                      origin: window.location.origin, 
                      // Ativa a API de comunicação necessária para o ReactPlayer
                      enablejsapi: 1 
                    }
                  }
                }}
                onError={(e: any) => console.error("Erro no Player:", e)}
              />
            </div>
          </div>
        ) : activeLesson.type === 'quiz' ? (
          <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
                <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                        <HelpCircle className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{activeQuiz?.title || "Avaliação"}</h2>
                        <p className="text-gray-500 text-sm">Nota mínima: {activeQuiz?.passingScore}%</p>
                    </div>
                </div>

                {!activeQuiz ? (
                    <div className="text-center py-10">Carregando dados do quiz...</div>
                ) : isLessonCompleted && !quizSubmitted ? (
                    <div className="text-center py-8">
                         <div className="flex flex-col items-center">
                            <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                            <h3 className="text-2xl font-bold text-green-600 mb-2">Quiz Concluído</h3>
                            <p className="text-gray-600 mb-6">Você já passou nesta avaliação.</p>
                            <button 
                                onClick={() => setQuizSubmitted(false)}
                                className="text-indigo-600 hover:underline"
                            >
                                Revisar Questões
                            </button>
                         </div>
                    </div>
                ) : quizSubmitted ? (
                    <div className="text-center py-8">
                        {quizScore >= activeQuiz.passingScore ? (
                             <div className="flex flex-col items-center">
                                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                                <h3 className="text-2xl font-bold text-green-600 mb-2">Você Passou!</h3>
                                <p className="text-gray-600">Você marcou {quizScore.toFixed(0)}%. Progresso salvo.</p>
                             </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <Lock className="w-16 h-16 text-red-500 mb-4" />
                                <h3 className="text-2xl font-bold text-red-600 mb-2">Não Passou</h3>
                                <p className="text-gray-600">Você marcou {quizScore.toFixed(0)}%. Você precisa de {activeQuiz.passingScore}% para passar.</p>
                                <button 
                                    onClick={() => setQuizSubmitted(false)}
                                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                    Tentar Novamente
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        {activeQuiz.questions.map((q, idx) => (
                            <div key={q.id} className="p-4 bg-gray-50 rounded-lg">
                                <h3 className="font-medium text-gray-900 mb-4">{idx + 1}. {q.text}</h3>
                                <div className="space-y-2">
                                    {q.options.map((opt, optIdx) => (
                                        <label key={optIdx} className="flex items-start gap-3 cursor-pointer p-2 hover:bg-white rounded transition-colors">
                                            <input 
                                                type="radio" 
                                                name={`q-${q.id}`} 
                                                className="mt-1"
                                                checked={quizAnswers[q.id] === optIdx}
                                                onChange={() => setQuizAnswers({...quizAnswers, [q.id]: optIdx})}
                                            />
                                            <span className="text-gray-700 text-sm">{opt.text}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <button 
                            onClick={submitQuiz}
                            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Enviar Respostas
                        </button>
                    </div>
                )}
            </div>
          </div>
        ) : (
            <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
                <div className="max-w-3xl mx-auto bg-white p-12 rounded-xl shadow-sm min-h-full">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">{activeLesson.title}</h1>
                    <div className="prose max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {activeLesson.textContent || "Nenhum conteúdo disponível."}
                    </div>
                </div>
            </div>
        )}

        <div className="bg-white border-t border-gray-200 p-6 flex justify-between items-center">
            <div className="flex-1 mr-4">
                 {activeLesson.type === 'video' && (
                    <>
                        <h1 className="text-xl font-bold text-gray-900">{activeLesson.title}</h1>
                        <p className="text-gray-500 mt-1 line-clamp-1">{activeLesson.description || "Nenhuma descrição disponível."}</p>
                    </>
                 )}
            </div>
            
            {activeLesson.type !== 'quiz' && (
                <button 
                    onClick={handleMarkComplete}
                    disabled={isLessonCompleted}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-colors whitespace-nowrap ${
                        isLessonCompleted 
                        ? 'bg-green-100 text-green-700 cursor-default' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                >
                    {isLessonCompleted ? (
                        <>
                            <CheckCircle className="w-5 h-5" /> Concluído
                        </>
                    ) : (
                        <>
                            Marcar como Concluído <ChevronRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
