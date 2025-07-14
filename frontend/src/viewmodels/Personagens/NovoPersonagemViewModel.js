import { PersonagemService } from '../../services/PersonagemService';
import { VantagemService } from '../../services/VantagemService';
import { HistoriaService } from '../../services/HistoriaService';
import { RacaService } from '../../services/RacaService';
import { ClasseService } from '../../services/ClasseService';
import { Personagem } from '../../models/Personagem';
import { apiClient } from '../../services/ApiClient';

const atributosIniciais = {
  forca: "",
  inteligencia: "",
  constituicao: "",
  agilidade: "",
  destreza: "",
  carisma: "",
};

const backgroundsGuiados = [
  "Aventureiro",
  "Nobre",
  "Mercador",
  "Artesão",
  "Mago Aprendiz",
  "Outro",
];

function getRandomPontos() {
  return Math.floor(Math.random() * 11) + 20; // 20 a 30
}

function somaAtributos(atributos) {
  return Object.values(atributos)
    .map((v) => Number(v) || 0)
    .reduce((a, b) => a + b, 0);
}

function somaCustoVantagens(vantagensSelecionadas, vantagensDisponiveis) {
  if (!Array.isArray(vantagensSelecionadas)) return 0;
  return vantagensSelecionadas.reduce((acc, id) => {
    const vant = vantagensDisponiveis.find(v => v.id === id);
    return acc + (vant ? Number(vant.custo) || 0 : 0);
  }, 0);
}

export class NovoPersonagemViewModel {
  constructor() {
    this.state = {
      nome: '',
      raca: '',
      classe: '',
      backgroundTipo: 'guiado',
      background: '',
      historia_id: null,
      atributos: { ...atributosIniciais },
      vantagens: [], // agora array de IDs
      equipamentos: '',
      pontosTotais: getRandomPontos(),
      loading: false,
      error: null,
      vantagensDisponiveis: [],
      loadingVantagens: false,
      vantagemError: null, // erro visual de pontos
      historiasDisponiveis: [],
      loadingHistorias: false,
      racasDisponiveis: [],
      classesDisponiveis: [],
      loadingOpcoes: false
    };
    
    this.subscribers = [];
    this.personagemService = new PersonagemService(apiClient);
    this.vantagemService = new VantagemService(apiClient);
    this.historiaService = new HistoriaService(apiClient);
    this.racaService = new RacaService(apiClient);
    this.classeService = new ClasseService(apiClient);
  }

  getState() {
    const pontosAtributos = somaAtributos(this.state.atributos);
    const pontosVantagens = somaCustoVantagens(this.state.vantagens, this.state.vantagensDisponiveis);
    const pontosRestantes = this.state.pontosTotais - pontosAtributos - pontosVantagens;
    return { 
      ...this.state,
      pontosDistribuidos: pontosAtributos,
      pontosRestantes: pontosRestantes,
      pontosVantagensRestantes: pontosRestantes,
      backgroundsGuiados
    };
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(callback => callback(this.getState()));
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  setNome = (nome) => {
    this.setState({ nome });
  };

  setRaca = (raca) => {
    this.setState({ raca });
  };

  setClasse = (classe) => {
    this.setState({ classe });
  };

  setBackgroundTipo = (backgroundTipo) => {
    this.setState({ backgroundTipo });
  };

  setBackground = (background) => {
    this.setState({ background });
  };

  setHistoriaId = (historia_id) => {
    this.setState({ historia_id });
  };

  setVantagens = (vantagens) => {
    // vantagens: array de IDs
    if (!Array.isArray(vantagens)) vantagens = [];
    const pontosAtributos = somaAtributos(this.state.atributos);
    const custoTotal = somaCustoVantagens(vantagens, this.state.vantagensDisponiveis);
    const pontosRestantes = this.state.pontosTotais - pontosAtributos - custoTotal;
    if (pontosRestantes < 0) {
      this.setState({ vantagemError: 'Pontos insuficientes para selecionar esta vantagem.' });
      return;
    }
    this.setState({ vantagens, vantagemError: null });
  };

  setEquipamentos = (equipamentos) => {
    this.setState({ equipamentos });
  };

  setAtributo = (atributo, valor) => {
    const novoValor = Number(valor) || 0;
    const outrosAtributos = { ...this.state.atributos, [atributo]: 0 };
    const somaSemAtual = somaAtributos(outrosAtributos);
    const custoVantagens = somaCustoVantagens(this.state.vantagens, this.state.vantagensDisponiveis);
    // Não permitir que a soma ultrapasse pontosTotais
    if (somaSemAtual + novoValor + custoVantagens > this.state.pontosTotais) return;
    this.setState({
      atributos: { ...this.state.atributos, [atributo]: valor }
    });
  };

  resetPontos = () => {
    this.setState({
      pontosTotais: getRandomPontos(),
      atributos: { ...atributosIniciais },
      vantagens: [],
      vantagemError: null
    });
  };

  loadVantagens = async (params) => {
    this.setState({ loadingVantagens: true });
    try {
      const vantagens = await this.vantagemService.getAll(params);
      this.setState({ 
        vantagensDisponiveis: vantagens,
        loadingVantagens: false 
      });
    } catch (error) {
      // Fallback para opções estáticas caso a API não esteja disponível
      const opcoesVantagens = [
        // Vantagens
        { id: 1, nome: 'Visão Noturna', custo: 2, descricao: 'Pode ver no escuro como se fosse dia claro.', tipo: 'vantagem' },
        { id: 2, nome: 'Imunidade a Veneno', custo: 3, descricao: 'Não é afetado por venenos de qualquer tipo.', tipo: 'vantagem' },
        { id: 3, nome: 'Regeneração', custo: 4, descricao: 'Recupera pontos de vida automaticamente.', tipo: 'vantagem' },
        { id: 4, nome: 'Telepatia', custo: 3, descricao: 'Pode se comunicar mentalmente com outros.', tipo: 'vantagem' },
        { id: 5, nome: 'Voo', custo: 5, descricao: 'Pode voar livremente pelo ar.', tipo: 'vantagem' },
        // Desvantagens
        { id: 6, nome: 'Cegueira', custo: -3, descricao: 'Não pode ver, mas ganha pontos extras.', tipo: 'desvantagem' },
        { id: 7, nome: 'Fraqueza', custo: -2, descricao: 'Menos resistente a dano físico.', tipo: 'desvantagem' },
        { id: 8, nome: 'Medo de Altura', custo: -1, descricao: 'Fica paralisado em lugares altos.', tipo: 'desvantagem' },
        { id: 9, nome: 'Alergia a Metais', custo: -2, descricao: 'Não pode usar equipamentos de metal.', tipo: 'desvantagem' },
        { id: 10, nome: 'Amnésia', custo: -4, descricao: 'Esqueceu parte de seu passado.', tipo: 'desvantagem' }
      ];
      this.setState({ 
        vantagensDisponiveis: opcoesVantagens,
        loadingVantagens: false 
      });
    }
  };

  loadHistorias = async () => {
    this.setState({ loadingHistorias: true });
    try {
      const historias = await this.historiaService.getAll();
      this.setState({ 
        historiasDisponiveis: historias,
        loadingHistorias: false 
      });
    } catch (error) {
      this.setState({ 
        error: `Erro ao carregar histórias: ${error.message}`,
        loadingHistorias: false 
      });
    }
  };

  loadOpcoes = async () => {
    this.setState({ loadingOpcoes: true });
    try {
      // Buscar raças e classes separadamente
      const [racas, classes] = await Promise.all([
        this.racaService.getAll(),
        this.classeService.getAll()
      ]);
      this.setState({ 
        racasDisponiveis: racas,
        classesDisponiveis: classes,
        loadingOpcoes: false 
      });
    } catch (error) {
      this.setState({ 
        error: `Erro ao carregar opções: ${error.message}`,
        loadingOpcoes: false 
      });
    }
  };

  criarPersonagem = async (onSuccess) => {
    const pontosAtributos = somaAtributos(this.state.atributos);
    const custoTotal = somaCustoVantagens(this.state.vantagens, this.state.vantagensDisponiveis);
    const pontosRestantes = this.state.pontosTotais - pontosAtributos - custoTotal;
    if (!this.state.nome.trim()) {
      this.setState({ error: 'O nome do personagem é obrigatório' });
      return;
    }
    if (!this.state.historia_id) {
      this.setState({ error: 'A história é obrigatória' });
      return;
    }
    if (pontosRestantes !== 0) {
      this.setState({ error: 'Distribua todos os pontos entre atributos e vantagens/desvantagens antes de salvar' });
      return;
    }
    this.setState({ loading: true, error: null });
    try {
      const personagem = new Personagem({
        nome: this.state.nome,
        raca: this.state.raca,
        classe: this.state.classe,
        sugestao_background: this.state.backgroundTipo,
        background: this.state.background,
        historia_id: this.state.historia_id,
        atributos: this.state.atributos,
        vantagens: this.state.vantagens,
        equipamentos: this.state.equipamentos,
        hp: 100,
        nivel: 1
      });
      await this.personagemService.create(personagem);
      
      // Limpar formulário após sucesso
      this.setState({
        nome: '',
        raca: '',
        classe: '',
        backgroundTipo: 'guiado',
        background: '',
        historia_id: null,
        atributos: { ...atributosIniciais },
        vantagens: [],
        equipamentos: '',
        pontosTotais: getRandomPontos(),
        error: null,
        vantagemError: null
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      this.setState({ 
        error: error.message || 'Erro ao criar personagem'
      });
    } finally {
      this.setState({ loading: false });
    }
  };

  clearError = () => {
    this.setState({ error: null, vantagemError: null });
  };
}

export const novoPersonagemViewModel = new NovoPersonagemViewModel(); 