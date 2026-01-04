
import React, { useEffect, useState } from 'react';
// Corrected imports for useParams and useNavigate from react-router-dom
import { useParams, useNavigate } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { getCourseById, getQuizById, submitQuizAttempt, markLessonComplete, getUserCourseProgress, getUserRating, submitCourseRating } from '../services/mockBackend';
import { useAuth } from '../context/AuthContext';
import { Course, Lesson, Quiz, Module } from '../types';
import { ChevronLeft, ChevronRight, CheckCircle, Lock, PlayCircle, HelpCircle, FileText, Circle, Star, Award, Clock } from 'lucide-react';

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
  
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [userRating, setUserRating] = useState<number>(0);
  const [isRatingHover, setIsRatingHover] = useState<number>(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (id && user) {
      getCourseById(id).then(c => {
        if (c) {
          setCourse(c);
          if (c.modules.length > 0 && c.modules[0].lessons.length > 0) {
            handleLessonChange(0, 0, c.modules[0].lessons[0]);
          }
        }
      });

      getUserCourseProgress(user.uid, id).then(progress => {
        if (progress) {
          setCompletedLessonIds(new Set(progress.completedLessons));
        }
      });

      getUserRating(user.uid, id).then(r => {
          if (r !== null) setUserRating(r);
      });
    }
  }, [id, user]);

  const formatVideoUrl = (url: string | undefined) => {
    if (!url) return "";
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('youtube-nocookie.com')) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/watch?v=${match[2]}`;
        }
    }
    return url;
  };

  const activeModule = course?.modules[activeModuleIndex];
  const activeLesson = activeModule?.lessons[activeLessonIndex];
  const isLessonCompleted = activeLesson ? completedLessonIds.has(activeLesson.id) : false;

  // Calculate total lessons vs completed
  const totalLessonsCount = course?.modules.reduce((acc, m) => acc + m.lessons.length, 0) || 0;
  const isCourseFinished = completedLessonIds.size >= totalLessonsCount && totalLessonsCount > 0;

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
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto hidden md:block flex-shrink-0">
        <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
            <button onClick={() => navigate('/dashboard')} className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-2">
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar ao Painel
            </button>
            <h2 className="font-bold text-gray-900 line-clamp-2 mb-3">{course.title}</h2>
            
            {isCourseFinished && (
                <button 
                  onClick={() => navigate(`/certificate/${course.id}`)}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-3 rounded-lg text-xs font-bold hover:bg-green-700 transition-all shadow-sm mb-4"
                >
                    <Award className="w-4 h-4" /> EMITIR MEU CERTIFICADO
                </button>
            )}

            <div className="flex items-center gap-1 mb-1 border-t border-gray-50 pt-2">
                <span className="text-xs text-gray-500 mr-2">Sua nota:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        onMouseEnter={() => setIsRatingHover(star)}
                        onMouseLeave={() => setIsRatingHover(0)}
                        onClick={() => handleRating(star)}
                        className="focus:outline-none"
                    >
                        <Star 
                            className={`w-3.5 h-3.5 transition-colors ${
                                star <= (isRatingHover || userRating) 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-gray-300'
                            }`} 
                        />
                    </button>
                ))}
            </div>
        </div>
        <div className="pb-8">
          {course.modules.map((mod, mIdx) => (
            <div key={mod.id}>
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 font-bold text-[11px] uppercase tracking-wider text-gray-500">
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
                        className={`w-full text-left px-4 py-3.5 flex items-start gap-3 text-sm hover:bg-gray-50 transition-colors border-b border-gray-50 ${isActive ? 'bg-indigo-50/50 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'}`}
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
                         
                         <div className={`flex-1 ${isActive ? 'text-indigo-900 font-bold' : 'text-gray-600 font-medium'}`}>
                             {lesson.title}
                             <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1 font-normal uppercase">
                                <Clock className="w-2.5 h-2.5" /> {lesson.duration}
                             </div>
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
      <div className="flex-1 overflow-y-auto flex flex-col bg-gray-50">
        {activeLesson.type === 'video' ? (
          <div className="flex-1 bg-black flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-5xl aspect-video bg-gray-900 rounded-xl overflow-hidden shadow-2xl relative border border-white/5">
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
                      origin: window.location.origin, 
                      enablejsapi: 1 
                    }
                  }
                }}
                onError={(e: any) => console.error("Erro no Player:", e)}
              />
            </div>
            {isCourseFinished && (
                <div className="mt-6 animate-bounce">
                    <button 
                      onClick={() => navigate(`/certificate/${course.id}`)}
                      className="bg-green-600 text-white px-8 py-4 rounded-xl font-black text-lg shadow-xl hover:bg-green-700 transition-all flex items-center gap-3 border-2 border-green-500"
                    >
                        <Award className="w-6 h-6" /> EMITIR MEU CERTIFICADO
                    </button>
                </div>
            )}
          </div>
        ) : activeLesson.type === 'quiz' ? (
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100">
                    <div className="p-4 bg-indigo-100 rounded-2xl shadow-inner">
                        <HelpCircle className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-900">{activeQuiz?.title || "Avaliação"}</h2>
                        <p className="text-gray-500 text-sm font-medium">Nota mínima: {activeQuiz?.passingScore}%</p>
                    </div>
                </div>

                {!activeQuiz ? (
                    <div className="text-center py-10">Carregando dados do quiz...</div>
                ) : isLessonCompleted && !quizSubmitted ? (
                    <div className="text-center py-12">
                         <div className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle className="w-12 h-12 text-green-500" />
                            </div>
                            <h3 className="text-2xl font-black text-green-600 mb-2">Quiz Concluído</h3>
                            <p className="text-gray-500 mb-8 font-medium">Você já passou nesta avaliação com sucesso.</p>
                            <button 
                                onClick={() => setQuizSubmitted(false)}
                                className="text-indigo-600 font-bold hover:underline"
                            >
                                Revisar Questões
                            </button>
                         </div>
                    </div>
                ) : quizSubmitted ? (
                    <div className="text-center py-12">
                        {quizScore >= activeQuiz.passingScore ? (
                             <div className="flex flex-col items-center">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle className="w-12 h-12 text-green-500" />
                                </div>
                                <h3 className="text-3xl font-black text-green-600 mb-2">Você Passou!</h3>
                                <p className="text-gray-500 font-medium">Você marcou {quizScore.toFixed(0)}%. Seu progresso foi atualizado.</p>
                             </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                                    <Lock className="w-12 h-12 text-red-500" />
                                </div>
                                <h3 className="text-3xl font-black text-red-600 mb-2">Não foi desta vez</h3>
                                <p className="text-gray-500 font-medium mb-8">Você marcou {quizScore.toFixed(0)}%. Você precisa de {activeQuiz.passingScore}% para prosseguir.</p>
                                <button 
                                    onClick={() => setQuizSubmitted(false)}
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                                >
                                    Tentar Novamente
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-8">
                        {activeQuiz.questions.map((q, idx) => (
                            <div key={q.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                <h3 className="font-bold text-gray-900 mb-6 text-lg">{idx + 1}. {q.text}</h3>
                                <div className="space-y-3">
                                    {q.options.map((opt, optIdx) => (
                                        <label key={optIdx} className="flex items-center gap-3 cursor-pointer p-4 bg-white hover:bg-indigo-50 rounded-xl border border-gray-200 hover:border-indigo-200 transition-all shadow-sm">
                                            <input 
                                                type="radio" 
                                                name={`q-${q.id}`} 
                                                className="w-4 h-4 text-indigo-600"
                                                checked={quizAnswers[q.id] === optIdx}
                                                onChange={() => setQuizAnswers({...quizAnswers, [q.id]: optIdx})}
                                            />
                                            <span className="text-gray-700 font-medium">{opt.text}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <button 
                            onClick={submitQuiz}
                            className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 text-lg uppercase tracking-wider"
                        >
                            Enviar Avaliação
                        </button>
                    </div>
                )}
            </div>
          </div>
        ) : (
            <div className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto bg-white p-12 rounded-3xl shadow-sm border border-gray-100 min-h-full">
                    <h1 className="text-4xl font-black text-gray-900 mb-8 pb-6 border-b border-gray-100 leading-tight">{activeLesson.title}</h1>
                    <div className="prose prose-indigo max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">
                        {activeLesson.textContent || "Nenhum conteúdo disponível."}
                    </div>
                </div>
            </div>
        )}

        <div className="bg-white border-t border-gray-200 p-6 flex justify-between items-center shadow-[0_-4px_10px_rgba(0,0,0,0.03)] sticky bottom-0 z-10">
            <div className="flex-1 mr-4">
                 {activeLesson.type === 'video' && (
                    <>
                        <h1 className="text-lg font-bold text-gray-900 line-clamp-1">{activeLesson.title}</h1>
                        <p className="text-gray-500 text-sm font-medium line-clamp-1">{activeLesson.description || "Descrição não informada."}</p>
                    </>
                 )}
            </div>
            
            <div className="flex items-center gap-4">
                {isCourseFinished && (
                    <button 
                      onClick={() => navigate(`/certificate/${course.id}`)}
                      className="hidden sm:flex items-center gap-2 px-5 py-3 rounded-xl font-bold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                    >
                        <Award className="w-5 h-5" /> Certificado
                    </button>
                )}
                
                {activeLesson.type !== 'quiz' && (
                    <button 
                        onClick={handleMarkComplete}
                        disabled={isLessonCompleted}
                        className={`flex items-center gap-2 px-8 py-3.5 rounded-xl font-black transition-all whitespace-nowrap shadow-lg ${
                            isLessonCompleted 
                            ? 'bg-green-100 text-green-700 cursor-default shadow-none border border-green-200' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                        }`}
                    >
                        {isLessonCompleted ? (
                            <>
                                <CheckCircle className="w-5 h-5" /> Aula Concluída
                            </>
                        ) : (
                            <>
                                Próxima Aula <ChevronRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePlayer;
