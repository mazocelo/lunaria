import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/theme.jsx';
import { useViewModel } from '../../shared/hooks/useViewModel';
import { perfilViewModel } from './viewmodel';
import InputSimples from '../../components/form/inputSimples';
import Button from '../../components/form/button';

const PerfilView = () => {
  const vm = useViewModel(perfilViewModel);
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    vm.initFromUser(user);
    if (user?.id) {
      vm.loadEstatisticas(user.id);
    }
    vm.clearError();
    vm.clearSuccess();
  }, []);

  const handleSalvarPerfil = async (e) => {
    e.preventDefault();
    await vm.salvarPerfil(user.id, (updatedData) => {
      updateUser({ ...user, ...updatedData });
    });
  };

  const handleAlterarSenha = async (e) => {
    e.preventDefault();
    await vm.alterarSenha(user.id);
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-3xl">👤</span>
        </div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
          Meu Perfil
        </h1>
        <p className="text-slate-400 font-modern">
          Gerencie suas informações e preferências
        </p>
      </div>

      {/* Messages */}
      {vm.error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-sm">!</span>
            </div>
            <p className="text-red-300 text-sm font-modern">{vm.error}</p>
          </div>
        </div>
      )}
      {vm.successMessage && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-sm">✓</span>
            </div>
            <p className="text-green-300 text-sm font-modern">{vm.successMessage}</p>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Section: Estatísticas */}
        {vm.estatisticas && (
          <div className="card-rpg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 gradient-accent rounded-lg flex items-center justify-center">
                <span className="text-sm">📊</span>
              </div>
              <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                Estatísticas
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatItem label="Histórias" value={vm.estatisticas.totalHistorias ?? 0} icon="📚" isLight={isLight} />
              <StatItem label="Personagens" value={vm.estatisticas.totalPersonagens ?? 0} icon="⚔️" isLight={isLight} />
              <StatItem label="Sessões" value={vm.estatisticas.totalSessoes ?? 0} icon="🎲" isLight={isLight} />
              <StatItem label="Mensagens" value={vm.estatisticas.totalMensagens ?? 0} icon="💬" isLight={isLight} />
            </div>
          </div>
        )}

        {/* Section: Informações Pessoais */}
        <form onSubmit={handleSalvarPerfil} className="card-rpg space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-sm">✏️</span>
            </div>
            <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Informações Pessoais
            </h2>
          </div>

          <InputSimples
            label="Nome"
            name="nome"
            value={vm.nome}
            onChange={e => vm.setNome(e.target.value)}
            placeholder="Seu nome"
            required
          />

          <InputSimples
            label="Email"
            name="email"
            type="email"
            value={vm.email}
            onChange={e => vm.setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
          />

          <div className="flex justify-end">
            <Button
              variant="primary"
              type="submit"
              disabled={vm.savingProfile}
            >
              {vm.savingProfile ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando...</span>
                </div>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>

        {/* Section: Alterar Senha */}
        <form onSubmit={handleAlterarSenha} className="card-rpg space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 gradient-secondary rounded-lg flex items-center justify-center">
              <span className="text-sm">🔒</span>
            </div>
            <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Alterar Senha
            </h2>
          </div>

          <InputSimples
            label="Senha Atual"
            name="senhaAtual"
            type="password"
            value={vm.senhaAtual}
            onChange={e => vm.setSenhaAtual(e.target.value)}
            placeholder="Digite sua senha atual"
            autoComplete="current-password"
          />

          <InputSimples
            label="Nova Senha"
            name="novaSenha"
            type="password"
            value={vm.novaSenha}
            onChange={e => vm.setNovaSenha(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
          />

          <InputSimples
            label="Confirmar Nova Senha"
            name="confirmarSenha"
            type="password"
            value={vm.confirmarSenha}
            onChange={e => vm.setConfirmarSenha(e.target.value)}
            placeholder="Confirme a nova senha"
            autoComplete="new-password"
          />

          <div className="flex justify-end">
            <Button
              variant="secondary"
              type="submit"
              disabled={vm.savingPassword}
            >
              {vm.savingPassword ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Alterando...</span>
                </div>
              ) : (
                'Alterar Senha'
              )}
            </Button>
          </div>
        </form>

        {/* Section: Tema */}
        <div className="card-rpg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 gradient-accent rounded-lg flex items-center justify-center">
              <span className="text-sm">🎨</span>
            </div>
            <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Aparência
            </h2>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className={`font-modern font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>
                Tema {isLight ? 'Claro' : 'Escuro'}
              </p>
              <p className="text-sm text-slate-400 font-modern">
                Alterne entre o tema claro e escuro
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 cursor-pointer ${
                isLight ? 'bg-slate-300' : 'bg-purple-600'
              }`}
            >
              <div className={`absolute top-0.5 w-6 h-6 rounded-full transition-transform duration-300 flex items-center justify-center text-xs ${
                isLight
                  ? 'left-0.5 bg-white shadow-md'
                  : 'left-7 bg-slate-900 shadow-md'
              }`}>
                {isLight ? '☀️' : '🌙'}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatItem = ({ label, value, icon, isLight }) => (
  <div className={`text-center p-3 rounded-lg ${isLight ? 'bg-slate-100/50' : 'bg-slate-800/50'}`}>
    <span className="text-2xl">{icon}</span>
    <div className={`text-2xl font-bold font-modern mt-1 ${isLight ? 'text-slate-800' : 'text-white'}`}>
      {value}
    </div>
    <div className="text-xs text-slate-400 font-modern">{label}</div>
  </div>
);

export default PerfilView;
