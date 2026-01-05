
import React, { useEffect, useState } from 'react';
/* Fix: Using namespace import for react-router-dom to resolve export issues */
import * as ReactRouterDOM from 'react-router-dom';
const { Link } = ReactRouterDOM as any;
import { getCourses } from '../services/mockBackend';
import { Course } from '../types';
import { Star, Clock, Users, ArrowRight, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo';

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
    <div className="bg-brand-neutral min-h-screen">
      {/* Hero Section - Using brand-deep for authority */}
      <div className="bg-brand-deep text-white py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-tech opacity-10 blur-3xl -mr-20"></div>
        <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-brand-light opacity-10 blur-3xl -ml-20"></div>

        <div className="max-w-7xl mx-auto text-center relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-brand-light text-sm font-bold mb-8 backdrop-blur-md border border-white/10">
            <ShieldCheck className="w-4 h-4" /> Evolução Educacional Garantida
          </div>
          
          <div className="mb-8">
            <Logo size="xl" className="drop-shadow-2xl" />
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl mb-6 max-w-4xl">
            A plataforma de <span className="text-brand-tech">alta performance</span> para mentes brilhantes.
          </h1>
          
          <p className="mt-6 text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Domine novas habilidades com cursos online abrangentes ministrados por especialistas do mercado. 
            A educação que evolui com você.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#courses" className="inline-flex items-center justify-center px-8 py-4 bg-brand-tech hover:bg-brand-tech/90 text-white text-lg font-bold rounded-2xl transition-all shadow-xl shadow-brand-tech/20">
              Ver Cursos <ArrowRight className="ml-2 w-5 h-5" />
            </a>
            <Link to="/login" className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/20 hover:border-white/40 text-white text-lg font-bold rounded-2xl transition-all backdrop-blur-sm">
              Criar Conta Gratuita
            </Link>
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div id="courses" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
                <h2 className="text-4xl font-black text-brand-deep">Cursos em Destaque</h2>
                <p className="text-gray-500 mt-2 font-medium">As melhores trilhas para sua carreira profissional</p>
            </div>
            <div className="bg-white p-1 rounded-xl border border-gray-200 flex gap-1">
                <button className="px-4 py-2 bg-brand-neutral rounded-lg text-sm font-bold text-brand-deep">Mais Recentes</button>
                <button className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-brand-tech transition-colors">Populares</button>
            </div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-3xl shadow-sm h-96 animate-pulse border border-gray-100">
                <div className="h-48 bg-gray-100 rounded-t-3xl"></div>
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => {
              const displayRating = (!course.totalRatings || course.totalRatings === 0) ? 4.0 : course.avgRating;
              
              return (
              <Link to={`/course/${course.id}`} key={course.id} className="group flex flex-col bg-white rounded-3xl shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden border border-gray-100">
                <div className="relative h-52 overflow-hidden">
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-brand-deep text-xs font-black shadow-sm">
                    {course.teacherName}
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center text-yellow-500 text-sm font-black">
                      <Star className="w-4 h-4 fill-current mr-1" />
                      {displayRating}
                    </div>
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {course.totalStudents} alunos
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-brand-deep mb-3 line-clamp-2 group-hover:text-brand-tech transition-colors">{course.title}</h3>
                  <p className="text-gray-500 text-sm mb-6 line-clamp-2 flex-1 leading-relaxed">{course.description}</p>
                  
                  <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-auto">
                    <span className="text-2xl font-black text-brand-tech">R$ {course.price}</span>
                    <div className="w-10 h-10 bg-brand-neutral rounded-xl flex items-center justify-center text-brand-tech group-hover:bg-brand-tech group-hover:text-white transition-all">
                        <ArrowRight className="w-5 h-5" />
                    </div>
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
