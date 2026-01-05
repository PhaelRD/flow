
import React from 'react';
/* Fix: Using namespace import for react-router-dom to resolve export issues */
import * as ReactRouterDOM from 'react-router-dom';
const { Link, useNavigate } = ReactRouterDOM as any;
import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';
import Logo from './Logo';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <Logo size="sm" variant="light" />
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-4 mr-4">
                  {user.role === 'student' && (
                     <>
                      <Link to="/dashboard" className="text-brand-graphite hover:text-brand-tech px-3 py-2 rounded-md text-sm font-semibold transition-colors">Meu Aprendizado</Link>
                      <Link to="/support" className="text-brand-graphite hover:text-brand-tech px-3 py-2 rounded-md text-sm font-semibold transition-colors">Suporte</Link>
                     </>
                  )}
                  {user.role === 'teacher' && (
                    <>
                       <Link to="/teacher/dashboard" className="text-brand-graphite hover:text-brand-tech px-3 py-2 rounded-md text-sm font-semibold transition-colors">Painel</Link>
                       <Link to="/teacher/inbox" className="text-brand-graphite hover:text-brand-tech px-3 py-2 rounded-md text-sm font-semibold transition-colors">Caixa de Entrada</Link>
                       <Link to="/teacher/create-course" className="text-brand-graphite hover:text-brand-tech px-3 py-2 rounded-md text-sm font-semibold transition-colors">Criar Curso</Link>
                    </>
                  )}
                  {user.role === 'admin' && (
                     <Link to="/admin/dashboard" className="text-brand-graphite hover:text-brand-tech px-3 py-2 rounded-md text-sm font-semibold transition-colors">Painel Admin</Link>
                  )}
                </div>
                
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-brand-deep">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user.role === 'student' ? 'Estudante' : user.role === 'teacher' ? 'Professor' : 'Admin'}
                    </p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    title="Sair"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-brand-graphite hover:text-brand-tech font-bold text-sm">Entrar</Link>
                <Link to="/login" className="bg-brand-tech hover:bg-brand-deep text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-brand-tech/20">
                  Começar agora
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
