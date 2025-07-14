import { PersonagemService } from '../../services/PersonagemService';
import { VantagemService } from '../../services/VantagemService';
import { DesvantagemService } from '../../services/DesvantagemService';
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

function somaCustoDesvantagens(desvantagensSelecionadas, desvantagensDisponiveis) {
  if (!Array.isArray(desvantagensSelecionadas)) return 0;
  return desvantagensSelecionadas.reduce((acc, id) => {
    const desv = desvantagensDisponiveis.find(d => d.id === id);
    return acc + (desv ? Number(desv.custo) || 0 : 0);
  }, 0);
}

export class NovoPersonagemViewModel {
  constructor() {
    this.state = {
      nome: '',
      raca_id: '',
      classe_id: '',
      backgroundTipo: 'guiado',
      background: '',
      historia_id: '',
      atributos: { ...atributosIniciais },
      vantagens: [],
      desvantagens: [],
      equipamentos: '',
      loading: false,
      error: null,
      vantagensDisponiveis: [],
      desvantagensDisponiveis: [],
      loadingVantagens: false,
      loadingDesvantagens: false,
      vantagemError: null,
      historiasDisponiveis: [],
      loadingHistorias: false,
      racasDisponiveis: [],
      classesDisponiveis: [],
      loadingOpcoes: false
    };
    
    this.subscribers = [];
    this.personagemService = new PersonagemService(apiClient);
    this.vantagemService = new VantagemService(apiClient);
    this.desvantagemService = new DesvantagemService(apiClient);
    this.historiaService = new HistoriaService(apiClient);
    this.racaService = new RacaService(apiClient);
    this.classeService = new ClasseService(apiClient);
  }

  getState() {
    const pontosAtributos = somaAtributos(this.state.atributos);
    const pontosVantagens = somaCustoVantagens(this.state.vantagens, this.state.vantagensDisponiveis);
    const pontosDesvantagens = somaCustoDesvantagens(this.state.desvantagens, this.state.desvantagensDisponiveis);
    const pontosUsados = pontosAtributos + pontosVantagens + pontosDesvantagens;
    const state = { 
      ...this.state,
      pontosDistribuidos: pontosAtributos,
      pontosVantagens: pontosVantagens,
      pontosDesvantagens: pontosDesvantagens,
      pontosUsados: pontosUsados,
      backgroundsGuiados
    };
    return state;
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notify() {
    const state = this.getState();
    this.subscribers.forEach(callback => callback(state));
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  setNome = (nome) => {
    this.setState({ nome });
  };

  setRaca = (raca) => {
    this.setState({ raca_id: String(raca) });
  };

  setClasse = (classe) => {
    this.setState({ classe_id: String(classe) });
  };

  setBackgroundTipo = (backgroundTipo) => {
    this.setState({ backgroundTipo });
  };

  setBackground = (background) => {
    this.setState({ background });
  };

  setHistoriaId = (historia_id) => {
    this.setState({ historia_id: String(historia_id) });
  };

  setVantagens = (vantagens) => {
    if (!Array.isArray(vantagens)) vantagens = [];
    this.setState({ vantagens, vantagemError: null });
  };

  setDesvantagens = (desvantagens) => {
    if (!Array.isArray(desvantagens)) desvantagens = [];
    this.setState({ desvantagens, vantagemError: null });
  };

  setEquipamentos = (equipamentos) => {
    this.setState({ equipamentos });
  };

  setAtributo = (atributo, valor) => {
    this.setState({
      atributos: { ...this.state.atributos, [atributo]: valor }
    });
  };

  resetPontos = () => {
    this.setState({
      atributos: { ...atributosIniciais },
      vantagens: [],
      desvantagens: [],
      vantagemError: null,
      raca_id: '',
      classe_id: '',
      historia_id: ''
    });
  };

  loadVantagens = async (params) => {
    this.setState({ loadingVantagens: true });
    try {
      const vantagens = await this.vantagemService.getAll(params);
      const vantagensProcessadas = Array.isArray(vantagens) ? vantagens : [];
      this.setState({ 
        vantagensDisponiveis: vantagensProcessadas,
        loadingVantagens: false 
      });
    } catch (error) {
      const opcoesVantagens = [
        { id: 1, nome: 'Visão Noturna', custo: 2, descricao: 'Pode ver no escuro como se fosse dia claro.', tipo: 'vantagem' },
        { id: 2, nome: 'Imunidade a Veneno', custo: 3, descricao: 'Não é afetado por venenos de qualquer tipo.', tipo: 'vantagem' },
        { id: 3, nome: 'Regeneração', custo: 4, descricao: 'Recupera pontos de vida automaticamente.', tipo: 'vantagem' },
        { id: 4, nome: 'Telepatia', custo: 3, descricao: 'Pode se comunicar mentalmente com outros.', tipo: 'vantagem' },
        { id: 5, nome: 'Voo', custo: 5, descricao: 'Pode voar livremente pelo ar.', tipo: 'vantagem' }
      ];
      this.setState({ 
        vantagensDisponiveis: opcoesVantagens,
        loadingVantagens: false 
      });
    }
  };

  loadDesvantagens = async (params) => {
    this.setState({ loadingDesvantagens: true });
    try {
      const desvantagens = await this.desvantagemService.getAll(params);
      const desvantagensProcessadas = Array.isArray(desvantagens) ? desvantagens : [];
      this.setState({ 
        desvantagensDisponiveis: desvantagensProcessadas,
        loadingDesvantagens: false 
      });
    } catch (error) {
      const opcoesDesvantagens = [
        { id: 6, nome: 'Cegueira', custo: -3, descricao: 'Não pode ver, mas ganha pontos extras.', tipo: 'desvantagem' },
        { id: 7, nome: 'Fraqueza', custo: -2, descricao: 'Menos resistente a dano físico.', tipo: 'desvantagem' },
        { id: 8, nome: 'Medo de Altura', custo: -1, descricao: 'Fica paralisado em lugares altos.', tipo: 'desvantagem' },
        { id: 9, nome: 'Alergia a Metais', custo: -2, descricao: 'Não pode usar equipamentos de metal.', tipo: 'desvantagem' },
        { id: 10, nome: 'Amnésia', custo: -4, descricao: 'Esqueceu parte de seu passado.', tipo: 'desvantagem' }
      ];
      this.setState({ 
        desvantagensDisponiveis: opcoesDesvantagens,
        loadingDesvantagens: false 
      });
    }
  };

  loadHistorias = async () => {
    this.setState({ loadingHistorias: true });
    try {
      const historias = await this.historiaService.getAll();
      const historiasProcessadas = Array.isArray(historias) ? historias : [];
      this.setState({ 
        historiasDisponiveis: historiasProcessadas,
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
      const [racas, classes] = await Promise.all([
        this.racaService.getAll(),
        this.classeService.getAll()
      ]);
      
      // Garantir que os dados tenham a estrutura correta
      const racasProcessadas = Array.isArray(racas) ? racas : [];
      const classesProcessadas = Array.isArray(classes) ? classes : [];
      
      this.setState({ 
        racasDisponiveis: racasProcessadas,
        classesDisponiveis: classesProcessadas,
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
    const custoVantagens = somaCustoVantagens(this.state.vantagens, this.state.vantagensDisponiveis);
    const custoDesvantagens = somaCustoDesvantagens(this.state.desvantagens, this.state.desvantagensDisponiveis);
    const pontosUsados = pontosAtributos + custoVantagens + custoDesvantagens;
    
    if (!this.state.nome.trim()) {
      this.setState({ error: 'O nome do personagem é obrigatório' });
      return;
    }
    if (!this.state.historia_id || this.state.historia_id === '') {
      this.setState({ error: 'A história é obrigatória' });
      return;
    }
    
    this.setState({ loading: true, error: null });
    try {
      const personagem = new Personagem({
        nome: this.state.nome,
        raca_id: this.state.raca_id,
        classe_id: this.state.classe_id,
        sugestao_background: this.state.backgroundTipo,
        background: this.state.background,
        historia_id: this.state.historia_id,
        atributos: this.state.atributos,
        vantagens: this.state.vantagens,
        desvantagens: this.state.desvantagens,
        equipamentos: this.state.equipamentos,
        pontos_iniciais: 0,
        pontos_totais: pontosUsados,
        hp: 100,
        nivel: 1
      });
      await this.personagemService.create(personagem);
      
      this.setState({
        nome: '',
        raca_id: '',
        classe_id: '',
        backgroundTipo: 'guiado',
        background: '',
        historia_id: '',
        atributos: { ...atributosIniciais },
        vantagens: [],
        desvantagens: [],
        equipamentos: '',
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

  // Getters para acessar os valores do estado
  get nome() {
    return this.state.nome;
  }

  get raca() {
    return this.state.raca_id;
  }

  get classe() {
    return this.state.classe_id;
  }

  get backgroundTipo() {
    return this.state.backgroundTipo;
  }

  get background() {
    return this.state.background;
  }

  get historia_id() {
    return this.state.historia_id;
  }

  get vantagens() {
    return this.state.vantagens;
  }

  get desvantagens() {
    return this.state.desvantagens;
  }

  get equipamentos() {
    return this.state.equipamentos;
  }

  get error() {
    return this.state.error;
  }

  get vantagemError() {
    return this.state.vantagemError;
  }
}

export const novoPersonagemViewModel = new NovoPersonagemViewModel(); 