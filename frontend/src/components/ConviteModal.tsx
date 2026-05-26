import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useTheme } from '../contexts/theme';

export interface ConviteModalHistoria {
  nome?: string | null;
  maximo_de_participantes?: number | string | null;
}

interface ConviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (email: string) => void;
  historia?: ConviteModalHistoria | null;
  loading?: boolean;
}

/**
 * Modal para convidar jogadores por email para uma historia.
 */
const ConviteModal = ({ isOpen, onClose, onConfirm, historia, loading = false }: ConviteModalProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Limpar campos quando o modal abre/fecha
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setEmailError('');
    }
  }, [isOpen]);

  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, loading]);

  // Validar email
  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  // Lidar com mudanca no input
  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    if (emailError && value) {
      setEmailError('');
    }
  };

  // Lidar com envio do formulario
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setEmailError('Email é obrigatório');
      return;
    }

    if (!validateEmail(email.trim())) {
      setEmailError('Email inválido');
      return;
    }

    onConfirm(email.trim());
  };

  // Lidar com cancelamento
  const handleCancel = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 backdrop-blur-sm transition-opacity duration-300 ${
          isLight ? 'bg-black/20' : 'bg-black/40'
        }`}
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-md mx-4 animate-scale-in ${
        isLight ? 'bg-white' : 'bg-slate-800'
      } rounded-xl shadow-2xl border ${
        isLight ? 'border-slate-200' : 'border-slate-700'
      }`}>
        
        {/* Header */}
        <div className={`p-6 border-b ${
          isLight ? 'border-slate-200' : 'border-slate-700'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-xl font-fantasy font-bold ${
                isLight ? 'text-slate-800' : 'text-white'
              }`}>
                Convidar Jogador
              </h3>
              <p className="text-sm text-slate-400 mt-1 font-modern">
                Envie um convite por email para "{historia?.nome}"
              </p>
            </div>
            
            <button
              onClick={handleCancel}
              disabled={loading}
              className={`p-2 rounded-lg transition-colors ${
                loading 
                  ? 'opacity-50 cursor-not-allowed'
                  : isLight
                    ? 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
                    : 'hover:bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            {/* Campo de email */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isLight ? 'text-slate-700' : 'text-slate-300'
              }`}>
                Email do jogador
              </label>
              
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={loading}
                  placeholder="exemplo@email.com"
                  className={`w-full px-4 py-3 rounded-lg border transition-colors font-modern ${
                    emailError
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                      : isLight
                        ? 'border-slate-300 focus:border-purple-500 focus:ring-purple-500/20 bg-white text-slate-900'
                        : 'border-slate-600 focus:border-purple-400 focus:ring-purple-400/20 bg-slate-700 text-white'
                  } focus:ring-4 focus:outline-none ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                
                {/* Ícone de email */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className={`w-5 h-5 ${
                    isLight ? 'text-slate-400' : 'text-slate-500'
                  }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
              </div>

              {/* Erro do email */}
              {emailError && (
                <p className="text-red-500 text-sm mt-2 font-modern">
                  {emailError}
                </p>
              )}
            </div>

            {/* Informações da história */}
            {historia && (
              <div className={`p-4 rounded-lg ${
                isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-700/50 border border-slate-600'
              }`}>
                <h4 className={`font-semibold text-sm mb-2 ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  Detalhes da História
                </h4>
                <div className="space-y-1 text-sm">
                  <div className={`${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    <span className="font-medium">Nome:</span> {historia.nome}
                  </div>
                  <div className={`${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    <span className="font-medium">Máx. Participantes:</span> {historia.maximo_de_participantes || 'Não definido'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                loading
                  ? 'opacity-50 cursor-not-allowed'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center space-x-2 ${
                loading || !email.trim()
                  ? 'opacity-50 cursor-not-allowed bg-slate-400'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              }`}
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              <span>📧</span>
              <span>{loading ? 'Enviando...' : 'Enviar Convite'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConviteModal;
