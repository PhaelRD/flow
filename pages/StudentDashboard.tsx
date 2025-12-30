import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCourses, getUserCourseProgress } from '../services/mockBackend';
import { Course } from '../types';
import { PlayCircle } from 'lucide-react';

interface EnrolledCourseWithProgress extends Course {
  progressPercentage: number;
}

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourseWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
        if (user) {
            const allCourses = await getCourses();
            const userCourses = allCourses.filter(c => user.enrolledCourses.includes(c.id));
            
            // Calculate progress for each course
            const coursesWithProgress = await Promise.all(userCourses.map(async (course) => {
                const progress = await getUserCourseProgress(user.uid, course.id);
                
                // Calculate total lessons
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
            <div key={course.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden flex flex-col">
              <div className="h-40 bg-gray-200">
                <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{course.title}</h3>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                  <div 
                    className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${course.progressPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                    <span>{course.progressPercentage}% Completo</span>
                </div>
                
                <Link 
                  to={`/player/${course.id}`}
                  className="mt-auto w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Continuar
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;