import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/theme.jsx';

const FormHabilidade = ({
  label,
  value,
  onChange,
  name,
  options = [],
  placeholder = 'Selecione uma habilidade',
  required = false,
  disabled = false,
  className = '',
  error
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const selectId = `habilidade-${name}`;
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const dropdownRef = useRef(null);

  // Encontrar a opção selecionada
  useEffect(() => {
    const option = options.find(opt => opt.value === value);
    setSelectedOption(option);
  }, [value, options]);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (option) => {
    setSelectedOption(option);
    onChange({ target: { name, value: option.value } });
    setIsOpen(false);
  };

  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className={`mb-2 text-sm font-semibold font-modern ${isLight ? 'text-slate-700' : 'text-white'}`}
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        {/* Select customizado */}
        <div
          className={`w-full px-4 py-2 rounded-lg font-modern border focus:outline-none transition-all cursor-pointer
            ${isLight ? 'bg-white/90 border-slate-300 text-slate-800' : 'bg-[#1e1b4bcc] border-slate-700 text-white'}
            ${error ? 'border-red-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${isOpen ? 'ring-2 ring-purple-500/50' : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <span className={selectedOption ? 'text-current' : 'text-slate-400'}>
              {selectedOption ? `${selectedOption.label} ${selectedOption.custo ? `(${selectedOption.custo} pts)` : ''}` : placeholder}
            </span>
            <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
          </div>
        </div>
        
        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-4 py-2 text-slate-400 text-sm">Nenhuma habilidade disponível</div>
            ) : (
              options.map((option) => (
                <div
                  key={option.value}
                  className={`px-4 py-2 cursor-pointer transition-colors hover:bg-slate-700
                    ${selectedOption?.value === option.value ? 'bg-purple-600/20 text-purple-300' : 'text-white'}`}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={() => setHoveredOption(option)}
                  onMouseLeave={() => setHoveredOption(null)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option.label}</span>
                    {option.custo && (
                      <span className="text-cyan-400 text-sm">{option.custo} pts</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {/* Tooltip de descrição */}
        {hoveredOption && hoveredOption.descricao && (
          <div className="absolute z-50 mt-2 p-3 rounded-lg shadow-lg max-w-xs bg-slate-800 border border-slate-600 text-white text-sm">
            <div className="font-semibold mb-1">{hoveredOption.label}</div>
            {hoveredOption.custo && (
              <div className="text-cyan-400 text-xs mb-2">
                Custo: {hoveredOption.custo} pontos
              </div>
            )}
            <div className="text-slate-300 text-xs leading-relaxed">
              {hoveredOption.descricao}
            </div>
            <div className="absolute top-0 left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-slate-800 transform -translate-y-full"></div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-xs text-red-400 font-modern">{error}</p>
      )}
    </div>
  );
};

export default FormHabilidade; 