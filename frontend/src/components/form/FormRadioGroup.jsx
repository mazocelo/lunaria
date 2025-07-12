import React from 'react';
import { useTheme } from '../../contexts/theme.jsx';

const FormRadioGroup = ({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  className = '',
  error
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      {label && (
        <span className={`mb-2 text-sm font-semibold font-modern ${isLight ? 'text-slate-700' : 'text-white'}`}>{label}</span>
      )}
      <div className="flex gap-4 mb-2">
        {options.map((opt) => (
          <label key={opt.value ?? opt} className={`flex items-center gap-1 font-modern ${isLight ? 'text-slate-700' : 'text-white'}`}>
            <input
              type="radio"
              name={name}
              value={opt.value ?? opt}
              checked={value === (opt.value ?? opt)}
              onChange={onChange}
              required={required}
              className="mr-2 accent-purple-500"
            />
            {opt.label ?? opt}
          </label>
        ))}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-400 font-modern">{error}</p>
      )}
    </div>
  );
};

export default FormRadioGroup; 