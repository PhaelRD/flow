
import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark'; // 'light' para fundos claros (texto escuro), 'dark' para fundos escuros (texto claro)
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  showText = true,
  variant = 'dark',
  size = 'md' 
}) => {
  const [imgError, setImgError] = useState(false);

  // Mapa de tamanhos para o ícone (imagem ou fallback)
  const iconSizeMap = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  // Mapa de tamanhos para a tipografia
  const textSizeMap = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-6xl',
    xl: 'text-8xl'
  };

  const subtextSizeMap = {
    sm: 'text-[10px]',
    md: 'text-lg',
    lg: 'text-3xl',
    xl: 'text-5xl'
  };

  const gapSizeMap = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-5',
    xl: 'gap-6'
  };

  // Definição de cores baseada no tema
  const textColor = variant === 'dark' ? 'text-white' : 'text-[#081C3A]';
  const subtextColor = variant === 'dark' ? 'text-[#6BCF8E]' : 'text-[#1F6AE1]';

  return (
    <div className={`inline-flex items-center ${gapSizeMap[size]} ${className}`}>
      {/* Ícone da Marca - Tentativa de carregamento relativo com fallback */}
      <div className={`${iconSizeMap[size]} flex-shrink-0 flex items-center justify-center relative`}>
        {!imgError ? (
          <img 
            src="./icon.png" 
            alt="Habilon Icon" 
            className="w-full h-full object-contain drop-shadow-md transition-opacity duration-300"
            onLoad={(e) => (e.currentTarget.style.opacity = '1')}
            onError={() => {
              console.warn("Habilon Icon: Falha ao carregar ./icon.png. Ativando fallback visual.");
              setImgError(true);
            }}
            style={{ opacity: 0 }}
          />
        ) : (
          /* Fallback visual de alta fidelidade: Um emblema sofisticado com gradiente da marca */
          <div className={`w-full h-full rounded-xl flex items-center justify-center bg-gradient-to-br from-[#1F6AE1] to-[#081C3A] shadow-lg border border-white/10`}>
            <span className={`font-black text-white italic tracking-tighter ${
              size === 'sm' ? 'text-sm' : 
              size === 'md' ? 'text-lg' : 
              size === 'lg' ? 'text-4xl' : 
              'text-6xl'
            }`}>H</span>
          </div>
        )}
      </div>

      {showText && (
        <div className="flex flex-col leading-[0.7] select-none">
          {/* Nome Principal - Forte e Moderno */}
          <span className={`font-black tracking-tighter uppercase ${textColor} ${textSizeMap[size]}`}>
            HABILON
          </span>
          {/* Subtítulo - Elegante e Tradicional */}
          <span className={`font-serif italic font-normal tracking-tight ${subtextColor} ${subtextSizeMap[size]} ml-1`}>
            Class
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
