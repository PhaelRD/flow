
import React from 'react';
import { ArrowLeft, ScrollText } from 'lucide-react';
// Corrected import for useNavigate from react-router-dom
import { useNavigate } from 'react-router-dom';

const TermsOfService: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-16 rounded-2xl shadow-xl border border-gray-100">
        <button 
            onClick={() => navigate(-1)} 
            className="flex items-center text-sm text-indigo-600 hover:text-indigo-800 mb-10 transition-colors font-semibold"
        >
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar para a página anterior
        </button>

        <div className="flex items-center gap-5 mb-12">
            <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
                <ScrollText className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900 tracking-tight">Termos de Serviço</h1>
              <p className="text-gray-500 mt-1 font-medium italic">Leia atentamente nossas diretrizes da plataforma</p>
            </div>
        </div>

        <div className="prose prose-indigo prose-lg max-w-none text-gray-700 space-y-8 leading-relaxed">
            <section className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <h2 className="text-2xl font-black text-indigo-900 mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 text-sm">1</span>
                  Aceitação dos Termos
                </h2>
                <p>
                    Ao acessar e utilizar a plataforma <strong>EduFlow</strong>, você concorda voluntariamente em cumprir e estar integralmente vinculado aos seguintes Termos de Serviço. Se você não concordar com qualquer parte destes termos, você não poderá acessar o serviço ou deve interromper o uso imediatamente.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-black text-gray-800 mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm">2</span>
                  Uso do Serviço
                </h2>
                <p>
                    O EduFlow é uma plataforma de aprendizado online. Você deve fornecer informações precisas, atuais e completas ao criar sua conta. Você é o único responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrem sob sua conta. Contas detectadas com compartilhamento simultâneo de múltiplos IPs podem ser suspensas.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-black text-gray-800 mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm">3</span>
                  Propriedade Intelectual
                </h2>
                <p>
                    Todo o conteúdo disponível na plataforma, incluindo vídeos, textos, códigos-fonte, quizzes e logotipos, é de propriedade exclusiva do EduFlow ou de seus respectivos instrutores e está protegido por leis internacionais de direitos autorais. O acesso ao curso concede uma licença de uso <strong>pessoal, não exclusiva e intransferível</strong>.
                </p>
            </section>

            <section className="bg-amber-50/30 p-6 rounded-2xl border border-amber-100">
                <h2 className="text-2xl font-black text-amber-900 mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600 text-sm">4</span>
                  Conduta do Usuário
                </h2>
                <p>
                    Você concorda explicitamente em não utilizar a plataforma para:
                </p>
                <ul className="list-disc pl-6 space-y-3 mt-4 text-gray-800 font-medium">
                    <li>Publicar conteúdo ofensivo, discriminatório, ilegal ou abusivo;</li>
                    <li>Tentar burlar sistemas de segurança, realizar scraping de vídeos ou acesso não autorizado;</li>
                    <li>Compartilhar sua conta com terceiros;</li>
                    <li>Copiar, gravar ou redistribuir o conteúdo das aulas sem autorização expressa por escrito.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-2xl font-black text-gray-800 mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm">5</span>
                  Pagamentos e Reembolsos
                </h2>
                <p>
                    Os preços dos cursos são definidos pela administração. Oferecemos uma garantia incondicional de satisfação de <strong>7 dias</strong>, conforme o Código de Defesa do Consumidor. Solicitações de reembolso após esse período serão analisadas apenas em casos excepcionais de falha técnica comprovada.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-black text-gray-800 mb-4 flex items-center gap-2">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-600 text-sm">6</span>
                  Modificações nos Termos
                </h2>
                <p>
                    O EduFlow reserva-se o direito de modificar estes termos a qualquer momento para refletir mudanças na lei ou no serviço. Alterações significativas serão notificadas através da plataforma. O uso continuado do serviço após tais alterações constitui sua aceitação tácita dos novos termos.
                </p>
            </section>

            <section className="pt-12 border-t border-gray-100 text-sm text-gray-400 flex justify-between items-center">
                <p>© 2024 EduFlow - Todos os direitos reservados.</p>
                <p>Última atualização: 24 de Maio de 2024</p>
            </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
