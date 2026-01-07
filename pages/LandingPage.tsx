
import React, { useEffect, useState } from 'react';
/* Fix: Using namespace import for react-router-dom to resolve export issues */
import * as ReactRouterDOM from 'react-router-dom';
const { Link } = ReactRouterDOM as any;
import { getCourses } from '../services/mockBackend';
import { Course, COURSE_CATEGORIES } from '../types';
import { Star, Clock, Users, ArrowRight, ShieldCheck, Search, Filter, SortAsc, LayoutGrid, Sparkles } from 'lucide-react';
import Logo from '../components/Logo';

const LandingPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'popular', 'rating'

  useEffect(() => {
    getCourses().then(data => {
      const published = data.filter(c => c.status === 'published');
      setCourses(published);
      setFilteredCourses(published);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = [...courses];

    // Filter by search term (Title or Teacher)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(term) || 
        c.teacherName.toLowerCase().includes(term)
      );
    }

    // Filter by Category
    if (selectedCategory !== 'Todas') {
      result = result.filter(c => c.category === selectedCategory);
    }

    // Sort
    if (sortBy === 'recent') {
      result.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    } else if (sortBy === 'popular') {
      result.sort((a, b) => (b.totalStudents || 0) - (a.totalStudents || 0));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    }

    setFilteredCourses(result);
  }, [searchTerm, selectedCategory, sortBy, courses]);

  return (
    <div className="bg-brand-neutral min-h-screen">
      {/* Hero Section */}
      <div className="bg-brand-deep text-white py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-tech opacity-10 blur-3xl -mr-20"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-brand-light text-sm font-bold mb-8 backdrop-blur-md border border-white/10">
            <ShieldCheck className="w-4 h-4" /> Evolução Educacional de Alta Performance
          </div>
          <div className="mb-8"><Logo size="xl" className="drop-shadow-2xl" /></div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl mb-6 max-w-4xl">
            A tecnologia a serviço do seu <span className="text-brand-tech">conhecimento</span>.
          </h1>
          <p className="mt-6 text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Acesse treinamentos exclusivos, valide sua performance com avaliações técnicas e conquiste certificações Habilon Class.
          </p>
          
          {/* Main Search Bar in Hero */}
          <div className="mt-12 w-full max-w-2xl relative group">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
              <Search className="h-6 w-6 text-brand-tech" />
            </div>
            <input 
              type="text" 
              placeholder="Pesquisar por nome do curso ou instrutor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white text-brand-deep rounded-3xl py-6 pl-16 pr-6 shadow-2xl focus:ring-4 focus:ring-brand-tech/20 focus:outline-none text-lg font-medium border-0 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Filter & Grid Section */}
      <div id="courses" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col space-y-12">
            
            {/* Header with Sort and Layout Info */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 className="text-3xl font-black text-brand-deep flex items-center gap-2">
                      <LayoutGrid className="w-8 h-8 text-brand-tech" />
                      Catálogo Habilon
                    </h2>
                    <p className="text-gray-500 font-medium mt-1">Exibindo {filteredCourses.length} cursos encontrados</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm w-full md:w-auto">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2 hidden sm:block">Ordenar por:</span>
                    <button 
                      onClick={() => setSortBy('recent')}
                      className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${sortBy === 'recent' ? 'bg-brand-tech text-white shadow-lg shadow-brand-tech/20' : 'text-gray-500 hover:bg-brand-neutral'}`}
                    >
                      Recentes
                    </button>
                    <button 
                      onClick={() => setSortBy('popular')}
                      className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${sortBy === 'popular' ? 'bg-brand-tech text-white shadow-lg shadow-brand-tech/20' : 'text-gray-500 hover:bg-brand-neutral'}`}
                    >
                      Populares
                    </button>
                    <button 
                      onClick={() => setSortBy('rating')}
                      className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${sortBy === 'rating' ? 'bg-brand-tech text-white shadow-lg shadow-brand-tech/20' : 'text-gray-500 hover:bg-brand-neutral'}`}
                    >
                      Melhor Avaliados
                    </button>
                </div>
            </div>

            {/* Category Chips - Flex Wrap (No Scrollbar) */}
            <div className="flex flex-wrap justify-center gap-3 md:gap-4">
                <button 
                  onClick={() => setSelectedCategory('Todas')}
                  className={`px-6 py-3 rounded-2xl text-sm font-black transition-all border-2 flex items-center gap-2 uppercase tracking-widest ${
                    selectedCategory === 'Todas' 
                    ? 'bg-brand-deep text-white border-brand-deep shadow-xl shadow-brand-deep/20 scale-105' 
                    : 'bg-white text-gray-400 border-gray-100 hover:border-brand-tech/30 hover:text-brand-tech'
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${selectedCategory === 'Todas' ? 'text-brand-light' : 'text-gray-300'}`} />
                  Todas as Áreas
                </button>
                {COURSE_CATEGORIES.map(cat => (
                   <button 
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-6 py-3 rounded-2xl text-sm font-black transition-all border-2 uppercase tracking-widest ${
                      selectedCategory === cat 
                      ? 'bg-brand-tech text-white border-brand-tech shadow-xl shadow-brand-tech/20 scale-105' 
                      : 'bg-white text-gray-400 border-gray-100 hover:border-brand-tech/30 hover:text-brand-tech'
                    }`}
                   >
                     {cat}
                   </button>
                ))}
            </div>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-[2.5rem] shadow-sm h-96 animate-pulse border border-gray-100">
                <div className="h-48 bg-gray-50 rounded-t-[2.5rem]"></div>
                <div className="p-8 space-y-4">
                  <div className="h-6 bg-gray-50 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-50 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-gray-200 mt-16">
              <div className="w-20 h-20 bg-brand-neutral/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-2xl font-black text-brand-deep">Nenhum resultado encontrado</h3>
              <p className="text-gray-500 mt-2 font-medium">Tente ajustar seus termos de busca ou filtros.</p>
              <button onClick={() => { setSearchTerm(''); setSelectedCategory('Todas'); }} className="mt-8 text-brand-tech font-black uppercase tracking-widest text-xs hover:underline">Limpar Filtros</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mt-16">
            {filteredCourses.map((course) => {
              const displayRating = (!course.totalRatings || course.totalRatings === 0) ? 4.5 : course.avgRating;
              
              return (
              <Link to={`/course/${course.id}`} key={course.id} className="group flex flex-col bg-white rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden border border-gray-100">
                <div className="relative h-56 overflow-hidden">
                  <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-4 left-4 bg-brand-tech text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                    {course.category || 'Treinamento'}
                  </div>
                  <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm px-4 py-1.5 rounded-xl text-brand-deep text-xs font-black shadow-md">
                    {course.teacherName}
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center text-yellow-500 text-sm font-black bg-yellow-50 px-3 py-1 rounded-lg">
                      <Star className="w-4 h-4 fill-current mr-1.5" />
                      {displayRating}
                    </div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-brand-tech" /> {course.totalStudents} alunos
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-brand-deep mb-4 line-clamp-2 group-hover:text-brand-tech transition-colors leading-tight">{course.title}</h3>
                  <p className="text-gray-500 text-sm mb-8 line-clamp-2 flex-1 leading-relaxed font-medium">{course.description}</p>
                  
                  <div className="flex items-center justify-between pt-8 border-t border-gray-100 mt-auto">
                    <div>
                        <span className="text-xs font-black text-gray-300 uppercase tracking-widest block mb-1">Acesso Habilon</span>
                        <span className="text-2xl font-black text-brand-deep">R$ {course.price}</span>
                    </div>
                    <div className="w-12 h-12 bg-brand-neutral rounded-2xl flex items-center justify-center text-brand-tech group-hover:bg-brand-tech group-hover:text-white transition-all shadow-sm">
                        <ArrowRight className="w-6 h-6" />
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
