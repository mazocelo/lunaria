import { ClasseService } from '../../services/ClasseService';
import { Classe } from '../../models/Classe';
import { ApiClient } from '../../services/ApiClient';

export default class NovaClasseViewModel {
  constructor() {
    this.apiClient = new ApiClient();
    this.classeService = new ClasseService(this.apiClient);
    
    this.state = {
      nome: '',
      descricao: '',
      custo: 0,
      atributos_bonus: {
        forca: 0,
        destreza: 0,
        constituicao: 0,
        inteligencia: 0,
        agilidade: 0,
        carisma: 0
      },
      vantagens_iniciais: [],
      desvantagens_iniciais: [],
      habilidades_especiais: [],
      loading: false,
      error: null
    };

    this.subscribers = [];
  }

  // Métodos de estado
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

  getState() {
    return { ...this.state };
  }

  // Setters para campos
  setNome = (nome) => {
    this.setState({ nome });
  };

  setDescricao = (descricao) => {
    this.setState({ descricao });
  };

  setCusto = (custo) => {
    this.setState({ custo: Number(custo) || 0 });
  };

  setAtributoBonus = (atributo, valor) => {
    this.setState({
      atributos_bonus: {
        ...this.state.atributos_bonus,
        [atributo]: Number(valor) || 0
      }
    });
  };

  setVantagensIniciais = (vantagens) => {
    this.setState({ vantagens_iniciais: vantagens });
  };

  setDesvantagensIniciais = (desvantagens) => {
    this.setState({ desvantagens_iniciais: desvantagens });
  };

  setHabilidadesEspeciais = (habilidades) => {
    this.setState({ habilidades_especiais: habilidades });
  };

  // Validação
  validate() {
    const classe = new Classe(this.state);
    return classe.validate();
  }

  // Criação da classe
  criarClasse = async (onSuccess) => {
    const validation = this.validate();
    
    if (!validation.isValid) {
      this.setState({ error: validation.errors.join(', ') });
      return;
    }

    this.setState({ loading: true, error: null });

    try {
      const classeData = {
        nome: this.state.nome,
        descricao: this.state.descricao,
        custo: this.state.custo,
        atributos_bonus: this.state.atributos_bonus,
        vantagens_iniciais: this.state.vantagens_iniciais,
        desvantagens_iniciais: this.state.desvantagens_iniciais,
        habilidades_especiais: this.state.habilidades_especiais
      };

      const response = await this.classeService.create(classeData);
      
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      this.setState({ 
        error: `Erro ao criar classe: ${error.message}`,
        loading: false 
      });
    }
  };

  // Reset do formulário
  reset = () => {
    this.setState({
      nome: '',
      descricao: '',
      custo: 0,
      atributos_bonus: {
        forca: 0,
        destreza: 0,
        constituicao: 0,
        inteligencia: 0,
        agilidade: 0,
        carisma: 0
      },
      vantagens_iniciais: [],
      desvantagens_iniciais: [],
      habilidades_especiais: [],
      error: null
    });
  };

  // Limpar erro
  clearError = () => {
    this.setState({ error: null });
  };
} 