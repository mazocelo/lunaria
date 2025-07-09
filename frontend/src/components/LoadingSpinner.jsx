import React from 'react';

const LoadingSpinner = ({ 
    size = 'medium', 
    text = 'Carregando...', 
    showText = true,
    variant = 'primary' 
}) => {
    const sizeClasses = {
        small: 'w-6 h-6',
        medium: 'w-8 h-8',
        large: 'w-12 h-12',
        xl: 'w-16 h-16'
    };

    const variantClasses = {
        primary: 'border-purple-500',
        secondary: 'border-cyan-500',
        accent: 'border-green-500'
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`${sizeClasses[size]} border-2 border-slate-700 border-t-current rounded-full animate-spin ${variantClasses[variant]}`} />
            {showText && (
                <p className="text-slate-400 font-modern text-sm animate-pulse">
                    {text}
                </p>
            )}
        </div>
    );
};

export default LoadingSpinner; 