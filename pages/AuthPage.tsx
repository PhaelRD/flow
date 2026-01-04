
import React, { useState, useEffect } from 'react';
// Corrected imports for Link and useNavigate from react-router-dom
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { createUserProfile } from '../services/mockBackend';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, User as UserIcon, CheckCircle2, X, ScrollText } from 'lucide-react';

const AuthPage: React.FC = () => {
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isLogin && !agreedToTerms) {
        setError('Você deve aceitar os Termos de Serviço para continuar.');
        return;
    }

    setLoading(true);

    try {
        if (isLogin) {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = userCredential.user;
            await updateProfile(newUser, { displayName: name });
            await createUserProfile({
                uid: newUser.uid,
                name: name,
                email: newUser.email || '',
                role: 'student',
                enrolledCourses: []
            });
        }
    } catch (err: any) {
        console.error(err);
        let msg = "Ocorreu um erro.";
        if (err.code === 'auth/invalid-email') msg = "Endereço de e-mail inválido.";
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = "E-mail ou senha inválidos.";
        if (err.code === 'auth/email-already-in-use') msg = "Este e-mail já está em uso.";
        if (err.code === 'auth/weak-password') msg = "A senha deve ter pelo menos 6 caracteres.";
        setError(msg);
        setLoading(false);
    }
  };

  const handleAcceptTerms = () => {
      setAgreedToTerms(true);
      setShowTermsModal(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isLogin ? 'Entrar no EduFlow' : 'Criar uma Conta'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isLogin ? 'Bem-vindo de volta, aluno!' : 'Comece sua jornada de aprendizado hoje.'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-3">
            {!isLogin && (
                <div className="relative">
                    <label htmlFor="name" className="sr-only">Nome Completo</label>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        required={!isLogin}
                        className="bg-white appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                        placeholder="Nome Completo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>
            )}
            <div className="relative">
              <label htmlFor="email-address" className="sr-only">Endereço de e-mail</label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="bg-white appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Endereço de e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">Senha</label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="bg-white appearance-none rounded-md relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {!isLogin && (
              <div className="flex items-start">
                  <div className="flex items-center h-5">
                      <input
                          id="terms"
                          name="terms"
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded cursor-pointer"
                      />
                  </div>
                  <div className="ml-3 text-sm">
                      <span className="font-medium text-gray-700">
                          Eu li e aceito os{' '}
                          <button 
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-indigo-600 hover:text-indigo-500 underline font-bold focus:outline-none"
                          >
                            Termos de Serviço
                          </button>
                      </span>
                  </div>
              </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-bold rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all shadow-md"
            >
              {loading ? (isLogin ? 'Entrando...' : 'Registrando...') : (isLogin ? 'Entrar' : 'Registrar')}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center border-t border-gray-100 pt-6">
            <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
                {isLogin ? "Não tem uma conta? Registre-se agora" : "Já tem uma conta? Entre aqui"}
            </button>
        </div>
      </div>

      {/* Floating Terms Modal */}
      {showTermsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                              <ScrollText className="w-5 h-5" />
                          </div>
                          <h3 className="text-xl font-black text-gray-900">Termos de Serviço</h3>
                      </div>
                      <button 
                        onClick={() => setShowTermsModal(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                      >
                          <X className="w-6 h-6" />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 prose prose-indigo max-w-none text-gray-600">
                      <h4 className="text-lg font-bold text-gray-900 mb-4">1. Aceitação dos Termos</h4>
                      <p className="mb-6">
                          Ao acessar e utilizar a plataforma <strong>EduFlow</strong>, você concorda voluntariamente em cumprir e estar integralmente vinculado aos seguintes Termos de Serviço. Se você não concordar com qualquer parte destes termos, você não poderá acessar o serviço ou deve interromper o uso imediatamente.
                      </p>

                      <h4 className="text-lg font-bold text-gray-900 mb-4">2. Uso do Serviço</h4>
                      <p className="mb-6">
                          O EduFlow é uma plataforma de aprendizado online. Você deve fornecer informações precisas, atuais e completas ao criar sua conta. Você é o único responsável por manter a confidencialidade de sua senha e por todas as atividades que ocorrem sob sua conta. Contas detectadas com compartilhamento simultâneo de múltiplos IPs podem ser suspensas.
                      </p>

                      <h4 className="text-lg font-bold text-gray-900 mb-4">3. Propriedade Intelectual</h4>
                      <p className="mb-6">
                          Todo o conteúdo disponível na plataforma, incluindo vídeos, textos, códigos-fonte, quizzes e logotipos, é de propriedade exclusiva do EduFlow ou de seus respectivos instrutores e está protegido por leis internacionais de direitos autorais. O acesso ao curso concede uma licença de uso <strong>pessoal, não exclusiva e intransferível</strong>.
                      </p>

                      <h4 className="text-lg font-bold text-gray-900 mb-4">4. Conduta do Usuário</h4>
                      <p className="mb-4">
                          Você concorda explicitamente em não utilizar a plataforma para:
                      </p>
                      <ul className="list-disc pl-6 mb-6 space-y-2">
                          <li>Publicar conteúdo ofensivo, discriminatório, ilegal ou abusivo;</li>
                          <li>Tentar burlar sistemas de segurança ou realizar scraping de conteúdo;</li>
                          <li>Compartilhar sua conta com terceiros;</li>
                          <li>Copiar, gravar ou redistribuir o conteúdo das aulas sem autorização.</li>
                      </ul>

                      <h4 className="text-lg font-bold text-gray-900 mb-4">5. Pagamentos e Reembolsos</h4>
                      <p className="mb-6">
                          Oferecemos uma garantia incondicional de satisfação de <strong>7 dias</strong>, conforme o Código de Defesa do Consumidor. Solicitações de reembolso após esse período serão analisadas caso a caso.
                      </p>

                      <p className="text-sm text-gray-400 mt-10 border-t pt-4">
                          Última atualização: 24 de Maio de 2024
                      </p>
                  </div>

                  <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                      <button 
                        onClick={() => setShowTermsModal(false)}
                        className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-700"
                      >
                          Fechar
                      </button>
                      <button 
                        onClick={handleAcceptTerms}
                        className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                      >
                          <CheckCircle2 className="w-4 h-4" /> Li e Aceito os Termos
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AuthPage;
