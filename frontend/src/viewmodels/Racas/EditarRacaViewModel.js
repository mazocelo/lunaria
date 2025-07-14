import { RacaService } from '../../services/RacaService';
import { Raca } from '../../models/Raca';
import { ApiClient } from '../../services/ApiClient';

export default class EditarRacaViewModel {
  constructor() {
    this.apiClient = new ApiClient();
    this.racaService = new RacaService(this.apiClient);
    
    this.state = {
      id: null,
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
      loading: false,
      error: null,
      loadingRaca: false
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

  // Carregar raça por ID
  loadRaca = async (id) => {
    this.setState({ loadingRaca: true, error: null });
    
    try {
      const response = await this.racaService.getById(id);
      const raca = Raca.fromApi(response);
      
      this.setState({
        id: raca.id,
        nome: raca.nome,
        descricao: raca.descricao,
        custo: raca.custo,
        atributos_bonus: raca.atributos_bonus,
        vantagens_iniciais: raca.vantagens_iniciais,
        desvantagens_iniciais: raca.desvantagens_iniciais,
        loadingRaca: false
      });
    } catch (error) {
      // Fallback com dados de exemplo
      const racaExemplo = {
        id: id,
        nome: 'Elfo',
        descricao: 'Ágil, com sentidos aguçados e afinidade com magia.',
        custo: 2,
        atributos_bonus: { agilidade: 2, inteligencia: 1, destreza: 1 },
        vantagens_iniciais: ['Visão Noturna'],
        desvantagens_iniciais: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const raca = Raca.fromApi(racaExemplo);
      
      this.setState({
        id: raca.id,
        nome: raca.nome,
        descricao: raca.descricao,
        custo: raca.custo,
        atributos_bonus: raca.atributos_bonus,
        vantagens_iniciais: raca.vantagens_iniciais,
        desvantagens_iniciais: raca.desvantagens_iniciais,
        loadingRaca: false,
        error: `Erro ao carregar raça: ${error.message}`
      });
    }
  };

  // Validação
  validate() {
    const raca = new Raca(this.state);
    return raca.validate();
  }

  // Atualização da raça
  atualizarRaca = async (onSuccess) => {
    const validation = this.validate();
    
    if (!validation.isValid) {
      this.setState({ error: validation.errors.join(', ') });
      return;
    }

    this.setState({ loading: true, error: null });

    try {
      const racaData = {
        nome: this.state.nome,
        descricao: this.state.descricao,
        custo: this.state.custo,
        atributos_bonus: this.state.atributos_bonus,
        vantagens_iniciais: this.state.vantagens_iniciais,
        desvantagens_iniciais: this.state.desvantagens_iniciais
      };

      const response = await this.racaService.update(this.state.id, racaData);
      
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      this.setState({ 
        error: `Erro ao atualizar raça: ${error.message}`,
        loading: false 
      });
    }
  };

  // Limpar erro
  clearError = () => {
    this.setState({ error: null });
  };
} 