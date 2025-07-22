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
    error,
    name,
    min,
    max,
    id,
    autoComplete
}) => {
    const { theme } = useTheme();
    const isLight = theme === 'light';
    
    // ✅ CORRIGIDO: Gerar ID único e seguro
    const inputId = id || htmlFor || (name ? `input-${name}` : `input-${Math.random().toString(36).substr(2, 9)}`);

    // Handler para aceitar apenas números
    const handleKeyDown = (e) => {
        if (type === 'number') {
            // Permite: backspace, delete, tab, escape, enter, setas
            if (["Backspace","Delete","Tab","Escape","Enter","ArrowLeft","ArrowRight",".",","].includes(e.key)) return;
            // Permite Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
            if ((e.ctrlKey || e.metaKey) && ["a","c","v","x"].includes(e.key.toLowerCase())) return;
            // Permite números
            if (!/^[0-9]$/.test(e.key)) {
                e.preventDefault();
            }
        }
    };

    return (
        <div className={`flex flex-col mb-4 ${className}`}>
            {label && (
                <label 
                    htmlFor={inputId}
                    className={`mb-2 text-sm font-semibold font-modern ${isLight ? 'text-slate-200' : 'text-white'} drop-shadow`}
                >
                    {label}
                    {required && <span className="text-red-400 ml-1">*</span>}
                </label>
            )}
            <input
                id={inputId}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                min={min}
                max={max}
                autoComplete={autoComplete}
                className={`w-full px-4 py-2 rounded-lg font-modern border focus:outline-none transition-all
                    ${isLight ? 'bg-white/20 border-slate-400 text-slate-100' : 'bg-[#1e1b4bcc] border-slate-700 text-white'}
                    placeholder:text-slate-400
                    ${error ? 'border-red-500' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={type === 'number' ? {
                    MozAppearance: 'textfield',
                    appearance: 'textfield',
                } : {}}
            />
            {/* Remove setas do input number no Chrome/Edge */}
            <style>{`
                input[type=number]::-webkit-inner-spin-button, 
                input[type=number]::-webkit-outer-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
            `}</style>
            {error && (
                <p className="mt-1 text-xs text-red-400 font-modern">
                    {error}
                </p>
            )}
        </div>
    );
};

export default InputSimples;