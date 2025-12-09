import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  limit?: number;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({ 
  label, 
  options, 
  selected, 
  onChange, 
  limit = 3 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      if (selected.length < limit) {
        onChange([...selected, option]);
      }
    }
  };

  return (
    <div ref={containerRef}>
      <label className="text-xs text-gray-500 mb-1.5 block font-medium">{label}</label>
      
      <div className="relative">
        <div 
          className={`w-full bg-white/5 rounded-lg p-2 min-h-[42px] text-sm text-white border transition-all cursor-pointer flex items-center justify-between group ${isOpen ? 'border-white/30 bg-white/10' : 'border-white/10 hover:border-white/20'}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex flex-wrap gap-1.5">
            {selected.length === 0 ? (
              <span className="text-gray-500 px-1 py-0.5">Select up to {limit}...</span>
            ) : (
              selected.map(item => (
                <span key={item} className="bg-[#00E3FF]/10 text-[#00E3FF] border border-[#00E3FF]/20 text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium animate-in fade-in zoom-in duration-200">
                  {item}
                  <div 
                    className="hover:bg-[#00E3FF]/20 rounded p-0.5 cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(item);
                    }}
                  >
                    <X size={10} />
                  </div>
                </span>
              ))
            )}
          </div>
          <ChevronDown size={14} className={`text-gray-500 transition-transform duration-200 shrink-0 mx-1 ${isOpen ? 'rotate-180 text-white' : ''}`} />
        </div>

        {isOpen && (
          <div className="absolute bottom-full left-0 z-50 w-full mb-2 bg-[#0A0A0A] border border-white/10 rounded-lg shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
             <div className="max-h-60 overflow-y-auto custom-scrollbar p-1">
              {options.map(option => {
                  const isSelected = selected.includes(option);
                  const isDisabled = !isSelected && selected.length >= limit;
                  return (
                      <div 
                          key={option}
                          className={`px-3 py-2.5 text-sm flex items-center justify-between cursor-pointer rounded-md transition-all ${
                            isSelected 
                              ? 'bg-white/10 text-white font-medium' 
                              : isDisabled 
                                ? 'opacity-40 cursor-not-allowed text-gray-500' 
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                          }`}
                          onClick={() => !isDisabled && toggleOption(option)}
                      >
                          <span>{option}</span>
                          {isSelected && <Check size={14} className="text-[#00E3FF]" />}
                      </div>
                  );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};