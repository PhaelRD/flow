
import React, { useState, useEffect } from 'react';
/* Fix: Using namespace import for react-router-dom to resolve export issues */
import * as ReactRouterDOM from 'react-router-dom';
const { Link, useNavigate } = ReactRouterDOM as any;
import { auth } from '../services/firebase';
// Use namespace import to resolve modular auth named export issues
import * as firebaseAuth from 'firebase/auth';
import { createUserProfile } from '../services/mockBackend';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, User as UserIcon, CheckCircle2, X, Fingerprint } from 'lucide-react';
import Logo from '../components/Logo';

const { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } = firebaseAuth as any;

const AuthPage: React.FC = () => {
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
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

    if (!isLogin) {
        if (!agreedToTerms) {
            setError('Você deve aceitar os Termos de Serviço para continuar.');
            return;
        }
        if (!cpfCnpj.trim()) {
            setError('O CPF ou CNPJ é obrigatório para processar pagamentos.');
            return;
        }
    }

    setLoading(true);

    try {
        if (isLogin) {
            // Modular signInWithEmailAndPassword
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            // Modular createUserWithEmailAndPassword
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = userCredential.user;
            // Modular updateProfile
            await updateProfile(newUser, { displayName: name });
            await createUserProfile({
                uid: newUser.uid,
                name: name,
                email: newUser.email || '',
                cpfCnpj: cpfCnpj,
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

  const handleAcceptTermsFromModal = () => {
      setAgreedToTerms(true);
      setShowTermsModal(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-brand-neutral py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-2xl border border-gray-100">
        <div className="text-center flex flex-col items-center">
          <Logo size="md" variant="light" className="mb-6" />
          <h2 className="text-3xl font-black text-brand-deep">
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            Sua porta de entrada para a alta performance.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {!isLogin && (
                <>
                    <div className="relative">
                        <label htmlFor="name" className="sr-only">Nome Completo</label>
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <UserIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required={!isLogin}
                            className="bg-brand-neutral/50 border-0 rounded-2xl relative block w-full px-4 py-3.5 pl-12 text-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-tech transition-all sm:text-sm placeholder-gray-400"
                            placeholder="Nome Completo"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <label htmlFor="cpfCnpj" className="sr-only">CPF ou CNPJ</label>
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Fingerprint className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            id="cpfCnpj"
                            name="cpfCnpj"
                            type="text"
                            required={!isLogin}
                            className="bg-brand-neutral/50 border-0 rounded-2xl relative block w-full px-4 py-3.5 pl-12 text-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-tech transition-all sm:text-sm placeholder-gray-400"
                            placeholder="CPF ou CNPJ (apenas números)"
                            value={cpfCnpj}
                            onChange={(e) => setCpfCnpj(e.target.value.replace(/\D/g, ''))}
                        />
                    </div>
                </>
            )}
            <div className="relative">
              <label htmlFor="email-address" className="sr-only">Endereço de e-mail</label>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="bg-brand-neutral/50 border-0 rounded-2xl relative block w-full px-4 py-3.5 pl-12 text-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-tech transition-all sm:text-sm placeholder-gray-400"
                placeholder="Endereço de e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">Senha</label>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="bg-brand-neutral/50 border-0 rounded-2xl relative block w-full px-4 py-3.5 pl-12 text-brand-deep focus:outline-none focus:ring-2 focus:ring-brand-tech transition-all sm:text-sm placeholder-gray-400"
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
                          className="focus:ring-brand-tech h-4 w-4 text-brand-tech border-gray-300 rounded cursor-pointer transition-all"
                      />
                  </div>
                  <div className="ml-3 text-sm">
                      <label htmlFor="terms" className="font-medium text-gray-500 cursor-pointer">
                          Eu li e aceito os{' '}
                      </label>
                      <button 
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-brand-tech hover:text-brand-deep underline font-bold focus:outline-none"
                      >
                        Termos de Serviço
                      </button>
                  </div>
              </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl border border-red-100">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-black rounded-2xl text-white bg-brand-tech hover:bg-brand-deep focus:outline-none transition-all shadow-xl shadow-brand-tech/20 disabled:opacity-50 uppercase tracking-widest"
            >
              {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Registrar')}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-8">
            <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-sm font-bold text-brand-tech hover:text-brand-deep transition-colors"
            >
                {isLogin ? "Ainda não tem conta? Junte-se à Habilon Class" : "Já faz parte da Habilon? Entre aqui"}
            </button>
        </div>
      </div>

      {/* Floating Terms Modal */}
      {showTermsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-deep/60 backdrop-blur-sm transition-all animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-brand-neutral/30">
                      <div className="flex items-center gap-4">
                          <Logo size="sm" variant="light" showText={false} />
                          <div>
                            <h3 className="text-2xl font-black text-brand-deep">Termos de Serviço</h3>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Habilon Class • Atualizado 2024</p>
                          </div>
                      </div>
                      <button 
                        onClick={() => setShowTermsModal(false)}
                        className="p-2 text-gray-400 hover:text-brand-deep hover:bg-gray-100 rounded-full transition-colors"
                      >
                          <X className="w-7 h-7" />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 prose prose-brand max-w-none text-brand-graphite leading-relaxed">
                      <h4 className="text-xl font-black text-brand-deep mb-4">1. Aceitação dos Termos</h4>
                      <p className="mb-6">
                          Ao acessar e utilizar a plataforma <strong>Habilon Class</strong>, você concorda voluntariamente em cumprir e estar integralmente vinculado aos seguintes Termos de Serviço.
                      </p>
                  </div>

                  <div className="p-8 border-t border-gray-100 bg-brand-neutral/30 flex justify-end gap-4">
                      <button 
                        onClick={() => setShowTermsModal(false)}
                        className="px-6 py-2.5 text-sm font-bold text-gray-400 hover:text-brand-deep transition-colors"
                      >
                          Fechar
                      </button>
                      <button 
                        onClick={handleAcceptTermsFromModal}
                        className="px-8 py-3 bg-brand-tech text-white font-black rounded-2xl shadow-xl shadow-brand-tech/30 hover:bg-brand-deep transition-all flex items-center gap-2 uppercase tracking-widest text-sm"
                      >
                          <CheckCircle2 className="w-5 h-5" /> Aceitar Termos
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AuthPage;
