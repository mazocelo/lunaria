import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { mestreCriadorService, personagemService } from '../../../services/index.js';
import { usePersonagemStore } from '../../../store/personagem';
import { useVantagemStore } from '../../../store/vantagem';
import { useDesvantagemStore } from '../../../store/desvantagem';
import { useRacaStore } from '../../../store/raca';
import { useClasseStore } from '../../../store/classe';
import { useTheme } from '../../../contexts/theme.jsx';
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

const PONTOS_TOTAIS = 75;

function somaAtributos(atributos) {
  return Object.values(atributos)
    .map((v) => Number(v) || 0)
    .reduce((a, b) => a + b, 0);
}

export const useWizardModel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const recarregarPersonagens = usePersonagemStore(s => s.recarregarPersonagens);
  const chatEndRef = useRef(null);

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

  // Wizard state
  const [etapaAtual, setEtapaAtual] = useState('boas_vindas');
  const [mensagens, setMensagens] = useState([]);
  const [inputTexto, setInputTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  // Personagem state
  const [nome, setNome] = useState('');
  const [racaId, setRacaId] = useState(null);
  const [racaNome, setRacaNome] = useState('');
  const [classeId, setClasseId] = useState(null);
  const [classeNome, setClasseNome] = useState('');
  const [background, setBackground] = useState('');
  const [vantagensIds, setVantagensIds] = useState([]);
  const [vantagensNomes, setVantagensNomes] = useState([]);
  const [desvantagensIds, setDesvantagensIds] = useState([]);
  const [desvantagensNomes, setDesvantagensNomes] = useState([]);
  const [atributos, setAtributos] = useState({
    forca: 10, destreza: 10, constituicao: 10,
    inteligencia: 10, agilidade: 10, carisma: 10,
  });

  // Sugestões ativas (vindas da IA)
  const [sugestoes, setSugestoes] = useState([]);
  const [atributosSugeridos, setAtributosSugeridos] = useState(null);

  // Saving
  const [salvando, setSalvando] = useState(false);
  const [gerandoBackground, setGerandoBackground] = useState(false);

  // Dados para preview card
  const racasDisponiveis = racas || [];
  const classesDisponiveis = classes || [];
  const vantagensDisponiveis = useMemo(() => {
    return [...(vantagens || []), ...(desvantagens || [])];
  }, [vantagens, desvantagens]);

  const pontosDistribuidos = useMemo(() => somaAtributos(atributos), [atributos]);
  const pontosRestantes = PONTOS_TOTAIS - pontosDistribuidos;

  const etapaIndex = useMemo(() => {
    return ETAPAS.findIndex(e => e.id === etapaAtual);
  }, [etapaAtual]);

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

  // Iniciar wizard automaticamente
  useEffect(() => {
    iniciarWizard();
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
    atributos,
  }), [nome, racaId, racaNome, classeId, classeNome, background, vantagensIds, vantagensNomes, desvantagensIds, desvantagensNomes, atributos]);

  /** Monta histórico de chat para enviar ao backend */
  const getHistorico = useCallback(() => {
    return mensagens.map(m => ({
      role: m.role === 'mestre' ? 'assistant' : 'user',
      content: m.content,
    }));
  }, [mensagens]);

  /** Envia mensagem do jogador */
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

      // Avançar etapa
      if (resultado.etapa_proxima && resultado.etapa_proxima !== etapaAtual) {
        setEtapaAtual(resultado.etapa_proxima);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }, [etapaAtual, nome, enviando, getEstado, getHistorico]);

  /** Seleciona uma sugestão (raça, classe, vantagem, etc.) */
  const selecionarSugestao = useCallback((sugestao) => {
    const { tipo, id, nome: sugestaoNome } = sugestao;

    // Ignorar se vantagem/desvantagem já está selecionada
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
      case 'vantagem':
        setVantagensIds(prev => [...prev, id]);
        setVantagensNomes(prev => [...prev, sugestaoNome]);
        break;
      case 'desvantagem':
        setDesvantagensIds(prev => [...prev, id]);
        setDesvantagensNomes(prev => [...prev, sugestaoNome]);
        break;
    }

    // Enviar como mensagem do jogador
    enviarMensagem(`Escolho: ${sugestaoNome}`);
  }, [enviarMensagem, vantagensIds, desvantagensIds]);

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

  /** Aplica sugestão de atributos da IA */
  const aplicarAtributosSugeridos = useCallback(() => {
    if (atributosSugeridos) {
      setAtributos({ ...atributosSugeridos });
    }
  }, [atributosSugeridos]);

  /** Atualiza um atributo individual */
  const setAtributo = useCallback((key, value) => {
    const val = Math.min(20, Math.max(1, Number(value) || 0));
    setAtributos(prev => ({ ...prev, [key]: val }));
  }, []);

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

    setSalvando(true);
    setError(null);

    try {
      // Aplicar bônus de raça/classe nos atributos finais
      const parseBonus = (raw) => {
        if (!raw) return null;
        try {
          const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
          return Array.isArray(obj) ? obj[0] : obj;
        } catch { return null; }
      };
      const racaObj = racasDisponiveis.find(r => r.id === racaId);
      const classeObj = classesDisponiveis.find(c => c.id === classeId);
      const racaBonus = parseBonus(racaObj?.bonus);
      const classeBonus = parseBonus(classeObj?.bonus);

      const getBonus = (key) => {
        let b = 0;
        if (racaBonus && (typeof racaBonus[key] === 'string' || typeof racaBonus[key] === 'number')) {
          b += Number(racaBonus[key]) || 0;
        }
        if (classeBonus && (typeof classeBonus[key] === 'string' || typeof classeBonus[key] === 'number')) {
          b += Number(classeBonus[key]) || 0;
        }
        return b;
      };

      const dados = {
        nome,
        raca_id: racaId || undefined,
        classe_id: classeId || undefined,
        sugestao_background: 'guiado',
        background,
        historias: [],
        forca: atributos.forca + getBonus('forca'),
        destreza: atributos.destreza + getBonus('destreza'),
        constituicao: atributos.constituicao + getBonus('constituicao'),
        inteligencia: atributos.inteligencia + getBonus('inteligencia'),
        agilidade: atributos.agilidade + getBonus('agilidade'),
        carisma: atributos.carisma + getBonus('carisma'),
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

      await recarregarPersonagens();
      navigate('/personagens');
    } catch (err) {
      setError(err.message || 'Erro ao criar personagem');
    } finally {
      setSalvando(false);
    }
  }, [nome, racaId, classeId, background, atributos, vantagensIds, desvantagensIds, racasDisponiveis, classesDisponiveis, navigate, recarregarPersonagens]);

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
    atributos,
    pontosDistribuidos,
    pontosRestantes,
    pontosTotais: PONTOS_TOTAIS,

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
    salvarPersonagem,
    clearError,

    // Async
    salvando,
    gerandoBackground,
    error,

    // Theme
    isLight,
    navigate,
  };
};
