import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import InputSimples from '../../components/form/inputSimples';
import Button from '../../components/form/button';
import LoadingSpinner from '../../components/LoadingSpinner';
import Notification from '../../components/Notification';
import ParticlesBackground from '../../components/ParticlesBackground';
import { Eye, EyeOff } from 'lucide-react';

const RegisterView = ({ onSwitchToLogin }) => {
  const { register, loading, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    confirmSenha: ''
  });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Redireccionar se já autenticado
  useEffect(() => {
    if (isAuthenticated) {
      // Usuário já autenticado
    }
  }, [isAuthenticated]);

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

  /**
   * Validar formulário
   */
  const validateForm = () => {
    const newErrors = {};

    // Validação do nome
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    } else if (formData.nome.trim().length < 2) {
      newErrors.nome = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Validação do email
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    // Validação da senha
    if (!formData.senha.trim()) {
      newErrors.senha = 'Senha é obrigatória';
    } else if (formData.senha.length < 6) {
      newErrors.senha = 'Senha deve ter pelo menos 6 caracteres';
    }

    // Validação da confirmação de senha
    if (!formData.confirmSenha.trim()) {
      newErrors.confirmSenha = 'Confirmação de senha é obrigatória';
    } else if (formData.senha !== formData.confirmSenha) {
      newErrors.confirmSenha = 'Senhas não conferem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Submeter formulário de registro
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Remover confirmSenha dos dados enviados
    const { confirmSenha, ...registerData } = formData;
    
    try {
      // Se o contexto não tiver função register, simular por enquanto
      const result = register 
        ? await register(registerData)
        : { success: false, error: 'Funcionalidade de registro em desenvolvimento' };
      
      if (result.success) {
        setNotification({
          type: 'success',
          message: 'Conta criada com sucesso!'
        });
        
        // Limpar formulário após sucesso
        setFormData({
          nome: '',
          email: '',
          senha: '',
          confirmSenha: ''
        });

        // Redirecionar para login após 2 segundos se não foi autenticado automaticamente
        if (!result.user) {
          setTimeout(() => {
            onSwitchToLogin();
          }, 2000);
        }
      } else {
        setNotification({
          type: 'error',
          message: result.error || 'Erro ao criar conta'
        });
      }
    } catch (error) {
      setNotification({
        type: 'error',
        message: 'Erro inesperado ao criar conta'
      });
    }
  };

  /**
   * Navegar para login
   */
  const handleGoToLogin = () => {
    onSwitchToLogin();
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
        {/* Card de registro */}
        <div className="glass p-8 rounded-2xl shadow-2xl border border-purple-500/20 backdrop-blur-xl">
          
          {/* Logo e título */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/assets/logo_lunaria.png" 
                alt="Lunaria Plataforma" 
                className="h-20 w-20 object-contain filter drop-shadow-2xl animate-pulse-slow"
              />
            </div>
            <h1 className="text-3xl font-fantasy text-white mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Lunaria
            </h1>
            <p className="text-purple-200 text-sm font-modern">
              Comece sua jornada épica
            </p>
          </div>

          {/* Formulário de registro */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Nome */}
            <div className="space-y-2">
              <label htmlFor="nome" className="text-sm font-medium text-purple-200">
                Nome
              </label>
              <InputSimples
                id="nome"
                name="nome"
                type="text"
                value={formData.nome}
                onChange={handleInputChange}
                className="input-rpg w-full bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/50 focus:border-purple-400 focus:ring-purple-400/30"
                placeholder="Seu nome completo"
                disabled={loading}
              />
              {errors.nome && (
                <p className="text-red-400 text-xs mt-1">{errors.nome}</p>
              )}
            </div>

            {/* Campo Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-purple-200">
                Email
              </label>
              <InputSimples
                id="register-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
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
                  id="register-senha"
                  name="senha"
                  type={showPassword ? "text" : "password"}
                  value={formData.senha}
                  onChange={handleInputChange}
                  className="input-rpg w-full bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/50 focus:border-purple-400 focus:ring-purple-400/30 mb-0"
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="new-password"
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

            {/* Campo Confirmação de Senha */}
            <div className="space-y-2">
              <label htmlFor="confirmSenha" className="text-sm font-medium text-purple-200">
                Confirmar Senha
              </label>
              <div className="relative [&>div]:relative [&>div>input]:pr-10">
                <InputSimples
                  id="register-confirm-senha"
                  name="confirmSenha"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmSenha}
                  onChange={handleInputChange}
                  className="input-rpg w-full bg-slate-800/50 border-purple-500/30 text-white placeholder-purple-300/50 focus:border-purple-400 focus:ring-purple-400/30 mb-0"
                  placeholder="••••••••"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 bottom-2 text-purple-300 hover:text-purple-200 transition-colors focus:outline-none z-10"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              {errors.confirmSenha && (
                <p className="text-red-400 text-xs mt-1">{errors.confirmSenha}</p>
              )}
            </div>

            {/* Botão de registro */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full btn-rpg h-12 text-base font-semibold bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25 mt-6"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Criando conta...</span>
                </div>
              ) : (
                'Criar Conta Épica'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-purple-500/30"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-slate-800/50 px-4 text-purple-300 font-modern">
                Já tem uma conta?
              </span>
            </div>
          </div>

          {/* Link para login */}
          <div className="text-center">
            <button
              type="button"
              className="text-purple-400 hover:text-purple-300 transition-colors font-modern text-sm hover:underline"
              onClick={handleGoToLogin}
            >
              ← Voltar para login
            </button>
          </div>

          {/* Efeito de brilho no card */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-purple-300/60 text-xs font-modern">
            © 2024 Lunaria Plataforma. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Notificações */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}

      {/* Efeitos visuais adicionais */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-cyan-500/10 rounded-full filter blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-40 h-40 bg-purple-500/10 rounded-full filter blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 right-10 w-20 h-20 bg-cyan-400/10 rounded-full filter blur-lg animate-float"></div>
    </div>
  );
};

export default RegisterView; 