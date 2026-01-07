
import React, { useEffect, useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import ReactPlayer from 'react-player';
import { 
  getCourseById, 
  getQuizById, 
  submitQuizAttempt, 
  markLessonComplete, 
  getUserCourseProgress, 
  getUserRating, 
  submitCourseRating 
} from '../services/mockBackend';
import { useAuth } from '../context/AuthContext';
import { Course, Lesson, Quiz } from '../types';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Lock, 
  PlayCircle, 
  HelpCircle, 
  FileText, 
  Star, 
  Award, 
  Clock 
} from 'lucide-react';

const { useParams, useNavigate } = ReactRouterDOM as any;
const Player = ReactPlayer as any;

const CoursePlayer: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

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
        if (progress) setCompletedLessonIds(new Set(progress.completedLessons));
      });

      getUserRating(user.uid, id).then(r => {
        if (r !== null) setUserRating(r);
      });
    }
  }, [id, user]);

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
    if (!user || !course || !activeLesson) return;
    
    const newSet = new Set(completedLessonIds);
    newSet.add(activeLesson.id);
    setCompletedLessonIds(newSet);
    await markLessonComplete(user.uid, course.id, activeLesson.id);

    const currentModule = course.modules[activeModuleIndex];
    if (activeLessonIndex < currentModule.lessons.length - 1) {
      handleLessonChange(activeModuleIndex, activeLessonIndex + 1, currentModule.lessons[activeLessonIndex + 1]);
    } else if (activeModuleIndex < course.modules.length - 1) {
      const nextModule = course.modules[activeModuleIndex + 1];
      if (nextModule.lessons.length > 0) {
        handleLessonChange(activeModuleIndex + 1, 0, nextModule.lessons[0]);
      }
    }
  };

  const submitQuiz = async () => {
    if (!activeQuiz || !user || !course || !activeLesson) return;
    
    let correctCount = 0;
    activeQuiz.questions.forEach(q => {
      const selected = quizAnswers[q.id];
      if (selected !== undefined && q.options[selected].isCorrect) correctCount++;
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

  const activeModule = course?.modules[activeModuleIndex];
  const activeLesson = activeModule?.lessons[activeLessonIndex];
  if (!course || !activeModule || !activeLesson) return <div className="p-12 text-center text-brand-graphite font-black uppercase tracking-widest animate-pulse">Carregando Treinamento...</div>;

  const isLessonCompleted = completedLessonIds.has(activeLesson.id);
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const isCourseFinished = completedLessonIds.size >= totalLessons;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-brand-neutral">
      {/* Sidebar Content */}
      <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto hidden md:block">
        <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <button onClick={() => navigate('/dashboard')} className="flex items-center text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-tech mb-4 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Painel
          </button>
          <h2 className="font-black text-brand-deep line-clamp-2 leading-tight mb-4">{course.title}</h2>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(star => (
              <Star 
                key={star} 
                onClick={() => {
                  setUserRating(star);
                  submitCourseRating(user!.uid, course.id, star);
                }}
                className={`w-4 h-4 cursor-pointer transition-colors ${star <= (isRatingHover || userRating) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-200'}`} 
                onMouseEnter={() => setIsRatingHover(star)}
                onMouseLeave={() => setIsRatingHover(0)}
              />
            ))}
          </div>
        </div>
        <div className="pb-10">
          {course.modules.map((mod, mIdx) => (
            <div key={mod.id}>
              <div className="bg-brand-neutral/50 px-6 py-3 border-b border-gray-100 font-black text-[10px] uppercase tracking-widest text-gray-400">
                {mod.title}
              </div>
              {mod.lessons.map((lesson, lIdx) => {
                const isActive = mIdx === activeModuleIndex && lIdx === activeLessonIndex;
                const isDone = completedLessonIds.has(lesson.id);
                return (
                  <button
                    key={lesson.id}
                    onClick={() => handleLessonChange(mIdx, lIdx, lesson)}
                    className={`w-full text-left px-6 py-4 flex items-center gap-3 hover:bg-brand-neutral/50 transition-all border-b border-gray-50 ${isActive ? 'bg-brand-tech/5 border-l-4 border-brand-tech' : 'border-l-4 border-transparent'}`}
                  >
                    {isDone ? <CheckCircle className="w-4 h-4 text-brand-green" /> : <PlayCircle className={`w-4 h-4 ${isActive ? 'text-brand-tech' : 'text-gray-300'}`} />}
                    <span className={`text-sm truncate ${isActive ? 'text-brand-deep font-black' : 'text-brand-graphite font-medium'}`}>{lesson.title}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        {activeLesson.type === 'video' ? (
          <div className="flex-1 bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl">
              <Player
                url={activeLesson.videoUrl}
                width="100%"
                height="100%"
                controls={true}
                config={{ youtube: { playerVars: { modestbranding: 1, rel: 0 } } }}
              />
            </div>
          </div>
        ) : activeLesson.type === 'quiz' ? (
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-2xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
              <h2 className="text-2xl font-black text-brand-deep mb-8 flex items-center gap-3">
                <HelpCircle className="w-8 h-8 text-brand-tech" /> {activeQuiz?.title}
              </h2>
              {quizSubmitted ? (
                <div className="text-center py-10">
                   <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${quizScore >= (activeQuiz?.passingScore || 70) ? 'bg-brand-green/10 text-brand-green' : 'bg-red-50 text-red-500'}`}>
                      {quizScore >= (activeQuiz?.passingScore || 70) ? <CheckCircle className="w-10 h-10" /> : <Lock className="w-10 h-10" />}
                   </div>
                   <h3 className="text-2xl font-black text-brand-deep mb-2">Seu resultado: {quizScore.toFixed(0)}%</h3>
                   <p className="text-gray-500 mb-8 font-medium">{quizScore >= (activeQuiz?.passingScore || 70) ? 'Excelente! Você foi aprovado.' : 'Não foi dessa vez. Estude mais um pouco e tente novamente.'}</p>
                   <button onClick={() => setQuizSubmitted(false)} className="px-8 py-3 bg-brand-tech text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-brand-deep transition-all">Refazer</button>
                </div>
              ) : (
                <div className="space-y-8">
                  {activeQuiz?.questions.map((q, idx) => (
                    <div key={q.id} className="p-6 bg-brand-neutral/30 rounded-2xl border border-gray-100">
                      <p className="font-bold text-brand-deep mb-4">{idx + 1}. {q.text}</p>
                      <div className="space-y-3">
                        {q.options.map((opt, oIdx) => (
                          <label key={oIdx} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-brand-tech/30 transition-all">
                            <input type="radio" name={q.id} className="w-4 h-4 text-brand-tech" checked={quizAnswers[q.id] === oIdx} onChange={() => setQuizAnswers({...quizAnswers, [q.id]: oIdx})} />
                            <span className="text-sm font-medium text-brand-graphite">{opt.text}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={submitQuiz} className="w-full bg-brand-tech text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-brand-tech/20 hover:bg-brand-deep transition-all">Finalizar Quiz</button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-4xl mx-auto bg-white p-12 rounded-[2.5rem] shadow-sm border border-gray-100 prose prose-brand">
              <h1 className="text-4xl font-black text-brand-deep mb-8">{activeLesson.title}</h1>
              <div className="text-lg leading-relaxed text-brand-graphite">{activeLesson.textContent}</div>
            </div>
          </div>
        )}

        <footer className="bg-white border-t border-gray-100 p-6 flex justify-between items-center shadow-lg">
          <div>
            <h3 className="text-lg font-black text-brand-deep line-clamp-1">{activeLesson.title}</h3>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{activeLesson.duration} de conteúdo</span>
          </div>
          <div className="flex gap-4">
            {isCourseFinished && (
              <button onClick={() => navigate(`/certificate/${course.id}`)} className="bg-brand-green text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                <Award className="w-4 h-4" /> Certificado
              </button>
            )}
            {activeLesson.type !== 'quiz' && (
              <button onClick={handleMarkComplete} disabled={isLessonCompleted} className={`px-10 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isLessonCompleted ? 'bg-gray-100 text-gray-400' : 'bg-brand-tech text-white hover:bg-brand-deep shadow-lg shadow-brand-tech/20'}`}>
                {isLessonCompleted ? 'Concluída' : 'Marcar como Concluída'}
              </button>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
};

export default CoursePlayer;