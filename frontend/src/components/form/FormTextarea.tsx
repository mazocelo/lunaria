import type { ChangeEventHandler, ReactNode } from 'react';
import { useTheme } from '../../contexts/theme';

export interface FormTextareaProps {
  label?: ReactNode;
  value?: string;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
  name?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  error?: string | null;
  rows?: number;
}

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
  rows = 3,
}: FormTextareaProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const textareaId = `textarea-${name}`;

  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className={`mb-2 text-sm font-semibold font-modern ${isLight ? 'text-slate-200' : 'text-white'} drop-shadow`}
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
          ${isLight ? 'bg-white/20 border-slate-400 text-slate-100' : 'bg-[#1e1b4bcc] border-slate-700 text-white'}
          placeholder:text-slate-400
          ${error ? 'border-red-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      />
      {error && (
        <p className="mt-1 text-xs text-red-400 font-modern">{error}</p>
      )}
    </div>
  );
};

export default FormTextarea; 