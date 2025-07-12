import React from 'react';
import { useTheme } from '../../contexts/theme.jsx';

const FormSelect = ({
  label,
  value,
  onChange,
  name,
  options = [],
  placeholder = 'Selecione uma opção',
  required = false,
  disabled = false,
  className = '',
  error,
  multiple = false
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const selectId = `select-${name}`;

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
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        multiple={multiple}
        className={`w-full px-4 py-2 rounded-lg font-modern border focus:outline-none transition-all
          ${isLight ? 'bg-white/90 border-slate-300 text-slate-800' : 'bg-[#1e1b4bcc] border-slate-700 text-white'}
          ${error ? 'border-red-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${multiple ? 'min-h-24' : ''}`}
      >
        <option value="" disabled={!multiple}>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value ?? opt} value={opt.value ?? opt}>
            {opt.label ?? opt}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-xs text-red-400 font-modern">{error}</p>
      )}
    </div>
  );
};

export default FormSelect; 