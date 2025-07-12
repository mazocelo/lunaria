import { PersonagemService } from '../../services/PersonagemService';
import { HabilidadeService } from '../../services/HabilidadeService';
import { apiClient } from '../../services/ApiClient';

const atributosIniciais = {
  forca: "",
  inteligencia: "",
  carisma: "",
  destreza: "",
  constituicao: "",
  sabedoria: "",
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

export class NovoPersonagemViewModel {
  constructor() {
    this.state = {
      nome: '',
      raca: '',
      classe: '',
      profissao: '',
      backgroundTipo: 'guiado',
      background: '',
      atributos: { ...atributosIniciais },
      habilidades: '',
      equipamentos: '',
      pontosTotais: getRandomPontos(),
      loading: false,
      error: null,
      habilidadesDisponiveis: [],
      loadingHabilidades: false
    };
    
    this.subscribers = [];
    this.personagemService = new PersonagemService(apiClient);
    this.habilidadeService = new HabilidadeService(apiClient);
  }

  getState() {
    return { 
      ...this.state,
      pontosDistribuidos: somaAtributos(this.state.atributos),
      pontosRestantes: this.state.pontosTotais - somaAtributos(this.state.atributos),
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

  setProfissao = (profissao) => {
    this.setState({ profissao });
  };

  setBackgroundTipo = (backgroundTipo) => {
    this.setState({ backgroundTipo });
  };

  setBackground = (background) => {
    this.setState({ background });
  };

  setHabilidades = (habilidades) => {
    this.setState({ habilidades });
  };

  setEquipamentos = (equipamentos) => {
    this.setState({ equipamentos });
  };

  setAtributo = (atributo, valor) => {
    const novoValor = Number(valor) || 0;
    const outrosAtributos = { ...this.state.atributos, [atributo]: 0 };
    const somaSemAtual = somaAtributos(outrosAtributos);
    
    // Não permitir que a soma ultrapasse pontosTotais
    if (somaSemAtual + novoValor > this.state.pontosTotais) return;
    
    this.setState({
      atributos: { ...this.state.atributos, [atributo]: valor }
    });
  };

  resetPontos = () => {
    this.setState({
      pontosTotais: getRandomPontos(),
      atributos: { ...atributosIniciais }
    });
  };

  loadHabilidades = async () => {
    this.setState({ loadingHabilidades: true });
    try {
      const habilidades = await this.habilidadeService.getAll();
      this.setState({ 
        habilidadesDisponiveis: habilidades,
        loadingHabilidades: false 
      });
    } catch (error) {
      this.setState({ 
        error: `Erro ao carregar habilidades: ${error.message}`,
        loadingHabilidades: false 
      });
    }
  };

  criarPersonagem = async (onSuccess) => {
    const pontosRestantes = this.state.pontosTotais - somaAtributos(this.state.atributos);
    
    if (!this.state.nome.trim()) {
      this.setState({ error: 'O nome do personagem é obrigatório' });
      return;
    }

    if (pontosRestantes !== 0) {
      this.setState({ error: 'Distribua todos os pontos antes de salvar' });
      return;
    }
    
    this.setState({ loading: true, error: null });
    try {
      await this.personagemService.create({
        nome: this.state.nome,
        raca: this.state.raca,
        classe: this.state.classe,
        profissao: this.state.profissao,
        backgroundTipo: this.state.backgroundTipo,
        background: this.state.background,
        atributos: this.state.atributos,
        habilidades: this.state.habilidades,
        equipamentos: this.state.equipamentos,
        hp: 100,
        nivel: 1
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
    this.setState({ error: null });
  };
}

export const novoPersonagemViewModel = new NovoPersonagemViewModel(); 