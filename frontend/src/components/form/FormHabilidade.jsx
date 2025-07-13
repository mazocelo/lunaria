import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../contexts/theme.jsx';

const FormHabilidade = ({
  label,
  value = [],
  onChange,
  name,
  options = [],
  placeholder = 'Selecione as habilidades',
  required = false,
  disabled = false,
  className = '',
  error,
  pontosRestantes = 0,
  habilidadeError = null
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const selectId = `habilidade-${name}`;
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

  // Soma custo das habilidades selecionadas
  const custoTotal = value.reduce((acc, id) => {
    const hab = options.find(h => h.value === id);
    return acc + (hab ? Number(hab.custo) || 0 : 0);
  }, 0);

  // Handler de seleção múltipla
  const handleSelect = (option) => {
    if (disabled) return;
    const isSelected = value.includes(option.value);
    let newValue;
    if (isSelected) {
      newValue = value.filter(id => id !== option.value);
    } else {
      // Checar se há pontos suficientes
      const custoNova = Number(option.custo) || 0;
      if (custoTotal + custoNova > pontosRestantes) {
        // Notificação visual será exibida pelo erro vindo do ViewModel
        return;
      }
      newValue = [...value, option.value];
    }
    onChange({ target: { name, value: newValue } });
  };

  // Handler para remover habilidade pelo chip
  const handleRemoveChip = (id) => {
    if (disabled) return;
    const newValue = value.filter(habId => habId !== id);
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
        <span className="text-xs text-slate-400 font-modern">Pontos restantes para habilidades: <span className="font-bold text-cyan-400">{pontosRestantes - custoTotal}</span></span>
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
            {value.length === 0 ? (
              <span className="text-slate-400">{placeholder}</span>
            ) : (
              value.map(id => {
                const hab = options.find(h => h.value === id);
                return hab ? (
                  <span key={id} className="bg-cyan-700/80 text-white rounded px-2 py-0.5 text-xs font-semibold flex items-center gap-1">
                    {hab.label} {hab.custo ? <span className="text-cyan-300">({hab.custo} pts)</span> : null}
                    <button
                      type="button"
                      className="ml-1 text-white/70 hover:text-red-400 focus:outline-none text-lg leading-none w-6 h-6 flex items-center justify-center rounded-full transition-colors duration-150"
                      onClick={e => { e.stopPropagation(); handleRemoveChip(id); }}
                      tabIndex={-1}
                      aria-label="Remover habilidade"
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
              <div className="px-4 py-2 text-slate-400 text-sm">Nenhuma habilidade disponível</div>
            ) : (
              options.map((option) => {
                const isSelected = value.includes(option.value);
                const custoNova = Number(option.custo) || 0;
                const semPontos = !isSelected && (custoTotal + custoNova > pontosRestantes);
                return (
                  <div
                    key={option.value}
                    className={`px-4 py-2 cursor-pointer transition-colors flex items-center justify-between
                      ${isSelected ? 'bg-purple-600/20 text-purple-300' : semPontos ? 'bg-slate-700/40 text-slate-500 cursor-not-allowed' : 'text-white hover:bg-slate-700'}`}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={(e) => {
                      setHoveredOption(option);
                      setMousePosition({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => setHoveredOption(null)}
                  >
                    <span className="font-medium flex-1">{option.label}</span>
                    {option.custo && (
                      <span className="text-cyan-400 text-sm ml-2">{option.custo} pts</span>
                    )}
                    {isSelected && <span className="ml-2 text-cyan-300">✓</span>}
                  </div>
                );
              })
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
            {hoveredOption.custo && (
              <div className="text-cyan-400 text-xs mb-2">
                Custo: {hoveredOption.custo} pontos
              </div>
            )}
            <div className="text-slate-300 text-xs leading-relaxed">
              {hoveredOption.descricao}
            </div>
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></div>
          </div>
        )}
      </div>
      {habilidadeError && (
        <div className="mt-2 text-xs text-red-400 font-modern animate-pulse">{habilidadeError}</div>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-400 font-modern">{error}</p>
      )}
    </div>
  );
};

export default FormHabilidade; 