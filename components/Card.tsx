import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  accent?: 'gold' | 'turquoise' | 'white' | 'none';
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, accent = 'white' }) => {
  const accentStyles = {
    gold: 'border-t-2 border-t-[#FFD700]',
    turquoise: 'border-t-2 border-t-[#00E3FF]',
    white: 'border-t-2 border-t-white/20',
    none: ''
  };

  return (
    <div className={`glass-panel rounded-xl p-8 hover:bg-white/[0.02] transition-all duration-300 relative overflow-hidden group ${accentStyles[accent]} ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-3 relative z-10 tracking-tight">
          {title}
        </h3>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};