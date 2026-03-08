import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useViewModel } from '../../../shared/hooks/useViewModel.js';
import { historiaViewModel } from '../Lista/viewmodel.js';
import { useMestreStore } from '../../../store/mestre/index.js';
import LoadingSpinner from '../../../components/LoadingSpinner.jsx';
import Notification from '../../../components/Notification.jsx';
import RPGCard from '../../../components/RPGCard.jsx';
import { useTheme } from '../../../contexts/theme.jsx';
import { Badge } from '../../../components/shared';
import {
  BookOpen, ArrowLeft, Play, X, Users, Crown, Settings, Target,
  Pencil, Calendar, RefreshCw, ScrollText, Clock, MessageCircle, Loader2
} from 'lucide-react';
import { SessaoService } from '../../../services/SessaoService.js';
import { apiClient } from '../../../services/ApiClient.js';
import SessaoHistoricoModal from '../../../components/Jogo/Modals/SessaoHistoricoModal.jsx';

/**
 * View para visualização detalhada de uma História
 * Segue o padrão MVVM - apenas responsável pela apresentação
 */
export const VerHistoriaView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const viewModel = useViewModel(historiaViewModel);
  const {
    historiaAtual,
    loading,
    error,
    loadHistoria,
    clearError
  } = viewModel;

  const { theme } = useTheme();
  const isLight = theme === 'light';

  const mestresAtivos = useMestreStore(s => s.mestresAtivos);
  const carregarMestres = useMestreStore(s => s.carregarMestres);
  const [editandoMestre, setEditandoMestre] = useState(false);
  const [mestreSelecionadoId, setMestreSelecionadoId] = useState(null);
  const [salvandoMestre, setSalvandoMestre] = useState(false);

  // Sessoes anteriores
  const [sessoes, setSessoes] = useState([]);
  const [loadingSessoes, setLoadingSessoes] = useState(false);
  const [sessaoSelecionada, setSessaoSelecionada] = useState(null);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const sessaoService = useState(() => new SessaoService(apiClient))[0];

  useEffect(() => {
    if (id) {
      loadHistoria(parseInt(id));
      // Carregar sessoes anteriores
      setLoadingSessoes(true);
      sessaoService.getSessoesByHistoria(id)
        .then(data => setSessoes(data || []))
        .catch(() => setSessoes([]))
        .finally(() => setLoadingSessoes(false));
    }
    carregarMestres();
  }, [id]);

  useEffect(() => {
    return () => {
      clearError();
    };
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <LoadingSpinner
            size="xl"
            text="Carregando história..."
            variant="primary"
          />
        </div>
      </div>
    );
  }

  if (!historiaAtual) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg text-center py-12">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-red-500/20">
            <X size={36} className="text-red-400" />
          </div>
          <h3 className={`text-lg font-semibold mb-2 font-modern ${isLight ? 'text-slate-700' : 'text-white'}`}>
            História não encontrada
          </h3>
          <p className="text-slate-400 font-modern mb-6">
            A história que você está procurando não existe ou foi removida.
          </p>
          <Link to="/historias">
            <button className="btn-rpg">
              Voltar às Histórias
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const nomesTemas = viewModel.getNomesTemas(historiaAtual);

  const abrirHistorico = async (sessao) => {
    setLoadingHistorico(true);
    try {
      const completa = await sessaoService.getSessaoHistorico(sessao.id);
      setSessaoSelecionada(completa);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const formatSessaoDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="animate-fade-in space-y-6">
      {error && (
        <Notification
          message={error}
          type="error"
          onClose={clearError}
        />
      )}

      {/* Header da página */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
            isLight ? 'bg-purple-100 text-purple-600' : 'bg-purple-900/40 text-purple-400'
          }`}>
            <BookOpen size={22} />
          </div>
          <div>
            <h1 className={`text-2xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              {historiaAtual.nome}
            </h1>
            <p className={`text-sm font-modern mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Detalhes da aventura épica
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link to="/historias">
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
            onClick={() => navigate(`/jogo/${historiaAtual.id}/selecao-personagem`)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-modern font-semibold text-white gradient-primary transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/25 cursor-pointer"
          >
            <Play size={16} />
            Iniciar Sessão
          </button>
        </div>
      </div>

      {/* Informações principais */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card principal */}
        <div className="lg:col-span-2">
          <RPGCard className="p-6">
            <div className="space-y-6">
              {/* Nome e ID */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-2xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-1`}>
                    {historiaAtual.nome}
                  </h2>
                  <p className="text-slate-400 font-modern text-sm">
                    ID: #{historiaAtual.id}
                  </p>
                </div>
                <Badge variant="green" dot>Ativa</Badge>
              </div>

              {/* Prólogo */}
              <div>
                <h3 className={`text-lg font-semibold font-fantasy mb-3 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                  <BookOpen size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
                  Prólogo
                </h3>
                <div className={`p-4 rounded-lg ${
                  isLight
                    ? 'bg-slate-50 border border-slate-200'
                    : 'bg-slate-800/50 border border-slate-700'
                }`}>
                  {historiaAtual.prologo ? (
                    <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {historiaAtual.prologo}
                    </p>
                  ) : (
                    <p className={`font-modern italic ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      O prólogo desta história ainda não foi gerado pelo sistema.
                    </p>
                  )}
                </div>
              </div>

              {/* Temas */}
              <div>
                <h3 className={`text-lg font-semibold font-fantasy mb-3 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                  <Target size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
                  Temas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {nomesTemas.length > 0 ? (
                    nomesTemas.map((nomeTema, i) => (
                      <Badge key={i} variant="purple">{nomeTema}</Badge>
                    ))
                  ) : (
                    <Badge variant="slate">Sem temas definidos</Badge>
                  )}
                </div>
              </div>
            </div>
          </RPGCard>
        </div>

        {/* Sidebar com informações adicionais */}
        <div className="space-y-6">
          {/* Participantes */}
          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              <Users size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
              Participantes
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Máximo de jogadores:
                </span>
                <span className="font-semibold text-cyan-400 font-modern">
                  {historiaAtual.maximo_de_participantes}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Vagas disponíveis:
                </span>
                <span className="font-semibold text-green-400 font-modern">
                  {historiaAtual.maximo_de_participantes}
                </span>
              </div>
            </div>
          </RPGCard>

          {/* Mestre */}
          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              <Crown size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
              Mestre
            </h3>
            {editandoMestre ? (
              <div className="space-y-3">
                <select
                  value={mestreSelecionadoId || ''}
                  onChange={(e) => setMestreSelecionadoId(e.target.value ? parseInt(e.target.value) : null)}
                  className={`w-full px-3 py-2 rounded-lg font-modern text-sm transition-all duration-200 ${
                    isLight
                      ? 'bg-slate-100 border border-slate-300 text-slate-800 focus:border-purple-500'
                      : 'bg-slate-800/50 border border-slate-600 text-white focus:border-purple-500'
                  } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                >
                  <option value="">Mestre Padrao</option>
                  {mestresAtivos?.map((m) => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    disabled={salvandoMestre}
                    onClick={async () => {
                      setSalvandoMestre(true);
                      try {
                        await viewModel.atualizarMestre(historiaAtual.id, mestreSelecionadoId);
                        setEditandoMestre(false);
                      } catch (_) {}
                      setSalvandoMestre(false);
                    }}
                    className="flex-1 px-3 py-1.5 rounded-lg font-modern text-sm bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer disabled:opacity-50"
                  >
                    {salvandoMestre ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => setEditandoMestre(false)}
                    className={`flex-1 px-3 py-1.5 rounded-lg font-modern text-sm transition-all cursor-pointer ${
                      isLight
                        ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    }`}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {viewModel.getMestreNome(historiaAtual)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setMestreSelecionadoId(historiaAtual.mestre_id || historiaAtual.mestres?.id || null);
                    setEditandoMestre(true);
                  }}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg font-modern text-sm transition-all cursor-pointer ${
                    isLight
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                  }`}
                >
                  <RefreshCw size={14} />
                  Trocar Mestre
                </button>
              </div>
            )}
          </RPGCard>

          {/* Informações do sistema */}
          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              <Settings size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
              Informações
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Criada em:
                </span>
                <span className={`font-modern text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {new Date(historiaAtual.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Última atualização:
                </span>
                <span className={`font-modern text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {new Date(historiaAtual.updated_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </RPGCard>

          {/* Ações */}
          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              <Target size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
              Ações
            </h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/jogo/${historiaAtual.id}/selecao-personagem`)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-modern font-semibold text-white gradient-primary transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/25 cursor-pointer"
              >
                <Play size={16} />
                Iniciar Sessão
              </button>
              <Link to="/historias" className="block">
                <button className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-modern transition-all duration-200 cursor-pointer ${
                  isLight
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}>
                  <ArrowLeft size={16} />
                  Voltar às Histórias
                </button>
              </Link>
            </div>
          </RPGCard>
        </div>
      </div>

      {/* Sessoes Anteriores */}
      <RPGCard className="p-6">
        <h3 className={`text-lg font-semibold font-fantasy mb-4 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
          <ScrollText size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
          Sessões Anteriores
        </h3>

        {loadingSessoes ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 size={16} className="animate-spin text-purple-400" />
            <span className="text-slate-400 font-modern text-sm">Carregando sessões...</span>
          </div>
        ) : sessoes.length === 0 ? (
          <p className={`font-modern text-sm italic ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Nenhuma sessão registrada para esta história.
          </p>
        ) : (
          <div className="space-y-2">
            {sessoes.map(sessao => {
              const participantes = sessao.jogadores
                ? Object.values(sessao.jogadores).map(j => j.personagemNome || j.username || 'Jogador')
                : [];

              return (
                <button
                  key={sessao.id}
                  onClick={() => abrirHistorico(sessao)}
                  disabled={loadingHistorico}
                  className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      : 'glass border-slate-700/50 hover:border-purple-500/30'
                  } ${loadingHistorico ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Clock size={14} className={isLight ? 'text-slate-400' : 'text-slate-500'} />
                      <span className={`text-sm font-modern font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>
                        {formatSessaoDate(sessao.iniciada_em)}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded border font-modern ${
                      sessao.status === 'finalizada'
                        ? 'bg-green-500/20 text-green-300 border-green-500/30'
                        : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                    }`}>
                      {sessao.status === 'finalizada' ? 'Finalizada' : 'Em andamento'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-modern">
                    <span className="flex items-center gap-1">
                      <MessageCircle size={11} /> {sessao.totalMensagens || 0} msgs
                    </span>
                    <span>{sessao.rodada_atual || 0} rodadas</span>
                    {participantes.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users size={11} /> {participantes.length}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </RPGCard>

      {/* Modal de Historico */}
      <SessaoHistoricoModal
        isOpen={!!sessaoSelecionada}
        onClose={() => setSessaoSelecionada(null)}
        sessao={sessaoSelecionada}
      />
    </div>
  );
};

export default VerHistoriaView;
