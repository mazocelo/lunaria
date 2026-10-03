import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, ArrowLeft, Loader2, RotateCcw, Sparkles, Trash2, Users, X } from 'lucide-react';
import { useTheme } from '../../../contexts/theme';
import { PageHeader } from '../../../components/shared';
import PersonagemPreviewCard from '../../../components/PersonagemPreviewCard';
import { parseRacaClasseBonus } from '../../../utils/personagemBonus';
import WizardCreationResultModal from './components/WizardCreationResultModal';
import HeroStrip from './components/HeroStrip';
import Stepper from './components/Stepper';
import StageFrame from './components/StageFrame';
import WizardFooter from './components/WizardFooter';
import MestrePanel from './components/MestrePanel';
import LegacyStageAdapter from './components/LegacyStageAdapter';
import MestrePensando from './components/MestrePensando';
import MestreFalaCard from './components/MestreFalaCard';
import NomeStage from './stages/NomeStage';
import CatalogStage, { type CatalogItem } from './stages/CatalogStage';
import { telaDaEtapa } from './stages/stageScreen';
import { getStageConfig } from './stages/stageConfig';
import { getProgressItems, canCreate } from './stages/stageSelectors';
import { falaDeRecusa, avisoDeFalha, type TentativaDeAvanco } from './stages/mestreFeedback';
import { bonusRacialDnd } from './stages/dnd';
import type { WizardSuggestion } from './hooks/useChatState';
import type { WizardModel } from './wizard.model';

type WizardViewProps = WizardModel;
type WizardChatProps = Parameters<typeof LegacyStageAdapter>[0];

const SIGLAS: Array<{ chave: string; sigla: string }> = [
  { chave: 'forca', sigla: 'FOR' }, { chave: 'inteligencia', sigla: 'INT' }, { chave: 'constituicao', sigla: 'CON' },
  { chave: 'agilidade', sigla: 'AGI' }, { chave: 'destreza', sigla: 'DES' }, { chave: 'carisma', sigla: 'CAR' },
];

const NOME_SISTEMA: Record<string, string> = { lunaria: 'Lunaria RPG', dnd5e: 'D&D 5e', tresdet: '3D&T Alpha' };

interface ItemDeCatalogo {
  id?: number | string | null;
  nome?: string | null;
  descricao?: string | null;
  imagem?: string | null;
  custo?: number | null;
  bonus?: unknown;
}

const WizardView = (props: WizardViewProps) => {
  const {
    etapas,
    etapaAtual,
    etapaIndex,
    mensagens,
    inputTexto,
    setInputTexto,
    enviando,
    sugestoes,
    atributosSugeridos,
    chatEndRef,
    nome,
    racaId,
    classeId,
    atributosBase,
    atributosFinal,
    vantagensIds,
    desvantagensIds,
    pontosDistribuidos,
    pontosRestantes,
    pontosTotais,
    racasDisponiveis,
    classesDisponiveis,
    vantagensDisponiveis,
    enviarMensagem,
    selecionarSugestao,
    aplicarAtributosSugeridos,
    setAtributo,
    confirmarAtributos,
    salvarPersonagem,
    avancarComMestre,
    pularEtapa,
    navegarParaEtapa,
    clearError,
    bonusAplicados,
    bonusDetalhes,
    bonusFontes,
    bonusInvalidado,
    skipVantagens,
    skipDesvantagens,
    background,
    draftRestaurado,
    descartarDraft,
    etapasConcluidas,
    etapasVisitadas,
    pontosCriacaoTotal,
    pontosCriacaoRestantes,
    pontosVantagem,
    pontosDesvantagem,
    custoRaca,
    custoClasse,
    pontosGastos,
    maxCustoDesvantagem,
    attrMin,
    attrMax,
    salvando,
    error,
    comboPreviewData,
    comboPreviewLoading,
    comboPreviewErro,
    comboPreviewTentativa,
    recarregarComboPreview,
    regenerarComboPreview,
    creationFlowStatus,
    creationResultModalOpen,
    creationResultData,
    fecharResultadoCriacao,
    irParaPersonagens,
    verFichaCriada,
    imageUrl,
    imageLoading,
    imageError,
    gerarImagem,
    grimorioMagias,
    grimorioSlots,
    grimorioSelecionadas,
    grimorioLoading,
    grimorioError,
    grimorioSelecionado,
    toggleGrimorioMagia,
    confirmarGrimorio,
    sistema,
    isTresdet,
    tresdetCaracteristicas,
    tresdetCaracteristicasConfirmadas,
    tresdetPontosTotais,
    setTresdetCaracteristica,
    confirmarTresdetCaracteristicas,
    tresdetVantagensIds,
    tresdetVantagensConfirmadas,
    toggleTresdetVantagem,
    confirmarTresdetVantagens,
    tresdetDesvantagensIds,
    tresdetDesvantagensConfirmadas,
    toggleTresdetDesvantagem,
    confirmarTresdetDesvantagens,
    isDnd5e,
    classeNome,
    dndAbilityScores,
    dndAbilitiesConfirmed,
    setDndAbilityScore,
    resetDndAbilityScores,
    confirmarDndAbilities,
    dndSkillProficiencies,
    dndSkillsConfirmed,
    toggleDndSkill,
    confirmarDndSkills,
    avancarEtapa,
    navigate,
    definirNome,
    catalogoCarregando,
    catalogoErro,
    recarregarCatalogo,
  } = props;

  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [fichaAberta, setFichaAberta] = useState(false);
  const [mestreAberto, setMestreAberto] = useState(false);
  const botaoMestreRef = useRef<HTMLButtonElement>(null);

  // Sentido da transição de etapa: estado derivado do índice anterior (padrão do React,
  // em vez de ref escrita no render, que o StrictMode renderiza duas vezes).
  const [transicao, setTransicao] = useState<{ indice: number; direcao: 1 | -1 }>({ indice: etapaIndex, direcao: 1 });
  if (transicao.indice !== etapaIndex) {
    setTransicao({ indice: etapaIndex, direcao: etapaIndex > transicao.indice ? 1 : -1 });
  }
  const { direcao } = transicao;

  // A página rola dentro do <main> do shell; a etapa nova começa do topo.
  useEffect(() => {
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [etapaIndex]);

  // Rascunho do nome: o Continuar do rodapé confirma o que está digitado. Volta ao nome do
  // modelo quando ele muda por fora (chip do Mestre, rascunho descartado).
  const [rascunhoNome, setRascunhoNome] = useState({ base: nome, valor: nome });
  if (rascunhoNome.base !== nome) setRascunhoNome({ base: nome, valor: nome });

  // Pedido de avanço pendente; vira o card de recusa se o Mestre responder sem mudar a etapa.
  // Some ao trocar de etapa, para não reaparecer quando o jogador voltar.
  const [tentativa, setTentativa] = useState<TentativaDeAvanco | null>(null);
  if (tentativa && tentativa.etapa !== etapaAtual) setTentativa(null);
  const tentarAvancar = (acao: () => void) => {
    setTentativa({ etapa: etapaAtual, qtdMensagens: mensagens.length });
    acao();
  };

  const allSelecoes = useMemo(() => [...vantagensIds, ...desvantagensIds], [vantagensIds, desvantagensIds]);

  const racaAtual = useMemo(
    () => racasDisponiveis.find(item => String(item.id) === String(racaId)),
    [racasDisponiveis, racaId],
  );

  const classeAtual = useMemo(
    () => classesDisponiveis.find(item => String(item.id) === String(classeId)),
    [classesDisponiveis, classeId],
  );

  const buildState = useMemo(() => ({
    nome, racaId, classeId, background,
    vantagensIds, desvantagensIds,
    skipVantagens, skipDesvantagens,
    bonusAplicados, bonusInvalidado,
    racaAtual, classeAtual,
    orcamentoCriacaoValido: pontosCriacaoRestantes >= 0,
    pontosCriacaoRestantes,
    grimorioSelecionado,
    caracteristicasDistribuidas: tresdetCaracteristicasConfirmadas,
    vantagensSelecionadas: tresdetVantagensConfirmadas,
    desvantagensSelecionadas: tresdetDesvantagensConfirmadas,
    magiasSelecionadas: grimorioSelecionado,
    dndAbilitiesConfirmed,
    dndSkillsConfirmed,
  }), [
    nome, racaId, classeId, background,
    vantagensIds, desvantagensIds,
    skipVantagens, skipDesvantagens,
    bonusAplicados, bonusInvalidado,
    racaAtual, classeAtual,
    pontosCriacaoRestantes,
    grimorioSelecionado,
    tresdetCaracteristicasConfirmadas,
    tresdetVantagensConfirmadas,
    tresdetDesvantagensConfirmadas,
    dndAbilitiesConfirmed,
    dndSkillsConfirmed,
  ]);

  const podeCriar = useMemo(() => canCreate(buildState, sistema), [buildState, sistema]);
  const progressoItems = useMemo(() => getProgressItems(buildState, sistema), [buildState, sistema]);
  const creationStatusLabel = useMemo(() => {
    switch (creationFlowStatus) {
      case 'creating_character':
        return 'Criando a ficha';
      case 'generating_background':
        return 'Escrevendo o background';
      case 'opening_result':
        return 'Registrando a leitura do Mestre';
      default:
        return '';
    }
  }, [creationFlowStatus]);

  const config = getStageConfig(etapaAtual, sistema);
  const etapaProxima = etapas[etapaIndex + 1] ?? null;
  const concluidasCount = progressoItems.filter((i) => i.done).length;
  const tela = telaDaEtapa(etapaAtual, sistema);
  // Até a Task 20, só Nome/Raça/Classe têm tela própria; o resto continua no LegacyStageAdapter.
  const legado = tela !== 'nome' && tela !== 'catalogo-raca' && tela !== 'catalogo-classe';
  // canContinueStage não cobre Nome/Raça/Classe; nessas telas basta o campo do modelo estar preenchido.
  const podeContinuar = tela === 'nome' ? Boolean(rascunhoNome.valor.trim())
    : tela === 'catalogo-raca' ? racaId != null
    : tela === 'catalogo-classe' ? classeId != null
    : false;

  const sugestoesDaUltima = useMemo(() => {
    const ultima = [...mensagens].reverse().find((m) => m.role === 'mestre');
    return (ultima?.sugestoes ?? []) as WizardSuggestion[];
  }, [mensagens]);
  const nomesSugeridos = sugestoesDaUltima.filter((s) => s.tipo === 'nome').map((s) => String(s.nome ?? '')).filter(Boolean);
  // Filtra por tipo: ids de raça e de classe podem coincidir.
  const idsSugeridos = (tipo: 'raca' | 'classe') => sugestoesDaUltima
    .filter((s) => s.tipo === tipo)
    .map((s) => s.id)
    .filter((id): id is string | number => id != null);

  const paraItem = (x: ItemDeCatalogo): CatalogItem | null =>
    x.id == null ? null : {
      id: x.id,
      nome: x.nome ?? '',
      descricao: x.descricao ?? null,
      imagem: x.imagem ?? null,
      custo: typeof x.custo === 'number' ? x.custo : null,
      detalhe: descreverBonus(x.bonus),
    };

  const escolherDoCatalogo = (tipo: 'raca' | 'classe', item: CatalogItem) => {
    const sugestao: WizardSuggestion = { tipo, id: item.id, nome: item.nome, descricao: item.descricao, custo: item.custo ?? 0 };
    selecionarSugestao(sugestao);
    tentarAvancar(() => {
      if (tipo === 'raca') avancarComMestre({ raca_id: item.id, raca_nome: item.nome });
      else avancarComMestre({ classe_id: item.id, classe_nome: item.nome });
    });
  };

  const escolherSugestaoDoMestre = (s: WizardSuggestion) => {
    selecionarSugestao(s);
    if (s.tipo === 'raca') tentarAvancar(() => avancarComMestre({ raca_id: s.id, raca_nome: s.nome }));
    else if (s.tipo === 'classe') tentarAvancar(() => avancarComMestre({ classe_id: s.id, classe_nome: s.nome }));
    setMestreAberto(false);
  };

  const continuarNome = () => {
    const valor = rascunhoNome.valor.trim();
    if (!valor) return;
    if (valor !== nome) definirNome(valor);
    tentarAvancar(() => avancarComMestre({ nome: valor }));
  };

  const recusa = legado ? null : falaDeRecusa(tentativa, etapaAtual, enviando, mensagens);
  const falhaDoMestre = legado ? null : avisoDeFalha(mensagens, etapaAtual);
  const abrirConversa = () => { setTentativa(null); setMestreAberto(true); };

  const onVoltar = () => {
    const anterior = etapas[etapaIndex - 1];
    if (anterior) navegarParaEtapa(anterior.id);
  };

  const atributosStrip = SIGLAS.map(({ chave, sigla }) => ({ chave, sigla, valor: Number(atributosFinal[chave] ?? 0) }));

  return (
    <div className="animate-fade-in mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Novo personagem"
        subtitle={`${NOME_SISTEMA[sistema] ?? sistema} · etapa ${etapaIndex + 1} de ${etapas.length}`}
        icon={Users}
        actions={
          <>
            <button type="button" data-acao="sair" onClick={() => navigate('/personagens')} title="Sair do wizard. Seu rascunho fica salvo." className="btn-rpg-secondary inline-flex items-center gap-2 cursor-pointer">
              <ArrowLeft size={16} />
              <span>Sair</span>
            </button>
            <button type="button" ref={botaoMestreRef} data-acao="abrir-mestre" onClick={() => setMestreAberto(true)} className="btn-rpg-secondary inline-flex items-center gap-2 cursor-pointer">
              <Sparkles size={16} />
              <span className="hidden sm:inline">Pedir sugestão ao Mestre</span>
              <span className="sm:hidden">Mestre</span>
            </button>
          </>
        }
      />

      <HeroStrip
        nome={nome}
        racaNome={racaAtual?.nome ?? null}
        classeNome={classeAtual?.nome ?? null}
        imageUrl={imageUrl}
        atributos={atributosStrip}
        etapasConcluidas={concluidasCount}
        etapasTotal={progressoItems.length}
        pontosRestantes={sistema === 'lunaria' ? pontosCriacaoRestantes : null}
        expandida={fichaAberta}
        onToggle={() => setFichaAberta((v) => !v)}
        isLight={isLight}
      >
        {/* variant default: a "wizard" depende de .wizard-atelier, que só existe dentro do LegacyStageAdapter. */}
        <PersonagemPreviewCard
          nome={nome}
          raca={racaId}
          classe={classeId}
          atributos={atributosFinal}
          vantagensSelecionadas={allSelecoes}
          vantagensDisponiveis={vantagensDisponiveis}
          racasDisponiveis={racasDisponiveis}
          classesDisponiveis={classesDisponiveis}
          bonusJaAplicado={true}
          mostrarPendencias={true}
          bonusAplicados={bonusAplicados}
          skipVantagens={skipVantagens}
          skipDesvantagens={skipDesvantagens}
        />
      </HeroStrip>

      <Stepper
        etapas={etapas}
        etapaIndex={etapaIndex}
        etapasConcluidas={etapasConcluidas}
        etapasVisitadas={etapasVisitadas}
        puladas={[...(skipVantagens ? ['vantagens'] : []), ...(skipDesvantagens ? ['desvantagens'] : [])]}
        onEtapaClick={navegarParaEtapa}
        isLight={isLight}
      />

      {(error || bonusInvalidado || draftRestaurado) && (
        <div className="space-y-3">
          {error && (
            <div className="card-rpg flex items-center gap-3 border border-red-500/30 bg-red-500/10 !py-3">
              <AlertCircle size={16} className="shrink-0 text-red-400" />
              <span className={`flex-1 font-modern text-sm ${isLight ? 'text-red-700' : 'text-red-200'}`}>{error}</span>
              <button type="button" onClick={clearError} aria-label="Fechar aviso" className="cursor-pointer opacity-70 hover:opacity-100"><X size={16} /></button>
            </div>
          )}
          {bonusInvalidado && (
            <div className="card-rpg flex items-start gap-3 border border-amber-500/30 bg-amber-500/10 !py-3">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
              <div className="font-modern text-sm">
                <p className="font-semibold">Bônus precisam de reconfirmação</p>
                <p className="opacity-80">Você mudou raça ou classe. Reconfirme os atributos antes de finalizar.</p>
              </div>
            </div>
          )}
          {draftRestaurado && (
            <div className="card-rpg flex items-center gap-3 !py-3">
              <RotateCcw size={16} className="shrink-0 text-[var(--primary)]" />
              <div className="flex-1 font-modern text-sm">
                <p className="font-semibold">Rascunho restaurado</p>
                <p className="opacity-80">Continuamos de onde você parou.</p>
              </div>
              <button type="button" onClick={descartarDraft} className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/15 px-3 py-1.5 font-modern text-xs font-semibold text-red-400 hover:bg-red-500/25 cursor-pointer">
                <Trash2 size={12} /> Descartar
              </button>
            </div>
          )}
        </div>
      )}

      <StageFrame etapaId={etapaAtual} titulo={config.label} flavor={config.flavor} direcao={direcao} isLight={isLight}>
        {falhaDoMestre && (
          <div role="status" aria-live="polite" data-mestre="falha" className="card-rpg mb-4 flex items-start gap-3 border border-amber-500/30 bg-amber-500/10 !py-3">
            <AlertTriangle size={16} className={`mt-0.5 shrink-0 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
            <div className={`flex-1 font-modern text-sm ${isLight ? 'text-amber-900' : 'text-amber-100'}`}>
              <p className="font-semibold">O Mestre não respondeu desta vez</p>
              <p className="opacity-90">Você pode seguir sozinho por esta tela ou pedir sugestões de novo.</p>
            </div>
            <button type="button" onClick={abrirConversa} className={`shrink-0 font-modern text-sm font-semibold cursor-pointer ${isLight ? 'text-amber-800' : 'text-amber-200'}`}>Abrir conversa</button>
          </div>
        )}
        {tela === 'nome' && (
          <NomeStage
            rascunho={rascunhoNome.valor}
            onRascunhoChange={(valor) => setRascunhoNome({ base: nome, valor })}
            sugestoes={nomesSugeridos}
            enviando={enviando}
            onConfirmar={continuarNome}
            onPedirSugestoes={() => enviarMensagem(config.refreshPrompt ?? 'Sugira nomes para o meu herói', { manterEtapa: true })}
            nomeSistema={NOME_SISTEMA[sistema] ?? sistema}
            isLight={isLight}
          />
        )}
        {tela === 'catalogo-raca' && (
          <CatalogStage
            itens={racasDisponiveis.map(paraItem).filter((i): i is CatalogItem => i !== null)}
            selecionados={racaId != null ? [racaId] : []}
            modo="unica"
            sugeridos={idsSugeridos('raca')}
            enviando={enviando}
            onSelecionar={(item) => escolherDoCatalogo('raca', item)}
            carregando={catalogoCarregando.raca}
            erro={catalogoErro.raca}
            onTentarDeNovo={() => recarregarCatalogo('raca')}
            textoVazio="Nenhuma raça cadastrada para este sistema"
            textoErro="Não conseguimos carregar as raças"
            catalogoHref="/racas"
            rotuloBusca="Buscar raça..."
            isLight={isLight}
          />
        )}
        {tela === 'catalogo-classe' && (
          <CatalogStage
            itens={classesDisponiveis.map(paraItem).filter((i): i is CatalogItem => i !== null)}
            selecionados={classeId != null ? [classeId] : []}
            modo="unica"
            sugeridos={idsSugeridos('classe')}
            enviando={enviando}
            onSelecionar={(item) => escolherDoCatalogo('classe', item)}
            carregando={catalogoCarregando.classe}
            erro={catalogoErro.classe}
            onTentarDeNovo={() => recarregarCatalogo('classe')}
            textoVazio="Nenhuma classe cadastrada para este sistema"
            textoErro="Não conseguimos carregar as classes"
            catalogoHref="/classes"
            rotuloBusca="Buscar classe..."
            isLight={isLight}
          />
        )}
        {legado && (
          <LegacyStageAdapter
            theme={theme}
            mensagens={mensagens}
            inputTexto={inputTexto}
            setInputTexto={setInputTexto}
            enviando={enviando}
            onEnviar={enviarMensagem}
            onSelecionarSugestao={selecionarSugestao}
            onAvancarComMestre={avancarComMestre}
            onPularEtapa={pularEtapa}
            vantagensIds={vantagensIds}
            desvantagensIds={desvantagensIds}
            etapaAtual={etapaAtual}
            racasDisponiveis={racasDisponiveis as unknown as WizardChatProps['racasDisponiveis']}
            classesDisponiveis={classesDisponiveis as unknown as WizardChatProps['classesDisponiveis']}
            vantagensDisponiveis={vantagensDisponiveis as unknown as WizardChatProps['vantagensDisponiveis']}
            chatEndRef={chatEndRef}
            isLight={isLight}
            podeCriar={podeCriar}
            atributos={atributosBase}
            atributosFinal={atributosFinal}
            setAtributo={setAtributo}
            pontosDistribuidos={pontosDistribuidos}
            pontosRestantes={pontosRestantes}
            pontosTotais={pontosTotais}
            atributosSugeridos={atributosSugeridos}
            aplicarAtributosSugeridos={aplicarAtributosSugeridos}
            bonusAplicados={bonusAplicados}
            bonusDetalhes={bonusDetalhes}
            bonusFontes={bonusFontes}
            pontosCriacaoTotal={pontosCriacaoTotal}
            pontosCriacaoRestantes={pontosCriacaoRestantes}
            pontosGastos={pontosGastos}
            pontosVantagem={pontosVantagem}
            pontosDesvantagem={pontosDesvantagem}
            custoRaca={custoRaca}
            custoClasse={custoClasse}
            maxCustoDesvantagem={maxCustoDesvantagem}
            skipVantagens={skipVantagens}
            skipDesvantagens={skipDesvantagens}
            attrMin={attrMin}
            attrMax={attrMax}
            onConfirmarAtributos={confirmarAtributos}
            onSalvarPersonagem={salvarPersonagem}
            salvando={salvando}
            comboPreviewData={comboPreviewData}
            comboPreviewLoading={comboPreviewLoading}
            comboPreviewErro={comboPreviewErro}
            comboPreviewTentativa={comboPreviewTentativa}
            onRegenerarComboPreview={regenerarComboPreview}
            onRecarregarComboPreview={recarregarComboPreview}
            creationFlowStatus={creationFlowStatus}
            sugestoes={sugestoes}
            imageUrl={imageUrl}
            imageLoading={imageLoading}
            imageError={imageError}
            grimorioMagias={grimorioMagias}
            grimorioSlots={grimorioSlots}
            grimorioSelecionadas={grimorioSelecionadas}
            grimorioLoading={grimorioLoading}
            grimorioError={grimorioError}
            onToggleGrimorioMagia={toggleGrimorioMagia}
            onConfirmarGrimorio={confirmarGrimorio}
            onGerarImagem={() => gerarImagem({
              nome,
              racaNome: racaAtual?.nome,
              classeNome: classeAtual?.nome,
              background,
              vantagensNomes: vantagensIds.map(id => vantagensDisponiveis.find(v => String(v.id) === String(id))?.nome).filter((n): n is string => Boolean(n)),
              desvantagensNomes: desvantagensIds.map(id => vantagensDisponiveis.find(v => String(v.id) === String(id))?.nome).filter((n): n is string => Boolean(n)),
            })}
            sistema={sistema}
            isTresdet={isTresdet}
            tresdetCaracteristicas={tresdetCaracteristicas}
            tresdetCaracteristicasConfirmadas={tresdetCaracteristicasConfirmadas}
            tresdetPontosTotais={tresdetPontosTotais}
            onSetTresdetCaracteristica={setTresdetCaracteristica}
            onConfirmarTresdetCaracteristicas={confirmarTresdetCaracteristicas}
            tresdetVantagensIds={tresdetVantagensIds}
            tresdetVantagensConfirmadas={tresdetVantagensConfirmadas}
            onToggleTresdetVantagem={toggleTresdetVantagem}
            onConfirmarTresdetVantagens={confirmarTresdetVantagens}
            tresdetDesvantagensIds={tresdetDesvantagensIds}
            tresdetDesvantagensConfirmadas={tresdetDesvantagensConfirmadas}
            onToggleTresdetDesvantagem={toggleTresdetDesvantagem}
            onConfirmarTresdetDesvantagens={confirmarTresdetDesvantagens}
            isDnd5e={isDnd5e}
            classeNome={classeNome}
            dndAbilityScores={dndAbilityScores}
            dndAbilitiesConfirmed={dndAbilitiesConfirmed}
            onSetDndAbilityScore={setDndAbilityScore}
            onResetDndAbilityScores={resetDndAbilityScores}
            onConfirmarDndAbilities={confirmarDndAbilities}
            dndSkillProficiencies={dndSkillProficiencies}
            dndSkillsConfirmed={dndSkillsConfirmed}
            onToggleDndSkill={toggleDndSkill}
            onConfirmarDndSkills={confirmarDndSkills}
            /* Só exibição (L-14): o POST de criação manda a distribuição sem bônus. */
            dndRacialBonuses={bonusRacialDnd(racaAtual)}
            onAvancarEtapa={avancarEtapa}
          />
        )}
      </StageFrame>

      {!legado && enviando && <MestrePensando isLight={isLight} />}
      {recusa && (
        <MestreFalaCard
          fala={String(recusa.content ?? '')}
          onAbrirConversa={abrirConversa}
          onFechar={() => setTentativa(null)}
          isLight={isLight}
        />
      )}

      <WizardFooter
        etapaIndex={etapaIndex}
        etapasTotal={etapas.length}
        proximaLabel={etapaProxima?.label ?? null}
        podeContinuar={podeContinuar}
        enviando={enviando}
        onVoltar={onVoltar}
        onContinuar={legado ? undefined : tela === 'nome' ? continuarNome : () => tentarAvancar(() => avancarComMestre())}
        isLight={isLight}
      />

      <MestrePanel
        aberto={mestreAberto}
        onFechar={() => setMestreAberto(false)}
        mensagens={mensagens}
        enviando={enviando}
        inputTexto={inputTexto}
        setInputTexto={setInputTexto}
        etapaAtual={etapaAtual}
        sistema={sistema}
        onEnviar={enviarMensagem}
        onEscolherSugestao={escolherSugestaoDoMestre}
        focoAoFechar={botaoMestreRef}
        isLight={isLight}
      />

      {creationFlowStatus !== 'idle' && !creationResultModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-md">
          <div className="card-rpg max-w-md text-center">
            <Loader2 size={28} className="mx-auto animate-spin text-[var(--primary)]" />
            <h2 className={`mt-4 font-fantasy text-2xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{creationStatusLabel}</h2>
            <p className={`mt-2 font-modern text-sm ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>A ficha, o background e a leitura final do Mestre estão sendo consolidados.</p>
          </div>
        </div>
      )}

      <WizardCreationResultModal
        open={creationResultModalOpen}
        data={creationResultData as unknown as Parameters<typeof WizardCreationResultModal>[0]['data']}
        onViewSheet={verFichaCriada}
        onGoToCharacters={irParaPersonagens}
        onClose={fecharResultadoCriacao}
        isLight={isLight}
      />
    </div>
  );
};

/** "+1 Destreza, +1 Agilidade" a partir do bonus do catálogo; null quando vazio. */
function descreverBonus(bonus: unknown): string | null {
  const mapa = parseRacaClasseBonus(bonus);
  if (!mapa) return null;
  const partes = Object.entries(mapa)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k.charAt(0).toUpperCase()}${k.slice(1)}`);
  return partes.length ? partes.join(', ') : null;
}

export default WizardView;
