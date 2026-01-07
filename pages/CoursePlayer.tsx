
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  CheckCircle, 
  Lock, 
  Play, 
  Pause,
  Volume2,
  Maximize,
  HelpCircle, 
  FileText, 
  Star, 
  Award,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

const Player = ReactPlayer as any;

const CoursePlayer: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados do Curso
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

  // Estados do Player Customizado
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const playerRef = useRef<any>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Marca d'água dinâmica
  const [watermarkPos, setWatermarkPos] = useState({ top: '20%', left: '20%' });

  // Segurança: Bloqueio de teclas e Mouse
  useEffect(() => {
    const preventDevTools = (e: KeyboardEvent) => {
      // Bloqueia F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        return false;
      }
    };

    const interval = setInterval(() => {
      setWatermarkPos({
        top: Math.floor(Math.random() * 70) + 10 + '%',
        left: Math.floor(Math.random() * 60) + 10 + '%'
      });
    }, 15000);

    window.addEventListener('keydown', preventDevTools);
    return () => {
      window.removeEventListener('keydown', preventDevTools);
      clearInterval(interval);
    };
  }, []);

  const handleLessonChange = useCallback(async (modIndex: number, lessonIndex: number, lesson: Lesson) => {
    setActiveModuleIndex(modIndex);
    setActiveLessonIndex(lessonIndex);
    setQuizSubmitted(false);
    setQuizAnswers({});
    setActiveQuiz(null);
    setIsPlaying(false);
    setProgress(0);

    if (lesson.type === 'quiz' && lesson.quizId) {
      const q = await getQuizById(lesson.quizId);
      if (q) setActiveQuiz(q);
    }
  }, []);

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
  }, [id, user, handleLessonChange]);

  // Controles do Player
  const togglePlay = () => setIsPlaying(!isPlaying);
  
  const handleProgress = (state: { played: number }) => {
    setProgress(state.played * 100);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setProgress(val);
    playerRef.current?.seekTo(val / 100);
  };

  const formatTime = (seconds: number) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    return `${mm}:${ss}`;
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
      if (nextModule.lessons.length > 0) handleLessonChange(activeModuleIndex + 1, 0, nextModule.lessons[0]);
    }
  };

  const activeModule = course?.modules[activeModuleIndex];
  const activeLesson = activeModule?.lessons[activeLessonIndex];

  if (!course || !activeModule || !activeLesson) {
    return <div className="h-screen flex items-center justify-center bg-brand-neutral">Carregando...</div>;
  }

  const isLessonCompleted = completedLessonIds.has(activeLesson.id);
  const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const isCourseFinished = completedLessonIds.size >= totalLessons;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-brand-neutral select-none">
      <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto hidden md:block">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <button onClick={() => navigate('/dashboard')} className="text-[10px] font-black uppercase text-gray-400 hover:text-brand-tech flex items-center mb-4">
            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
          </button>
          <h2 className="font-black text-brand-deep leading-tight mb-4">{course.title}</h2>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} className={`w-4 h-4 cursor-pointer ${s <= (isRatingHover || userRating) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-200'}`} 
                onMouseEnter={() => setIsRatingHover(s)} onMouseLeave={() => setIsRatingHover(0)}
                onClick={() => { setUserRating(s); submitCourseRating(user!.uid, course.id, s); }} />
            ))}
          </div>
        </div>
        <div className="pb-10">
          {course.modules.map((mod, mIdx) => (
            <div key={mod.id}>
              <div className="bg-brand-neutral/50 px-6 py-3 border-b text-[10px] font-black uppercase text-gray-400">{mod.title}</div>
              {mod.lessons.map((lesson, lIdx) => {
                const isActive = mIdx === activeModuleIndex && lIdx === activeLessonIndex;
                const isDone = completedLessonIds.has(lesson.id);
                return (
                  <button key={lesson.id} onClick={() => handleLessonChange(mIdx, lIdx, lesson)}
                    className={`w-full text-left px-6 py-4 flex items-center gap-3 border-b ${isActive ? 'bg-brand-tech/5 border-l-4 border-brand-tech' : 'border-l-4 border-transparent'}`}>
                    {isDone ? <CheckCircle className="w-4 h-4 text-brand-green" /> : <Play className={`w-4 h-4 ${isActive ? 'text-brand-tech' : 'text-gray-300'}`} />}
                    <span className={`text-sm truncate ${isActive ? 'text-brand-deep font-black' : 'text-brand-graphite'}`}>{lesson.title}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 bg-black flex items-center justify-center p-4 relative overflow-hidden group">
          {activeLesson.type === 'video' ? (
            <div 
              className="w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-brand-deep relative"
              onContextMenu={(e) => e.preventDefault()}
              onMouseMove={() => {
                  setShowControls(true);
                  if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
                  controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
              }}
            >
              {/* SHIELD: Camada invisível que bloqueia interações diretas com o iframe do vídeo */}
              <div className="absolute inset-0 z-10 cursor-default" onClick={togglePlay}></div>

              {/* WATERMARK: Marca d'água dinâmica ininterrupta */}
              <div className="absolute inset-0 z-20 pointer-events-none">
                <div 
                  className="absolute bg-white/5 backdrop-blur-[1px] text-[9px] text-white/20 px-3 py-1.5 rounded-lg font-mono whitespace-nowrap transition-all duration-1000 border border-white/5"
                  style={{ top: watermarkPos.top, left: watermarkPos.left }}
                >
                  {user?.email} • {user?.uid} • PROTECTED BY HABILON SECURITY
                </div>
              </div>

              <Player
                ref={playerRef}
                url={activeLesson.videoUrl}
                width="100%"
                height="100%"
                playing={isPlaying}
                volume={volume}
                onProgress={handleProgress}
                onDuration={(d: number) => setDuration(d)}
                style={{ pointerEvents: 'none' }} // Desativa cliques no player nativo
                config={{ 
                  youtube: { playerVars: { controls: 0, modestbranding: 1, rel: 0, disablekb: 1, iv_load_policy: 3 } } 
                }}
              />

              {/* CUSTOM CONTROLS: Nossa própria UI de controle */}
              <div className={`absolute inset-0 z-30 flex flex-col justify-end bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                 <div className="p-6 space-y-4">
                    {/* Barra de Progresso Customizada */}
                    <input type="range" min="0" max="100" step="0.1" value={progress} onChange={handleSeek}
                      className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-brand-tech" />
                    
                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-6">
                            <button onClick={togglePlay} className="hover:text-brand-tech transition-colors">
                                {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                            </button>
                            <div className="flex items-center gap-3 group/vol">
                                <Volume2 className="w-5 h-5" />
                                <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
                                  className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" />
                            </div>
                            <span className="text-xs font-mono font-bold opacity-80">
                                {formatTime(duration * (progress/100))} / {formatTime(duration)}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-brand-tech/20 px-3 py-1 rounded-full border border-brand-tech/30 flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3 text-brand-tech" />
                                <span className="text-[9px] font-black uppercase tracking-widest text-brand-tech">Habilon Secure Node</span>
                            </div>
                            <button onClick={() => playerRef.current?.getInternalPlayer()?.requestFullscreen()} className="hover:text-brand-tech">
                                <Maximize className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                 </div>
              </div>

              {/* Centro: Botão de Play gigante no início/pausa */}
              {!isPlaying && (
                  <button onClick={togglePlay} className="absolute inset-0 m-auto w-20 h-20 bg-brand-tech text-white rounded-full flex items-center justify-center shadow-2xl scale-110 z-20 hover:bg-brand-deep transition-all">
                      <Play className="w-8 h-8 fill-current ml-1" />
                  </button>
              )}
            </div>
          ) : activeLesson.type === 'quiz' ? (
            <div className="flex-1 p-8 overflow-y-auto w-full max-w-2xl mx-auto">
               <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
                  <h2 className="text-2xl font-black text-brand-deep mb-8 flex items-center gap-3">
                    <HelpCircle className="w-8 h-8 text-brand-tech" /> {activeQuiz?.title}
                  </h2>
                  {quizSubmitted ? (
                    <div className="text-center py-6">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${quizScore >= (activeQuiz?.passingScore || 70) ? 'bg-brand-green/10 text-brand-green' : 'bg-red-50 text-red-500'}`}>
                            {quizScore >= (activeQuiz?.passingScore || 70) ? <CheckCircle className="w-10 h-10" /> : <Lock className="w-10 h-10" />}
                        </div>
                        <h3 className="text-2xl font-black text-brand-deep">Nota: {quizScore.toFixed(0)}%</h3>
                        <p className="text-gray-500 my-4">{quizScore >= (activeQuiz?.passingScore || 70) ? 'Aprovado! Conteúdo dominado.' : 'Estude um pouco mais e tente novamente.'}</p>
                        <button onClick={() => setQuizSubmitted(false)} className="flex items-center gap-2 mx-auto px-6 py-2 bg-brand-tech text-white rounded-xl font-black text-xs uppercase tracking-widest">
                            <RotateCcw className="w-4 h-4" /> Refazer Quiz
                        </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                        {activeQuiz?.questions.map((q, i) => (
                            <div key={q.id} className="p-6 bg-brand-neutral/30 rounded-2xl border border-gray-100">
                                <p className="font-bold text-brand-deep mb-4">{i+1}. {q.text}</p>
                                <div className="space-y-2">
                                    {q.options.map((o, oi) => (
                                        <label key={oi} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-brand-tech/30">
                                            <input type="radio" name={q.id} className="text-brand-tech" onChange={() => setQuizAnswers({...quizAnswers, [q.id]: oi})} />
                                            <span className="text-sm font-medium">{o.text}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <button onClick={async () => {
                            let correct = 0;
                            activeQuiz?.questions.forEach(q => { if(activeQuiz.questions.find(x=>x.id===q.id)?.options[quizAnswers[q.id]]?.isCorrect) correct++; });
                            const score = (correct / (activeQuiz?.questions.length || 1)) * 100;
                            setQuizScore(score); setQuizSubmitted(true);
                            if(score >= (activeQuiz?.passingScore || 70)) {
                                await markLessonComplete(user!.uid, course.id, activeLesson.id);
                                setCompletedLessonIds(new Set([...completedLessonIds, activeLesson.id]));
                            }
                        }} className="w-full bg-brand-deep text-white py-4 rounded-2xl font-black uppercase tracking-widest">Finalizar Teste</button>
                    </div>
                  )}
               </div>
            </div>
          ) : (
            <div className="flex-1 p-8 overflow-y-auto w-full max-w-4xl mx-auto">
                <div className="bg-white p-12 rounded-[2.5rem] border shadow-sm">
                    <h1 className="text-4xl font-black text-brand-deep mb-6">{activeLesson.title}</h1>
                    <div className="prose prose-brand text-brand-graphite leading-relaxed text-lg">
                        {activeLesson.textContent}
                    </div>
                </div>
            </div>
          )}
        </div>

        <footer className="bg-white border-t p-6 flex justify-between items-center shadow-lg sticky bottom-0 z-40">
          <div>
            <h3 className="text-lg font-black text-brand-deep">{activeLesson.title}</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{activeLesson.duration} de conteúdo técnico</p>
          </div>
          <div className="flex gap-4">
            {isCourseFinished && (
                <button onClick={() => navigate(`/certificate/${course.id}`)} className="bg-brand-green text-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2">
                    <Award className="w-4 h-4" /> Certificado
                </button>
            )}
            {activeLesson.type !== 'quiz' && (
                <button onClick={handleMarkComplete} disabled={isLessonCompleted}
                    className={`px-10 py-3 rounded-xl font-black text-xs uppercase transition-all ${isLessonCompleted ? 'bg-gray-100 text-gray-400' : 'bg-brand-tech text-white hover:bg-brand-deep shadow-lg shadow-brand-tech/20'}`}>
                    {isLessonCompleted ? 'Concluída' : 'Marcar Concluída'}
                </button>
            )}
          </div>
        </footer>
      </main>
    </div>
  );
};

export default CoursePlayer;
