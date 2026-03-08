import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useViewModel } from '../../../shared/hooks/useViewModel';
import { editarMestreViewModel } from '../../../viewmodels/Mestres';
import { useTheme } from '../../../contexts/theme.jsx';
import Notification from '../../../components/Notification.jsx';
import RPGCard from '../../../components/RPGCard.jsx';
import { Badge } from '../../../components/shared';
import { ROUTES, generateRoute } from '../../../routes.jsx';
import {
  Crown, ArrowLeft, Pencil, X, BookOpen, Theater, ScrollText,
  Settings, Target
} from 'lucide-react';

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
                <Crown size={24} className="text-white" />
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
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-red-500/20">
            <X size={36} className="text-red-400" />
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
        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
            isLight ? 'bg-purple-100 text-purple-600' : 'bg-purple-900/40 text-purple-400'
          }`}>
            <Crown size={22} />
          </div>
          <div>
            <h1 className={`text-2xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              {vm.nome}
            </h1>
            <p className={`text-sm font-modern mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Detalhes do mestre narrador
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link to={ROUTES.MESTRES}>
            <button className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-modern transition-all cursor-pointer ${
              isLight
                ? 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                : 'border border-slate-600 text-slate-300 hover:bg-slate-700/50'
            }`}>
              <ArrowLeft size={16} />
              Voltar
            </button>
          </Link>
          <button
            onClick={() => navigate(generateRoute.editarMestre(id))}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-modern font-semibold text-white gradient-primary transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/25 cursor-pointer"
          >
            <Pencil size={16} />
            Editar
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
                  <Badge variant="purple">{vm.tom_narrativo}</Badge>
                )}
              </div>

              {vm.descricao && (
                <div>
                  <h3 className={`text-lg font-semibold font-fantasy mb-3 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                    <BookOpen size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
                    Descrição
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
                  <h3 className={`text-lg font-semibold font-fantasy mb-3 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                    <Theater size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
                    Personalidade
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
                  <h3 className={`text-lg font-semibold font-fantasy mb-3 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                    <ScrollText size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
                    Regras Especiais
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
            <h3 className={`text-lg font-semibold font-fantasy mb-4 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              <Settings size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
              Configurações
            </h3>
            <div className="space-y-3">
              <InfoRow label="Modelo" value={vm.modelo} />
              <InfoRow label="Temperatura" value={vm.temperatura} />
              <InfoRow label="Max Tokens" value={vm.max_tokens} />
              <InfoRow label="Tom Narrativo" value={vm.tom_narrativo} />
            </div>
          </RPGCard>

          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              <Target size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
              Ações
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate(generateRoute.editarMestre(id))}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-modern font-semibold text-white gradient-primary transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/25 cursor-pointer"
              >
                <Pencil size={16} />
                Editar Mestre
              </button>
              <Link to={ROUTES.MESTRES} className="block">
                <button className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-modern transition-all duration-200 cursor-pointer ${
                  isLight
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}>
                  <ArrowLeft size={16} />
                  Voltar aos Mestres
                </button>
              </Link>
            </div>
          </RPGCard>
        </div>
      </div>
    </div>
  );
};

export default VerMestreView;
