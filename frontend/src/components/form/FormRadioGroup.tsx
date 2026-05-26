import type { ChangeEventHandler, ReactNode } from 'react';
import { useTheme } from '../../contexts/theme';

export type FormRadioOption =
  | string
  | number
  | { value: string | number; label: ReactNode };

export interface FormRadioGroupProps {
  label?: ReactNode;
  name?: string;
  value?: string | number;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  options?: FormRadioOption[];
  required?: boolean;
  className?: string;
  error?: string | null;
}

const FormRadioGroup = ({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  className = '',
  error,
}: FormRadioGroupProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      {label && (
        <span className={`mb-2 text-sm font-semibold font-modern ${isLight ? 'text-slate-700' : 'text-white'}`}>{label}</span>
      )}
      <div className="flex gap-4 mb-2">
        {options.map((opt) => {
          const isObj = typeof opt === 'object' && opt !== null;
          const optValue = isObj ? opt.value : opt;
          const optLabel = isObj ? opt.label : opt;
          return (
            <label key={String(optValue)} className={`flex items-center gap-1 font-modern ${isLight ? 'text-slate-700' : 'text-white'}`}>
              <input
                type="radio"
                name={name}
                value={optValue}
                checked={value === optValue}
                onChange={onChange}
                required={required}
                className="mr-2 accent-purple-500"
              />
              {optLabel}
            </label>
          );
        })}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-400 font-modern">{error}</p>
      )}
    </div>
  );
};

export default FormRadioGroup;
