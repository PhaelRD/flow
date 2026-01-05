import React, { useEffect, useState } from 'react';
/* Fix: Using namespace import for react-router-dom to resolve export issues */
import * as ReactRouterDOM from 'react-router-dom';
const { useParams, useNavigate } = ReactRouterDOM as any;
import { getCourseById } from '../services/mockBackend';
import { initiateAsaasPayment, getPaymentMethods, PaymentMethod } from '../services/paymentService';
import { useAuth } from '../context/AuthContext';
import { Course } from '../types';
import { PlayCircle, CheckCircle, ShieldCheck, Clock, FileText, HelpCircle, ShoppingCart, Loader2, AlertCircle, X, ArrowLeft } from 'lucide-react';

const CourseDetails: React.FC = () => {
  // Fix: Untyped function calls (any) may not accept type arguments
  const { id } = useParams();
  const [course, setCourse] = useState<Course | undefined>();
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [installments, setInstallments] = useState(1);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      getCourseById(id).then(c => {
        setCourse(c);
        setLoading(false);
      });
    }
    
    getPaymentMethods().then(methods => {
      setPaymentMethods(methods);
    }).catch(err => {
      console.error("Erro ao carregar métodos de pagamento:", err);
    });
  }, [id]);

  const handleBuy = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!course) return;

    if (user.role === 'teacher' || user.role === 'admin') {
       alert("Professores e Administradores não podem comprar cursos.");
       return;
    }
    
    setShowPaymentModal(true);
  };

  const handlePaymentMethodSelect = async (methodId: string) => {
    if (!course) return;
    
    setSelectedMethod(methodId);
    setIsProcessing(true);
    setError(null);

    try {
        const paymentUrl = await initiateAsaasPayment(
            course.id,
            methodId,
            methodId === 'CREDIT_CARD' ? installments : undefined
        );
        
        window.location.href = paymentUrl;
    } catch (err: any) {
        console.error("Erro no checkout:", err);
        setError(err.message || "Não foi possível gerar o link de pagamento. Tente novamente.");
        setIsProcessing(false);
        setSelectedMethod(null);
    }
  };

  const installmentOptions = () => {
    if (!course) return [];
    const options = [];
    for (let i = 1; i <= 12; i++) {
        const installmentAmount = (course.price / i).toFixed(2);
        options.push({
            count: i,
            amount: parseFloat(installmentAmount)
        });
    }
    return options;
  };

  const isEnrolled = user && course && user.enrolledCourses.includes(course.id);

  if (loading) return <div className="p-8 text-center text-brand-graphite font-bold">Carregando detalhes do curso...</div>;
  if (!course) return <div className="p-8 text-center text-red-500">Curso não encontrado</div>;

  return (
    <div className="bg-brand-neutral min-h-screen">
      {/* Header - Brand Deep */}
      <div className="bg-brand-deep text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/4 h-full bg-brand-tech opacity-10 blur-3xl"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <button onClick={() => navigate(-1)} className="flex items-center text-brand-light hover:text-white transition-colors text-xs font-black uppercase tracking-widest mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </button>
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">{course.title}</h1>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed font-medium">{course.description}</p>
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                <ShieldCheck className="w-4 h-4 text-brand-green"/> 
                Instrutor: <span className="font-bold text-brand-light">{course.teacherName}</span>
              </span>
              <span className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                <Clock className="w-4 h-4 text-brand-light"/> 
                Última atualização: 2024
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Syllabus Section */}
        <div className="lg:col-span-2 space-y-8">
          <h2 className="text-3xl font-black text-brand-deep flex items-center gap-3">
            <div className="w-1.5 h-8 bg-brand-tech rounded-full"></div>
            Conteúdo do Curso
          </h2>
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            {course.modules.length === 0 ? (
               <div className="p-10 text-gray-400 italic text-center font-medium">Este curso ainda não possui módulos disponíveis.</div>
            ) : (
                course.modules.map((mod, idx) => (
                <div key={mod.id} className="border-b border-gray-100 last:border-0">
                    <div className="bg-brand-neutral/50 px-8 py-5 flex justify-between items-center">
                    <h3 className="font-black text-brand-deep text-lg">Módulo {idx + 1}: {mod.title}</h3>
                    <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-brand-tech border border-brand-tech/10 uppercase tracking-widest">
                        {mod.lessons.length} aulas
                    </span>
                    </div>
                    <ul className="divide-y divide-gray-50">
                    {mod.lessons.map(lesson => (
                        <li key={lesson.id} className="px-8 py-4 flex items-center gap-4 text-brand-graphite hover:bg-brand-neutral transition-colors group">
                        <div className="p-2 rounded-xl bg-brand-neutral text-brand-tech group-hover:bg-brand-tech group-hover:text-white transition-all shadow-sm">
                            {lesson.type === 'video' && <PlayCircle className="w-4 h-4" />}
                            {lesson.type === 'quiz' && <HelpCircle className="w-4 h-4" />}
                            {lesson.type === 'text' && <FileText className="w-4 h-4" />}
                        </div>
                        
                        <span className="text-sm font-bold flex-1">{lesson.title}</span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{lesson.duration}</span>
                        </li>
                    ))}
                    </ul>
                </div>
                ))
            )}
          </div>
        </div>

        {/* Purchase Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden group">
            <div className="h-56 overflow-hidden relative">
               <img src={course.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
               <div className="absolute bottom-6 left-8 text-white">
                    <div className="text-xs font-black uppercase tracking-[0.2em] mb-1 text-brand-light">Investimento</div>
                    <div className="text-4xl font-black">R$ {course.price}</div>
               </div>
            </div>
            <div className="p-8">
              {isEnrolled ? (
                 <button
                 onClick={() => navigate(`/player/${course.id}`)}
                 className="w-full bg-brand-green text-white font-black py-5 rounded-2xl hover:bg-brand-green/90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-brand-green/20 uppercase tracking-widest text-sm"
               >
                 <PlayCircle className="w-5 h-5" />
                 Acessar Agora
               </button>
              ) : (
                <div className="space-y-4">
                    <button
                        onClick={handleBuy}
                        disabled={isProcessing}
                        className="w-full bg-brand-tech text-white font-black py-5 rounded-2xl hover:bg-brand-deep transition-all flex justify-center items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-brand-tech/30 uppercase tracking-widest text-sm"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Processando...
                            </>
                        ) : (
                            <>
                                Inscrever-se no Curso
                                <ShoppingCart className="w-5 h-5" />
                            </>
                        )}
                    </button>
                    {error && (
                        <div className="flex items-center gap-3 text-red-600 text-xs bg-red-50 p-4 rounded-2xl border border-red-100 font-bold">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {error}
                        </div>
                    )}
                </div>
              )}
              
              <div className="mt-10 space-y-4">
                <div className="flex items-center gap-3 text-sm text-brand-graphite font-bold">
                    <div className="p-1.5 bg-brand-green/10 rounded-lg"><CheckCircle className="w-4 h-4 text-brand-green" /></div>
                    <span>Pagamento Seguro Habilon</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-brand-graphite font-bold">
                    <div className="p-1.5 bg-brand-green/10 rounded-lg"><CheckCircle className="w-4 h-4 text-brand-green" /></div>
                    <span>Acesso vitalício completo</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-brand-graphite font-bold">
                    <div className="p-1.5 bg-brand-green/10 rounded-lg"><CheckCircle className="w-4 h-4 text-brand-green" /></div>
                    <span>Certificado de Conclusão</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-brand-deep/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-8 border-b border-gray-100 bg-brand-neutral/30">
              <div>
                  <h2 className="text-2xl font-black text-brand-deep tracking-tight">Checkout Seguro</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Escolha como pagar</p>
              </div>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedMethod(null);
                }}
                className="p-2 text-gray-400 hover:text-brand-deep hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-4">
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  onClick={() => {
                    if (method.id === 'CREDIT_CARD') {
                      setSelectedMethod(method.id);
                    } else {
                      handlePaymentMethodSelect(method.id);
                    }
                  }}
                  disabled={isProcessing && selectedMethod !== method.id}
                  className={`w-full p-5 rounded-2xl border-2 transition-all text-left ${
                    selectedMethod === method.id
                      ? 'border-brand-tech bg-brand-tech/5 ring-4 ring-brand-tech/10'
                      : 'border-gray-100 hover:border-brand-tech/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed group`}
                >
                  <div className="flex items-start gap-4">
                    <span className="text-3xl bg-white p-2 rounded-xl shadow-sm border border-gray-50">{method.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-black text-brand-deep text-lg">{method.name}</h3>
                      <p className="text-xs text-gray-500 font-medium mt-1">{method.description}</p>
                      <div className="flex gap-4 mt-3 text-[10px] font-black uppercase tracking-widest text-brand-tech">
                        <span className="flex items-center gap-1 opacity-70">⏱️ {method.processingTime}</span>
                        <span className="flex items-center gap-1">💰 {method.fees}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}

              {/* Installments for Credit Card */}
              {selectedMethod === 'CREDIT_CARD' && (
                <div className="mt-8 pt-8 border-t border-gray-100 space-y-5 animate-in slide-in-from-top-4">
                  <h3 className="font-black text-brand-deep uppercase tracking-widest text-xs">Parcelamento no Cartão</h3>
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(parseInt(e.target.value))}
                    className="w-full p-4 bg-brand-neutral/50 border-0 rounded-2xl font-bold text-brand-deep focus:ring-2 focus:ring-brand-tech transition-all outline-none"
                  >
                    {installmentOptions().map(opt => (
                      <option key={opt.count} value={opt.count}>
                        {opt.count}x de R$ {opt.amount.toFixed(2)}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handlePaymentMethodSelect('CREDIT_CARD')}
                    disabled={isProcessing}
                    className="w-full bg-brand-tech text-white font-black py-5 rounded-2xl hover:bg-brand-deep transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl shadow-brand-tech/30 uppercase tracking-widest text-sm"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Aguarde...
                      </>
                    ) : (
                      'Pagar com Cartão de Crédito'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetails;