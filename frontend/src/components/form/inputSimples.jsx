import React from 'react';
import { useTheme } from '../../contexts/theme.jsx';

const InputSimples = ({ 
    label, 
    type = "text", 
    value, 
    onChange, 
    htmlFor,
    placeholder,
    required = false,
    disabled = false,
    className = "",
    error
}) => {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    const inputId = htmlFor || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
        <div className={`flex flex-col mb-4 ${className}`}>
            {label && (
                <label 
                    htmlFor={inputId}
                    className={`mb-2 text-sm font-semibold font-modern ${
                        isLight ? 'text-slate-700' : 'text-white'
                    }`}
                >
                    {label}
                    {required && <span className="text-red-400 ml-1">*</span>}
                </label>
            )}
            
            <input
                id={inputId}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                className={`${isLight ? 'input-rpg-light' : 'input-rpg'} ${error ? 'border-red-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            
            {error && (
                <p className="mt-1 text-xs text-red-400 font-modern">
                    {error}
                </p>
            )}
        </div>
    );
};

export default InputSimples;