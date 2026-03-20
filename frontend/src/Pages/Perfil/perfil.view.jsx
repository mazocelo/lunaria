import React from 'react';
import InputSimples from '../../components/form/inputSimples';
import Button from '../../components/form/button';
import { useTheme } from '../../contexts/theme.jsx';

const PerfilView = ({
  nome,
  email,
  bio,
  avatar,
  preferencias,
  privacidade,
  senhaAtual,
  novaSenha,
  confirmarSenha,
  estatisticas,
  savingProfile,
  savingPassword,
  error,
  successMessage,
  setNome,
  setEmail,
  setBio,
  setAvatar,
  setPreferencias,
  setPrivacidade,
  setSenhaAtual,
  setNovaSenha,
  setConfirmarSenha,
  salvarPerfil,
  alterarSenha,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
          {avatar ? (
            <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl">{'\uD83D\uDC64'}</span>
          )}
        </div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
          Meu Perfil
        </h1>
        <p className="text-slate-400 font-modern">
          Gerencie suas informa\u00E7\u00F5es e prefer\u00EAncias
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-sm">!</span>
            </div>
            <p className="text-red-300 text-sm font-modern">{error}</p>
          </div>
        </div>
      )}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-sm">{'\u2713'}</span>
            </div>
            <p className="text-green-300 text-sm font-modern">{successMessage}</p>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* Section: Estatisticas */}
        {estatisticas && (
          <div className="card-rpg">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 gradient-accent rounded-lg flex items-center justify-center">
                <span className="text-sm">{'\uD83D\uDCCA'}</span>
              </div>
              <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                Estat\u00EDsticas
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatItem label="Hist\u00F3rias" value={estatisticas.totalHistorias ?? 0} icon={'\uD83D\uDCDA'} isLight={isLight} />
              <StatItem label="Personagens" value={estatisticas.totalPersonagens ?? 0} icon={'\u2694\uFE0F'} isLight={isLight} />
              <StatItem label="Sess\u00F5es" value={estatisticas.totalSessoes ?? 0} icon={'\uD83C\uDFB2'} isLight={isLight} />
              <StatItem label="Mensagens" value={estatisticas.totalMensagens ?? 0} icon={'\uD83D\uDCAC'} isLight={isLight} />
            </div>
          </div>
        )}

        {/* Section: Informacoes Pessoais */}
        <form onSubmit={salvarPerfil} className="card-rpg space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-sm">{'\u270F\uFE0F'}</span>
            </div>
            <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Informa\u00E7\u00F5es Pessoais
            </h2>
          </div>

          <InputSimples
            label="Nome"
            name="nome"
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Seu nome"
            required
          />

          <InputSimples
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
          />

          <div>
            <label className={`block text-sm font-medium mb-1 font-modern ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Bio
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Conte um pouco sobre voce..."
              className={`w-full rounded-lg border px-3 py-2 text-sm font-modern resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-800'
                  : 'bg-slate-800 border-slate-600 text-white'
              }`}
            />
            <p className="text-xs text-slate-400 mt-1">{bio.length}/500</p>
          </div>

          <InputSimples
            label="Avatar (URL)"
            name="avatar"
            value={avatar}
            onChange={e => setAvatar(e.target.value)}
            placeholder="https://exemplo.com/avatar.png"
          />

          <div className="flex justify-end">
            <Button
              variant="primary"
              type="submit"
              disabled={savingProfile}
            >
              {savingProfile ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando...</span>
                </div>
              ) : (
                'Salvar Altera\u00E7\u00F5es'
              )}
            </Button>
          </div>
        </form>

        {/* Section: Alterar Senha */}
        <form onSubmit={alterarSenha} className="card-rpg space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 gradient-secondary rounded-lg flex items-center justify-center">
              <span className="text-sm">{'\uD83D\uDD12'}</span>
            </div>
            <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Alterar Senha
            </h2>
          </div>

          <InputSimples
            label="Senha Atual"
            name="senhaAtual"
            type="password"
            value={senhaAtual}
            onChange={e => setSenhaAtual(e.target.value)}
            placeholder="Digite sua senha atual"
            autoComplete="current-password"
          />

          <InputSimples
            label="Nova Senha"
            name="novaSenha"
            type="password"
            value={novaSenha}
            onChange={e => setNovaSenha(e.target.value)}
            placeholder="M\u00EDnimo 8 caracteres"
            autoComplete="new-password"
          />

          <InputSimples
            label="Confirmar Nova Senha"
            name="confirmarSenha"
            type="password"
            value={confirmarSenha}
            onChange={e => setConfirmarSenha(e.target.value)}
            placeholder="Confirme a nova senha"
            autoComplete="new-password"
          />

          <div className="flex justify-end">
            <Button
              variant="secondary"
              type="submit"
              disabled={savingPassword}
            >
              {savingPassword ? (
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

        {/* Section: Notificacoes */}
        <div className="card-rpg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-sm">{'\uD83D\uDD14'}</span>
            </div>
            <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Notifica\u00E7\u00F5es
            </h2>
          </div>
          <div className="space-y-3">
            <ToggleItem
              label="Convites de historia"
              description="Receber notificacoes de convites para historias"
              checked={preferencias.notificacoes?.convites ?? true}
              onChange={v => setPreferencias(p => ({ ...p, notificacoes: { ...p.notificacoes, convites: v } }))}
              isLight={isLight}
            />
            <ToggleItem
              label="Solicitacoes de amizade"
              description="Receber notificacoes de solicitacoes de amizade"
              checked={preferencias.notificacoes?.amizades ?? true}
              onChange={v => setPreferencias(p => ({ ...p, notificacoes: { ...p.notificacoes, amizades: v } }))}
              isLight={isLight}
            />
            <ToggleItem
              label="Sessoes de jogo"
              description="Receber notificacoes quando uma sessao iniciar"
              checked={preferencias.notificacoes?.sessoes ?? true}
              onChange={v => setPreferencias(p => ({ ...p, notificacoes: { ...p.notificacoes, sessoes: v } }))}
              isLight={isLight}
            />
          </div>
        </div>

        {/* Section: Privacidade */}
        <div className="card-rpg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 gradient-secondary rounded-lg flex items-center justify-center">
              <span className="text-sm">{'\uD83D\uDEE1\uFE0F'}</span>
            </div>
            <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Privacidade
            </h2>
          </div>
          <div className="space-y-3">
            <ToggleItem
              label="Perfil publico"
              description="Permitir que outros usuarios vejam seu perfil"
              checked={privacidade.perfil_publico ?? true}
              onChange={v => setPrivacidade(p => ({ ...p, perfil_publico: v }))}
              isLight={isLight}
            />
            <ToggleItem
              label="Mostrar estatisticas"
              description="Exibir suas estatisticas no perfil publico"
              checked={privacidade.mostrar_estatisticas ?? true}
              onChange={v => setPrivacidade(p => ({ ...p, mostrar_estatisticas: v }))}
              isLight={isLight}
            />
          </div>
        </div>

        {/* Section: Tema */}
        <div className="card-rpg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 gradient-accent rounded-lg flex items-center justify-center">
              <span className="text-sm">{'\uD83C\uDFA8'}</span>
            </div>
            <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Apar\u00EAncia
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
                {isLight ? '\u2600\uFE0F' : '\uD83C\uDF19'}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToggleItem = ({ label, description, checked, onChange, isLight }) => (
  <div className="flex items-center justify-between py-2">
    <div>
      <p className={`font-modern font-semibold text-sm ${isLight ? 'text-slate-700' : 'text-white'}`}>
        {label}
      </p>
      <p className="text-xs text-slate-400 font-modern">{description}</p>
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer ${
        checked ? 'bg-purple-600' : isLight ? 'bg-slate-300' : 'bg-slate-600'
      }`}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
        checked ? 'left-5.5' : 'left-0.5'
      }`} />
    </button>
  </div>
);

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
