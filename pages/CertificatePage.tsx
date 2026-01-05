import React, { useEffect, useState } from 'react';
/* Fix: Using namespace import for react-router-dom to resolve export issues */
import * as ReactRouterDOM from 'react-router-dom';
const { useParams, useNavigate } = ReactRouterDOM as any;
import { getCourseById } from '../services/mockBackend';
import { useAuth } from '../context/AuthContext';
import { Course } from '../types';
import { Award, Printer, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Logo from '../components/Logo';

const CertificatePage: React.FC = () => {
  // Fix: Untyped function calls (any) may not accept type arguments
  const { courseId } = useParams();
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

  if (loading) return <div className="p-8 text-center text-brand-graphite font-bold text-lg">Emitindo sua certificação oficial Habilon...</div>;
  if (!course || !user) return <div className="p-8 text-center text-red-500 font-bold">Erro ao recuperar dados do certificado.</div>;

  const date = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-brand-neutral py-12 px-4 flex flex-col items-center">
      {/* Controls - Hidden on Print */}
      <div className="max-w-[1000px] w-full flex justify-between items-center mb-8 print:hidden">
        <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-xs font-black text-brand-graphite hover:text-brand-tech uppercase tracking-widest transition-colors"
        >
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Curso
        </button>
        <button 
            onClick={handlePrint}
            className="flex items-center gap-2 bg-brand-tech text-white px-8 py-3 rounded-2xl font-black shadow-xl shadow-brand-tech/20 hover:bg-brand-deep transition-all uppercase tracking-widest text-xs"
        >
            <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
        </button>
      </div>

      {/* Certificate Container */}
      <div className="certificate-paper max-w-[1000px] w-full aspect-[1.414/1] bg-white shadow-2xl relative overflow-hidden print:shadow-none print:m-0 rounded-sm">
        
        {/* Artistic Background & Borders */}
        <div className="absolute inset-0 border-[20px] border-brand-deep/5 pointer-events-none"></div>
        <div className="absolute inset-6 border-[1px] border-brand-tech/15 pointer-events-none"></div>
        <div className="absolute inset-8 border-[1px] border-brand-deep/5 pointer-events-none"></div>
        
        {/* Watermark Pattern */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none flex flex-wrap justify-around items-around overflow-hidden p-10">
            {Array.from({length: 12}).map((_, i) => (
                <div key={i} className="transform -rotate-45">
                    <Logo showText={false} size="lg" />
                </div>
            ))}
        </div>

        {/* Corner Motifs */}
        <div className="absolute top-0 left-0 w-32 h-32 border-t-[8px] border-l-[8px] border-brand-tech/20"></div>
        <div className="absolute top-0 right-0 w-32 h-32 border-t-[8px] border-r-[8px] border-brand-tech/20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 border-b-[8px] border-l-[8px] border-brand-tech/20"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-[8px] border-r-[8px] border-brand-tech/20"></div>

        {/* Inner Content Wrapper */}
        <div className="h-full flex flex-col items-center justify-between py-12 px-20 text-center relative z-10">
            
            {/* Header Section */}
            <div className="w-full flex flex-col items-center">
                <div className="mb-2 transform scale-[0.7] origin-center">
                    <Logo size="lg" variant="light" />
                </div>
                <h1 className="text-5xl font-serif font-black text-brand-deep tracking-tight">Certificado de Conclusão</h1>
                <div className="h-0.5 w-48 bg-gradient-to-r from-transparent via-brand-tech/30 to-transparent mt-2"></div>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em] mt-3">Habilon Class Excellence Program</p>
            </div>

            {/* Recipient Section */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 max-w-3xl">
                <p className="text-lg text-brand-graphite font-medium italic">Certificamos com distinção acadêmica que</p>
                
                <div className="relative group">
                    <h2 className="text-4xl md:text-5xl font-serif font-black text-brand-deep leading-tight">
                        {user.name}
                    </h2>
                    <div className="h-1 w-full bg-brand-tech/20 mt-1"></div>
                </div>

                <p className="text-lg text-brand-graphite font-medium italic">concluiu com êxito e aproveitamento superior o treinamento de alta performance</p>
                
                <div className="bg-brand-neutral/40 px-8 py-3 rounded-2xl border border-brand-tech/10">
                    <h3 className="text-2xl font-black text-brand-tech uppercase tracking-wide">
                        {course.title}
                    </h3>
                </div>

                <p className="text-gray-500 text-[11px] font-medium leading-relaxed max-w-xl">
                    Este programa acadêmico abrange competências técnicas avançadas, metodologias de mercado e avaliações rigorosas de desempenho sob a curadoria tecnológica da Habilon Class.
                </p>
            </div>

            {/* Footer Section (Signatures & Seal) */}
            <div className="w-full grid grid-cols-3 gap-8 items-end px-4 mt-6">
                {/* Teacher Signature */}
                <div className="text-center flex flex-col items-center pb-2">
                    <div className="w-full border-b border-brand-deep/20 mb-2"></div>
                    <p className="text-xs font-black text-brand-deep uppercase tracking-widest line-clamp-1">{course.teacherName}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Instrutor Especialista</p>
                </div>
                
                {/* Central Seal */}
                <div className="flex flex-col items-center justify-center -mb-4">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-white border-[1px] border-brand-tech/10 flex items-center justify-center shadow-lg relative z-20">
                            <div className="w-20 h-20 rounded-full border-2 border-dashed border-brand-tech/30 flex items-center justify-center">
                                <ShieldCheck className="w-10 h-10 text-brand-tech" />
                            </div>
                        </div>
                        {/* Golden Rays Effect */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-brand-tech/5 rounded-full blur-xl z-10"></div>
                    </div>
                </div>

                {/* Director Signature */}
                <div className="text-center flex flex-col items-center pb-2">
                    <div className="w-full border-b border-brand-deep/20 mb-2"></div>
                    <p className="text-xs font-black text-brand-deep uppercase tracking-widest">Habilon Class Board</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Diretoria Acadêmica</p>
                </div>
            </div>

            {/* Digital Verification */}
            <div className="mt-8 flex flex-col items-center space-y-1">
                <div className="flex items-center gap-2 text-[9px] text-gray-400 font-black uppercase tracking-widest">
                    <span>Emissão: {date}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>ID: HC-{courseId?.substring(0, 12).toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-1 text-[8px] text-brand-tech font-bold uppercase opacity-60">
                    <CheckCircle2 size={10} /> Autenticidade verificada pelo ecossistema Habilon
                </div>
            </div>

        </div>
      </div>
      
      {/* Print-specific Styles */}
      <style>{`
        @media print {
          body { 
            background: white !important; 
            padding: 0 !important; 
            margin: 0 !important; 
            -webkit-print-color-adjust: exact;
          }
          .min-h-screen { 
            min-height: auto !important; 
            background: white !important; 
            padding: 0 !important; 
          }
          .certificate-paper {
            width: 100% !important;
            height: 100% !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
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