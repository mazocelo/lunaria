import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import InputSimples from '../../components/form/inputSimples';
import Button from '../../components/form/button';
import LoadingSpinner from '../../components/LoadingSpinner';
import Notification from '../../components/Notification';
import ParticlesBackground from '../../components/ParticlesBackground';
import { ROUTES } from '../../constants/routes.js';
import { Eye, EyeOff } from 'lucide-react';

const LoginView = ({ onSwitchToRegister }) => {
  const { login, authService, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    senha: '',
    lembrarDeMim: false
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirecionar se já autenticado
  useEffect(() => {
    if (isAuthenticated) {
      // Verificar se há URL de redirecionamento salva
      const redirectUrl = localStorage.getItem('redirectAfterLogin');
      if (redirectUrl) {
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectUrl);
      } else {
        navigate(ROUTES.HISTORIAS);
      }
    }
  }, [isAuthenticated, navigate]);

  /**
   * Atualizar dados do formulário
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateField = (name) => {
    setErrors(prev => {
      const next = { ...prev };
      if (name === 'email') {
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          next.email = 'Email inválido';
        } else {
          delete next.email;
        }
      }
      if (name === 'senha') {
        if (formData.senha && formData.senha.length > 0 && formData.senha.length < 6) {
          next.senha = 'Senha deve ter pelo menos 6 caracteres';
        } else {
          delete next.senha;
        }
      }
      return next;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.senha.trim()) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Submeter formulário de login
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Limpar notificação anterior
    setNotification(null);

    const result = await login(formData);
    
    if (result.success) {
      setNotification({
        type: 'success',
        message: `Bem-vindo, ${result.user.nome}! Redirecionando...`
      });
      
      // Redirect rápido após mostrar toast de sucesso
      setTimeout(() => {
        const redirectUrl = localStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          localStorage.removeItem('redirectAfterLogin');
          navigate(redirectUrl);
        } else {
          navigate(ROUTES.HISTORIAS);
        }
      }, 500);
    } else {
      setNotification({
        type: 'error',
        message: result.error
      });
    }
  };

  const [forgotLoading, setForgotLoading] = useState(false);

  /**
   * Lidar com esqueci a senha
   */
  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setForgotEmail('');
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setNotification({ type: 'error', message: 'Informe seu email' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setNotification({ type: 'error', message: 'Email inválido' });
      return;
    }
    setForgotLoading(true);
    try {
      await authService.forgotPassword(forgotEmail);
      setNotification({
        type: 'success',
        message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.'
      });
      setShowForgotPassword(false);
    } catch {
      setNotification({
        type: 'success',
        message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.'
      });
      setShowForgotPassword(false);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <ParticlesBackground />
      
      {/* Background com gradiente espacial */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900/40 to-slate-900"></div>
      
      {/* Estrelas de fundo */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Container principal */}
      <div className="relative z-10 w-full max-w-md">
        {/* Card de login */}
        <div className="glass p-8 rounded-2xl shadow-2xl border border-purple-500/20 backdrop-blur-xl">
          
          {/* Logo e título */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/assets/logo_lunaria.png" 
                alt="Lunaria - The Fable Forge" 
                className="h-20 w-20 object-contain filter drop-shadow-2xl animate-pulse-slow"
              />
            </div>
            <h1 className="text-3xl font-fantasy text-white mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Lunaria - The Fable Forge
            </h1>
            <p className="text-purple-200 text-sm font-modern">
              Entre na sua aventura
            </p>
          </div>

          {/* Formulário de login */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campo Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-purple-200">
                Email
              </label>
              <InputSimples
                id="login-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={() => validateField('email')}
                className="input-rpg w-full bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/50 focus:border-purple-400 focus:ring-purple-400/30"
                placeholder="seu@email.com"
                disabled={loading}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Campo Senha */}
            <div className="space-y-2">
              <label htmlFor="senha" className="text-sm font-medium text-purple-200">
                Senha
              </label>
              <div className="relative [&>div]:relative [&>div>input]:pr-10">
                <InputSimples
                  id="login-senha"
                  name="senha"
                  type={showPassword ? "text" : "password"}
                  value={formData.senha}
                  onChange={handleInputChange}
                  onBlur={() => validateField('senha')}
                  className="input-rpg w-full bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/50 focus:border-purple-400 focus:ring-purple-400/30 mb-0"
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 bottom-2 text-purple-300 hover:text-purple-200 transition-colors focus:outline-none z-10"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              {errors.senha && (
                <p className="text-red-400 text-xs mt-1">{errors.senha}</p>
              )}
            </div>

            {/* Checkbox Lembrar de mim e Link Esqueci a senha */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="lembrarDeMim"
                  name="lembrarDeMim"
                  type="checkbox"
                  checked={formData.lembrarDeMim}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    lembrarDeMim: e.target.checked
                  }))}
                  className="w-4 h-4 text-purple-600 bg-slate-800/50 border-purple-500/30 rounded focus:ring-purple-400 focus:ring-2"
                />
                <label htmlFor="lembrarDeMim" className="ml-2 text-sm text-purple-200">
                  Lembrar de mim
                </label>
              </div>
              
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors font-modern"
              >
                Esqueceu a senha?
              </button>
            </div>

            {/* Botão de login */}
            <Button
              type="submit"
              disabled={loading}
              className={`w-full btn-rpg h-12 text-base font-semibold transition-all duration-300 transform shadow-lg ${
                loading 
                  ? 'bg-gradient-to-r from-purple-600/70 to-cyan-600/70 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 hover:scale-105 hover:shadow-purple-500/25'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Entrando na aventura...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>Entrar na Aventura</span>
                  <span className="text-xl">🎮</span>
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-purple-500/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-slate-800/50 px-4 text-purple-300 font-modern">
                Novo na plataforma?
              </span>
            </div>
          </div>

          {/* Link para registro */}
          <div className="text-center">
            <button
              type="button"
              className="text-purple-400 hover:text-purple-300 transition-colors font-modern text-sm hover:underline"
              onClick={onSwitchToRegister}
            >
              Criar nova conta →
            </button>
          </div>

          {/* Efeito de brilho no card */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/10 to-cyan-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-purple-300/60 text-xs font-modern">
            © 2024 Lunaria - The Fable Forge. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Notificações */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
          autoClose={notification.type === 'success' ? false : 5000}
        />
      )}

      {/* Modal Esqueci a Senha */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm glass p-6 rounded-2xl border border-purple-500/20">
            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="absolute top-3 right-3 text-purple-300 hover:text-white transition-colors text-xl leading-none"
            >
              &times;
            </button>

            <h2 className="text-xl font-fantasy text-white mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Recuperar Senha
            </h2>
            <p className="text-purple-200/70 text-sm mb-4 font-modern">
              Informe seu email e enviaremos instruções para redefinir sua senha.
            </p>

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <InputSimples
                id="forgot-email"
                name="forgotEmail"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="input-rpg w-full bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/50 focus:border-purple-400 focus:ring-purple-400/30"
                placeholder="seu@email.com"
                disabled={forgotLoading}
                autoComplete="email"
              />

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition-colors"
                  disabled={forgotLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold transition-all"
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Efeitos visuais adicionais */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/10 rounded-full filter blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-cyan-500/10 rounded-full filter blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-10 w-20 h-20 bg-purple-400/10 rounded-full filter blur-lg animate-float"></div>
    </div>
  );
};

export default LoginView; 