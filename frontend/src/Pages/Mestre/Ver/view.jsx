import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useViewModel } from '../../../shared/hooks/useViewModel';
import { editarMestreViewModel } from '../../../viewmodels/Mestres';
import { useTheme } from '../../../contexts/theme.jsx';
import Notification from '../../../components/Notification.jsx';
import RPGCard from '../../../components/RPGCard.jsx';
import { ROUTES, generateRoute } from '../../../routes.jsx';

const VerMestreView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const vm = useViewModel(editarMestreViewModel);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    vm.reset();
    if (id) {
      vm.loadMestre(id);
    }
    return () => vm.clearError();
  }, [id]);

  if (vm.loading) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse-slow">
                <span className="text-2xl">🧙</span>
              </div>
              <div className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Carregando mestre...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!vm.nome && !vm.loading && vm.error) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg text-center py-12">
          <div className="w-20 h-20 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">❌</span>
          </div>
          <h3 className={`text-lg font-semibold mb-2 font-modern ${isLight ? 'text-slate-700' : 'text-white'}`}>
            Mestre não encontrado
          </h3>
          <p className="text-slate-400 font-modern mb-6">
            O mestre que você está procurando não existe ou foi removido.
          </p>
          <Link to={ROUTES.MESTRES}>
            <button className="btn-rpg">Voltar aos Mestres</button>
          </Link>
        </div>
      </div>
    );
  }

  const InfoRow = ({ label, value, fallback = 'Não definido' }) => (
    <div className="flex items-center justify-between">
      <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{label}:</span>
      <span className={`font-modern text-sm ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
        {value || fallback}
      </span>
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
      {vm.error && (
        <Notification message={vm.error} type="error" onClose={vm.clearError} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
            {vm.nome}
          </h1>
          <p className="text-slate-400 font-modern">
            Detalhes do mestre narrador
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link to={ROUTES.MESTRES}>
            <button className={`px-4 py-2 rounded-lg font-modern transition-all duration-200 cursor-pointer ${
              isLight
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
            }`}>
              ← Voltar
            </button>
          </Link>
          <button
            onClick={() => navigate(generateRoute.editarMestre(id))}
            className="btn-rpg hover-lift flex items-center space-x-2 cursor-pointer"
          >
            <span>✏️</span>
            <span>Editar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RPGCard className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-2xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-1`}>
                    {vm.nome}
                  </h2>
                  <p className="text-slate-400 font-modern text-sm">
                    ID: #{id}
                  </p>
                </div>
                {vm.tom_narrativo && (
                  <span className={`px-3 py-1 rounded-full text-sm font-modern ${
                    isLight
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  }`}>
                    {vm.tom_narrativo}
                  </span>
                )}
              </div>

              {vm.descricao && (
                <div>
                  <h3 className={`text-lg font-semibold font-fantasy mb-3 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                    📖 Descrição
                  </h3>
                  <div className={`p-4 rounded-lg ${
                    isLight
                      ? 'bg-slate-50 border border-slate-200'
                      : 'bg-slate-800/50 border border-slate-700'
                  }`}>
                    <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {vm.descricao}
                    </p>
                  </div>
                </div>
              )}

              {vm.personalidade && (
                <div>
                  <h3 className={`text-lg font-semibold font-fantasy mb-3 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                    🎭 Personalidade
                  </h3>
                  <div className={`p-4 rounded-lg ${
                    isLight
                      ? 'bg-slate-50 border border-slate-200'
                      : 'bg-slate-800/50 border border-slate-700'
                  }`}>
                    <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {vm.personalidade}
                    </p>
                  </div>
                </div>
              )}

              {vm.regras_especiais && (
                <div>
                  <h3 className={`text-lg font-semibold font-fantasy mb-3 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                    📜 Regras Especiais
                  </h3>
                  <div className={`p-4 rounded-lg ${
                    isLight
                      ? 'bg-slate-50 border border-slate-200'
                      : 'bg-slate-800/50 border border-slate-700'
                  }`}>
                    <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {vm.regras_especiais}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </RPGCard>
        </div>

        <div className="space-y-6">
          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              ⚙️ Configurações
            </h3>
            <div className="space-y-3">
              <InfoRow label="Modelo" value={vm.modelo} />
              <InfoRow label="Temperatura" value={vm.temperatura} />
              <InfoRow label="Max Tokens" value={vm.max_tokens} />
              <InfoRow label="Tom Narrativo" value={vm.tom_narrativo} />
            </div>
          </RPGCard>

          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              🎯 Ações
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate(generateRoute.editarMestre(id))}
                className="w-full btn-rpg hover-lift flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>✏️</span>
                <span>Editar Mestre</span>
              </button>
              <button
                onClick={() => navigate(ROUTES.MESTRES)}
                className={`w-full px-4 py-2 rounded-lg font-modern transition-all duration-200 cursor-pointer ${
                  isLight
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                ← Voltar aos Mestres
              </button>
            </div>
          </RPGCard>
        </div>
      </div>
    </div>
  );
};

export default VerMestreView;
