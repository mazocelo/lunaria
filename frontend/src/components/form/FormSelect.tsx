import type { ChangeEventHandler, ReactNode } from 'react';
import { useTheme } from '../../contexts/theme';

export type FormSelectOption =
  | string
  | number
  | { value: string | number; label: ReactNode };

export interface FormSelectProps {
  label?: ReactNode;
  value?: string | number | readonly string[];
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  name?: string;
  options?: FormSelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string | null;
  multiple?: boolean;
}

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
  multiple = false,
}: FormSelectProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const selectId = `select-${name}`;

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
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        multiple={multiple}
        className={`w-full px-4 py-2 rounded-lg font-modern border focus:outline-none transition-all
          ${isLight ? 'bg-white/20 border-slate-400 text-slate-100' : 'bg-[#1e1b4bcc] border-slate-700 text-white'}
          placeholder:text-slate-400
          ${error ? 'border-red-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${multiple ? 'min-h-24' : ''}`}
        style={{
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          appearance: 'none',
        }}
      >
        <option value="" disabled={!multiple}>{placeholder}</option>
        {options.map((opt) => {
          const isObj = typeof opt === 'object' && opt !== null;
          const optionValue = isObj ? opt.value : opt;
          const optionLabel = isObj ? opt.label : opt;
          return (
            <option key={String(optionValue)} value={String(optionValue)}>
              {optionLabel}
            </option>
          );
        })}
      </select>
      {/* Remove setas do select no Chrome/Edge */}
      <style>{`
        select::-ms-expand { display: none; }
      `}</style>
      {error && (
        <p className="mt-1 text-xs text-red-400 font-modern">{error}</p>
      )}
    </div>
  );
};

export default FormSelect; 