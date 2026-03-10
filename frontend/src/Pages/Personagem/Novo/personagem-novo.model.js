import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { personagemService, historiaService } from '../../../services/index.js';
import { usePersonagemStore } from '../../../store/personagem';
import { useVantagemStore } from '../../../store/vantagem';
import { useDesvantagemStore } from '../../../store/desvantagem';
import { useRacaStore } from '../../../store/raca';
import { useClasseStore } from '../../../store/classe';
import { useTheme } from '../../../contexts/theme.jsx';
import { Personagem } from '../../../models/Personagem';

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

export const usePersonagemNovoModel = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
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

  // Combine vantagens + desvantagens for the MultiSelect
  const vantagensDisponiveis = useMemo(() => {
    return [...(vantagens || []), ...(desvantagens || [])];
  }, [vantagens, desvantagens]);

  const racasDisponiveis = racas || [];
  const classesDisponiveis = classes || [];

  const pontosDistribuidos = useMemo(() => somaAtributos(atributos), [atributos]);

  const setAtributo = useCallback((key, value) => {
    setAtributos(prev => ({ ...prev, [key]: value }));
  }, []);

  const criarPersonagem = useCallback(async (e) => {
    e.preventDefault();

    if (!nome.trim()) {
      setError('O nome do personagem e obrigatorio');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const vantagensIds = [];
      const desvantagensIds = [];

      if (Array.isArray(vantagensSelecionadas)) {
        // Criar set de IDs que vieram da store de desvantagens para separação correta
        const desvantagemIdSet = new Set((desvantagens || []).map(d => String(d.id)));
        vantagensSelecionadas.forEach(id => {
          if (desvantagemIdSet.has(String(id))) {
            desvantagensIds.push(Number(id));
          } else {
            vantagensIds.push(Number(id));
          }
        });
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
        forca: Number(atributos.forca) || 10,
        destreza: Number(atributos.destreza) || 10,
        constituicao: Number(atributos.constituicao) || 10,
        inteligencia: Number(atributos.inteligencia) || 10,
        agilidade: Number(atributos.agilidade) || 10,
        carisma: Number(atributos.carisma) || 10,
        vantagens: vantagensIds,
        desvantagens: desvantagensIds,
        nivel: 1,
        ...(imagem ? { imagem } : {}),
      };

      const personagem = new Personagem(dados);
      const criado = await personagemService.create(personagem);

      // Se modo guiado, gerar background via IA apos criacao
      if (backgroundTipo === 'guiado' && criado?.id) {
        try {
          setGerandoBackground(true);
          await personagemService.gerarBackground(criado.id, background);
        } catch (bgError) {
          console.warn('Background IA nao gerado:', bgError.message);
          setGerandoBackground(false);
          setError('Personagem criado com sucesso! Porem o background nao pode ser gerado pela IA. Voce pode edita-lo depois.');
          return;
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
  }, [nome, raca, classe, backgroundTipo, background, historias, atributos, vantagensSelecionadas, vantagensDisponiveis, navigate]);

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
    isLight,
    imagem,
    setImagem,
  };
};
