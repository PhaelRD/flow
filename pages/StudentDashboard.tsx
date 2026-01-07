
import React, { useEffect, useState } from 'react';
/* Fix: Using namespace import for react-router-dom to resolve export issues */
import * as ReactRouterDOM from 'react-router-dom';
const { Link, useNavigate } = ReactRouterDOM as any;
import { useAuth } from '../context/AuthContext';
import { getCourses, getUserCourseProgress } from '../services/mockBackend';
import { Course } from '../types';
import { PlayCircle, Award, CheckCircle2, Clock, BookOpen } from 'lucide-react';

interface EnrolledCourseWithProgress extends Course {
  progressPercentage: number;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
        if (user) {
            const allCourses = await getCourses();
            const userCourses = allCourses.filter(c => user.enrolledCourses.includes(c.id));
            
            const coursesWithProgress = await Promise.all(userCourses.map(async (course) => {
                const progress = await getUserCourseProgress(user.uid, course.id);
                
                let totalLessons = 0;
                course.modules.forEach(m => totalLessons += m.lessons.length);
                
                const completedCount = progress ? progress.completedLessons.length : 0;
                const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

                return {
                    ...course,
                    progressPercentage: percentage
                };
            }));

            setEnrolledCourses(coursesWithProgress);
            setLoading(false);
        }
    };
    fetchDashboardData();
  }, [user]);

  if (loading) return <div className="p-8 text-center text-brand-graphite font-bold">Carregando sua jornada...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-4xl font-black text-brand-deep">Meu Aprendizado</h1>
            <p className="text-gray-500 font-medium mt-1">Bem-vindo de volta à <span className="text-brand-tech">Habilon Class</span></p>
        </div>
        <Link to="/" className="flex items-center gap-2 bg-white border border-gray-200 px-5 py-2.5 rounded-xl font-bold text-brand-graphite hover:bg-brand-neutral transition-colors shadow-sm">
            <BookOpen className="w-4 h-4 text-brand-tech" /> Explorar Novos Cursos
        </Link>
      </div>
      
      {enrolledCourses.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-gray-200 shadow-sm">
          <div className="w-20 h-20 bg-brand-neutral rounded-3xl flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-brand-tech opacity-40" />
          </div>
          <h3 className="text-2xl font-black text-brand-deep">Sua biblioteca está vazia</h3>
          <p className="mt-3 text-gray-500 font-medium max-w-md mx-auto">Explore nosso catálogo e encontre o próximo passo para sua evolução profissional.</p>
          <Link to="/" className="mt-8 inline-flex items-center px-8 py-3.5 bg-brand-tech hover:bg-brand-deep text-white font-black rounded-2xl shadow-xl shadow-brand-tech/20 transition-all uppercase tracking-widest text-sm">
            Ver Catálogo de Cursos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {enrolledCourses.map(course => (
            <div key={course.id} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-2xl hover:-translate-y-1 transition-all group">
              <div className="h-44 bg-gray-200 relative overflow-hidden">
                <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                {course.progressPercentage === 100 && (
                    <div className="absolute top-4 right-4 bg-brand-green text-white p-2 rounded-xl shadow-lg animate-bounce">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                )}
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {course.teacherName}
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-brand-deep mb-6 line-clamp-2 leading-tight">{course.title}</h3>
                
                <div className="mb-8">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest mb-2">
                      <span className={course.progressPercentage === 100 ? 'text-brand-green' : 'text-brand-tech'}>
                        {course.progressPercentage}% CONCLUÍDO
                      </span>
                  </div>
                  <div className="w-full bg-brand-neutral rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${course.progressPercentage === 100 ? 'bg-brand-green' : 'bg-brand-tech'}`} 
                      style={{ width: `${course.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="mt-auto space-y-3">
                    <Link 
                      to={`/player/${course.id}`}
                      className={`w-full flex items-center justify-center px-4 py-3.5 rounded-2xl shadow-lg transition-all font-black uppercase tracking-widest text-xs ${
                          course.progressPercentage === 100 
                          ? 'bg-brand-neutral text-brand-deep hover:bg-gray-200' 
                          : 'bg-brand-tech text-white hover:bg-brand-deep shadow-brand-tech/20'
                      }`}
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      {course.progressPercentage === 0 ? 'Iniciar Curso' : 'Continuar Estudos'}
                    </Link>

                    {course.progressPercentage === 100 && (
                        <button 
                          onClick={() => navigate(`/certificate/${course.id}`)}
                          className="w-full flex items-center justify-center px-4 py-3.5 border-2 border-brand-green rounded-2xl shadow-sm text-xs font-black text-brand-green bg-white hover:bg-brand-green hover:text-white transition-all uppercase tracking-widest"
                        >
                          <Award className="w-4 h-4 mr-2" />
                          Certificado Disponível
                        </button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;