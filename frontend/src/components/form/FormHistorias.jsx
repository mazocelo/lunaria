import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/theme.jsx';

const FormHistorias = ({
  label,
  value = [],
  onChange,
  name,
  options = [],
  placeholder = 'Selecione as histórias',
  required = false,
  disabled = false,
  className = '',
  error
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const selectId = `historias-${name}`;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Garantir que value seja sempre um array
  const safeValue = Array.isArray(value) ? value : [];

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

  // Handler de seleção múltipla
  const handleSelect = (option) => {
    if (disabled) return;
    const isSelected = safeValue.includes(String(option.value));
    let newValue;
    if (isSelected) {
      newValue = safeValue.filter(id => String(id) !== String(option.value));
    } else {
      newValue = [...safeValue, String(option.value)];
    }
    onChange({ target: { name, value: newValue } });
  };

  // Handler para remover história pelo chip
  const handleRemoveChip = (id) => {
    if (disabled) return;
    const newValue = safeValue.filter(historiaId => historiaId !== id);
    onChange({ target: { name, value: newValue } });
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
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-slate-400 font-modern">
          {safeValue.length} história(s) selecionada(s)
        </span>
      </div>
      <div className="relative" ref={dropdownRef}>
        {/* Select customizado */}
        <div
          className={`w-full px-4 py-2 rounded-lg font-modern border focus:outline-none transition-all cursor-pointer
            ${isLight ? 'bg-white/90 border-slate-300 text-slate-800' : 'bg-[#1e1b4bcc] border-slate-700 text-white'}
            ${error ? 'border-red-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${isOpen ? 'ring-2 ring-purple-500/50' : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <div className="flex flex-wrap gap-2 min-h-[24px]">
            {safeValue.length === 0 ? (
              <span className="text-slate-400">{placeholder}</span>
            ) : (
              safeValue.map(id => {
                const historia = options.find(h => String(h.value) === String(id));
                return historia ? (
                  <span key={id} className="rounded px-3 py-1 text-xs font-semibold flex items-center gap-1 bg-purple-700/80 text-white">
                    {historia.label}
                    <button
                      type="button"
                      className="ml-1 text-white/70 hover:text-red-400 focus:outline-none text-lg leading-none w-6 h-6 flex items-center justify-center rounded-full transition-colors duration-150"
                      onClick={e => { e.stopPropagation(); handleRemoveChip(id); }}
                      tabIndex={-1}
                      aria-label="Remover história"
                    >
                      ×
                    </button>
                  </span>
                ) : null;
              })
            )}
          </div>
          <span className={`absolute right-4 top-1/2 -translate-y-1/2 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
        </div>
        {/* Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-4 py-2 text-slate-400 text-sm">Nenhuma história disponível</div>
            ) : (
              options.map((option) => {
                const isSelected = safeValue.includes(String(option.value));
                return (
                  <div
                    key={option.value}
                    className={`px-4 py-2 cursor-pointer transition-colors flex items-center justify-between
                      ${isSelected ? 'bg-purple-600/20 text-purple-300' : 'text-white hover:bg-slate-700'}`}
                    onClick={() => handleSelect(option)}
                  >
                    <span className="font-medium flex-1">{option.label}</span>
                    {isSelected && <span className="text-purple-300">✓</span>}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-400 font-modern">{error}</p>
      )}
    </div>
  );
};

export default FormHistorias;

