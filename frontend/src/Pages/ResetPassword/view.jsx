import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import InputSimples from '../../components/form/inputSimples';
import Button from '../../components/form/button';
import LoadingSpinner from '../../components/LoadingSpinner';
import Notification from '../../components/Notification';
import ParticlesBackground from '../../components/ParticlesBackground';
import { Eye, EyeOff } from 'lucide-react';

const ResetPasswordView = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword } = useAuth();

  const [formData, setFormData] = useState({ senha: '', confirmarSenha: '' });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateField = (name) => {
    setErrors(prev => {
      const next = { ...prev };
      if (name === 'senha') {
        if (formData.senha && formData.senha.length < 6) {
          next.senha = 'Senha deve ter pelo menos 6 caracteres';
        } else {
          delete next.senha;
        }
      }
      if (name === 'confirmarSenha') {
        if (formData.confirmarSenha && formData.confirmarSenha !== formData.senha) {
          next.confirmarSenha = 'As senhas não coincidem';
        } else {
          delete next.confirmarSenha;
        }
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.senha.trim()) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (!formData.confirmarSenha.trim()) {
      newErrors.confirmarSenha = 'Confirmação é obrigatória';
    } else if (formData.confirmarSenha !== formData.senha) {
      newErrors.confirmarSenha = 'As senhas não coincidem';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitLoading(true);
    try {
      const result = await resetPassword({ token, senha: formData.senha });
      if (result.success) {
        setSuccess(true);
        setNotification({ type: 'success', message: 'Senha redefinida com sucesso!' });
      } else {
        setNotification({ type: 'error', message: result.error || 'Erro ao redefinir senha' });
      }
    } catch {
      setNotification({ type: 'error', message: 'Erro ao redefinir senha. Tente novamente.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Token ausente
  if (!token) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <ParticlesBackground />
        <div className="relative z-10 w-full max-w-md">
          <div className="glass p-8 rounded-2xl shadow-2xl border border-purple-500/20 backdrop-blur-xl text-center">
            <h1 className="text-2xl font-fantasy text-white mb-4 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Link Invalido
            </h1>
            <p className="text-purple-200/70 mb-6 font-modern">
              O link de redefinicao de senha e invalido ou expirou. Solicite um novo link na tela de login.
            </p>
            <a
              href="/"
              className="inline-block bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold px-6 py-3 rounded-lg transition-all"
            >
              Voltar ao Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <ParticlesBackground />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/40 to-slate-900"></div>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass p-8 rounded-2xl shadow-2xl border border-purple-500/20 backdrop-blur-xl">
          {/* Logo e titulo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img
                src="/assets/logo_lunaria.png"
                alt="Lunaria - The Fable Forge"
                className="h-20 w-20 object-contain filter drop-shadow-2xl"
              />
            </div>
            <h1 className="text-3xl font-fantasy text-white mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Redefinir Senha
            </h1>
            <p className="text-purple-200 text-sm font-modern">
              Crie uma nova senha para sua conta
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <div className="text-5xl mb-4">&#10003;</div>
              <p className="text-purple-200 font-modern">
                Sua senha foi redefinida com sucesso!
              </p>
              <a
                href="/"
                className="inline-block bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold px-6 py-3 rounded-lg transition-all mt-4"
              >
                Ir para o Login
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nova senha */}
              <div className="space-y-2">
                <label htmlFor="senha" className="text-sm font-medium text-purple-200">
                  Nova Senha
                </label>
                <div className="relative [&>div]:relative [&>div>input]:pr-10">
                  <InputSimples
                    id="reset-senha"
                    name="senha"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.senha}
                    onChange={handleChange}
                    onBlur={() => validateField('senha')}
                    className="input-rpg w-full bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/50 focus:border-purple-400 focus:ring-purple-400/30 mb-0"
                    placeholder="Minimo 6 caracteres"
                    disabled={submitLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 bottom-2 text-purple-300 hover:text-purple-200 transition-colors focus:outline-none z-10"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.senha && (
                  <p className="text-red-400 text-xs mt-1">{errors.senha}</p>
                )}
              </div>

              {/* Confirmar senha */}
              <div className="space-y-2">
                <label htmlFor="confirmarSenha" className="text-sm font-medium text-purple-200">
                  Confirmar Senha
                </label>
                <div className="relative [&>div]:relative [&>div>input]:pr-10">
                  <InputSimples
                    id="reset-confirmar"
                    name="confirmarSenha"
                    type={showConfirm ? 'text' : 'password'}
                    value={formData.confirmarSenha}
                    onChange={handleChange}
                    onBlur={() => validateField('confirmarSenha')}
                    className="input-rpg w-full bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/50 focus:border-purple-400 focus:ring-purple-400/30 mb-0"
                    placeholder="Repita a nova senha"
                    disabled={submitLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 bottom-2 text-purple-300 hover:text-purple-200 transition-colors focus:outline-none z-10"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.confirmarSenha && (
                  <p className="text-red-400 text-xs mt-1">{errors.confirmarSenha}</p>
                )}
              </div>

              {/* Botao submit */}
              <Button
                type="submit"
                disabled={submitLoading}
                className={`w-full btn-rpg h-12 text-base font-semibold transition-all duration-300 transform shadow-lg ${
                  submitLoading
                    ? 'bg-gradient-to-r from-purple-600/70 to-cyan-600/70 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 hover:scale-105 hover:shadow-purple-500/25'
                }`}
              >
                {submitLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>Redefinindo...</span>
                  </div>
                ) : (
                  'Redefinir Senha'
                )}
              </Button>
            </form>
          )}

          <div className="text-center mt-6">
            <a
              href="/"
              className="text-purple-400 hover:text-purple-300 transition-colors font-modern text-sm hover:underline"
            >
              Voltar ao Login
            </a>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-purple-300/60 text-xs font-modern">
            &copy; 2024 Lunaria - The Fable Forge. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
          autoClose={5000}
        />
      )}

      <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/10 rounded-full filter blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-cyan-500/10 rounded-full filter blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
    </div>
  );
};

export default ResetPasswordView;
