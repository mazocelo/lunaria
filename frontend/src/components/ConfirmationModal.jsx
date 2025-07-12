import React from 'react';
import { useTheme } from '../contexts/theme.jsx';

const ConfirmationModal = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Confirmar Ação", 
    message = "Tem certeza que deseja realizar esta ação?",
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    type = "danger",
    loading = false
}) => {
    const { theme } = useTheme();
    const isLight = theme === 'light';

    if (!isOpen) return null;

    const typeClasses = {
        danger: {
            icon: '⚠️',
            button: isLight 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-red-600 hover:bg-red-700 text-white',
            border: isLight 
                ? 'border-red-500/20' 
                : 'border-red-500/30'
        },
        warning: {
            icon: '⚠️',
            button: isLight 
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                : 'bg-yellow-600 hover:bg-yellow-700 text-white',
            border: isLight 
                ? 'border-yellow-500/20' 
                : 'border-yellow-500/30'
        },
        info: {
            icon: 'ℹ️',
            button: isLight 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white',
            border: isLight 
                ? 'border-blue-500/20' 
                : 'border-blue-500/30'
        }
    };

    const currentType = typeClasses[type];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className={`relative max-w-md w-full ${isLight ? 'glass-light' : 'glass'} rounded-lg border ${currentType.border} animate-scale-in`}>
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start space-x-3 mb-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isLight ? 'bg-slate-100' : 'bg-slate-700'
                        }`}>
                            <span className="text-lg">{currentType.icon}</span>
                        </div>
                        <div className="flex-1">
                            <h3 className={`text-lg font-semibold font-fantasy mb-1 ${
                                isLight ? 'text-slate-800' : 'text-white'
                            }`}>
                                {title}
                            </h3>
                            <p className={`text-sm font-modern ${
                                isLight ? 'text-slate-600' : 'text-slate-300'
                            }`}>
                                {message}
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className={`flex-1 px-4 py-2 rounded-lg font-modern transition-all duration-200 ${
                                isLight 
                                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' 
                                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={`flex-1 px-4 py-2 rounded-lg font-modern transition-all duration-200 ${currentType.button} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Processando...</span>
                                </div>
                            ) : (
                                confirmText
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal; 