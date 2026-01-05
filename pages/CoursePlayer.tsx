import React, { useEffect, useState } from 'react';
/* Fix: Using namespace import for react-router-dom to resolve export issues */
import * as ReactRouterDOM from 'react-router-dom';
const { useParams, useNavigate } = ReactRouterDOM as any;
import ReactPlayer from 'react-player';
import { getCourseById, getQuizById, submitQuizAttempt, markLessonComplete, getUserCourseProgress, getUserRating, submitCourseRating } from '../services/mockBackend';
import { useAuth } from '../context/AuthContext';
import { Course, Lesson, Quiz, Module } from '../types';
import { ChevronLeft, ChevronRight, CheckCircle, Lock, PlayCircle, HelpCircle, FileText, Circle, Star, Award, Clock } from 'lucide-react';

const Player = ReactPlayer as any;

const CoursePlayer: React.FC = () => {
  // Fix: Untyped function calls (any) may not accept type arguments
  const { id } = useParams();
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

  if (!course || !activeModule || !activeLesson) return <div className="p-8 text-center text-brand-graphite font-bold">Iniciando sua aula...</div>;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-brand-neutral">
      {/* Sidebar - Course Content */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto hidden md:block flex-shrink-0">
        <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
            <button onClick={() => navigate('/dashboard')} className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-brand-tech mb-4 transition-colors">
                <ChevronLeft className="w-4 h-4 mr-1" /> Painel
            </button>
            <h2 className="font-black text-brand-deep line-clamp-2 leading-tight mb-4">{course.title}</h2>
            
            {isCourseFinished && (
                <button 
                  onClick={() => navigate(`/certificate/${course.id}`)}
                  className="w-full flex items-center justify-center gap-2 bg-brand-green text-white py-3 px-4 rounded-xl text-xs font-black hover:bg-brand-green/90 transition-all shadow-lg shadow-brand-green/20 mb-6 uppercase tracking-widest"
                >
                    <Award className="w-4 h-4" /> Certificado Disponível
                </button>
            )}

            <div className="flex items-center gap-1.5 pt-4 border-t border-gray-50">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-1">Sua Nota:</span>
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
                                ? 'fill-yellow-500 text-yellow-500' 
                                : 'text-gray-200'
                            }`} 
                        />
                    </button>
                ))}
            </div>
        </div>
        <div className="pb-12">
          {course.modules.map((mod, mIdx) => (
            <div key={mod.id}>
              <div className="bg-brand-neutral/50 px-6 py-4 border-b border-gray-100 font-black text-[10px] uppercase tracking-[0.2em] text-gray-400">
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
                        className={`w-full text-left px-6 py-4 flex items-start gap-4 text-sm hover:bg-brand-neutral/50 transition-all border-b border-gray-50 ${isActive ? 'bg-brand-tech/5 border-l-4 border-brand-tech' : 'border-l-4 border-transparent'}`}
                      >
                         <div className="mt-1">
                            {isCompleted ? (
                                <CheckCircle className="w-4 h-4 text-brand-green" />
                            ) : lesson.type === 'video' ? (
                                <PlayCircle className={`w-4 h-4 ${isActive ? 'text-brand-tech' : 'text-gray-300'}`} /> 
                            ) : lesson.type === 'quiz' ? (
                                <HelpCircle className={`w-4 h-4 ${isActive ? 'text-brand-tech' : 'text-gray-300'}`} /> 
                            ) : (
                                <FileText className={`w-4 h-4 ${isActive ? 'text-brand-tech' : 'text-gray-300'}`} />
                            )}
                         </div>
                         
                         <div className={`flex-1 ${isActive ? 'text-brand-deep font-black' : 'text-brand-graphite font-medium'}`}>
                             {lesson.title}
                             <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-1 font-bold uppercase tracking-widest">
                                <Clock className="w-3 h-3" /> {lesson.duration}
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
      <div className="flex-1 overflow-y-auto flex flex-col bg-brand-neutral">
        {activeLesson.type === 'video' ? (
          <div className="flex-1 bg-black flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-5xl aspect-video bg-brand-deep rounded-3xl overflow-hidden shadow-2xl relative border border-white/5">
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
                <div className="mt-8 animate-bounce">
                    <button 
                      onClick={() => navigate(`/certificate/${course.id}`)}
                      className="bg-brand-green text-white px-10 py-5 rounded-2xl font-black text-lg shadow-2xl shadow-brand-green/30 hover:bg-brand-green/90 transition-all flex items-center gap-3 border-2 border-white/20 uppercase tracking-widest"
                    >
                        <Award className="w-7 h-7" /> Emitir Certificado
                    </button>
                </div>
            )}
          </div>
        ) : activeLesson.type === 'quiz' ? (
          <div className="flex-1 p-10 overflow-y-auto">
            <div className="max-w-2xl mx-auto bg-white p-12 rounded-[2.5rem] shadow-sm border border-gray-100">
                <div className="flex items-center gap-6 mb-10 pb-10 border-b border-gray-50">
                    <div className="p-5 bg-brand-tech rounded-3xl shadow-xl shadow-brand-tech/20">
                        <HelpCircle className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-brand-deep leading-tight">{activeQuiz?.title || "Avaliação de Performance"}</h2>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Exigência: {activeQuiz?.passingScore}% de acerto</p>
                    </div>
                </div>

                {!activeQuiz ? (
                    <div className="text-center py-12 text-gray-400 font-bold uppercase tracking-widest text-sm">Carregando avaliação Habilon...</div>
                ) : isLessonCompleted && !quizSubmitted ? (
                    <div className="text-center py-16">
                         <div className="flex flex-col items-center">
                            <div className="w-24 h-24 bg-brand-green/10 rounded-full flex items-center justify-center mb-8">
                                <CheckCircle className="w-14 h-14 text-brand-green" />
                            </div>
                            <h3 className="text-3xl font-black text-brand-green mb-3 uppercase tracking-tight">Avaliação Concluída</h3>
                            <p className="text-gray-500 mb-10 font-medium">Seu desempenho nesta aula foi registrado com sucesso.</p>
                            <button 
                                onClick={() => setQuizSubmitted(false)}
                                className="text-brand-tech font-black hover:underline uppercase tracking-widest text-xs"
                            >
                                Rever Perguntas
                            </button>
                         </div>
                    </div>
                ) : quizSubmitted ? (
                    <div className="text-center py-16">
                        {quizScore >= activeQuiz.passingScore ? (
                             <div className="flex flex-col items-center">
                                <div className="w-24 h-24 bg-brand-green/10 rounded-full flex items-center justify-center mb-8">
                                    <CheckCircle className="w-14 h-14 text-brand-green" />
                                </div>
                                <h3 className="text-4xl font-black text-brand-green mb-3 uppercase tracking-tight">Você evoluiu!</h3>
                                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Score final: {quizScore.toFixed(0)}% de acerto</p>
                             </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-8">
                                    <Lock className="w-14 h-14 text-red-600" />
                                </div>
                                <h3 className="text-4xl font-black text-red-600 mb-3 uppercase tracking-tight">Não foi desta vez</h3>
                                <p className="text-gray-500 font-medium mb-10">Você marcou {quizScore.toFixed(0)}%. É necessário atingir {activeQuiz.passingScore}%.</p>
                                <button 
                                    onClick={() => setQuizSubmitted(false)}
                                    className="px-10 py-5 bg-brand-tech text-white rounded-2xl font-black hover:bg-brand-deep shadow-xl shadow-brand-tech/30 transition-all uppercase tracking-widest text-sm"
                                >
                                    Refazer Avaliação
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-10">
                        {activeQuiz.questions.map((q, idx) => (
                            <div key={q.id} className="p-8 bg-brand-neutral/30 rounded-3xl border border-gray-100">
                                <h3 className="font-black text-brand-deep mb-8 text-xl leading-snug">{idx + 1}. {q.text}</h3>
                                <div className="space-y-4">
                                    {q.options.map((opt, optIdx) => (
                                        <label key={optIdx} className="flex items-center gap-4 cursor-pointer p-5 bg-white hover:bg-brand-tech/5 rounded-2xl border border-gray-100 hover:border-brand-tech/30 transition-all shadow-sm group">
                                            <input 
                                                type="radio" 
                                                name={`q-${q.id}`} 
                                                className="w-5 h-5 text-brand-tech focus:ring-brand-tech border-gray-300 transition-all"
                                                checked={quizAnswers[q.id] === optIdx}
                                                onChange={() => setQuizAnswers({...quizAnswers, [q.id]: optIdx})}
                                            />
                                            <span className="text-brand-graphite font-bold group-hover:text-brand-tech transition-colors">{opt.text}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <button 
                            onClick={submitQuiz}
                            className="w-full bg-brand-tech text-white font-black py-6 rounded-[2rem] hover:bg-brand-deep transition-all shadow-2xl shadow-brand-tech/30 text-lg uppercase tracking-[0.2em]"
                        >
                            Finalizar Avaliação
                        </button>
                    </div>
                )}
            </div>
          </div>
        ) : (
            <div className="flex-1 p-10 overflow-y-auto">
                <div className="max-w-4xl mx-auto bg-white p-16 rounded-[3rem] shadow-sm border border-gray-50 min-h-full">
                    <h1 className="text-5xl font-black text-brand-deep mb-10 pb-8 border-b border-gray-50 leading-tight tracking-tight">{activeLesson.title}</h1>
                    <div className="prose prose-brand max-w-none text-brand-graphite whitespace-pre-wrap leading-relaxed text-lg font-medium">
                        {activeLesson.textContent || "Este conteúdo ainda não foi publicado."}
                    </div>
                </div>
            </div>
        )}

        <div className="bg-white border-t border-gray-100 p-8 flex justify-between items-center shadow-lg sticky bottom-0 z-10">
            <div className="flex-1 mr-8">
                 {activeLesson.type === 'video' && (
                    <>
                        <h1 className="text-xl font-black text-brand-deep line-clamp-1 tracking-tight">{activeLesson.title}</h1>
                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1 line-clamp-1">{activeLesson.description || "Descrição exclusiva Habilon Class."}</p>
                    </>
                 )}
            </div>
            
            <div className="flex items-center gap-4">
                {isCourseFinished && (
                    <button 
                      onClick={() => navigate(`/certificate/${course.id}`)}
                      className="hidden sm:flex items-center gap-2 px-6 py-4 rounded-2xl font-black bg-brand-green/10 text-brand-green border border-brand-green/20 hover:bg-brand-green hover:text-white transition-all uppercase tracking-widest text-xs"
                    >
                        <Award className="w-5 h-5" /> Certificado
                    </button>
                )}
                
                {activeLesson.type !== 'quiz' && (
                    <button 
                        onClick={handleMarkComplete}
                        disabled={isLessonCompleted}
                        className={`flex items-center gap-3 px-10 py-4.5 rounded-[2rem] font-black transition-all whitespace-nowrap shadow-xl uppercase tracking-widest text-xs ${
                            isLessonCompleted 
                            ? 'bg-brand-green text-white cursor-default shadow-brand-green/20' 
                            : 'bg-brand-tech text-white hover:bg-brand-deep shadow-brand-tech/30'
                        }`}
                    >
                        {isLessonCompleted ? (
                            <>
                                <CheckCircle className="w-5 h-5" /> Concluído
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