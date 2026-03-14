import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mestreCriadorService, personagemService } from '../../../services/index.js';
import { usePersonagemStore } from '../../../store/personagem';
import { useVantagemStore } from '../../../store/vantagem';
import { useDesvantagemStore } from '../../../store/desvantagem';
import { useRacaStore } from '../../../store/raca';
import { useClasseStore } from '../../../store/classe';
import { useTheme } from '../../../contexts/theme.jsx';
import { useLayout } from '../../../contexts/LayoutContext.jsx';
import { Personagem } from '../../../models/Personagem';

const ETAPAS = [
  { id: 'boas_vindas', label: 'O Chamado', icon: '✨' },
  { id: 'raca', label: 'Linhagem', icon: '🧬' },
  { id: 'classe', label: 'Vocação', icon: '⚔️' },
  { id: 'background', label: 'Origens', icon: '📖' },
  { id: 'vantagens', label: 'Dons', icon: '🌟' },
  { id: 'desvantagens', label: 'Marcas', icon: '🔥' },
  { id: 'atributos', label: 'Essência', icon: '💎' },
  { id: 'resumo', label: 'Destino', icon: '🏰' },
  { id: 'refinamento', label: 'Ajustes', icon: '⚙️' },
];

const PONTOS_TOTAIS = 60;
const ATTR_MIN = 5;
const ATTR_MAX = 16; // max na criação (antes de bônus)

const ATRIBUTOS_INICIAIS = {
  forca: 10, destreza: 10, constituicao: 10,
  inteligencia: 10, agilidade: 10, carisma: 10,
};

function somaAtributos(atributos) {
  return Object.values(atributos)
    .map((v) => Number(v) || 0)
    .reduce((a, b) => a + b, 0);
}

export const useWizardModel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { setIsFullscreen } = useLayout();
  const recarregarPersonagens = usePersonagemStore(s => s.recarregarPersonagens);
  const chatEndRef = useRef(null);

  // Ativa fullscreen no main (sem padding, overflow-hidden) e desativa ao sair
  useEffect(() => {
    setIsFullscreen(true);
    return () => setIsFullscreen(false);
  }, [setIsFullscreen]);

  // Zustand stores
  const racas = useRacaStore(s => s.racas);
  const racasCarregadas = useRacaStore(s => s.racasCarregadas);
  const carregarRacas = useRacaStore(s => s.carregarRacas);

  const classes = useClasseStore(s => s.classes);
  const classesCarregadas = useClasseStore(s => s.classesCarregadas);
  const carregarClasses = useClasseStore(s => s.carregarClasses);

  const vantagens = useVantagemStore(s => s.vantagens);
  const vantagensCarregadas = useVantagemStore(s => s.vantagensCarregadas);
  const carregarVantagens = useVantagemStore(s => s.carregarVantagens);

  const desvantagens = useDesvantagemStore(s => s.desvantagens);
  const desvantagensCarregadas = useDesvantagemStore(s => s.desvantagensCarregadas);
  const carregarDesvantagens = useDesvantagemStore(s => s.carregarDesvantagens);

  // T4: Draft v2 — shape novo com atributosBase, skip flags
  const DRAFT_KEY = 'lunaria_wizard_draft_v2';

  const loadDraft = () => {
    try {
      // Descartar v1 silenciosamente
      localStorage.removeItem('lunaria_wizard_draft_v1');
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  };

  const draft = useRef(loadDraft());

  // T4: Flag de draft restaurado
  const [draftRestaurado, setDraftRestaurado] = useState(false);

  // Wizard state (restaura do draft se existir)
  const [etapaAtual, setEtapaAtual] = useState(draft.current?.etapaAtual || 'boas_vindas');
  const [mensagens, setMensagens] = useState([]);
  const [inputTexto, setInputTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  // Navegacao: etapas visitadas e skip flags
  const [etapasVisitadas, setEtapasVisitadas] = useState(
    draft.current?.etapasVisitadas || [draft.current?.etapaAtual || 'boas_vindas']
  );
  const [skipVantagens, setSkipVantagens] = useState(draft.current?.skipVantagens || false);
  const [skipDesvantagens, setSkipDesvantagens] = useState(draft.current?.skipDesvantagens || false);

  // Personagem state (restaura do draft se existir)
  const [nome, setNome] = useState(draft.current?.nome || '');
  const [racaId, setRacaId] = useState(draft.current?.racaId || null);
  const [racaNome, setRacaNome] = useState(draft.current?.racaNome || '');
  const [classeId, setClasseId] = useState(draft.current?.classeId || null);
  const [classeNome, setClasseNome] = useState(draft.current?.classeNome || '');
  const [background, setBackground] = useState(draft.current?.background || '');
  const [vantagensIds, setVantagensIds] = useState(draft.current?.vantagensIds || []);
  const [vantagensNomes, setVantagensNomes] = useState(draft.current?.vantagensNomes || []);
  const [desvantagensIds, setDesvantagensIds] = useState(draft.current?.desvantagensIds || []);
  const [desvantagensNomes, setDesvantagensNomes] = useState(draft.current?.desvantagensNomes || []);

  // T3: atributosBase — distribuição do jogador (60 pontos), sem bônus
  const [atributosBase, setAtributosBase] = useState(
    draft.current?.atributosBase || { ...ATRIBUTOS_INICIAIS }
  );

  // Sugestões ativas (vindas da IA)
  const [sugestoes, setSugestoes] = useState([]);
  const [atributosSugeridos, setAtributosSugeridos] = useState(null);

  // T3: bonusAplicados = confirmação do jogador
  const [bonusAplicados, setBonusAplicados] = useState(draft.current?.bonusAplicados || false);

  // T3: Flag para banner de invalidação em etapas avançadas
  const [bonusInvalidado, setBonusInvalidado] = useState(false);

  // Saving
  const [salvando, setSalvando] = useState(false);
  const [gerandoBackground, setGerandoBackground] = useState(false);

  // Dados para preview card
  const racasDisponiveis = racas || [];
  const classesDisponiveis = classes || [];
  const vantagensDisponiveis = useMemo(() => {
    return [...(vantagens || []), ...(desvantagens || [])];
  }, [vantagens, desvantagens]);

  // T3: Bônus calculado como derivação pura (useMemo, sem side-effect)
  const bonusDetalhes = useMemo(() => {
    const ATTR_BASE = ['forca', 'destreza', 'constituicao', 'inteligencia', 'agilidade', 'carisma'];

    const parseRacaClasseBonus = (raw) => {
      if (!raw) return null;
      try {
        const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(obj) ? obj[0] : obj;
      } catch { return null; }
    };

    const racaObj = racasDisponiveis.find(r => r.id === racaId);
    const classeObj = classesDisponiveis.find(c => c.id === classeId);
    const racaBonus = parseRacaClasseBonus(racaObj?.bonus);
    const classeBonus = parseRacaClasseBonus(classeObj?.bonus);

    const bonus = {};
    for (const key of ATTR_BASE) {
      let b = 0;
      if (racaBonus && (typeof racaBonus[key] === 'string' || typeof racaBonus[key] === 'number')) {
        b += Number(racaBonus[key]) || 0;
      }
      if (classeBonus && (typeof classeBonus[key] === 'string' || typeof classeBonus[key] === 'number')) {
        b += Number(classeBonus[key]) || 0;
      }
      if (b !== 0) bonus[key] = b;
    }

    // Vantagens/desvantagens bonus
    const allItems = vantagensDisponiveis || [];
    const selectedIds = [...vantagensIds, ...desvantagensIds];
    for (const id of selectedIds) {
      const item = allItems.find(v => v.id === id);
      if (!item?.bonus) continue;
      const bonusArr = Array.isArray(item.bonus) ? item.bonus : [item.bonus];
      for (const entry of bonusArr) {
        if (entry?.atributo && ATTR_BASE.includes(entry.atributo)) {
          bonus[entry.atributo] = (bonus[entry.atributo] || 0) + (Number(entry.valor) || 0);
        }
      }
    }

    // Remove zeros
    for (const key of Object.keys(bonus)) {
      if (bonus[key] === 0) delete bonus[key];
    }

    return bonus;
  }, [racaId, classeId, racasDisponiveis, classesDisponiveis, vantagensIds, desvantagensIds, vantagensDisponiveis]);

  // T3: atributosFinal = atributosBase + bônus (sempre derivado)
  const atributosFinal = useMemo(() => {
    const result = { ...atributosBase };
    for (const [key, val] of Object.entries(bonusDetalhes)) {
      result[key] = (result[key] || 10) + val;
    }
    return result;
  }, [atributosBase, bonusDetalhes]);

  // T3: Pontos baseados apenas em atributosBase (sem bônus)
  const pontosDistribuidos = useMemo(() => somaAtributos(atributosBase), [atributosBase]);
  const pontosRestantes = PONTOS_TOTAIS - pontosDistribuidos;

  // T3: Invalidar bonusAplicados quando build muda
  const buildDepsRef = useRef({ racaId, classeId, vantagensIds, desvantagensIds });
  useEffect(() => {
    const prev = buildDepsRef.current;
    const changed = prev.racaId !== racaId
      || prev.classeId !== classeId
      || prev.vantagensIds !== vantagensIds
      || prev.desvantagensIds !== desvantagensIds;
    buildDepsRef.current = { racaId, classeId, vantagensIds, desvantagensIds };

    if (!changed) return;
    if (etapaAtual === 'boas_vindas') return;

    if (bonusAplicados) {
      setBonusAplicados(false);
      if (etapaAtual === 'resumo' || etapaAtual === 'refinamento') {
        setBonusInvalidado(true);
      }
    }
  }, [racaId, classeId, vantagensIds, desvantagensIds, etapaAtual, bonusAplicados]);

  // Etapas concluídas (derivadas do estado atual)
  const etapasConcluidas = useMemo(() => {
    const concluidas = [];
    if (nome.trim()) concluidas.push('boas_vindas');
    if (racaId) concluidas.push('raca');
    if (classeId) concluidas.push('classe');
    if (background.trim()) concluidas.push('background');
    if (vantagensIds.length > 0 || skipVantagens) concluidas.push('vantagens');
    if (desvantagensIds.length > 0 || skipDesvantagens) concluidas.push('desvantagens');
    if (bonusAplicados) concluidas.push('atributos');
    return concluidas;
  }, [nome, racaId, classeId, background, vantagensIds, desvantagensIds, skipVantagens, skipDesvantagens, bonusAplicados]);

  const etapaIndex = useMemo(() => {
    return ETAPAS.findIndex(e => e.id === etapaAtual);
  }, [etapaAtual]);

  // T4: Draft v2 — salvar com shape novo
  useEffect(() => {
    if (etapaAtual === 'boas_vindas' && !nome) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        etapaAtual, nome, racaId, racaNome, classeId, classeNome,
        background, vantagensIds, vantagensNomes, desvantagensIds,
        desvantagensNomes, atributosBase, bonusAplicados,
        skipVantagens, skipDesvantagens, etapasVisitadas, etapasConcluidas,
      }));
    } catch { /* quota exceeded — ignore */ }
  }, [etapaAtual, nome, racaId, classeId, background, vantagensIds, desvantagensIds,
      atributosBase, bonusAplicados, skipVantagens, skipDesvantagens, etapasVisitadas, etapasConcluidas]);

  // Aviso ao fechar aba com wizard em andamento
  useEffect(() => {
    const handler = (e) => {
      if (nome || racaId) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [nome, racaId]);

  // Load catalogs on mount
  useEffect(() => {
    const loadAll = async () => {
      const promises = [];
      if (!racasCarregadas) promises.push(carregarRacas());
      if (!classesCarregadas) promises.push(carregarClasses());
      if (!vantagensCarregadas) promises.push(carregarVantagens());
      if (!desvantagensCarregadas) promises.push(carregarDesvantagens());
      if (promises.length > 0) await Promise.all(promises);
    };
    loadAll();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // T4: Inserir mensagem de draft restaurado OU iniciar wizard
  useEffect(() => {
    if (draft.current) {
      setDraftRestaurado(true);
      setMensagens([{
        id: Date.now(),
        role: 'sistema',
        content: '**Rascunho restaurado.** Seu progresso anterior foi recuperado. Você pode continuar de onde parou ou descartar o rascunho para recomeçar.',
        timestamp: new Date(),
      }]);
    } else {
      iniciarWizard();
    }
  }, []);

  const iniciarWizard = useCallback(async () => {
    setEnviando(true);
    try {
      const resultado = await mestreCriadorService.interagir({
        etapa: 'boas_vindas',
        estado: {},
        mensagemJogador: 'Olá, estou pronto para criar meu personagem!',
        historico: [],
      });

      setMensagens([{
        id: Date.now(),
        role: 'mestre',
        content: resultado.mensagem,
        sugestoes: resultado.sugestoes,
        timestamp: new Date(),
      }]);

      if (resultado.sugestoes?.length) setSugestoes(resultado.sugestoes);
    } catch (err) {
      setError(err.message);
      // Fallback welcome
      setMensagens([{
        id: Date.now(),
        role: 'mestre',
        content: '**Bem-vindo, aventureiro!** Você chega a uma taverna antiga onde pergaminhos e mapas cobrem as paredes. Um sábio ancião sorri ao vê-lo.\n\n*"Ah, mais um herói em busca de destino! Diga-me, como deseja ser chamado neste mundo?"*',
        sugestoes: [],
        timestamp: new Date(),
      }]);
    } finally {
      setEnviando(false);
    }
  }, []);

  /** Monta o estado completo do personagem para enviar ao backend */
  const getEstado = useCallback(() => ({
    nome,
    raca_id: racaId,
    raca_nome: racaNome,
    classe_id: classeId,
    classe_nome: classeNome,
    background,
    vantagens_ids: vantagensIds,
    vantagens_nomes: vantagensNomes,
    desvantagens_ids: desvantagensIds,
    desvantagens_nomes: desvantagensNomes,
    atributos: atributosFinal,
  }), [nome, racaId, racaNome, classeId, classeNome, background, vantagensIds, vantagensNomes, desvantagensIds, desvantagensNomes, atributosFinal]);

  /** Monta histórico de chat para enviar ao backend */
  const getHistorico = useCallback(() => {
    return mensagens.filter(m => m.role !== 'sistema').map(m => ({
      role: m.role === 'mestre' ? 'assistant' : 'user',
      content: m.content,
    }));
  }, [mensagens]);

  /** Envia mensagem do jogador (input textual livre) */
  const enviarMensagem = useCallback(async (texto) => {
    if (!texto?.trim() || enviando) return;

    const mensagemJogador = texto.trim();

    // Atualizar estado baseado na etapa atual ANTES de enviar
    if (etapaAtual === 'boas_vindas' && !nome) {
      setNome(mensagemJogador);
    } else if (etapaAtual === 'background') {
      setBackground(prev => prev ? `${prev}\n${mensagemJogador}` : mensagemJogador);
    }

    // Adicionar mensagem do jogador ao chat
    const novaMensagem = {
      id: Date.now(),
      role: 'jogador',
      content: mensagemJogador,
      timestamp: new Date(),
    };
    setMensagens(prev => [...prev, novaMensagem]);
    setInputTexto('');
    setEnviando(true);
    setError(null);

    try {
      const resultado = await mestreCriadorService.interagir({
        etapa: etapaAtual,
        estado: { ...getEstado(), nome: etapaAtual === 'boas_vindas' ? mensagemJogador : nome },
        mensagemJogador,
        historico: getHistorico(),
      });

      // Adicionar resposta do mestre
      setMensagens(prev => [...prev, {
        id: Date.now() + 1,
        role: 'mestre',
        content: resultado.mensagem,
        sugestoes: resultado.sugestoes,
        timestamp: new Date(),
      }]);

      // Atualizar sugestões
      if (resultado.sugestoes?.length) setSugestoes(resultado.sugestoes);
      else setSugestoes([]);

      // Atualizar atributos sugeridos
      if (resultado.atributos_sugeridos) setAtributosSugeridos(resultado.atributos_sugeridos);

      // Avançar etapa (mantido para mensagens textuais do jogador)
      if (resultado.etapa_proxima && resultado.etapa_proxima !== etapaAtual) {
        const proxima = resultado.etapa_proxima;
        setEtapaAtual(proxima);
        setEtapasVisitadas(prev => prev.includes(proxima) ? prev : [...prev, proxima]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }, [etapaAtual, nome, enviando, getEstado, getHistorico]);

  // Limites de seleção
  const MAX_DESVANTAGENS = 3;
  const MAX_PONTOS_DESVANTAGEM = -4; // soma mínima dos custos negativos

  // Pontos de desvantagem usados (soma dos custos negativos)
  const pontosDesvantagem = useMemo(() => {
    const allItems = vantagensDisponiveis || [];
    return desvantagensIds.reduce((sum, id) => {
      const item = allItems.find(v => v.id === id);
      return sum + (item ? Number(item.custo) || 0 : 0);
    }, 0);
  }, [desvantagensIds, vantagensDisponiveis]);

  // Pontos de vantagem usados (soma dos custos positivos)
  const pontosVantagem = useMemo(() => {
    const allItems = vantagensDisponiveis || [];
    return vantagensIds.reduce((sum, id) => {
      const item = allItems.find(v => v.id === id);
      return sum + (item ? Number(item.custo) || 0 : 0);
    }, 0);
  }, [vantagensIds, vantagensDisponiveis]);

  // Pontos de criação disponíveis (base + devolvidos por desvantagens)
  const PONTOS_CRIACAO_BASE = 5;
  const pontosDevolvidos = Math.min(Math.abs(MAX_PONTOS_DESVANTAGEM), Math.abs(pontosDesvantagem));
  const pontosCriacaoTotal = PONTOS_CRIACAO_BASE + pontosDevolvidos;
  const pontosCriacaoRestantes = pontosCriacaoTotal - pontosVantagem;

  /** T1: Seleciona sugestão silenciosamente (sem enviarMensagem) */
  const selecionarSugestao = useCallback((sugestao) => {
    const { tipo, id, nome: sugestaoNome, custo: sugCusto } = sugestao;

    // Ignorar se já selecionada
    if (tipo === 'vantagem' && vantagensIds.includes(id)) return;
    if (tipo === 'desvantagem' && desvantagensIds.includes(id)) return;

    switch (tipo) {
      case 'raca':
        setRacaId(id);
        setRacaNome(sugestaoNome);
        break;
      case 'classe':
        setClasseId(id);
        setClasseNome(sugestaoNome);
        break;
      case 'vantagem': {
        // Verificar pontos de criação
        const custo = Number(sugCusto) || 0;
        if (custo > pontosCriacaoRestantes) {
          setError(`Pontos de criação insuficientes. Disponível: ${pontosCriacaoRestantes}, Custo: ${custo}`);
          return;
        }
        setVantagensIds(prev => [...prev, id]);
        setVantagensNomes(prev => [...prev, sugestaoNome]);
        break;
      }
      case 'desvantagem': {
        // Limite de quantidade
        if (desvantagensIds.length >= MAX_DESVANTAGENS) {
          setError(`Máximo de ${MAX_DESVANTAGENS} desvantagens por personagem`);
          return;
        }
        // Limite de pontos devolvidos
        const custoDesv = Number(sugCusto) || 0;
        if (pontosDesvantagem + custoDesv < MAX_PONTOS_DESVANTAGEM) {
          setError(`Limite de ${Math.abs(MAX_PONTOS_DESVANTAGEM)} pontos de desvantagem atingido (atual: ${Math.abs(pontosDesvantagem)})`);
          return;
        }
        setDesvantagensIds(prev => [...prev, id]);
        setDesvantagensNomes(prev => [...prev, sugestaoNome]);
        break;
      }
    }
    // T1: Seleção NÃO envia mensagem de chat — estado atualiza silenciosamente
  }, [vantagensIds, desvantagensIds, pontosCriacaoRestantes, pontosDesvantagem]);

  /** Remove uma vantagem/desvantagem selecionada */
  const removerSelecao = useCallback((tipo, id) => {
    if (tipo === 'vantagem') {
      setVantagensIds(prev => prev.filter(v => v !== id));
      setVantagensNomes(prev => {
        const item = (vantagens || []).find(v => v.id === id);
        return prev.filter(n => n !== item?.nome);
      });
    } else {
      setDesvantagensIds(prev => prev.filter(d => d !== id));
      setDesvantagensNomes(prev => {
        const item = (desvantagens || []).find(d => d.id === id);
        return prev.filter(n => n !== item?.nome);
      });
    }
  }, [vantagens, desvantagens]);

  /** Aplica sugestão de atributos da IA (opera sobre atributosBase) */
  const aplicarAtributosSugeridos = useCallback(() => {
    if (atributosSugeridos) {
      setAtributosBase({ ...atributosSugeridos });
    }
  }, [atributosSugeridos]);

  /** T3: Confirma atributos — apenas marca como confirmado */
  const confirmarAtributos = useCallback(() => {
    if (bonusAplicados) return;
    setBonusAplicados(true);
    setBonusInvalidado(false);
  }, [bonusAplicados]);

  /** T3: Atualiza um atributo individual (opera sobre atributosBase) */
  const setAtributo = useCallback((key, value) => {
    const val = Math.min(ATTR_MAX, Math.max(ATTR_MIN, Number(value) || ATTR_MIN));
    setAtributosBase(prev => ({ ...prev, [key]: val }));
  }, []);

  /** Avança para a próxima etapa (usado pelo CTA "Continuar") */
  const avancarEtapa = useCallback(() => {
    const idx = ETAPAS.findIndex(e => e.id === etapaAtual);
    if (idx < 0 || idx >= ETAPAS.length - 1) return null;
    const proxima = ETAPAS[idx + 1].id;
    const primeiraVisita = !etapasVisitadas.includes(proxima);
    setEtapaAtual(proxima);
    setEtapasVisitadas(prev => primeiraVisita ? [...prev, proxima] : prev);
    return { etapa: proxima, primeiraVisita };
  }, [etapaAtual, etapasVisitadas]);

  /** Navega para uma etapa específica (usado pelo progress bar — T2) */
  const navegarParaEtapa = useCallback((etapaId) => {
    if (!etapasConcluidas.includes(etapaId)) return;
    setEtapaAtual(etapaId);
    setEtapasVisitadas(prev => prev.includes(etapaId) ? prev : [...prev, etapaId]);
  }, [etapasConcluidas]);

  /** T4: Descarta draft e reseta todo estado */
  const descartarDraft = useCallback(() => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    setEtapaAtual('boas_vindas');
    setNome('');
    setRacaId(null);
    setRacaNome('');
    setClasseId(null);
    setClasseNome('');
    setBackground('');
    setVantagensIds([]);
    setVantagensNomes([]);
    setDesvantagensIds([]);
    setDesvantagensNomes([]);
    setAtributosBase({ ...ATRIBUTOS_INICIAIS });
    setBonusAplicados(false);
    setBonusInvalidado(false);
    setSkipVantagens(false);
    setSkipDesvantagens(false);
    setEtapasVisitadas(['boas_vindas']);
    setSugestoes([]);
    setAtributosSugeridos(null);
    setDraftRestaurado(false);
    setMensagens([]);
    setError(null);
    iniciarWizard();
  }, [iniciarWizard]);

  /** Salva o personagem */
  const salvarPersonagem = useCallback(async () => {
    if (!nome.trim()) {
      setError('Nome do personagem é obrigatório');
      return;
    }
    if (!racaId) {
      setError('Selecione uma raça antes de salvar');
      return;
    }
    if (!classeId) {
      setError('Selecione uma classe antes de salvar');
      return;
    }

    if (!bonusAplicados) {
      setError('Confirme seus atributos antes de salvar (aplique os bônus de raça/classe)');
      return;
    }

    setSalvando(true);
    setError(null);

    try {
      // T3: Enviar atributosFinal (base + bônus derivados)
      const dados = {
        nome,
        raca_id: racaId || undefined,
        classe_id: classeId || undefined,
        sugestao_background: 'guiado',
        background,
        historias: [],
        forca: atributosFinal.forca,
        destreza: atributosFinal.destreza,
        constituicao: atributosFinal.constituicao,
        inteligencia: atributosFinal.inteligencia,
        agilidade: atributosFinal.agilidade,
        carisma: atributosFinal.carisma,
        vantagens: vantagensIds,
        desvantagens: desvantagensIds,
        nivel: 1,
      };

      const personagem = new Personagem(dados);
      const criado = await personagemService.create(personagem);

      // Gerar background via IA
      if (criado?.id && background) {
        try {
          setGerandoBackground(true);
          await personagemService.gerarBackground(criado.id, background);
        } catch (bgError) {
          console.warn('Background IA não gerado:', bgError.message);
        } finally {
          setGerandoBackground(false);
        }
      }

      // Limpar draft após salvar com sucesso
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      await recarregarPersonagens();
      navigate('/personagens');
    } catch (err) {
      setError(err.message || 'Erro ao criar personagem');
    } finally {
      setSalvando(false);
    }
  }, [nome, racaId, classeId, background, atributosFinal, vantagensIds, desvantagensIds, bonusAplicados, navigate, recarregarPersonagens]);

  const clearError = useCallback(() => setError(null), []);

  return {
    // Wizard
    etapas: ETAPAS,
    etapaAtual,
    etapaIndex,
    mensagens,
    inputTexto,
    setInputTexto,
    enviando,
    sugestoes,
    atributosSugeridos,
    chatEndRef,

    // T3: Atributos separados
    atributosBase,
    atributosFinal,

    // Personagem
    nome,
    racaId,
    racaNome,
    classeId,
    classeNome,
    background,
    vantagensIds,
    vantagensNomes,
    desvantagensIds,
    desvantagensNomes,
    pontosDistribuidos,
    pontosRestantes,
    pontosTotais: PONTOS_TOTAIS,
    attrMin: ATTR_MIN,
    attrMax: ATTR_MAX,

    // Catálogos (para preview)
    racasDisponiveis,
    classesDisponiveis,
    vantagensDisponiveis,

    // Actions
    enviarMensagem,
    selecionarSugestao,
    removerSelecao,
    aplicarAtributosSugeridos,
    setAtributo,
    confirmarAtributos,
    salvarPersonagem,
    avancarEtapa,
    navegarParaEtapa,
    clearError,

    // Bonus
    bonusAplicados,
    bonusDetalhes,
    bonusInvalidado,

    // Navegação
    etapasVisitadas,
    etapasConcluidas,
    skipVantagens,
    setSkipVantagens,
    skipDesvantagens,
    setSkipDesvantagens,

    // Draft
    draftRestaurado,
    descartarDraft,

    // Limites de seleção
    pontosCriacaoTotal,
    pontosCriacaoRestantes,
    pontosVantagem,
    pontosDesvantagem,
    maxDesvantagens: MAX_DESVANTAGENS,

    // Async
    salvando,
    gerandoBackground,
    error,

    // Theme
    isLight,
    navigate,
  };
};
