import { ClasseService } from '../../services/ClasseService';
import { Classe } from '../../models/Classe';
import { ApiClient } from '../../services/ApiClient';

export default class EditarClasseViewModel {
  constructor() {
    this.apiClient = new ApiClient();
    this.classeService = new ClasseService(this.apiClient);
    
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
      habilidades_especiais: [],
      loading: false,
      error: null,
      loadingClasse: false
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

  // Carregar classe por ID
  loadClasse = async (id) => {
    this.setState({ loadingClasse: true, error: null });
    
    try {
      const response = await this.classeService.getById(id);
      const classe = Classe.fromApi(response);
      
      this.setState({
        id: classe.id,
        nome: classe.nome,
        descricao: classe.descricao,
        custo: classe.custo,
        atributos_bonus: classe.atributos_bonus,
        vantagens_iniciais: classe.vantagens_iniciais,
        desvantagens_iniciais: classe.desvantagens_iniciais,
        habilidades_especiais: classe.habilidades_especiais,
        loadingClasse: false
      });
    } catch (error) {
      // Fallback com dados de exemplo
      const classeExemplo = {
        id: id,
        nome: 'Mago',
        descricao: 'Usuário de magia arcana, domina feitiços poderosos.',
        custo: 2,
        atributos_bonus: { inteligencia: 3, carisma: 1 },
        vantagens_iniciais: ['Magia Arcana'],
        desvantagens_iniciais: ['Fragilidade'],
        habilidades_especiais: ['Conjurar Feitiços', 'Resistência Mágica'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const classe = Classe.fromApi(classeExemplo);
      
      this.setState({
        id: classe.id,
        nome: classe.nome,
        descricao: classe.descricao,
        custo: classe.custo,
        atributos_bonus: classe.atributos_bonus,
        vantagens_iniciais: classe.vantagens_iniciais,
        desvantagens_iniciais: classe.desvantagens_iniciais,
        habilidades_especiais: classe.habilidades_especiais,
        loadingClasse: false,
        error: `Erro ao carregar classe: ${error.message}`
      });
    }
  };

  // Validação
  validate() {
    const classe = new Classe(this.state);
    return classe.validate();
  }

  // Atualização da classe
  atualizarClasse = async (onSuccess) => {
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

      const response = await this.classeService.update(this.state.id, classeData);
      
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      this.setState({ 
        error: `Erro ao atualizar classe: ${error.message}`,
        loading: false 
      });
    }
  };

  // Limpar erro
  clearError = () => {
    this.setState({ error: null });
  };
} 