
import React, { useEffect, useState } from 'react';
// Corrected imports for useParams and useNavigate from react-router-dom
import { useParams, useNavigate } from 'react-router-dom';
import { getCourseById } from '../services/mockBackend';
import { useAuth } from '../context/AuthContext';
import { Course } from '../types';
import { Award, Printer, ArrowLeft, Download, ShieldCheck } from 'lucide-react';

const CertificatePage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (courseId) {
      getCourseById(courseId).then(c => {
        if (c) setCourse(c);
        setLoading(false);
      });
    }
  }, [courseId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center">Carregando certificado...</div>;
  if (!course || !user) return <div className="p-8 text-center text-red-500">Dados não encontrados</div>;

  const date = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 flex flex-col items-center">
      {/* Controls - Hidden during print */}
      <div className="max-w-[1000px] w-full flex justify-between items-center mb-8 print:hidden">
        <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-sm text-gray-600 hover:text-indigo-600 font-medium"
        >
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao Curso
        </button>
        <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:bg-indigo-700 transition-all"
        >
            <Printer className="w-4 h-4" /> Imprimir ou Salvar PDF
        </button>
      </div>

      {/* Certificate Content */}
      <div className="max-w-[1000px] w-full aspect-[1.414/1] bg-white shadow-2xl relative overflow-hidden print:shadow-none print:m-0">
        {/* Decorative Border */}
        <div className="absolute inset-4 border-[12px] border-double border-indigo-900/10 pointer-events-none"></div>
        <div className="absolute inset-8 border-2 border-indigo-900/20 pointer-events-none"></div>
        
        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-32 h-32 border-t-8 border-l-8 border-indigo-900/40"></div>
        <div className="absolute top-0 right-0 w-32 h-32 border-t-8 border-r-8 border-indigo-900/40"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 border-b-8 border-l-8 border-indigo-900/40"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-8 border-r-8 border-indigo-900/40"></div>

        <div className="h-full flex flex-col items-center justify-center p-20 text-center">
            <div className="flex items-center gap-3 mb-6">
                 <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Award className="text-white w-8 h-8" />
                 </div>
                 <span className="text-3xl font-black text-indigo-900 tracking-tighter">EduFlow</span>
            </div>

            <h1 className="text-5xl font-serif font-bold text-gray-900 mb-4 tracking-tight">Certificado de Conclusão</h1>
            <p className="text-lg text-gray-500 uppercase tracking-[0.2em] mb-12">Plataforma EduFlow de Ensino Online</p>

            <div className="space-y-6 mb-16">
                <p className="text-xl text-gray-600 italic">Certificamos com distinção que</p>
                <h2 className="text-5xl font-serif font-bold text-indigo-900 underline decoration-indigo-200 underline-offset-8">
                    {user.name}
                </h2>
                <p className="text-xl text-gray-600 italic">concluiu com êxito todos os requisitos do curso</p>
                <h3 className="text-3xl font-bold text-gray-800">
                    {course.title}
                </h3>
                <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
                    Ministrado pelo professor <span className="font-bold text-gray-700">{course.teacherName}</span>, abrangendo todos os módulos de especialização, avaliações de desempenho e atividades práticas integradas.
                </p>
            </div>

            <div className="grid grid-cols-2 w-full gap-20 items-end px-12">
                <div className="text-center flex flex-col items-center">
                    <div className="w-full border-b border-gray-400 mb-2"></div>
                    <p className="text-sm font-bold text-gray-800 uppercase tracking-widest">{course.teacherName}</p>
                    <p className="text-xs text-gray-500 italic">Instrutor Especialista</p>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                    <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full bg-yellow-400/10 border-4 border-yellow-400/30 flex items-center justify-center">
                            <Award className="w-12 h-12 text-yellow-600" />
                        </div>
                        {/* Golden Seal Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/20 to-transparent rounded-full"></div>
                    </div>
                    <p className="text-sm text-gray-400 font-mono uppercase tracking-tighter">ID: {courseId?.substring(0, 10).toUpperCase()}-{user.uid.substring(0, 5).toUpperCase()}</p>
                </div>
            </div>

            <div className="absolute bottom-12 text-gray-400 text-sm">
                Emitido em {date} • Validado eletronicamente por EduFlow Systems
            </div>
        </div>
      </div>
      
      <style>{`
        @media print {
          body {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .min-h-screen {
            min-height: auto !important;
            background: white !important;
            padding: 0 !important;
          }
          @page {
            size: landscape;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default CertificatePage;
