import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { personagemService, historiaService } from '../../../services/index.js';
import { useVantagemStore } from '../../../store/vantagem';
import { useDesvantagemStore } from '../../../store/desvantagem';
import { useRacaStore } from '../../../store/raca';
import { useClasseStore } from '../../../store/classe';
import { useTheme } from '../../../contexts/theme.jsx';

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

export const usePersonagemEditarModel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Zustand stores
  const racas = useRacaStore(s => s.racas);
  const racasCarregadas = useRacaStore(s => s.racasCarregadas);
  const carregarRacas = useRacaStore(s => s.carregarRacas);
  const racasLoading = useRacaStore(s => s.loading);

  const classes = useClasseStore(s => s.classes);
  const classesCarregadas = useClasseStore(s => s.classesCarregadas);
  const carregarClasses = useClasseStore(s => s.carregarClasses);
  const classesLoading = useClasseStore(s => s.loading);

  const vantagensStore = useVantagemStore(s => s.vantagens);
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
  const [nivel, setNivel] = useState(1);

  // Async state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Options loading
  const [loadingOpcoes, setLoadingOpcoes] = useState(false);
  const [loadingVantagens, setLoadingVantagens] = useState(false);
  const [loadingHistorias, setLoadingHistorias] = useState(false);
  const [historiasDisponiveis, setHistoriasDisponiveis] = useState([]);

  // Load character data on mount
  useEffect(() => {
    if (id) {
      loadPersonagem(id);
      loadVantagensData();
      loadHistoriasData();
    }
  }, [id]);

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
      setError(`Erro ao carregar opcoes: ${err.message}`);
    } finally {
      setLoadingOpcoes(false);
    }
  };

  const loadVantagensData = async () => {
    const vantagensJa = vantagensCarregadas && vantagensStore.length > 0;
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

  const loadPersonagem = async (personagemId) => {
    setLoading(true);
    setError(null);
    try {
      // Ensure options are loaded before mapping
      await loadOpcoes();

      const personagem = await personagemService.getById(personagemId);

      // Get current store state for mapping
      const currentRacas = useRacaStore.getState().racas || [];
      const currentClasses = useClasseStore.getState().classes || [];

      // Map atributos
      const atributosMapeados = {
        forca: personagem.forca || personagem.atributos?.forca || 10,
        destreza: personagem.destreza || personagem.atributos?.destreza || 10,
        constituicao: personagem.constituicao || personagem.atributos?.constituicao || 10,
        inteligencia: personagem.inteligencia || personagem.atributos?.inteligencia || 10,
        agilidade: personagem.agilidade || personagem.atributos?.agilidade || 10,
        carisma: personagem.carisma || personagem.atributos?.carisma || 10,
      };

      // Map vantagens: combine vantagens + desvantagens IDs
      let vantagensMapeadas = [];
      if (Array.isArray(personagem.vantagens)) {
        vantagensMapeadas = personagem.vantagens.map(v =>
          typeof v === 'object' ? String(v.id) : String(v)
        );
      }
      if (Array.isArray(personagem.desvantagens)) {
        const desvantagensIds = personagem.desvantagens.map(d =>
          typeof d === 'object' ? String(d.id) : String(d)
        );
        vantagensMapeadas = [...vantagensMapeadas, ...desvantagensIds];
      }

      // Resolve raca/classe IDs
      let racaId = personagem.raca_id || null;
      let classeId = personagem.classe_id || null;

      if (!racaId && personagem.raca) {
        const racaEncontrada = currentRacas.find(r => r.nome === personagem.raca);
        if (racaEncontrada) racaId = racaEncontrada.id;
      }
      if (!classeId && personagem.classe) {
        const classeEncontrada = currentClasses.find(c => c.nome === personagem.classe);
        if (classeEncontrada) classeId = classeEncontrada.id;
      }

      // Map historias
      let historiasIds = [];
      if (Array.isArray(personagem.historias) && personagem.historias.length > 0) {
        historiasIds = personagem.historias.map(h =>
          typeof h === 'object' ? String(h.id) : String(h)
        );
      }

      setNome(personagem.nome || '');
      setRaca(racaId ? String(racaId) : '');
      setClasse(classeId ? String(classeId) : '');
      setBackgroundTipo(personagem.sugestao_background || personagem.backgroundTipo || 'guiado');
      setBackground(personagem.background || '');
      setHistorias(historiasIds);
      setAtributos(atributosMapeados);
      setVantagensSelecionadas(vantagensMapeadas);
      setNivel(personagem.nivel || 1);
    } catch (err) {
      setError(err.message || 'Erro ao carregar personagem');
    } finally {
      setLoading(false);
    }
  };

  // Combine vantagens + desvantagens for the MultiSelect
  const vantagensDisponiveis = useMemo(() => {
    return [...(vantagensStore || []), ...(desvantagens || [])];
  }, [vantagensStore, desvantagens]);

  const racasDisponiveis = racas || [];
  const classesDisponiveis = classes || [];

  const pontosDistribuidos = useMemo(() => somaAtributos(atributos), [atributos]);

  const setAtributo = useCallback((key, value) => {
    setAtributos(prev => ({ ...prev, [key]: value }));
  }, []);

  const atualizarPersonagem = useCallback(async (e) => {
    e.preventDefault();

    if (!nome.trim()) {
      setError('O nome do personagem e obrigatorio');
      return;
    }

    if (!id) {
      setError('ID do personagem nao encontrado');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Separate vantagens from desvantagens
      const vantagensIds = [];
      const desvantagensIds = [];

      if (Array.isArray(vantagensSelecionadas)) {
        vantagensSelecionadas.forEach(vid => {
          const vantagem = vantagensDisponiveis?.find(v => String(v.id) === String(vid));
          if (vantagem) {
            if (vantagem.tipo === 'desvantagem') {
              desvantagensIds.push(Number(vid));
            } else {
              vantagensIds.push(Number(vid));
            }
          } else {
            vantagensIds.push(Number(vid));
          }
        });
      }

      const historiasIds = Array.isArray(historias) ? historias.map(hid => Number(hid)) : [];

      const dadosAtualizacao = {
        nome,
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
        nivel,
      };

      await personagemService.update(id, dadosAtualizacao);
      navigate('/personagens');
    } catch (err) {
      setError(err.message || 'Erro ao atualizar personagem');
    } finally {
      setLoading(false);
    }
  }, [id, nome, background, historias, atributos, vantagensSelecionadas, vantagensDisponiveis, nivel, navigate]);

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
    // Actions
    atualizarPersonagem,
    clearError,
    navigate,
    isLight,
  };
};
