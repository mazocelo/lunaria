import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../contexts/theme';
import { Search, X } from 'lucide-react';

const SearchBar = ({ placeholder = 'Buscar...', value = '', onChange, className = '' }) => {
  const { theme } = useTheme();
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const isDark = theme === 'dark';

  return (
    <div className={`relative ${className}`}>
      <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
        isDark ? 'text-purple-400/60' : 'text-slate-400'
      }`} />
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full pl-9 pr-8 py-2.5 rounded-xl border text-sm transition-colors duration-200 focus:outline-none focus:ring-2
          ${isDark
            ? 'bg-slate-800/60 border-purple-500/30 text-white placeholder-purple-300/40 focus:border-purple-400 focus:ring-purple-400/20'
            : 'bg-white/80 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500 focus:ring-purple-500/20'
          }`}
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 transition-colors cursor-pointer
            ${isDark ? 'text-purple-300 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}
          aria-label="Limpar busca"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
