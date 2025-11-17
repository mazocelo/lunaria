import { PersonagemService } from '../../../services/PersonagemService';
import { Personagem } from '../../../models/Personagem';
import { apiClient } from '../../../services/ApiClient';

const personagemService = new PersonagemService(apiClient);

/**
 * ViewModel para gerenciar o estado e lógica de negócio dos Personagens
 * Responsável pela comunicação entre View e services
 */
export class PersonagemViewModel {
  constructor() {
    this.personagens = [];
    this.personagemAtual = null;
    this.loading = false;
    this.error = null;
    this.filtros = {
      classe: null,
      raca: null,
      busca: ''
    };
    this.observers = [];
  }

  /**
   * Adiciona um observer para mudanças de estado
   * @param {Function} observer - Função callback
   */
  subscribe = (observer) => {
    this.observers.push(observer);
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  /**
   * Notifica todos os observers sobre mudanças
   */
  notify = () => {
    this.observers.forEach(observer => observer(this.getState()));
  }

  /**
   * Retorna o estado atual do ViewModel
   * @returns {Object} Estado atual
   */
  getState = () => {
    return {
      personagens: this.personagens,
      personagemAtual: this.personagemAtual,
      loading: this.loading,
      error: this.error,
      filtros: this.filtros,
      estatisticas: this.getEstatisticas()
    };
  }

  /**
   * Define o estado de loading
   * @param {boolean} loading - Estado de loading
   */
  setLoading = (loading) => {
    this.loading = loading;
    this.notify();
  }

  /**
   * Define o erro atual
   * @param {string|null} error - Mensagem de erro
   */
  setError = (error) => {
    this.error = error;
    this.notify();
  }

  /**
   * Carrega todos os personagens
   */
  loadPersonagens = async () => {
    this.setLoading(true);
    this.setError(null);

    try {
      const personagens = await personagemService.getAll();
      this.personagens = personagens;
      this.notify();
    } catch (error) {
      this.setError(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Carrega um personagem específico
   * @param {number} id - ID do personagem
   */
  loadPersonagem = async (id) => {
    this.setLoading(true);
    this.setError(null);

    try {
      const personagem = await personagemService.getById(id);
      this.personagemAtual = personagem;
      this.notify();
    } catch (error) {
      this.setError(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Cria um novo personagem
   * @param {Object} dados - Dados do personagem
   */
  createPersonagem = async (dados) => {
    this.setLoading(true);
    this.setError(null);

    try {
      const personagem = new Personagem(dados);
      const novoPersonagem = await personagemService.create(personagem);
      this.personagens.push(novoPersonagem);
      this.notify();
      return novoPersonagem;
    } catch (error) {
      this.setError(error.message);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Atualiza um personagem existente
   * @param {number} id - ID do personagem
   * @param {Object} dados - Dados atualizados
   */
  updatePersonagem = async (id, dados) => {
    this.setLoading(true);
    this.setError(null);

    try {
      const personagem = new Personagem({ ...dados, id });
      const personagemAtualizado = await personagemService.update(id, personagem);
      
      // Atualiza na lista
      const index = this.personagens.findIndex(p => p.id === id);
      if (index !== -1) {
        this.personagens[index] = personagemAtualizado;
      }

      // Atualiza personagem atual se for o mesmo
      if (this.personagemAtual && this.personagemAtual.id === id) {
        this.personagemAtual = personagemAtualizado;
      }

      this.notify();
      return personagemAtualizado;
    } catch (error) {
      this.setError(error.message);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Remove um personagem
   * @param {number} id - ID do personagem
   */
  deletePersonagem = async (id) => {
    this.setLoading(true);
    this.setError(null);

    try {
      await personagemService.delete(id);
      
      // Remove da lista
      this.personagens = this.personagens.filter(p => p.id !== id);
      
      // Limpa personagem atual se for o mesmo
      if (this.personagemAtual && this.personagemAtual.id === id) {
        this.personagemAtual = null;
      }

      this.notify();
    } catch (error) {
      this.setError(error.message);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Aplica filtros aos personagens
   * @param {Object} filtros - Filtros a serem aplicados
   */
  aplicarFiltros = async (filtros) => {
    this.filtros = { ...this.filtros, ...filtros };
    this.setLoading(true);
    this.setError(null);

    try {
      const personagens = await personagemService.getWithFilters(this.filtros);
      this.personagens = personagens;
      this.notify();
    } catch (error) {
      this.setError(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Busca personagens por texto
   * @param {string} texto - Texto para busca
   */
  buscarPersonagens = async (texto) => {
    this.filtros.busca = texto;
    await this.aplicarFiltros(this.filtros);
  }

  /**
   * Calcula estatísticas dos personagens
   * @returns {Object} Estatísticas
   */
  getEstatisticas = () => {
    const total = this.personagens.length;
    const guerreiros = this.personagens.filter(p => p.classe === 'Guerreiro').length;
    const magos = this.personagens.filter(p => p.classe === 'Mago').length;
    const arqueiros = this.personagens.filter(p => p.classe === 'Arqueiro').length;
    const totalHP = this.personagens.reduce((acc, p) => acc + (p.hp || 100), 0);
    const mediaNivel = total > 0 ? Math.round(this.personagens.reduce((acc, p) => acc + (p.nivel || 1), 0) / total) : 0;

    return {
      total,
      guerreiros,
      magos,
      arqueiros,
      totalHP,
      mediaNivel
    };
  }

  /**
   * Obtém personagens filtrados por classe
   * @param {string} classe - Classe do personagem
   * @returns {Array} Personagens da classe
   */
  getPersonagensPorClasse = (classe) => {
    return this.personagens.filter(p => p.classe === classe);
  }

  /**
   * Obtém personagens filtrados por raça
   * @param {string} raca - Raça do personagem
   * @returns {Array} Personagens da raça
   */
  getPersonagensPorRaca = (raca) => {
    return this.personagens.filter(p => p.raca === raca);
  }

  /**
   * Limpa o erro atual
   */
  clearError = () => {
    this.setError(null);
  }

  /**
   * Reseta o ViewModel para o estado inicial
   */
  reset = () => {
    this.personagens = [];
    this.personagemAtual = null;
    this.loading = false;
    this.error = null;
    this.filtros = {
      classe: null,
      raca: null,
      busca: ''
    };
    this.notify();
  }
}

export const personagemViewModel = new PersonagemViewModel();

