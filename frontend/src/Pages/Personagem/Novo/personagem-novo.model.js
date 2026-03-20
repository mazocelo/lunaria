import { useState, useEffect, useMemo, useCallback } from 'react';
import { personagemService, historiaService } from '../../../services/index.js';
import { usePersonagemStore } from '../../../store/personagem';
import { useVantagemStore } from '../../../store/vantagem';
import { useDesvantagemStore } from '../../../store/desvantagem';
import { useRacaStore } from '../../../store/raca';
import { useClasseStore } from '../../../store/classe';
import { Personagem } from '../../../models/Personagem';
import { tierDesbloqueado } from '../../../utils/evolucaoHelper.js';

const PONTOS_ATRIBUTO_CRIACAO = 60;
const ATTR_MIN_CRIACAO = 5;
const ATTR_MAX_CRIACAO = 16;
const PONTOS_CRIACAO_BASE = 10;
const MAX_CUSTO_DESVANTAGEM = 3;

const atributosIniciais = {
  forca: '',
  inteligencia: '',
  constituicao: '',
  agilidade: '',
  destreza: '',
  carisma: '',
};

function somaAtributos(atributos) {
  return Object.values(atributos)
    .map((v) => Number(v) || 0)
    .reduce((a, b) => a + b, 0);
}

function toNumericCost(value) {
  return Number(value) || 0;
}

export const usePersonagemNovoModel = ({ navigate } = {}) => {
  const recarregarPersonagens = usePersonagemStore(s => s.recarregarPersonagens);

  // Zustand stores
  const racas = useRacaStore(s => s.racas);
  const racasCarregadas = useRacaStore(s => s.racasCarregadas);
  const carregarRacas = useRacaStore(s => s.carregarRacas);
  const racasLoading = useRacaStore(s => s.loading);

  const classes = useClasseStore(s => s.classes);
  const classesCarregadas = useClasseStore(s => s.classesCarregadas);
  const carregarClasses = useClasseStore(s => s.carregarClasses);
  const classesLoading = useClasseStore(s => s.loading);

  const vantagens = useVantagemStore(s => s.vantagens);
  const vantagensCarregadas = useVantagemStore(s => s.vantagensCarregadas);
  const carregarVantagens = useVantagemStore(s => s.carregarVantagens);
  const vantagensLoading = useVantagemStore(s => s.loading);

  const desvantagens = useDesvantagemStore(s => s.desvantagens);
  const desvantagensCarregadas = useDesvantagemStore(s => s.desvantagensCarregadas);
  const carregarDesvantagens = useDesvantagemStore(s => s.carregarDesvantagens);

  // Form state
  const [nome, setNome] = useState('');
  const [raca, setRaca] = useState('');
  const [classe, setClasse] = useState('');
  const [backgroundTipo, setBackgroundTipo] = useState('guiado');
  const [background, setBackground] = useState('');
  const [historias, setHistorias] = useState([]);
  const [atributos, setAtributos] = useState({ ...atributosIniciais });
  const [vantagensSelecionadas, setVantagensSelecionadas] = useState([]);

  // Async state
  const [imagem, setImagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gerandoBackground, setGerandoBackground] = useState(false);

  // Options loading
  const [loadingOpcoes, setLoadingOpcoes] = useState(false);
  const [loadingVantagens, setLoadingVantagens] = useState(false);
  const [loadingHistorias, setLoadingHistorias] = useState(false);
  const [historiasDisponiveis, setHistoriasDisponiveis] = useState([]);

  // Load options on mount
  useEffect(() => {
    loadOpcoes();
    loadVantagensData();
    loadHistoriasData();
  }, []);

  const loadOpcoes = async () => {
    const racasJa = racasCarregadas && racas.length > 0;
    const classesJa = classesCarregadas && classes.length > 0;
    if (racasJa && classesJa) return;

    setLoadingOpcoes(true);
    try {
      const promises = [];
      if (!racasJa) promises.push(carregarRacas());
      if (!classesJa) promises.push(carregarClasses());
      await Promise.all(promises);
    } catch (err) {
      console.error('Erro ao carregar opcoes:', err);
    } finally {
      setLoadingOpcoes(false);
    }
  };

  const loadVantagensData = async () => {
    const vantagensJa = vantagensCarregadas && vantagens.length > 0;
    const desvantagensJa = desvantagensCarregadas && desvantagens.length > 0;
    if (vantagensJa && desvantagensJa) return;

    setLoadingVantagens(true);
    try {
      const promises = [];
      if (!vantagensJa) promises.push(carregarVantagens());
      if (!desvantagensJa) promises.push(carregarDesvantagens());
      await Promise.all(promises);
    } catch (err) {
      console.error('Erro ao carregar vantagens:', err);
    } finally {
      setLoadingVantagens(false);
    }
  };

  const loadHistoriasData = async () => {
    setLoadingHistorias(true);
    try {
      const response = await historiaService.getAll();
      const data = response.data || [];
      setHistoriasDisponiveis(data);
    } catch (err) {
      console.error('Erro ao carregar historias:', err);
      setHistoriasDisponiveis([]);
    } finally {
      setLoadingHistorias(false);
    }
  };

  // Combine vantagens + desvantagens for the MultiSelect, filtered by creation tier
  const tierCriacao = tierDesbloqueado(1);
  const vantagensDisponiveis = useMemo(() => {
    const todas = [...(vantagens || []), ...(desvantagens || [])];
    return todas.filter(item => (item.nivel || 1) <= tierCriacao);
  }, [vantagens, desvantagens]);

  const racasDisponiveis = racas || [];
  const classesDisponiveis = classes || [];

  const pontosDistribuidos = useMemo(() => somaAtributos(atributos), [atributos]);

  const racaSelecionada = useMemo(() => (
    (racasDisponiveis || []).find(item => String(item.id) === String(raca))
  ), [racasDisponiveis, raca]);

  const classeSelecionada = useMemo(() => (
    (classesDisponiveis || []).find(item => String(item.id) === String(classe))
  ), [classesDisponiveis, classe]);

  const desvantagemIdSet = useMemo(() => (
    new Set((desvantagens || []).map(item => String(item.id)))
  ), [desvantagens]);

  const tracosSelecionados = useMemo(() => (
    (vantagensSelecionadas || [])
      .map((id) => (vantagensDisponiveis || []).find(item => String(item.id) === String(id)))
      .filter(Boolean)
  ), [vantagensSelecionadas, vantagensDisponiveis]);

  const pontosDesvantagem = useMemo(() => (
    tracosSelecionados
      .filter(item => desvantagemIdSet.has(String(item.id)))
      .reduce((sum, item) => sum + toNumericCost(item.custo), 0)
  ), [tracosSelecionados, desvantagemIdSet]);

  const pontosVantagem = useMemo(() => (
    tracosSelecionados
      .filter(item => !desvantagemIdSet.has(String(item.id)))
      .reduce((sum, item) => sum + toNumericCost(item.custo), 0)
  ), [tracosSelecionados, desvantagemIdSet]);

  const custoRaca = useMemo(() => toNumericCost(racaSelecionada?.custo), [racaSelecionada]);
  const custoClasse = useMemo(() => toNumericCost(classeSelecionada?.custo), [classeSelecionada]);
  const pontosDevolvidos = useMemo(() => (
    Math.min(MAX_CUSTO_DESVANTAGEM, Math.abs(Math.min(0, pontosDesvantagem)))
  ), [pontosDesvantagem]);
  const pontosCriacaoTotal = useMemo(() => PONTOS_CRIACAO_BASE + pontosDevolvidos, [pontosDevolvidos]);
  const pontosGastos = useMemo(() => custoRaca + custoClasse + pontosVantagem, [custoRaca, custoClasse, pontosVantagem]);
  const pontosCriacaoRestantes = useMemo(() => pontosCriacaoTotal - pontosGastos, [pontosCriacaoTotal, pontosGastos]);
  const orcamentoCriacaoValido = pontosCriacaoRestantes >= 0;

  const setAtributo = useCallback((key, value) => {
    setAtributos(prev => ({ ...prev, [key]: value }));
  }, []);

  const criarPersonagem = useCallback(async (e) => {
    e.preventDefault();

    if (!nome.trim()) {
      setError('O nome do personagem e obrigatorio');
      return;
    }

    const atributosNormalizados = {
      forca: Number(atributos.forca),
      destreza: Number(atributos.destreza),
      constituicao: Number(atributos.constituicao),
      inteligencia: Number(atributos.inteligencia),
      agilidade: Number(atributos.agilidade),
      carisma: Number(atributos.carisma),
    };
    const atributosInvalidos = Object.entries(atributosNormalizados).filter(([, value]) => !Number.isFinite(value) || value < ATTR_MIN_CRIACAO || value > ATTR_MAX_CRIACAO);
    if (atributosInvalidos.length > 0) {
      setError('Cada atributo deve ficar entre ' + ATTR_MIN_CRIACAO + ' e ' + ATTR_MAX_CRIACAO + ' na criacao.');
      return;
    }

    if (somaAtributos(atributosNormalizados) !== PONTOS_ATRIBUTO_CRIACAO) {
      setError('A distribuicao inicial deve somar ' + PONTOS_ATRIBUTO_CRIACAO + ' pontos.');
      return;
    }

    if (!background.trim()) {
      setError(backgroundTipo === 'guiado'
        ? 'Descreva a origem que a IA deve lapidar em um background final.'
        : 'Escreva o background final do personagem.');
      return;
    }

    if (!orcamentoCriacaoValido) {
      setError(`A ficha excedeu o orcamento de criacao em ${Math.abs(pontosCriacaoRestantes)} ponto(s). Ajuste raca, classe, vantagens ou desvantagens antes de criar.`);
      return;
    }


    setLoading(true);
    setError(null);
    try {
      const vantagensIds = [];
      const desvantagensIds = [];

      if (Array.isArray(vantagensSelecionadas)) {
        // Criar set de IDs que vieram da store de desvantagens para separação correta
        vantagensSelecionadas.forEach(id => {
          if (desvantagemIdSet.has(String(id))) {
            desvantagensIds.push(Number(id));
          } else {
            vantagensIds.push(Number(id));
          }
        });
      }

      // Validacao defensiva de tier (protege contra estado contaminado)
      const todosTracos = [...(vantagens || []), ...(desvantagens || [])];
      const idsSelecionados = [...vantagensIds, ...desvantagensIds];
      for (const selId of idsSelecionados) {
        const traco = todosTracos.find(t => t.id === selId);
        if (traco && (traco.nivel || 1) > tierCriacao) {
          setError(`"${traco.nome}" requer tier ${traco.nivel}, mas a criacao so permite tier ${tierCriacao}`);
          setLoading(false);
          return;
        }
      }

      const historiasIds = Array.isArray(historias)
        ? historias.map(id => Number(id))
        : [];

      const dados = {
        nome,
        raca_id: raca ? Number(raca) : undefined,
        classe_id: classe ? Number(classe) : undefined,
        sugestao_background: backgroundTipo,
        background,
        historias: historiasIds,
        ...atributosNormalizados,
        vantagens: vantagensIds,
        desvantagens: desvantagensIds,
        nivel: 1,
        ...(imagem ? { imagem } : {}),
      };

      const personagem = new Personagem(dados);
      const criado = await personagemService.create(personagem, { context: 'criacao' });

      // Se modo guiado, gerar background via IA apos criacao
      if (backgroundTipo === 'guiado' && criado?.id) {
        try {
          setGerandoBackground(true);
          await personagemService.gerarBackground(criado.id, background);
        } catch (bgError) {
          console.warn('Background IA nao gerado:', bgError.message);
        } finally {
          setGerandoBackground(false);
        }
      }

      await recarregarPersonagens();
      navigate('/personagens');
    } catch (err) {
      setError(err.message || 'Erro ao criar personagem');
    } finally {
      setLoading(false);
    }
  }, [nome, raca, classe, backgroundTipo, background, historias, atributos, vantagensSelecionadas, desvantagemIdSet, orcamentoCriacaoValido, pontosCriacaoRestantes, imagem, recarregarPersonagens, navigate]);

  const clearError = useCallback(() => setError(null), []);

  return {
    // Form state
    nome,
    setNome,
    raca,
    setRaca,
    classe,
    setClasse,
    backgroundTipo,
    setBackgroundTipo,
    background,
    setBackground,
    historias,
    setHistorias: (val) => setHistorias(Array.isArray(val) ? val : []),
    atributos,
    setAtributo,
    vantagens: vantagensSelecionadas,
    setVantagens: setVantagensSelecionadas,
    pontosDistribuidos,
    custoRaca,
    custoClasse,
    pontosVantagem,
    pontosDesvantagem,
    pontosDevolvidos,
    pontosCriacaoTotal,
    pontosGastos,
    pontosCriacaoRestantes,
    maxCustoDesvantagem: MAX_CUSTO_DESVANTAGEM,
    orcamentoCriacaoValido,
    // Options
    racasDisponiveis,
    classesDisponiveis,
    vantagensDisponiveis,
    historiasDisponiveis,
    loadingOpcoes: loadingOpcoes || racasLoading || classesLoading,
    loadingVantagens: loadingVantagens || vantagensLoading,
    loadingHistorias,
    // Async
    loading,
    error,
    gerandoBackground,
    // Actions
    criarPersonagem,
    clearError,
    navigate,
    imagem,
    setImagem,
  };
};

