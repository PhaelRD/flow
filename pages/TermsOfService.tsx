
import React from 'react';
import { ArrowLeft, ScrollText, GraduationCap } from 'lucide-react';
/* Fix: Using namespace import for react-router-dom to resolve export issues */
import * as ReactRouterDOM from 'react-router-dom';
const { useNavigate } = ReactRouterDOM as any;

const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-brand-neutral py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-10 md:p-20 rounded-[3rem] shadow-2xl border border-gray-100 relative overflow-hidden">
        {/* Visual embellishment */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-tech/5 rounded-full -mr-16 -mt-16"></div>

        <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-sm text-brand-tech hover:text-brand-deep mb-12 transition-colors font-black uppercase tracking-widest"
        >
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </button>

        <div className="flex items-center gap-6 mb-16">
            <div className="p-5 bg-brand-deep rounded-3xl shadow-xl shadow-brand-deep/20">
                <GraduationCap className="w-12 h-12 text-brand-light" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-brand-deep tracking-tighter">Habilon <span className="text-brand-tech">Class</span></h1>
              <p className="text-gray-400 mt-2 font-bold uppercase tracking-widest text-xs">Políticas de Uso & Termos de Serviço</p>
            </div>
        </div>

        <div className="prose prose-brand prose-lg max-w-none text-brand-graphite space-y-10 leading-relaxed font-medium">
            <section className="bg-brand-neutral/40 p-10 rounded-[2rem] border border-gray-100">
                <h2 className="text-2xl font-black text-brand-deep mb-5 flex items-center gap-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-brand-tech text-white text-lg font-black">1</span>
                  Aceitação da Marca
                </h2>
                <p>
                    Ao acessar a plataforma <strong>Habilon Class</strong>, você concorda voluntariamente em cumprir e estar integralmente vinculado aos seguintes Termos de Serviço. A marca Habilon Class represents qualidade e autoridade em educação digital.
                </p>
            </section>

            <section className="px-6">
                <h2 className="text-2xl font-black text-brand-deep mb-5 flex items-center gap-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-brand-deep text-brand-light text-lg font-black">2</span>
                  Serviços Educacionais
                </h2>
                <p>
                    A Habilon Class fornece trilhas de aprendizado de alta performance. Você deve manter seus dados sempre atualizados e é o único responsável pela segurança de sua credencial de acesso. O compartilhamento de contas é estritamente proibido pela política de segurança da Habilon.
                </p>
            </section>

            <section className="px-6">
                <h2 className="text-2xl font-black text-brand-deep mb-5 flex items-center gap-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-brand-deep text-brand-light text-lg font-black">3</span>
                  Direitos Autorais (IP)
                </h2>
                <p>
                    Todo o ecossistema Habilon Class — vídeos, códigos, metodologias e design — é propriedade intelectual protegida. O acesso ao curso concede uma licença de uso <strong>pessoal e intransferível</strong> para evolução acadêmica e profissional.
                </p>
            </section>

            <section className="bg-brand-green/10 p-10 rounded-[2rem] border border-brand-green/20">
                <h2 className="text-2xl font-black text-brand-deep mb-5 flex items-center gap-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-brand-green text-white text-lg font-black">4</span>
                  Código de Conduta
                </h2>
                <p>
                    A evolução contínua exige respeito. Não permitimos scraping de conteúdo, engenharia reversa de nossa tecnologia ou comportamentos abusivos em canais de suporte e comunidade Habilon Class.
                </p>
            </section>

            <section className="pt-16 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">© 2024 Habilon Class • Todos os direitos reservados.</p>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-brand-green"></div>
                    <p className="text-xs text-brand-graphite font-black">Última atualização: 24 de Maio de 2024</p>
                </div>
            </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
