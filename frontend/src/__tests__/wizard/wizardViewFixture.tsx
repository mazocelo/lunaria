// Props mínimas para renderizar a WizardView em teste (o modelo real depende de stores e da API).
import type { WizardModel } from '../../Pages/Personagem/Wizard/wizard.model';
import type { WizardMessage } from '../../Pages/Personagem/Wizard/hooks/useChatState';

const noop = () => {};

export const etapasLunaria = [
  { id: 'boas_vindas', label: 'Nome' },
  { id: 'raca', label: 'Raça' },
  { id: 'classe', label: 'Classe' },
  { id: 'background', label: 'Background' },
];

export const criarPropsDaView = (over: Partial<Record<keyof WizardModel, unknown>> & { mensagens?: WizardMessage[] } = {}): WizardModel => ({
  sistema: 'lunaria', isTresdet: false, isDnd5e: false,
  etapas: etapasLunaria, etapaAtual: 'boas_vindas', etapaIndex: 0, etapasVisitadas: ['boas_vindas'], etapasConcluidas: [],
  avancarComMestre: noop, pularEtapa: noop, navegarParaEtapa: noop, avancarEtapa: noop,
  mensagens: [], inputTexto: '', setInputTexto: noop, enviando: false, sugestoes: [], chatEndRef: { current: null },
  atributosBase: {}, atributosFinal: {}, atributosSugeridos: null, bonusAplicados: false, bonusDetalhes: null, bonusFontes: null, bonusInvalidado: false,
  pontosDistribuidos: 0, pontosRestantes: 0, pontosTotais: 0, attrMin: 1, attrMax: 10, confirmarAtributos: noop, setAtributo: noop, aplicarAtributosSugeridos: noop,
  nome: '', racaId: null, racaNome: '', classeId: null, classeNome: '', background: '',
  vantagensIds: [], vantagensNomes: [], desvantagensIds: [], desvantagensNomes: [],
  skipVantagens: false, setSkipVantagens: noop, skipDesvantagens: false, setSkipDesvantagens: noop,
  pontosCriacaoTotal: 10, pontosCriacaoRestantes: 10, pontosGastos: 0, pontosVantagem: 0, pontosDesvantagem: 0, custoRaca: 0, custoClasse: 0, maxCustoDesvantagem: 0,
  racasDisponiveis: [], classesDisponiveis: [], vantagensDisponiveis: [],
  catalogoCarregando: { raca: false, classe: false }, catalogoErro: { raca: null, classe: null }, recarregarCatalogo: noop,
  enviarMensagem: noop, selecionarSugestao: noop, removerSelecao: noop, salvarPersonagem: noop, clearError: noop,
  draftRestaurado: false, resetarTudo: noop, descartarDraft: noop, salvando: false, error: null,
  comboPreviewData: null, comboPreviewLoading: false, comboPreviewErro: null, comboPreviewTentativa: 0, comboPreviewBuildKey: '', podeGerarPreview: false,
  regenerarComboPreview: noop, recarregarComboPreview: noop,
  creationFlowStatus: 'idle', creationResultModalOpen: false, creationResultData: null, fecharResultadoCriacao: noop, irParaPersonagens: noop, verFichaCriada: noop,
  imageUrl: null, imageLoading: false, imageError: null, gerarImagem: noop, resetImage: noop,
  grimorioMagias: [], grimorioSlots: 0, grimorioSelecionadas: [], grimorioLoading: false, grimorioError: null, grimorioSelecionado: false, toggleGrimorioMagia: noop, confirmarGrimorio: noop,
  tresdetCaracteristicas: {}, tresdetCaracteristicasConfirmadas: false, tresdetPontosTotais: 5, setTresdetCaracteristica: noop, confirmarTresdetCaracteristicas: noop,
  tresdetVantagensIds: [], tresdetVantagensConfirmadas: false, toggleTresdetVantagem: noop, confirmarTresdetVantagens: noop,
  tresdetDesvantagensIds: [], tresdetDesvantagensConfirmadas: false, toggleTresdetDesvantagem: noop, confirmarTresdetDesvantagens: noop,
  dndAbilityScores: {}, dndAbilitiesConfirmed: false, setDndAbilityScore: noop, resetDndAbilityScores: noop, confirmarDndAbilities: noop,
  dndSkillProficiencies: [], dndSkillsConfirmed: false, toggleDndSkill: noop, confirmarDndSkills: noop,
  navigate: noop,
  ...over,
}) as unknown as WizardModel;
