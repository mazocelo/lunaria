import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, ArrowLeft, Loader2, RotateCcw, Sparkles, Users, X } from 'lucide-react';
import { useTheme } from '../../../contexts/theme';
import { ConfirmDialog, FOCO, PageHeader } from '../../../components/shared';
import PersonagemPreviewCard from '../../../components/PersonagemPreviewCard';
import { parseRacaClasseBonus } from '../../../utils/personagemBonus';
import WizardCreationResultModal from './components/WizardCreationResultModal';
import HeroStrip from './components/HeroStrip';
import Stepper from './components/Stepper';
import StageFrame from './components/StageFrame';
import WizardFooter from './components/WizardFooter';
import MestrePanel from './components/MestrePanel';
import EquipamentosBlock from './components/EquipamentosBlock';
import GrimorioBlock from './components/GrimorioBlock';
import DnDAbilityScoreBlock from './components/DnDAbilityScoreBlock';
import DnDSkillsBlock from './components/DnDSkillsBlock';
import DestinoResolutivaBlock from './components/DestinoResolutivaBlock';
import MestrePensando from './components/MestrePensando';
import MestreFalaCard from './components/MestreFalaCard';
import NomeStage from './stages/NomeStage';
import CatalogStage, { type CatalogItem } from './stages/CatalogStage';
import BackgroundStage from './stages/BackgroundStage';
import OrcamentoBar from './stages/OrcamentoBar';
import AtributosStage from './stages/AtributosStage';
import ResumoStage, { type ResumoStageProps } from './stages/ResumoStage';
import { telaDaEtapa, regraDoRodape } from './stages/stageScreen';
import { getStageConfig } from './stages/stageConfig';
import { getProgressItems } from './stages/stageSelectors';
import { motivosDeBloqueio, pontosDevolvidos, saldoAposTroca } from './stages/orcamento';
import { formatarCustoTraco } from './stages/custoTraco';
import { etapasAfetadas, precisaConfirmarTroca } from './stages/invalidacao';
import { falaDeRecusa, avisoDeFalha, type TentativaDeAvanco } from './stages/mestreFeedback';
import { bonusRacialDnd, maxPericiasDaClasse } from './stages/dnd';
import { siglasDaFaixa } from './stages/atributos';
import { listarPendencias } from './stages/pendencias';
import { parseBonusVantagens } from '../../../utils/bonusTracos';
import { SKILLS } from '../../../utils/dnd5eData';
import type { WizardSuggestion } from './hooks/useChatState';
import type { WizardModel } from './wizard.model';

type WizardViewProps = WizardModel;
type TipoTraco = 'vantagem' | 'desvantagem';

const NOME_SISTEMA: Record<string, string> = { lunaria: 'Lunaria RPG', dnd5e: 'D&D 5e', tresdet: '3D&T Alpha' };

interface ItemDeCatalogo {
  id?: number | string | null;
  nome?: string | null;
  descricao?: string | null;
  imagem?: string | null;
  custo?: number | null;
  bonus?: unknown;
  nivel?: number | null;
}

/** "Atributos", "Atributos e Equipamentos", "Atributos, Equipamentos e Grimório". */
const juntar = (nomes: string[]) => nomes.length <= 1 ? (nomes[0] ?? '') : `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`;

const rolagem = (): ScrollBehavior =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

const WizardView = (props: WizardViewProps) => {
  const {
    etapas,
    etapaAtual,
    etapaIndex,
    mensagens,
    inputTexto,
    setInputTexto,
    enviando,
    atributosSugeridos,
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
    bonusFontes,
    bonusInvalidado,
    skipVantagens,
    skipDesvantagens,
    background,
    draftRestaurado,
    setDraftRestaurado,
    resetarTudo,
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
    removerSelecao,
    etapasInvalidadas,
    limparInvalidadas,
    definirBackground,
    redistribuirAtributos,
    editarDndAtributos,
    editarDndPericias,
    recarregarGrimorio,
    multRaca,
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

  // A página rola dentro do <main> do shell; a etapa nova começa do topo e o foco vai ao
  // título (MA:G6), menos na primeira montagem, para não roubar o foco ao abrir a página.
  const primeiraMontagem = useRef(true);
  useEffect(() => {
    document.querySelector('main')?.scrollTo?.({ top: 0, behavior: rolagem() });
    if (primeiraMontagem.current) { primeiraMontagem.current = false; return; }
    document.getElementById('etapa-titulo')?.focus({ preventScroll: true });
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
    dndAbilitiesConfirmed,
    dndSkillsConfirmed,
  ]);

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
  const labelDe = (id: string) => etapas.find((e) => e.id === id)?.label ?? id;

  const sugestoesDaUltima = useMemo(() => {
    const ultima = [...mensagens].reverse().find((m) => m.role === 'mestre');
    return (ultima?.sugestoes ?? []) as WizardSuggestion[];
  }, [mensagens]);
  const nomesSugeridos = sugestoesDaUltima.filter((s) => s.tipo === 'nome').map((s) => String(s.nome ?? '')).filter(Boolean);
  const sugestoesBackground = sugestoesDaUltima
    .filter((s) => s.tipo === 'background' && s.nome)
    .map((s) => ({ nome: String(s.nome), descricao: typeof s.descricao === 'string' ? s.descricao : null }));
  // Filtra por tipo: ids de raça e de classe (e de vantagem e desvantagem) podem coincidir.
  const idsSugeridos = (tipo: 'raca' | 'classe' | TipoTraco) => sugestoesDaUltima
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
      tracos: tracosConcedidos(x.bonus),
    };

  // Seleção (A16/A17/A20): a carta só seleciona; quem avança é o rodapé. Troca que derruba
  // etapa feita ou deixa o saldo negativo passa antes pelo diálogo.
  const [troca, setTroca] = useState<{ tipo: 'raca' | 'classe'; item: CatalogItem; afetadas: string[]; saldo: number | null; primeira: boolean } | null>(null);
  const saldoCom = (tipo: 'raca' | 'classe', custoNovo: number | null | undefined) =>
    sistema === 'lunaria' ? saldoAposTroca(pontosCriacaoRestantes, tipo === 'raca' ? custoRaca : custoClasse, custoNovo ?? 0) : null;
  const aplicarEscolha = (tipo: 'raca' | 'classe', item: CatalogItem) =>
    selecionarSugestao({ tipo, id: item.id, nome: item.nome, descricao: item.descricao, custo: item.custo ?? 0 });
  const escolherDoCatalogo = (tipo: 'raca' | 'classe', item: CatalogItem) => {
    const idAtual = tipo === 'raca' ? racaId : classeId;
    const saldo = saldoCom(tipo, item.custo);
    const depois = { racaId: tipo === 'raca' ? item.id : racaId, classeId: tipo === 'classe' ? item.id : classeId, vantagensIds, desvantagensIds };
    const racaNova = tipo === 'raca' ? racasDisponiveis.find((r) => String(r.id) === String(item.id)) : undefined;
    const afetadas = etapasAfetadas({ racaId, classeId, vantagensIds, desvantagensIds }, depois, {
      bonusAplicados, comboPronto: Boolean(comboPreviewData), grimorioSelecionado, dndAbilitiesConfirmed, dndSkillsConfirmed,
      racaDaBonusDnd: tipo === 'raca' && [racaNova, racaAtual].some((r) => Object.keys(bonusRacialDnd(r)).length > 0),
    }, sistema);
    if (precisaConfirmarTroca(etapasConcluidas.includes(tipo === 'raca' ? 'raca' : 'classe'), idAtual, item.id, afetadas, saldo)) {
      setTroca({ tipo, item, afetadas, saldo, primeira: idAtual == null });
      return;
    }
    aplicarEscolha(tipo, item);
  };

  const escolherSugestaoDoMestre = (s: WizardSuggestion) => {
    setMestreAberto(false);
    if (s.tipo === 'raca' || s.tipo === 'classe') {
      const lista: ItemDeCatalogo[] = s.tipo === 'raca' ? racasDisponiveis : classesDisponiveis;
      const doCatalogo = lista.find((x) => String(x.id) === String(s.id));
      const item = doCatalogo ? paraItem(doCatalogo) : s.id != null ? { id: s.id, nome: String(s.nome ?? ''), custo: typeof s.custo === 'number' ? s.custo : null } : null;
      if (item) escolherDoCatalogo(s.tipo, item);
      return;
    }
    selecionarSugestao(s);
  };

  // Vantagens e desvantagens vêm no mesmo catálogo; o sinal do custo separa (ver vantagem-desvantagem.ts).
  const tipoTraco: TipoTraco | null = tela === 'catalogo-vantagem' ? 'vantagem' : tela === 'catalogo-desvantagem' ? 'desvantagem' : null;
  const ehDoTipo = (tipo: TipoTraco, x: ItemDeCatalogo) => tipo === 'vantagem' ? (Number(x.custo) || 0) >= 0 : (Number(x.custo) || 0) < 0;
  const tracoPorId = (tipo: TipoTraco, id: number | string) =>
    (vantagensDisponiveis as ItemDeCatalogo[]).find((x) => String(x.id) === String(id) && ehDoTipo(tipo, x));
  const itensTraco = (tipo: TipoTraco) => (vantagensDisponiveis as ItemDeCatalogo[]).filter((x) => ehDoTipo(tipo, x));
  const idsTraco = (tipo: TipoTraco) => tipo === 'vantagem' ? vantagensIds : desvantagensIds;
  const escolhidasTraco = (tipo: TipoTraco) => idsTraco(tipo).map((id) => {
    const x = tracoPorId(tipo, id);
    return { id, nome: x?.nome ?? String(id), custo: Number(x?.custo) || 0 };
  });

  const continuarNome = () => {
    const valor = rascunhoNome.valor.trim();
    if (!valor) return;
    if (valor !== nome) definirNome(valor);
    tentarAvancar(() => avancarComMestre({ nome: valor }));
  };

  const recusa = falaDeRecusa(tentativa, etapaAtual, enviando, mensagens);
  const falhaDoMestre = avisoDeFalha(mensagens, etapaAtual);
  const abrirConversa = () => { setTentativa(null); setMestreAberto(true); };

  const onVoltar = () => {
    const anterior = etapas[etapaIndex - 1];
    if (anterior) navegarParaEtapa(anterior.id);
  };

  // D&D: só exibição do bônus racial (L-14); o POST manda a distribuição sem ele.
  const bonusRacial = isDnd5e ? bonusRacialDnd(racaAtual) : {};
  const atributosDndExibidos: Record<string, number | null> = Object.fromEntries(
    ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'].map((k) => {
      const v = dndAbilityScores?.[k];
      return [k, typeof v === 'number' ? v + (bonusRacial[k] ?? 0) : null];
    }),
  );
  const atributosStrip = siglasDaFaixa(sistema, atributosFinal, atributosDndExibidos);
  const pendencias = listarPendencias({
    sistema, nome, racaId, classeId, background, vantagensIds, desvantagensIds, skipVantagens, skipDesvantagens,
    bonusAplicados, comboPronto: Boolean(comboPreviewData), pontosCriacaoRestantes, dndAbilitiesConfirmed, dndSkillsConfirmed,
  });

  // Rodapé (decisão 4): toda etapa avança, confirma ou cria por aqui; desabilitado, diz por quê.
  const regra = regraDoRodape(tela, {
    nome: tela === 'nome' ? rascunhoNome.valor : nome, racaId, classeId, background, vantagensIds, desvantagensIds, skipVantagens, skipDesvantagens,
    bonusAplicados, pontosRestantes, dndAbilitiesConfirmed,
    dndAtribuidos: Object.values(dndAbilityScores ?? {}).filter((v) => v != null).length,
    dndSkillsConfirmed, dndPericiasEscolhidas: dndSkillProficiencies.length, dndPericiasMax: maxPericiasDaClasse(classeNome ?? ''),
    comboPronto: Boolean(comboPreviewData), comboCarregando: comboPreviewLoading, grimorioEscolhidas: grimorioSelecionadas.length,
    grimorioErro: Boolean(grimorioError), pendencias: pendencias.map((p) => p.texto),
  });

  // Atributos (decisão do dono): um clique só. O Continuar confirma e o avanço espera o bônus
  // aplicar, para o Mestre receber o estado já com os atributos confirmados.
  const avancarAposBonus = useRef(false);
  const avancarAgora = useRef(() => {});
  useEffect(() => { avancarAgora.current = () => tentarAvancar(() => avancarComMestre()); });
  useEffect(() => {
    if (etapaAtual !== 'atributos') { avancarAposBonus.current = false; return; }
    if (!avancarAposBonus.current || !bonusAplicados) return;
    avancarAposBonus.current = false;
    avancarAgora.current();
  }, [bonusAplicados, etapaAtual]);

  const agir = () => {
    switch (regra.acao) {
      case 'local': avancarEtapa(); break;
      case 'confirmar-atributos': avancarAposBonus.current = true; confirmarAtributos(); break;
      case 'confirmar-dnd-atributos': confirmarDndAbilities(); avancarEtapa(); break;
      case 'confirmar-dnd-pericias': confirmarDndSkills(); avancarEtapa(); break;
      case 'confirmar-grimorio': confirmarGrimorio(); break;
      case 'criar': void salvarPersonagem(); break;
      default:
        if (tela === 'nome') continuarNome();
        else tentarAvancar(() => avancarComMestre());
    }
  };

  // Lunaria: a carta de raça/classe já avisa quanto o saldo ficaria (decisão do dono).
  const avisosDeSaldo = (tipo: 'raca' | 'classe', itens: CatalogItem[]) => {
    const idAtual = tipo === 'raca' ? racaId : classeId;
    const avisos: Record<string, string> = {};
    for (const item of itens) {
      const saldo = saldoCom(tipo, item.custo);
      if (saldo != null && saldo < 0 && String(item.id) !== String(idAtual)) avisos[String(item.id)] = `Seu saldo ficaria ${saldo}`;
    }
    return avisos;
  };
  const itensRaca = racasDisponiveis.map(paraItem).filter((i): i is CatalogItem => i !== null);
  const itensClasse = classesDisponiveis.map(paraItem).filter((i): i is CatalogItem => i !== null);

  const comCusto = (e: { nome: string; custo: number }) => ({ nome: e.nome, detalhe: formatarCustoTraco(e.custo).texto, classe: formatarCustoTraco(e.custo).classe });
  const magiasEscolhidas = grimorioMagias
    .filter((m) => grimorioSelecionadas.some((id) => String(id) === String(m.id)))
    .map((m) => ({ nome: String(m.nome ?? m.id) }));
  const escolhasResumo: ResumoStageProps['escolhas'] = sistema === 'dnd5e'
    ? [
      { titulo: 'Antecedente', etapa: 'background', itens: background.trim() ? [{ nome: background.trim().length > 80 ? `${background.trim().slice(0, 80)}…` : background.trim() }] : [] },
      { titulo: 'Perícias', etapa: 'skills', itens: dndSkillProficiencies.map((id) => ({ nome: SKILLS.find((sk) => sk.id === id)?.nome ?? id })) },
    ]
    : [
      { titulo: 'Vantagens', etapa: 'vantagens', itens: escolhidasTraco('vantagem').map(comCusto) },
      { titulo: 'Desvantagens', etapa: 'desvantagens', itens: escolhidasTraco('desvantagem').map(comCusto) },
      ...(etapas.some((e) => e.id === 'grimorio')
        ? [{ titulo: `Magias (${grimorioSelecionadas.length}/${grimorioSlots} slots)`, etapa: 'grimorio', itens: magiasEscolhidas }]
        : []),
    ];

  const [confirmarDescarte, setConfirmarDescarte] = useState(false);
  const invalidadasLabels = etapasInvalidadas.map(labelDe);
  const gerarRetrato = () => gerarImagem({
    nome,
    racaNome: racaAtual?.nome,
    classeNome: classeAtual?.nome,
    background,
    vantagensNomes: escolhidasTraco('vantagem').map((e) => e.nome),
    desvantagensNomes: escolhidasTraco('desvantagem').map((e) => e.nome),
  });

  const ficha = (
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
      sistema={isDnd5e ? 'dnd5e' : 'lunaria'}
      background={background}
      pendencias={pendencias}
      atributosDnd={atributosDndExibidos}
    />
  );

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
        {ficha}
      </HeroStrip>

      <Stepper
        etapas={etapas}
        etapaIndex={etapaIndex}
        etapasConcluidas={etapasConcluidas}
        etapasVisitadas={etapasVisitadas}
        puladas={[...(skipVantagens ? ['vantagens'] : []), ...(skipDesvantagens ? ['desvantagens'] : [])]}
        invalidadas={etapasInvalidadas}
        onEtapaClick={navegarParaEtapa}
        isLight={isLight}
      />

      {(error || etapasInvalidadas.length > 0 || draftRestaurado) && (
        <div className="space-y-3">
          {error && (
            <div role="alert" className="card-rpg flex items-center gap-3 border border-red-500/30 bg-red-500/10 !py-3">
              <AlertCircle size={16} aria-hidden="true" className="shrink-0 text-red-500" />
              <span className={`flex-1 font-modern text-sm ${isLight ? 'text-red-700' : 'text-red-200'}`}>{error}</span>
              <button type="button" aria-label="Fechar aviso" onClick={clearError} className={`rounded p-1 cursor-pointer opacity-70 hover:opacity-100 ${FOCO}`}><X size={16} aria-hidden="true" /></button>
            </div>
          )}
          {etapasInvalidadas.length > 0 && (
            <div role="status" data-banner="invalidadas" className="card-rpg flex flex-wrap items-start gap-3 border border-amber-500/30 bg-amber-500/10 !py-3">
              <AlertTriangle size={16} aria-hidden="true" className={`mt-0.5 shrink-0 ${isLight ? 'text-amber-700' : 'text-amber-400'}`} />
              <p className="min-w-0 flex-1 font-modern text-sm text-[var(--foreground)]">
                {juntar(invalidadasLabels)} {invalidadasLabels.length === 1 ? 'precisa ser refeita' : 'precisam ser refeitas'} porque a raça, a classe ou as vantagens mudaram.
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" data-acao="ir-invalidada" onClick={() => navegarParaEtapa(etapasInvalidadas[0])} className={`btn-rpg-secondary cursor-pointer ${FOCO}`}>Ir para {invalidadasLabels[0]}</button>
                <button type="button" data-acao="entendi" onClick={limparInvalidadas} className={`rounded-lg px-3 py-1.5 font-modern text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] cursor-pointer ${FOCO}`}>Entendi</button>
              </div>
            </div>
          )}
          {draftRestaurado && (
            <div data-banner="rascunho" className="card-rpg flex flex-wrap items-center gap-3 !py-3">
              <RotateCcw size={16} aria-hidden="true" className="shrink-0 text-[var(--primary)]" />
              <p className="min-w-0 flex-1 font-modern text-sm text-[var(--foreground)]">
                Restauramos {nome.trim() || 'seu herói'} na etapa {labelDe(etapaAtual)}.
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" data-acao="manter-rascunho" onClick={() => setDraftRestaurado(false)} className={`btn-rpg-secondary cursor-pointer ${FOCO}`}>Continuar</button>
                <button type="button" data-acao="comecar-do-zero" onClick={() => setConfirmarDescarte(true)} className={`rounded-lg px-3 py-1.5 font-modern text-sm font-semibold cursor-pointer ${isLight ? 'text-red-700 hover:bg-red-50' : 'text-red-300 hover:bg-red-500/10'} ${FOCO}`}>Começar do zero</button>
              </div>
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
            itens={itensRaca}
            avisoPorItem={avisosDeSaldo('raca', itensRaca)}
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
            itens={itensClasse}
            avisoPorItem={avisosDeSaldo('classe', itensClasse)}
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
        {tela === 'background' && (
          <BackgroundStage
            valor={background}
            sugestoes={sugestoesBackground}
            enviando={enviando}
            onMudar={definirBackground}
            onPedirIdeias={() => enviarMensagem(config.refreshPrompt ?? 'Sugira origens para o meu herói', { manterEtapa: true })}
            isLight={isLight}
          />
        )}
        {tipoTraco && (
          <div className="space-y-4">
            <OrcamentoBar
              tipo={tipoTraco}
              total={pontosCriacaoTotal}
              gastos={pontosGastos}
              restantes={pontosCriacaoRestantes}
              custoRaca={custoRaca}
              custoClasse={custoClasse}
              pontosVantagem={pontosVantagem}
              devolvidos={pontosDevolvidos(pontosDesvantagem, maxCustoDesvantagem)}
              maxDevolucao={maxCustoDesvantagem}
              escolhidas={escolhidasTraco(tipoTraco)}
              enviando={enviando}
              onRemover={(id) => removerSelecao(tipoTraco, id)}
              isLight={isLight}
            />
            <CatalogStage
              key={tipoTraco}
              itens={itensTraco(tipoTraco).map(paraItem).filter((i): i is CatalogItem => i !== null)}
              selecionados={idsTraco(tipoTraco)}
              modo="multipla"
              sugeridos={idsSugeridos(tipoTraco)}
              enviando={enviando}
              onSelecionar={(item) => selecionarSugestao({ tipo: tipoTraco, id: item.id, nome: item.nome, descricao: item.descricao, custo: item.custo ?? 0 })}
              formatoCusto="traco"
              bloqueios={motivosDeBloqueio(tipoTraco, itensTraco(tipoTraco).filter((x): x is ItemDeCatalogo & { id: number | string } => x.id != null), { pontosCriacaoRestantes, pontosDesvantagem, maxCustoDesvantagem, tierMaximo: 1 })}
              textoVazio={tipoTraco === 'vantagem' ? 'Nenhuma vantagem disponível na criação' : 'Nenhuma desvantagem disponível na criação'}
              textoErro={tipoTraco === 'vantagem' ? 'Não conseguimos carregar as vantagens' : 'Não conseguimos carregar as desvantagens'}
              catalogoHref={tipoTraco === 'vantagem' ? '/vantagens' : '/desvantagens'}
              rotuloBusca={tipoTraco === 'vantagem' ? 'Buscar vantagem...' : 'Buscar desvantagem...'}
              isLight={isLight}
            />
          </div>
        )}
        {tela === 'atributos' && (
          <AtributosStage
            atributosBase={atributosBase}
            bonusFontes={bonusFontes ?? {}}
            bonusAplicados={bonusAplicados}
            setAtributo={setAtributo}
            pontosDistribuidos={pontosDistribuidos}
            pontosRestantes={pontosRestantes}
            pontosTotais={pontosTotais}
            atributosSugeridos={atributosSugeridos}
            aplicarAtributosSugeridos={aplicarAtributosSugeridos}
            attrMin={attrMin}
            attrMax={attrMax}
            multRaca={multRaca}
            enviando={enviando}
            onRedistribuir={redistribuirAtributos}
            isLight={isLight}
          />
        )}
        {tela === 'dnd-atributos' && (
          <DnDAbilityScoreBlock
            scores={dndAbilityScores}
            racialBonuses={bonusRacial}
            onSetScore={setDndAbilityScore}
            onReset={resetDndAbilityScores}
            onEditar={editarDndAtributos}
            confirmado={dndAbilitiesConfirmed}
            isLight={isLight}
          />
        )}
        {tela === 'dnd-pericias' && (
          <DnDSkillsBlock
            selecionadas={dndSkillProficiencies}
            classeNome={classeNome}
            abilityScores={Object.fromEntries(Object.entries(dndAbilityScores ?? {}).filter((par): par is [string, number] => typeof par[1] === 'number'))}
            onToggle={toggleDndSkill}
            onEditar={editarDndPericias}
            confirmado={dndSkillsConfirmed}
            isLight={isLight}
          />
        )}
        {tela === 'equipamentos' && (
          <EquipamentosBlock
            data={comboPreviewData as Parameters<typeof EquipamentosBlock>[0]['data']}
            loading={comboPreviewLoading}
            error={comboPreviewErro}
            tentativasUsadas={comboPreviewTentativa}
            onRegenerar={regenerarComboPreview}
            onRetry={recarregarComboPreview}
            isLight={isLight}
          />
        )}
        {tela === 'grimorio' && (
          <GrimorioBlock
            magias={grimorioMagias as Parameters<typeof GrimorioBlock>[0]['magias']}
            slots={grimorioSlots}
            selecionadas={grimorioSelecionadas}
            onToggleMagia={toggleGrimorioMagia}
            onRetry={recarregarGrimorio}
            loading={grimorioLoading}
            error={grimorioError}
            isLight={isLight}
          />
        )}
        {tela === 'resumo' && (
          <ResumoStage
            pendencias={pendencias}
            onResolver={navegarParaEtapa}
            escolhas={escolhasResumo}
            onEditar={navegarParaEtapa}
            leitura={sistema === 'dnd5e' ? (
              <DnDAbilityScoreBlock scores={dndAbilityScores} racialBonuses={bonusRacial} onSetScore={setDndAbilityScore} confirmado isLight={isLight} />
            ) : (
              <DestinoResolutivaBlock
                data={comboPreviewData as Parameters<typeof DestinoResolutivaBlock>[0]['data']}
                loading={comboPreviewLoading}
                error={comboPreviewErro}
                onRetry={recarregarComboPreview}
                imageUrl={imageUrl}
                imageLoading={imageLoading}
                imageError={imageError}
                onGerarImagem={gerarRetrato}
                isLight={isLight}
              />
            )}
            ficha={ficha}
            isLight={isLight}
          />
        )}
      </StageFrame>

      {enviando && <MestrePensando isLight={isLight} />}
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
        podeContinuar={regra.podeContinuar && !salvando}
        enviando={enviando || salvando}
        onVoltar={onVoltar}
        onContinuar={agir}
        onPular={regra.pular ? () => { if (regra.pular) pularEtapa(regra.pular); } : undefined}
        rotuloContinuar={regra.rotulo}
        motivoBloqueio={regra.motivoBloqueio}
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
        selecionados={allSelecoes}
        onRemover={removerSelecao}
        isLight={isLight}
      />

      {creationFlowStatus !== 'idle' && !creationResultModalOpen && (
        <div role="status" aria-live="polite" aria-busy="true" className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-md">
          <div className="card-rpg max-w-md text-center">
            <Loader2 size={28} aria-hidden="true" className="mx-auto animate-spin text-[var(--primary)]" />
            <h2 className="mt-4 font-fantasy text-2xl font-bold text-[var(--foreground)]">{creationStatusLabel}</h2>
            <p className="mt-2 font-modern text-sm text-[var(--muted-foreground)]">A ficha, o background e a leitura final do Mestre estão sendo consolidados.</p>
          </div>
        </div>
      )}

      <ConfirmDialog
        aberto={troca !== null}
        titulo={troca?.primeira ? (troca.tipo === 'raca' ? 'Escolher esta raça?' : 'Escolher esta classe?') : troca?.tipo === 'raca' ? 'Trocar a raça?' : 'Trocar a classe?'}
        descricao={troca ? (
          <>
            {troca.saldo != null && troca.saldo < 0 ? <p>Seu saldo ficaria {troca.saldo}; será preciso remover vantagens ou escolher {troca.tipo === 'raca' ? 'uma raça' : 'uma classe'} mais barata.</p> : null}
            {troca.afetadas.length > 0 ? <p>Estas etapas precisarão ser refeitas:</p> : null}
          </>
        ) : null}
        itens={(troca?.afetadas ?? []).map(labelDe)}
        rotuloConfirmar={troca?.primeira ? 'Escolher' : 'Trocar'}
        onConfirmar={() => { if (troca) aplicarEscolha(troca.tipo, troca.item); setTroca(null); }}
        onCancelar={() => setTroca(null)}
      />

      <ConfirmDialog
        aberto={confirmarDescarte}
        perigo
        titulo="Começar do zero?"
        descricao={`Isso apaga o rascunho de ${nome.trim() || 'seu herói'}. Não dá para desfazer.`}
        rotuloConfirmar="Apagar e recomeçar"
        onConfirmar={() => { resetarTudo(); setConfirmarDescarte(false); }}
        onCancelar={() => setConfirmarDescarte(false)}
      />

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

/** Nomes das vantagens que a raça/classe concede e das desvantagens que impõe (G-05); undefined quando nenhuma. */
function tracosConcedidos(bonus: unknown): CatalogItem['tracos'] {
  const { vantagens, desvantagens } = parseBonusVantagens(bonus);
  const nomes = (lista: Array<{ nome?: string }>) => lista.map((t) => t.nome).filter((n): n is string => Boolean(n));
  const concede = nomes(vantagens);
  const impoe = nomes(desvantagens);
  return concede.length || impoe.length ? { concede, impoe } : undefined;
}

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
