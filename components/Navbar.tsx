import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, BookOpen, LayoutDashboard, Settings, GraduationCap, MessageSquare } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <BookOpen className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-gray-900">EduFlow</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <div className="hidden md:flex items-center gap-4 mr-4">
                  {user.role === 'student' && (
                     <>
                      <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Meu Aprendizado</Link>
                      <Link to="/support" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Suporte</Link>
                     </>
                  )}
                  {user.role === 'teacher' && (
                    <>
                       <Link to="/teacher/dashboard" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Painel</Link>
                       <Link to="/teacher/inbox" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Caixa de Entrada</Link>
                       <Link to="/teacher/create-course" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Criar Curso</Link>
                    </>
                  )}
                  {user.role === 'admin' && (
                     <Link to="/admin/dashboard" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Painel Admin</Link>
                  )}
                </div>
                
                <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {user.role === 'student' ? 'Estudante' : user.role === 'teacher' ? 'Professor' : 'Admin'}
                    </p>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-colors"
                    title="Sair"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium text-sm">Entrar</Link>
                <Link to="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                  Começar
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