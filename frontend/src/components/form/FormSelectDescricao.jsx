import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/theme.jsx';

const FormSelectDescricao = ({
  label,
  value,
  onChange,
  name,
  options = [],
  placeholder = 'Selecione uma opção',
  required = false,
  disabled = false,
  className = '',
  error
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const selectId = `select-desc-${name}`;
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const dropdownRef = useRef(null);

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

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (option) => {
    if (disabled) return;
    onChange({ target: { name, value: option.value } });
    setIsOpen(false);
    setHoveredOption(null);
  };

  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className={`mb-2 text-sm font-semibold font-modern ${isLight ? 'text-slate-200' : 'text-white'} drop-shadow`}
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        <div
          className={`w-full px-4 py-2 rounded-lg font-modern border focus:outline-none transition-all cursor-pointer
            ${isLight ? 'bg-white/20 border-slate-400 text-slate-100' : 'bg-[#1e1b4bcc] border-slate-700 text-white'}
            ${error ? 'border-red-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${isOpen ? 'ring-2 ring-purple-500/50' : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span className={selectedOption ? 'text-current' : 'text-slate-400'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className={`absolute right-4 top-1/2 -translate-y-1/2 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </div>
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-4 py-2 text-slate-400 text-sm">Nenhuma opção disponível</div>
            ) : (
              options.map((option) => (
                <div
                  key={option.value}
                  className={`px-4 py-2 cursor-pointer transition-colors flex items-center justify-between
                    ${value === option.value ? 'bg-purple-600/20 text-purple-300' : 'text-white hover:bg-slate-700'}`}
                  onClick={() => handleSelect(option)}
                  onMouseEnter={(e) => {
                    setHoveredOption(option);
                    setMousePosition({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => setHoveredOption(null)}
                >
                  <span className="font-medium flex-1">{option.label}</span>
                  {value === option.value && <span className="ml-2 text-cyan-300">✓</span>}
                </div>
              ))
            )}
          </div>
        )}
        {/* Tooltip de descrição */}
        {hoveredOption && hoveredOption.descricao && (
          <div 
            className="fixed z-50 p-3 rounded-lg shadow-lg max-w-xs bg-slate-800 border border-slate-600 text-white text-sm pointer-events-none"
            style={{
              left: mousePosition.x + 10,
              top: mousePosition.y - 10,
              transform: 'translateY(-100%)'
            }}
          >
            <div className="font-semibold mb-1">{hoveredOption.label}</div>
            <div className="text-slate-300 text-xs leading-relaxed">
              {hoveredOption.descricao}
            </div>
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-400 font-modern">{error}</p>
      )}
    </div>
  );
};

export default FormSelectDescricao; 