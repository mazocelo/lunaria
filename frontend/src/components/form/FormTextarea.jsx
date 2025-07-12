import React from 'react';
import { useTheme } from '../../contexts/theme.jsx';

const FormTextarea = ({
  label,
  value,
  onChange,
  name,
  placeholder = '',
  required = false,
  disabled = false,
  className = '',
  error,
  rows = 3
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const textareaId = `textarea-${name}`;

  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className={`mb-2 text-sm font-semibold font-modern ${isLight ? 'text-slate-700' : 'text-white'}`}
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        rows={rows}
        placeholder={placeholder}
        className={`w-full px-4 py-2 rounded-lg font-modern border focus:outline-none transition-all
          ${isLight ? 'bg-white/90 border-slate-300 text-slate-800' : 'bg-[#1e1b4bcc] border-slate-700 text-white'}
          ${error ? 'border-red-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {error && (
        <p className="mt-1 text-xs text-red-400 font-modern">{error}</p>
      )}
    </div>
  );
};

export default FormTextarea; 