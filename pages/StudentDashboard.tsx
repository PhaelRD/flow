
import React, { useEffect, useState } from 'react';
// Corrected imports for Link and useNavigate from react-router-dom
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCourses, getUserCourseProgress } from '../services/mockBackend';
import { Course } from '../types';
import { PlayCircle, Award, CheckCircle2 } from 'lucide-react';

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

  if (loading) return <div className="p-8">Carregando painel...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Meu Aprendizado</h1>
      
      {enrolledCourses.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-300">
          <h3 className="text-xl font-medium text-gray-900">Você ainda não se inscreveu em nenhum curso.</h3>
          <p className="mt-2 text-gray-500">Explore nosso catálogo para começar a aprender.</p>
          <Link to="/" className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700">
            Navegar pelos Cursos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map(course => (
            <div key={course.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="h-40 bg-gray-200 relative">
                <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
                {course.progressPercentage === 100 && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full shadow-lg">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{course.title}</h3>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                      <span className="font-medium text-indigo-600">{course.progressPercentage}% concluído</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-700 ${course.progressPercentage === 100 ? 'bg-green-500' : 'bg-indigo-600'}`} 
                      style={{ width: `${course.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="mt-auto space-y-2">
                    <Link 
                      to={`/player/${course.id}`}
                      className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      {course.progressPercentage === 0 ? 'Começar' : 'Continuar Aprendendo'}
                    </Link>

                    {course.progressPercentage === 100 && (
                        <button 
                          onClick={() => navigate(`/certificate/${course.id}`)}
                          className="w-full flex items-center justify-center px-4 py-2 border border-green-600 rounded-md shadow-sm text-sm font-bold text-green-700 bg-white hover:bg-green-50 transition-colors"
                        >
                          <Award className="w-4 h-4 mr-2" />
                          Emitir Certificado
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
