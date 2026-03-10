import React, { useState } from 'react';
import { useTheme } from '../../contexts/theme.jsx';
import { HelpCircle } from 'lucide-react';

const InputSimples = ({
    label,
    type = "text",
    value,
    onChange,
    onBlur,
    htmlFor,
    placeholder,
    required = false,
    disabled = false,
    className = "",
    error,
    name,
    min,
    max,
    step,
    id,
    autoComplete,
    tooltip
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
                    className={`mb-2 text-sm font-semibold font-modern flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}
                >
                    {label}
                    {required && <span className="text-red-400 ml-1">*</span>}
                    {tooltip && <TooltipIcon text={tooltip} isLight={isLight} />}
                </label>
            )}
            <input
                id={inputId}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                required={required}
                disabled={disabled}
                min={min}
                max={max}
                step={step}
                autoComplete={autoComplete}
                className={`w-full px-4 py-2 rounded-lg font-modern border focus:outline-none transition-all
                    ${isLight ? 'bg-slate-100 border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-purple-500' : 'bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500'}
                    focus:ring-2 focus:ring-purple-500/20
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

function TooltipIcon({ text, isLight }) {
    const [show, setShow] = useState(false);
    return (
        <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
            <HelpCircle size={13} className="text-purple-400 cursor-help" />
            {show && (
                <span className={`absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg shadow-lg whitespace-pre-line max-w-[220px] border ${
                    isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-800 border-purple-500/30 text-slate-200'
                }`}>
                    {text}
                </span>
            )}
        </span>
    );
}

export default InputSimples;