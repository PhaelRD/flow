
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById } from '../services/mockBackend';
import { processPayment } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
import { Course } from '../types';
import { PlayCircle, CheckCircle, ShieldCheck, Clock, FileText, HelpCircle, ShoppingCart, Loader2 } from 'lucide-react';

const CourseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | undefined>();
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      getCourseById(id).then(c => {
        setCourse(c);
        setLoading(false);
      });
    }
  }, [id]);

  const handleBuy = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!course) return;

    if (user.role === 'teacher' || user.role === 'admin') {
       alert("Professores e Administradores não podem comprar cursos.");
       return;
    }
    
    setIsProcessing(true);
    try {
        // Chamada simulada que matricula o usuário imediatamente
        await processPayment(course.id, user.uid);
        await refreshProfile(); // Atualiza o perfil do usuário no contexto para liberar o curso
        alert("Compra realizada com sucesso! (Modo Simulação)");
        navigate(`/player/${course.id}`);
    } catch (error) {
        alert("Erro ao processar a compra simulada.");
    } finally {
        setIsProcessing(false);
    }
  };

  const isEnrolled = user && course && user.enrolledCourses.includes(course.id);

  if (loading) return <div className="p-8 text-center">Carregando detalhes do curso...</div>;
  if (!course) return <div className="p-8 text-center text-red-500">Curso não encontrado</div>;

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-8 items-center">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4">{course.title}</h1>
            <p className="text-xl text-gray-300 mb-6">{course.description}</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-green-400"/> Criado por {course.teacherName}</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-yellow-400"/> Atualizado em 2024</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Syllabus */}
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-2xl font-bold text-gray-900">Conteúdo do Curso</h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {course.modules.length === 0 ? (
               <div className="p-6 text-gray-500 italic">Nenhum conteúdo enviado ainda.</div>
            ) : (
                course.modules.map((mod, idx) => (
                <div key={mod.id} className="border-b border-gray-200 last:border-0">
                    <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">Módulo {idx + 1}: {mod.title}</h3>
                    <span className="text-xs text-gray-500">{mod.lessons.length} aulas</span>
                    </div>
                    <ul className="divide-y divide-gray-100">
                    {mod.lessons.map(lesson => (
                        <li key={lesson.id} className="px-6 py-3 flex items-center gap-3 text-gray-600 hover:bg-gray-50">
                        {lesson.type === 'video' && <PlayCircle className="w-4 h-4" />}
                        {lesson.type === 'quiz' && <HelpCircle className="w-4 h-4" />}
                        {lesson.type === 'text' && <FileText className="w-4 h-4" />}
                        
                        <span className="text-sm flex-1">{lesson.title}</span>
                        <span className="text-xs text-gray-400">{lesson.duration}</span>
                        </li>
                    ))}
                    </ul>
                </div>
                ))
            )}
          </div>
        </div>

        {/* Sidebar: Checkout */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="h-48 overflow-hidden">
               <img src={course.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
            </div>
            <div className="p-6">
              <div className="text-3xl font-bold text-gray-900 mb-6">${course.price}</div>
              
              {isEnrolled ? (
                 <button
                 onClick={() => navigate(`/player/${course.id}`)}
                 className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
               >
                 <PlayCircle className="w-5 h-5" />
                 Continuar Aprendendo
               </button>
              ) : (
                <button
                    onClick={handleBuy}
                    disabled={isProcessing}
                    className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processando...
                        </>
                    ) : (
                        <>
                            Comprar Agora
                            <ShoppingCart className="w-4 h-4" />
                        </>
                    )}
                </button>
              )}
              
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Acesso vitalício completo</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Suporte direto do instrutor</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Certificado de conclusão</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
