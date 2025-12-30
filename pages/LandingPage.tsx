import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCourses } from '../services/mockBackend';
import { Course } from '../types';
import { Star, Clock, Users } from 'lucide-react';

const LandingPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCourses().then(data => {
      setCourses(data.filter(c => c.status === 'published'));
      setLoading(false);
    });
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="bg-indigo-700 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
            Desbloqueie seu Potencial com EduFlow
          </h1>
          <p className="mt-6 text-xl text-indigo-100 max-w-3xl mx-auto">
            Domine novas habilidades com cursos online abrangentes de instrutores especializados. 
            Junte-se a milhares de alunos hoje.
          </p>
          <div className="mt-10 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
            <a href="#courses" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
              Navegar pelos Cursos
            </a>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div id="courses" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Cursos em Destaque</h2>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow h-80 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => {
              // Rating Logic: If no ratings (totalRatings === 0 or undefined), display 4.0. Else use average.
              const displayRating = (!course.totalRatings || course.totalRatings === 0) ? 4.0 : course.avgRating;
              
              return (
              <Link to={`/course/${course.id}`} key={course.id} className="group flex flex-col bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden border border-gray-100">
                <div className="relative h-48 overflow-hidden">
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {course.teacherName}
                    </span>
                    <div className="flex items-center text-yellow-400 text-sm font-bold">
                      <Star className="w-4 h-4 fill-current mr-1" />
                      {displayRating}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">{course.description}</p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                    <div className="flex items-center text-gray-500 text-xs">
                      <Users className="w-4 h-4 mr-1" />
                      {course.totalStudents} alunos
                    </div>
                    <span className="text-xl font-bold text-indigo-600">${course.price}</span>
                  </div>
                </div>
              </Link>
            )})}
          </div>
        )}
      </div>
    </div>
  );
};

export default LandingPage;