import { useState } from 'react';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../../components/LoadingSpinner';
import Notification from '../../../components/Notification';
import RPGCard from '../../../components/RPGCard';
import { Badge } from '../../../components/shared';
import {
  BookOpen, ArrowLeft, Play, X, Users, Crown, Settings, Target,
  RefreshCw, ScrollText, Clock, MessageCircle, Loader2, Link2, Check, Map, Sparkles, RotateCcw, Pause, History,
  FileText, Volume2
} from 'lucide-react';
import SessaoHistoricoModal from '../../../components/Jogo/Modals/SessaoHistoricoModal';
import RoteiroViewer from '../../../components/RoteiroViewer';
import RoteiroComparisonModal from '../../../components/RoteiroComparisonModal';
import ImageGenerator from '../../../components/form/ImageGenerator';
import ImageLightbox from '../../../components/ImageLightbox';
import NarrationAudioButton from '../../../components/shared/NarrationAudioButton';
import { ESTILOS_IMAGEM, MODOS_ROTEIRO, MODOS_ABERTURA } from './historia-ver.model';
import type { HistoriaExtendida, SessaoItem, VersaoRoteiro } from './historia-ver.model';
import {
  OPCOES_MAX_ACOES_TURNO,
  OPCOES_ORCAMENTO_BEATS,
  VELOCIDADES_NARRATIVA
} from '../../../utils/historiaConfig';
import { useTheme } from '../../../contexts/theme';
import type { UseTTSResult } from '../../../hooks/useTTS';
import type { MestreItem } from '../../../store/mestre/states';

interface CopyInviteLinkButtonProps {
  historiaId: number;
  isLight: boolean;
}

const CopyInviteLinkButton = ({ historiaId, isLight }: CopyInviteLinkButtonProps) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    const url = `${window.location.origin}/convite-jogo/${historiaId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-modern font-semibold transition-all cursor-pointer ${
        copied
          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
          : isLight
            ? 'bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-200'
            : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30'
      }`}
    >
      {copied ? <Check size={16} /> : <Link2 size={16} />}
      {copied ? 'Link copiado!' : 'Copiar link de convite'}
    </button>
  );
};

interface VerHistoriaViewProps {
  historiaAtual: HistoriaExtendida | null;
  loading: boolean;
  error: string | null;
  nomesTemas: unknown[];
  canMutateHistoria: boolean;
  mestresAtivos: MestreItem[];
  editandoMestre: boolean;
  mestreSelecionadoId: number | null;
  mestreTierSelecionado: string | null;
  setMestreTierSelecionado: (tier: string) => void;
  salvandoMestre: boolean;
  getMestreNome: (historia: HistoriaExtendida | null) => string;
  handleSalvarMestre: () => void;
  handleEditarMestre: () => void;
  handleCancelarEditarMestre: () => void;
  handleMestreSelecionadoChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  selectedMestre: MestreItem | null;
  mestreProviderLabel: string;
  loadingPreview: boolean;
  playingMestreId: number | null;
  handlePreviewMestre: () => void;
  tts: UseTTSResult;
  effectiveMestreVoiceId: string | null;
  effectiveMestreVoiceProvider: string;
  lightboxSrc: string | null;
  handleOpenLightbox: (src: string) => void;
  handleCloseLightbox: () => void;
  sessoes: SessaoItem[];
  loadingSessoes: boolean;
  sessaoSelecionada: unknown;
  loadingHistorico: boolean;
  abrirHistorico: (sessao: SessaoItem) => void;
  fecharHistorico: () => void;
  formatSessaoDate: (dateStr: string | null | undefined) => string;
  roteiro: Record<string, unknown> | null;
  roteiroStatus: string | null;
  roteiroLoading: boolean;
  selectedMode: string | null;
  setSelectedMode: (mode: string | null) => void;
  versoes: VersaoRoteiro[];
  versoesOpen: boolean;
  versoesLoading: boolean;
  handleGerarRoteiro: () => void;
  handleRoteiroUpdate: (r: Record<string, unknown>) => void;
  handleToggleVersoes: () => void;
  handleAtivarVersao: (id: number) => void;
  handleCompararVersao: (versao: VersaoRoteiro) => void;
  handleFecharComparacao: () => void;
  versaoComparacao: Record<string, unknown> | null;
  metadadosComparacao: Record<string, unknown> | null;
  loadingComparacao: boolean;
  comparacaoOpen: boolean;
  handleIniciarSessao: () => void;
  handleVoltar: () => void;
  estiloAtual: string;
  handleCapaGenerated: (url: string) => void;
  handleMapaGenerated: (url: string) => void;
  handleRemoveMapa: (index: number) => void;
  handleEstiloImagemChange: (estilo: string) => void;
  modoAberturaAtual: string;
  velocidadeNarrativaAtual: string;
  orcamentoDeBeatsAtual: number;
  maxAcoesPorTurnoAtual: number;
  salvandoAbertura: boolean;
  salvandoConfiguracaoNarrativa: boolean;
  handleModoAberturaChange: (modo: string) => void;
  handleVelocidadeNarrativaChange: (v: string) => void;
  handleOrcamentoDeBeatsChange: (v: number | string) => void;
  handleMaxAcoesPorTurnoChange: (v: number | string) => void;
  clearError: () => void;
}

const VerHistoriaView = ({
  historiaAtual,
  loading,
  error,
  nomesTemas,
  canMutateHistoria,
  mestresAtivos,
  editandoMestre,
  mestreSelecionadoId,
  mestreTierSelecionado,
  setMestreTierSelecionado,
  salvandoMestre,
  getMestreNome,
  handleSalvarMestre,
  handleEditarMestre,
  handleCancelarEditarMestre,
  handleMestreSelecionadoChange,
  selectedMestre,
  mestreProviderLabel,
  loadingPreview,
  playingMestreId,
  handlePreviewMestre,
  tts,
  effectiveMestreVoiceId,
  effectiveMestreVoiceProvider,
  lightboxSrc,
  handleOpenLightbox,
  handleCloseLightbox,
  sessoes,
  loadingSessoes,
  sessaoSelecionada,
  loadingHistorico,
  abrirHistorico,
  fecharHistorico,
  formatSessaoDate,
  roteiro,
  roteiroStatus,
  roteiroLoading,
  selectedMode,
  setSelectedMode,
  versoes,
  versoesOpen,
  versoesLoading,
  handleGerarRoteiro,
  handleRoteiroUpdate,
  handleToggleVersoes,
  handleAtivarVersao,
  handleCompararVersao,
  handleFecharComparacao,
  versaoComparacao,
  metadadosComparacao,
  loadingComparacao,
  comparacaoOpen,
  handleIniciarSessao,
  handleVoltar,
  estiloAtual,
  handleCapaGenerated,
  handleMapaGenerated,
  handleRemoveMapa,
  handleEstiloImagemChange,
  modoAberturaAtual,
  velocidadeNarrativaAtual,
  orcamentoDeBeatsAtual,
  maxAcoesPorTurnoAtual,
  salvandoAbertura,
  salvandoConfiguracaoNarrativa,
  handleModoAberturaChange,
  handleVelocidadeNarrativaChange,
  handleOrcamentoDeBeatsChange,
  handleMaxAcoesPorTurnoChange,
  clearError,
}: VerHistoriaViewProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const formatDisplayDate = (value: string | null | undefined): string => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <LoadingSpinner
            size="xl"
            text="Carregando historia..."
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
            Historia nao encontrada
          </h3>
          <p className="text-slate-400 font-modern mb-6">
            A historia que voce esta procurando nao existe ou foi removida.
          </p>
          <Link to="/historias">
            <button className="btn-rpg">
              Voltar as Historias
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const mapas = Array.isArray(historiaAtual.mapas) ? (historiaAtual.mapas as Array<{ url: string; nome?: string }>) : [];
  const roteiroAny = roteiro as Record<string, unknown> | null;
  const roteiroSinopse = roteiroAny?.sinopse as string | undefined;
  const roteiroAntagonista = (roteiroAny?.antagonista as { nome?: string } | undefined)?.nome;
  const roteiroLocais = (roteiroAny?.locais as Array<{ nome?: string }> | undefined) || [];
  const roteiroMapaMundi = roteiroAny?.mapaMundi;
  const versaoAtiva = versoes.find(v => v.ativa);
  const metadadosAtiva = versaoAtiva
    ? { modo: versaoAtiva.modo, temperatura: versaoAtiva.temperatura, modelo: versaoAtiva.modelo, criado_em: versaoAtiva.criado_em, versao: versaoAtiva.versao }
    : null;

  return (
    <div className="animate-fade-in space-y-6">
      {error && (
        <Notification message={error} type="error" onClose={clearError} />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {historiaAtual.imagem ? (
            <img
              src={historiaAtual.imagem}
              alt={historiaAtual.nome}
              className="flex-shrink-0 w-14 h-14 rounded-xl object-cover border-2 border-purple-500 cursor-pointer hover:opacity-80 transition-opacity select-none caret-transparent"
              draggable={false}
              onClick={() => historiaAtual.imagem && handleOpenLightbox(historiaAtual.imagem)}
            />
          ) : (
            <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center ${
              isLight ? 'bg-purple-100 text-purple-600' : 'bg-purple-900/40 text-purple-400'
            }`}>
              <BookOpen size={28} />
            </div>
          )}
          <div>
            <h1 className={`text-2xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              {historiaAtual.nome}
            </h1>
            <p className={`text-sm font-modern mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Detalhes da aventura epica
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleVoltar}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-modern transition-all cursor-pointer ${
              isLight
                ? 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                : 'border border-slate-600 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
          {canMutateHistoria && (
            <button
              onClick={handleIniciarSessao}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-modern font-semibold text-white gradient-primary transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/25 cursor-pointer"
            >
              <Play size={16} />
              Iniciar Sessao
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RPGCard className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-2xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-1`}>
                    {historiaAtual.nome}
                  </h2>
                  <p className="text-slate-400 font-modern text-sm">
                    ID: #{historiaAtual.id}
                  </p>
                </div>
                <Badge variant={historiaAtual.deleted_at ? 'red' : 'green'} dot>
                  {historiaAtual.deleted_at ? 'Removida' : 'Ativa'}
                </Badge>
              </div>

              {historiaAtual.descricao && (
                <div>
                  <h3 className={`text-lg font-semibold font-fantasy mb-3 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                    <FileText size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
                    Descricao
                  </h3>
                  <div className={`p-4 rounded-lg ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/50 border border-slate-700'}`}>
                    <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {historiaAtual.descricao}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h3 className={`text-lg font-semibold font-fantasy mb-3 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                  <BookOpen size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
                  Prologo
                </h3>
                <div className={`p-4 rounded-lg ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/50 border border-slate-700'}`}>
                  {historiaAtual.prologo ? (
                    <>
                      <p className={`font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        {historiaAtual.prologo}
                      </p>
                      <NarrationAudioButton
                        tts={tts as never}
                        text={historiaAtual.prologo}
                        itemId={`historia:${historiaAtual.id}:prologo`}
                        voiceId={effectiveMestreVoiceId}
                        voiceProvider={effectiveMestreVoiceProvider}
                        isLight={isLight}
                      />
                    </>
                  ) : (
                    <p className={`font-modern italic ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      O prologo desta historia ainda nao foi gerado pelo sistema.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className={`text-lg font-semibold font-fantasy mb-3 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                  <Target size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
                  Temas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(nomesTemas as string[]).length > 0 ? (
                    (nomesTemas as string[]).map((nomeTema, i) => (
                      <Badge key={i} variant="purple">{nomeTema}</Badge>
                    ))
                  ) : (
                    <Badge variant="slate">Sem temas definidos</Badge>
                  )}
                </div>
              </div>

              {canMutateHistoria && (
                <div>
                  <h3 className={`text-lg font-semibold font-fantasy mb-3 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                    <Sparkles size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
                    Estilo de Imagem
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {ESTILOS_IMAGEM.map(e => (
                      <button
                        key={e.value}
                        onClick={() => handleEstiloImagemChange(e.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-modern font-semibold transition-all cursor-pointer border ${
                          estiloAtual === e.value
                            ? 'bg-purple-500/30 border-purple-400 text-purple-200'
                            : isLight
                              ? 'border-slate-300 hover:bg-slate-100 text-slate-600'
                              : 'border-slate-600 hover:bg-slate-700 text-slate-400'
                        }`}
                      >
                        {e.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {canMutateHistoria && (
                <div>
                  <h3 className={`text-lg font-semibold font-fantasy mb-3 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                    <Settings size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
                    Abertura de Sessao
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {MODOS_ABERTURA.map(m => (
                      <button
                        key={m.value}
                        onClick={() => handleModoAberturaChange(m.value)}
                        disabled={salvandoAbertura}
                        title={m.desc}
                        className={`px-3 py-1.5 rounded-lg text-xs font-modern font-semibold transition-all cursor-pointer border ${salvandoAbertura ? 'opacity-50 cursor-not-allowed' : ''} ${
                          modoAberturaAtual === m.value
                            ? 'bg-purple-500/30 border-purple-400 text-purple-200'
                            : isLight
                              ? 'border-slate-300 hover:bg-slate-100 text-slate-600'
                              : 'border-slate-600 hover:bg-slate-700 text-slate-400'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <p className={`mt-1.5 text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {MODOS_ABERTURA.find(m => m.value === modoAberturaAtual)?.desc}
                  </p>
                </div>
              )}

              <div>
                <h3 className={`text-lg font-semibold font-fantasy mb-3 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                  <Clock size={18} className={isLight ? 'text-cyan-500' : 'text-cyan-400'} />
                  Ritmo da Aventura
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-2 font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Velocidade narrativa
                    </label>
                    {canMutateHistoria ? (
                      <select
                        value={velocidadeNarrativaAtual}
                        onChange={(e) => handleVelocidadeNarrativaChange(e.target.value)}
                        disabled={salvandoConfiguracaoNarrativa}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-modern border transition-all ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-800 focus:border-purple-500'
                            : 'bg-slate-800/50 border-slate-600 text-slate-200 focus:border-purple-400'
                        } ${salvandoConfiguracaoNarrativa ? 'opacity-60 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                      >
                        {VELOCIDADES_NARRATIVA.map((opcao) => (
                          <option key={opcao.value} value={opcao.value}>{opcao.label}</option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant="cyan">
                        {VELOCIDADES_NARRATIVA.find((opcao) => opcao.value === velocidadeNarrativaAtual)?.label || velocidadeNarrativaAtual}
                      </Badge>
                    )}
                    <p className={`mt-1.5 text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {VELOCIDADES_NARRATIVA.find((opcao) => opcao.value === velocidadeNarrativaAtual)?.desc}
                    </p>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-2 font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Orcamento de beats
                    </label>
                    {canMutateHistoria ? (
                      <select
                        value={orcamentoDeBeatsAtual}
                        onChange={(e) => handleOrcamentoDeBeatsChange(e.target.value)}
                        disabled={salvandoConfiguracaoNarrativa}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-modern border transition-all ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-800 focus:border-purple-500'
                            : 'bg-slate-800/50 border-slate-600 text-slate-200 focus:border-purple-400'
                        } ${salvandoConfiguracaoNarrativa ? 'opacity-60 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                      >
                        {OPCOES_ORCAMENTO_BEATS.map((valor) => (
                          <option key={valor} value={valor}>{valor} beats</option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant="amber">{orcamentoDeBeatsAtual} beats</Badge>
                    )}
                    <p className={`mt-1.5 text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Numero de marcos narrativos esperados. Ex: 8 curto, 12 medio, 20 longo.
                    </p>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-2 font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Max acoes por turno
                    </label>
                    {canMutateHistoria ? (
                      <select
                        value={maxAcoesPorTurnoAtual}
                        onChange={(e) => handleMaxAcoesPorTurnoChange(e.target.value)}
                        disabled={salvandoConfiguracaoNarrativa}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-modern border transition-all ${
                          isLight
                            ? 'bg-white border-slate-300 text-slate-800 focus:border-purple-500'
                            : 'bg-slate-800/50 border-slate-600 text-slate-200 focus:border-purple-400'
                        } ${salvandoConfiguracaoNarrativa ? 'opacity-60 cursor-not-allowed' : ''} focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                      >
                        {OPCOES_MAX_ACOES_TURNO.map((valor) => (
                          <option key={valor} value={valor}>{valor} respostas</option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant="pink">{maxAcoesPorTurnoAtual} respostas</Badge>
                    )}
                    <p className={`mt-1.5 text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Quantas respostas do Mestre cabem no turno antes de encerrar a batida.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className={`text-lg font-semibold font-fantasy mb-3 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                  <Sparkles size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
                  Capa da Historia
                </h3>
                {canMutateHistoria ? (
                  <ImageGenerator
                    imageUrl={historiaAtual.imagem || ''}
                    onImageGenerated={handleCapaGenerated}
                    entityType="historia"
                    entityData={{
                      nome: historiaAtual.nome,
                      temas: nomesTemas,
                      descricao: historiaAtual.descricao,
                      prologo: historiaAtual.prologo,
                      sinopse: roteiroSinopse,
                      antagonista: roteiroAntagonista,
                      locais: roteiroLocais.slice(0, 3).map(l => l.nome) || [],
                      contexto_historia: [historiaAtual.descricao, historiaAtual.prologo, roteiroSinopse].filter(Boolean).join(' | '),
                      estilo_imagem: estiloAtual,
                    }}
                    isLight={isLight}
                    label=""
                    imageOptions={{ width: 1024, height: 576 }}
                    imageClassName={`w-full h-56 sm:h-72 object-cover rounded-xl border-2 shadow-lg ${isLight ? 'border-slate-200' : 'border-purple-500/30'}`}
                  />
                ) : (
                  <div className={`w-full h-56 sm:h-72 rounded-xl border-2 shadow-lg overflow-hidden flex items-center justify-center ${
                    isLight ? 'border-slate-200 bg-slate-50' : 'border-purple-500/30 bg-slate-800/50'
                  }`}>
                    {historiaAtual.imagem ? (
                      <img
                        src={historiaAtual.imagem}
                        alt={historiaAtual.nome}
                        className="w-full h-full object-cover cursor-pointer select-none caret-transparent"
                        draggable={false}
                        onClick={() => historiaAtual.imagem && handleOpenLightbox(historiaAtual.imagem)}
                      />
                    ) : (
                      <span className={`text-sm font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        Nenhuma capa gerada
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <h3 className={`text-lg font-semibold font-fantasy mb-3 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                  <Map size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
                  Mapas do Mundo
                </h3>
                {mapas.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {mapas.map((mapa, i) => (
                      <div key={i} className="relative group">
                        <div
                          onClick={() => handleOpenLightbox(mapa.url)}
                          className={`block rounded-lg overflow-hidden border transition-all hover:scale-[1.02] cursor-pointer ${
                            isLight ? 'border-slate-200 hover:border-purple-400' : 'border-slate-700 hover:border-purple-500'
                          }`}
                        >
                          <img src={mapa.url} alt={mapa.nome || `Mapa ${i + 1}`} className="w-full h-36 object-cover select-none caret-transparent" draggable={false} />
                          <div className={`px-2 py-1.5 text-xs font-modern ${isLight ? 'text-slate-600 bg-slate-50' : 'text-slate-300 bg-slate-800/50'}`}>
                            {mapa.nome || `Mapa ${i + 1}`}
                          </div>
                        </div>
                        {canMutateHistoria && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMapa(i)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer select-none caret-transparent"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {canMutateHistoria && (
                  <ImageGenerator
                    imageUrl=""
                    onImageGenerated={handleMapaGenerated}
                    entityType="historia_mapa"
                    entityData={{
                      nome: historiaAtual.nome,
                      temas: nomesTemas,
                      locais: roteiroLocais.slice(0, 5).map(l => l.nome) || [],
                      mapaMundi: roteiroMapaMundi,
                      contexto_historia: [historiaAtual.descricao, historiaAtual.prologo, roteiroSinopse].filter(Boolean).join(' | '),
                      estilo_imagem: estiloAtual,
                    }}
                    isLight={isLight}
                    label=""
                  />
                )}
                {canMutateHistoria && mapas.length === 0 && (
                  <p className={`text-xs mt-2 ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                    Gere mapas do mundo da sua historia. Voce pode adicionar varios.
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-lg font-semibold font-fantasy flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
                    <ScrollText size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
                    Roteiro da Aventura
                  </h3>
                  {canMutateHistoria && (!roteiro && !['queued', 'generating'].includes(roteiroStatus || '') && !roteiroLoading) && (
                    <button
                      onClick={handleGerarRoteiro}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-modern font-semibold text-white gradient-primary transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/25 cursor-pointer"
                    >
                      <Sparkles size={14} />
                      Gerar com IA
                    </button>
                  )}
                  {canMutateHistoria && roteiro && !roteiroLoading && !['queued', 'generating'].includes(roteiroStatus || '') && (
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedMode || ''}
                        onChange={(e) => setSelectedMode(e.target.value || null)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-modern ${
                          isLight ? 'bg-slate-100 border border-slate-200 text-slate-600' : 'bg-slate-700 border border-slate-600 text-slate-300'
                        }`}
                      >
                        <option value="">Regenerar (padrão)</option>
                        {MODOS_ROTEIRO.map(m => (
                          <option key={m.value} value={m.value}>{m.label} — {m.desc}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleGerarRoteiro}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-modern transition-all cursor-pointer ${
                          isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-600' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        }`}
                      >
                        <RotateCcw size={12} />
                        Gerar
                      </button>
                    </div>
                  )}
                </div>

                {(roteiroLoading || ['queued', 'generating'].includes(roteiroStatus || '')) ? (
                  <div className={`p-6 rounded-lg text-center ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/50 border border-slate-700'}`}>
                    <Loader2 size={24} className="animate-spin text-purple-400 mx-auto mb-3" />
                    <p className={`font-modern text-sm ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      Gerando roteiro com Claude Sonnet 4.5...
                    </p>
                    <p className={`font-modern text-xs mt-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                      Isso pode levar 30-60 segundos
                    </p>
                    <div className="mt-3 w-full h-1.5 rounded-full bg-slate-700 overflow-hidden">
                      <div className="h-full rounded-full bg-purple-500 animate-pulse" style={{ width: '60%' }} />
                    </div>
                  </div>
                ) : roteiroStatus === 'error' ? (
                  <div className={`p-4 rounded-lg ${isLight ? 'bg-red-50 border border-red-200' : 'bg-red-500/10 border border-red-500/30'}`}>
                    <p className={`font-modern text-sm ${isLight ? 'text-red-600' : 'text-red-400'}`}>
                      Erro ao gerar roteiro. Tente novamente.
                    </p>
                    {canMutateHistoria && (
                      <button
                        onClick={handleGerarRoteiro}
                        className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-modern font-semibold text-white bg-red-500 hover:bg-red-600 transition-all cursor-pointer"
                      >
                        <RotateCcw size={12} />
                        Tentar novamente
                      </button>
                    )}
                  </div>
                ) : roteiro ? (
                  <>
                  <RoteiroViewer
                    roteiro={roteiro as never}
                    isLight={isLight}
                    historiaId={historiaAtual?.id}
                    onRoteiroUpdate={handleRoteiroUpdate as never}
                    estiloImagem={estiloAtual}
                    temasHistoria={nomesTemas as never}
                    historiaContexto={[historiaAtual?.descricao, historiaAtual?.prologo, roteiroSinopse].filter(Boolean).join(' | ')}
                    tts={tts as never}
                    mestreVoiceId={effectiveMestreVoiceId}
                    mestreVoiceProvider={effectiveMestreVoiceProvider}
                  />
                  {canMutateHistoria && (
                    <div className="mt-3">
                      <button
                        onClick={handleToggleVersoes}
                        className={`flex items-center gap-1.5 text-xs font-modern ${
                          isLight ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'
                        } transition-colors cursor-pointer`}
                      >
                        <History size={12} />
                        {versoesOpen ? 'Ocultar versões' : 'Ver versões anteriores'}
                      </button>
                      {versoesOpen && (
                        <div className={`mt-2 rounded-lg p-3 space-y-2 ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/50 border border-slate-700'}`}>
                          {versoesLoading ? (
                            <Loader2 size={16} className="animate-spin text-purple-400" />
                          ) : versoes.length === 0 ? (
                            <p className={`text-xs font-modern ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>Nenhuma versão salva.</p>
                          ) : (
                            versoes.map(v => (
                              <div key={v.id} className={`flex items-center justify-between text-xs font-modern p-2 rounded ${
                                v.ativa ? (isLight ? 'bg-purple-50 border border-purple-200' : 'bg-purple-500/10 border border-purple-500/30') : ''
                              }`}>
                                <div>
                                  <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>v{v.versao}</span>
                                  <span className={`ml-2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{v.modo} · {v.temperatura}</span>
                                  <span className={`ml-2 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{v.criado_em ? new Date(v.criado_em).toLocaleString('pt-BR') : ''}</span>
                                  {v.ativa && <span className="ml-2 text-purple-400 font-semibold">ativa</span>}
                                </div>
                                {!v.ativa && (
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleCompararVersao(v)}
                                      disabled={loadingComparacao}
                                      className="px-2 py-0.5 rounded text-xs bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 transition-colors cursor-pointer disabled:opacity-50"
                                    >
                                      {loadingComparacao ? <Loader2 size={10} className="animate-spin" /> : 'Comparar'}
                                    </button>
                                    <button
                                      onClick={() => handleAtivarVersao(v.id)}
                                      className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors cursor-pointer"
                                    >
                                      Ativar
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  </>
                ) : (
                  <div className={`p-4 rounded-lg ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/50 border border-slate-700'}`}>
                    <p className={`font-modern text-sm italic ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Nenhum roteiro gerado. Clique em "Gerar com IA" para criar um roteiro narrativo completo para esta aventura.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </RPGCard>
        </div>

        <div className="space-y-6">
          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              <Users size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
              Participantes
            </h3>
            <div className="flex items-center justify-between">
              <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Maximo de jogadores:
              </span>
              <span className="font-semibold text-cyan-400 font-modern">
                {historiaAtual.maximo_de_participantes}
              </span>
            </div>
          </RPGCard>

          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              <Crown size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
              Mestre
            </h3>
            {canMutateHistoria && editandoMestre ? (
              <div className="space-y-3">
                <select
                  value={mestreSelecionadoId || ''}
                  onChange={handleMestreSelecionadoChange}
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
                {selectedMestre && (
                  <div className="flex items-center gap-2">
                    <Badge variant="purple">
                      {selectedMestre.voice_provider === 'opensource' ? 'Open Source' : selectedMestre.voice_provider === 'cartesia' ? 'Cartesia' : 'ElevenLabs'}
                    </Badge>
                    {selectedMestre.voice_id ? (
                      <span className={`text-xs font-modern ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        {String(selectedMestre.voice_id)}
                      </span>
                    ) : null}
                  </div>
                )}
                {selectedMestre?.voice_id ? (
                  <button
                    type="button"
                    onClick={handlePreviewMestre}
                    disabled={loadingPreview}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg font-modern text-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      isLight
                        ? 'bg-purple-100 hover:bg-purple-200 text-purple-700 border border-purple-200'
                        : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30'
                    }`}
                  >
                    {loadingPreview ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : playingMestreId && String(playingMestreId) === String(selectedMestre.id) ? (
                      <Pause size={14} />
                    ) : (
                      <Play size={14} />
                    )}
                    {playingMestreId && String(playingMestreId) === String(selectedMestre.id) ? 'Pausar voz' : 'Ouvir voz do mestre'}
                  </button>
                ) : null}
                <div>
                  <p className={`text-xs font-semibold mb-2 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Qualidade do Mestre</p>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { id: 'pescador', label: 'Pescador' },
                      { id: 'poeta', label: 'Poeta' },
                      { id: 'bardo', label: 'Bardo' },
                      { id: 'profeta', label: 'Profeta' },
                      { id: 'profetisa', label: 'Profetisa' },
                    ].map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setMestreTierSelecionado(tier.id)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          mestreTierSelecionado === tier.id
                            ? 'bg-purple-600 text-white border border-purple-500'
                            : isLight
                              ? 'bg-slate-100 text-slate-600 border border-slate-200 hover:border-slate-300'
                              : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {tier.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={salvandoMestre}
                    onClick={handleSalvarMestre}
                    className="flex-1 px-3 py-1.5 rounded-lg font-modern text-sm bg-purple-600 hover:bg-purple-700 text-white transition-all cursor-pointer disabled:opacity-50"
                  >
                    {salvandoMestre ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    onClick={handleCancelarEditarMestre}
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
                <div>
                  <span className={`font-modern font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>
                    {getMestreNome(historiaAtual)}
                  </span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="purple">{mestreProviderLabel}</Badge>
                    <Badge variant="slate">
                      {({ pescador: 'Pescador', poeta: 'Poeta', bardo: 'Bardo', profeta: 'Profeta', profetisa: 'Profetisa' } as Record<string, string>)[historiaAtual?.mestre_tier || 'poeta'] || 'Poeta'}
                    </Badge>
                    {effectiveMestreVoiceId && (
                      <span className={`text-xs font-modern flex items-center gap-1 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
                        <Volume2 size={12} />
                        {effectiveMestreVoiceId}
                      </span>
                    )}
                  </div>
                </div>
                {canMutateHistoria && (
                  <button
                    onClick={handleEditarMestre}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg font-modern text-sm transition-all cursor-pointer ${
                      isLight
                        ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    }`}
                  >
                    <RefreshCw size={14} />
                    Trocar Mestre
                  </button>
                )}
              </div>
            )}
          </RPGCard>

          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              <Settings size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
              Informacoes
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Criada em:
                </span>
                <span className={`font-modern text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {formatDisplayDate(historiaAtual.created_at)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Ultima atualizacao:
                </span>
                <span className={`font-modern text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {formatDisplayDate(historiaAtual.updated_at)}
                </span>
              </div>
            </div>
          </RPGCard>

          <RPGCard className="p-6">
            <h3 className={`text-lg font-semibold font-fantasy mb-4 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
              <Target size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
              Acoes
            </h3>
            <div className="space-y-3">
              {canMutateHistoria && (
                <>
                  <button
                    onClick={handleIniciarSessao}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-modern font-semibold text-white gradient-primary transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-500/25 cursor-pointer"
                  >
                    <Play size={16} />
                    Iniciar Sessao
                  </button>
                  <CopyInviteLinkButton historiaId={historiaAtual.id} isLight={isLight} />
                </>
              )}
              <button
                onClick={handleVoltar}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-modern transition-all duration-200 cursor-pointer ${
                  isLight
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                <ArrowLeft size={16} />
                Voltar as Historias
              </button>
            </div>
          </RPGCard>
        </div>
      </div>

      <RPGCard className="p-6">
        <h3 className={`text-lg font-semibold font-fantasy mb-4 flex items-center gap-2 ${isLight ? 'text-slate-700' : 'text-white'}`}>
          <ScrollText size={18} className={isLight ? 'text-purple-500' : 'text-purple-400'} />
          Sessoes Anteriores
        </h3>

        {loadingSessoes ? (
          <div className="flex items-center gap-2 py-4">
            <Loader2 size={16} className="animate-spin text-purple-400" />
            <span className="text-slate-400 font-modern text-sm">Carregando sessoes...</span>
          </div>
        ) : sessoes.length === 0 ? (
          <p className={`font-modern text-sm italic ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Nenhuma sessao registrada para esta historia.
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
                      <span className="flex items-center gap-1" title={participantes.join(', ')}>
                        <Users size={11} /> {participantes.slice(0, 3).join(', ')}{participantes.length > 3 ? ` +${participantes.length - 3}` : ''}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </RPGCard>

      <SessaoHistoricoModal
        isOpen={!!sessaoSelecionada}
        onClose={fecharHistorico}
        sessao={sessaoSelecionada as never}
      />

      <ImageLightbox
        src={lightboxSrc ?? ''}
        alt={historiaAtual.nome}
        isOpen={!!lightboxSrc}
        onClose={handleCloseLightbox}
      />

      <RoteiroComparisonModal
        isOpen={comparacaoOpen}
        onClose={handleFecharComparacao}
        roteiroAtivo={roteiro as never}
        versaoComparacao={versaoComparacao as never}
        metadadosAtiva={metadadosAtiva as never}
        metadadosComparacao={metadadosComparacao as never}
        onAtivarVersao={metadadosComparacao ? () => {
          const v = versoes.find(v => v.versao === (metadadosComparacao.versao as number));
          if (v) handleAtivarVersao(v.id);
        } : (null as unknown as () => void)}
        isLight={isLight}
      />
    </div>
  );
};

export default VerHistoriaView;
