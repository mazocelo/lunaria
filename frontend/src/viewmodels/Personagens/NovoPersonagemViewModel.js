import { PersonagemService } from '../../services/PersonagemService';
import { HistoriaService } from '../../services/HistoriaService';
import { Personagem } from '../../models/Personagem';
import { apiClient } from '../../services/ApiClient';
import { 
  getVantagemStoreAPI, 
  getDesvantagemStoreAPI, 
  getRacaStoreAPI, 
  getClasseStoreAPI 
} from '../../store/index.js';

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

function getCustoRaca(raca_id, racasDisponiveis) {
  if (!raca_id || !Array.isArray(racasDisponiveis)) return 0;
  const raca = racasDisponiveis.find(r => String(r.id) === String(raca_id));
  return raca ? Number(raca.custo) || 0 : 0;
}

function getCustoClasse(classe_id, classesDisponiveis) {
  if (!classe_id || !Array.isArray(classesDisponiveis)) return 0;
  const classe = classesDisponiveis.find(c => String(c.id) === String(classe_id));
  return classe ? Number(classe.custo) || 0 : 0;
}

export class NovoPersonagemViewModel {
  constructor() {
    this.state = {
      nome: '',
      raca_id: '',
      classe_id: '',
      backgroundTipo: 'guiado',
      background: '',
      historias: [], // Array de IDs de histórias selecionadas
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
    
    // 🎯 Services para CRUD de personagens e histórias
    this.personagemService = new PersonagemService(apiClient);
    this.historiaService = new HistoriaService(apiClient);
    
    // 🏪 APIs diretas dos stores para dados estáticos (sem hooks!)
    this.vantagemStore = getVantagemStoreAPI();
    this.desvantagemStore = getDesvantagemStoreAPI();
    this.racaStore = getRacaStoreAPI();
    this.classeStore = getClasseStoreAPI();
    
    // 🔄 Subscribir a mudanças nos stores para sincronizar estado local
    this.unsubscribers = [
      this.vantagemStore.subscribe(() => this.updateVantagensFromStore()),
      this.desvantagemStore.subscribe(() => this.updateDesvantagensFromStore()),
      this.racaStore.subscribe(() => this.updateRacasFromStore()),
      this.classeStore.subscribe(() => this.updateClassesFromStore())
    ];
  }

  getState() {
    const pontosAtributos = somaAtributos(this.state.atributos);
    const pontosVantagens = somaCustoVantagens(this.state.vantagens, this.state.vantagensDisponiveis);
    const pontosDesvantagens = somaCustoDesvantagens(this.state.desvantagens, this.state.desvantagensDisponiveis);
    const custoRaca = getCustoRaca(this.state.raca_id, this.state.racasDisponiveis);
    const custoClasse = getCustoClasse(this.state.classe_id, this.state.classesDisponiveis);
    const pontosUsados = pontosAtributos + pontosVantagens + pontosDesvantagens + custoRaca + custoClasse;
    const state = { 
      ...this.state,
      pontosDistribuidos: pontosAtributos,
      pontosVantagens: pontosVantagens,
      pontosDesvantagens: pontosDesvantagens,
      custoRaca: custoRaca,
      custoClasse: custoClasse,
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

  // ===== HANDLERS DE SINCRONIZAÇÃO COM STORES =====
  updateVantagensFromStore = () => {
    const storeState = this.vantagemStore.getState();
    if (storeState.vantagensCarregadas && storeState.vantagens.length > 0) {
      // Filtrar apenas vantagens positivas (custo >= 0)
      const vantagensPositivas = storeState.vantagens.filter(v => v.custo >= 0);
      this.setState({ 
        vantagensDisponiveis: vantagensPositivas,
        loadingVantagens: storeState.loading,
        vantagemError: storeState.error
      });
    }
  };

  updateDesvantagensFromStore = () => {
    const storeState = this.desvantagemStore.getState();
    if (storeState.desvantagensCarregadas && storeState.desvantagens.length > 0) {
      this.setState({ 
        desvantagensDisponiveis: storeState.desvantagens,
        loadingDesvantagens: storeState.loading
      });
    }
  };

  updateRacasFromStore = () => {
    const storeState = this.racaStore.getState();
    if (storeState.racasCarregadas && storeState.racas.length > 0) {
      this.setState({ 
        racasDisponiveis: storeState.racas,
        loadingOpcoes: storeState.loading
      });
    }
  };

  updateClassesFromStore = () => {
    const storeState = this.classeStore.getState();
    if (storeState.classesCarregadas && storeState.classes.length > 0) {
      this.setState({ 
        classesDisponiveis: storeState.classes,
        loadingOpcoes: storeState.loading
      });
    }
  };

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

  setHistorias = (historias) => {
    this.setState({ historias: Array.isArray(historias) ? historias : [] });
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
    try {
      // 🔻 CACHE FIRST: Verificar se já existem dados no store
      const storeState = this.vantagemStore.getState();
      
      if (storeState.vantagensCarregadas && storeState.vantagens.length > 0) {
        this.updateVantagensFromStore();
        return;
      }
      
      // 📡 FALLBACK: Se não há cache, carregar do backend
      this.setState({ loadingVantagens: true });
      
      await this.vantagemStore.carregarVantagens();
      
      // Estado será atualizado via updateVantagensFromStore
    } catch (error) {
      console.error('❌ NovoPersonagemViewModel: Erro ao carregar vantagens:', error);
      
      // Fallback com dados estáticos
      const opcoesVantagens = [
        { id: 1, nome: 'Visão Noturna', custo: 2, descricao: 'Pode ver no escuro como se fosse dia claro.', tipo: 'vantagem' },
        { id: 2, nome: 'Imunidade a Veneno', custo: 3, descricao: 'Não é afetado por venenos de qualquer tipo.', tipo: 'vantagem' },
        { id: 3, nome: 'Regeneração', custo: 4, descricao: 'Recupera pontos de vida automaticamente.', tipo: 'vantagem' },
        { id: 4, nome: 'Telepatia', custo: 3, descricao: 'Pode se comunicar mentalmente com outros.', tipo: 'vantagem' },
        { id: 5, nome: 'Voo', custo: 5, descricao: 'Pode voar livremente pelo ar.', tipo: 'vantagem' }
      ];
      this.setState({ 
        vantagensDisponiveis: opcoesVantagens,
        loadingVantagens: false,
        vantagemError: error.message
      });
    }
  };

  loadDesvantagens = async (params) => {
    try {
      // 🔻 CACHE FIRST: Verificar se já existem dados no store
      const storeState = this.desvantagemStore.getState();
      
      if (storeState.desvantagensCarregadas && storeState.desvantagens.length > 0) {
        this.updateDesvantagensFromStore();
        return;
      }
      
      // 📡 FALLBACK: Se não há cache, carregar do backend
      this.setState({ loadingDesvantagens: true });
      
      await this.desvantagemStore.carregarDesvantagens();
      
      // Estado será atualizado via updateDesvantagensFromStore
    } catch (error) {
      console.error('❌ NovoPersonagemViewModel: Erro ao carregar desvantagens:', error);
      
      // Fallback com dados estáticos
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
      const response = await this.historiaService.getAll();
      if (response.success) {
        const historias = Array.isArray(response.data) ? response.data : [];
        this.setState({ 
          historiasDisponiveis: historias,
          loadingHistorias: false 
        });
      }
    } catch (error) {
      this.setState({ 
        error: `Erro ao carregar histórias: ${error.message}`,
        historiasDisponiveis: [],
        loadingHistorias: false 
      });
    }
  };

  loadOpcoes = async () => {
    try {
      // 🔻 CACHE FIRST: Verificar se já existem dados nos stores
      const racaState = this.racaStore.getState();
      const classeState = this.classeStore.getState();
      
      const racasJaCarregadas = racaState.racasCarregadas && racaState.racas.length > 0;
      const classesJaCarregadas = classeState.classesCarregadas && classeState.classes.length > 0;
      
      if (racasJaCarregadas && classesJaCarregadas) {
        this.updateRacasFromStore();
        this.updateClassesFromStore();
        return;
      }
      
      // 📡 FALLBACK: Se não há cache, carregar do backend
      this.setState({ loadingOpcoes: true });
      
      // Carregar em paralelo apenas os que não estão carregados
      const promises = [];
      if (!racasJaCarregadas) {
        promises.push(this.racaStore.carregarRacas());
      }
      if (!classesJaCarregadas) {
        promises.push(this.classeStore.carregarClasses());
      }
      
      await Promise.all(promises);
      
      // Estados serão atualizados via updateRacasFromStore e updateClassesFromStore
    } catch (error) {
      console.error('❌ NovoPersonagemViewModel: Erro ao carregar opções:', error);
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
    const custoRaca = getCustoRaca(this.state.raca_id, this.state.racasDisponiveis);
    const custoClasse = getCustoClasse(this.state.classe_id, this.state.classesDisponiveis);
    const pontosUsados = pontosAtributos + custoVantagens + custoDesvantagens + custoRaca + custoClasse;
    
    if (!this.state.nome.trim()) {
      this.setState({ error: 'O nome do personagem é obrigatório' });
      return;
    }
    // Histórias não são obrigatórias - personagem pode ser criado sem histórias
    
    this.setState({ loading: true, error: null });
    try {
      const personagem = new Personagem({
        nome: this.state.nome,
        raca_id: this.state.raca_id,
        classe_id: this.state.classe_id,
        sugestao_background: this.state.backgroundTipo,
        background: this.state.background,
        historias: this.state.historias, // Array de IDs de histórias
        // Mapear atributos individuais
        forca: Number(this.state.atributos.forca) || 10,
        destreza: Number(this.state.atributos.destreza) || 10,
        constituicao: Number(this.state.atributos.constituicao) || 10,
        inteligencia: Number(this.state.atributos.inteligencia) || 10,
        agilidade: Number(this.state.atributos.agilidade) || 10,
        carisma: Number(this.state.atributos.carisma) || 10,
        // Manter o objeto atributos para compatibilidade
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

  // 🧹 Cleanup para evitar memory leaks
  destroy() {
    if (this.unsubscribers) {
      this.unsubscribers.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      this.unsubscribers = [];
    }
    this.subscribers = [];
  }
}

export const novoPersonagemViewModel = new NovoPersonagemViewModel(); 