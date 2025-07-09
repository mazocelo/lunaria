import { Historia } from '../../models/Historia';
import { HistoriaService } from '../../services/HistoriaService';
import { apiClient } from '../../services/ApiClient';

const historiaService = new HistoriaService(apiClient);

/**
 * ViewModel para gerenciar o estado e lógica de negócio das Histórias
 * Responsável pela comunicação entre View e services
 */
export class HistoriaViewModel {
  constructor() {
    this.historias = [];
    this.historiaAtual = null;
    this.loading = false;
    this.error = null;
    this.filtros = {
      tema: null,
      participantes: null,
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
      historias: this.historias,
      historiaAtual: this.historiaAtual,
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
   * Carrega todas as histórias
   */
  loadHistorias = async () => {
    this.setLoading(true);
    this.setError(null);

    try {
      const historias = await historiaService.getAll();
      this.historias = historias;
      this.notify();
    } catch (error) {
      this.setError(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Carrega uma história específica
   * @param {number} id - ID da história
   */
  loadHistoria = async (id) => {
    this.setLoading(true);
    this.setError(null);

    try {
      const historia = await historiaService.getById(id);
      this.historiaAtual = historia;
      this.notify();
    } catch (error) {
      this.setError(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Cria uma nova história
   * @param {Object} dados - Dados da história
   */
  createHistoria = async (dados) => {
    this.setLoading(true);
    this.setError(null);

    try {
      const historia = new Historia(dados);
      const validation = historia.validate();
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const novaHistoria = await historiaService.create(historia);
      this.historias.push(novaHistoria);
      this.notify();
      return novaHistoria;
    } catch (error) {
      this.setError(error.message);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Atualiza uma história existente
   * @param {number} id - ID da história
   * @param {Object} dados - Dados atualizados
   */
  updateHistoria = async (id, dados) => {
    this.setLoading(true);
    this.setError(null);

    try {
      const historia = new Historia({ ...dados, id });
      const validation = historia.validate();
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const historiaAtualizada = await historiaService.update(id, historia);
      
      // Atualiza na lista
      const index = this.historias.findIndex(h => h.id === id);
      if (index !== -1) {
        this.historias[index] = historiaAtualizada;
      }

      // Atualiza história atual se for a mesma
      if (this.historiaAtual && this.historiaAtual.id === id) {
        this.historiaAtual = historiaAtualizada;
      }

      this.notify();
      return historiaAtualizada;
    } catch (error) {
      this.setError(error.message);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Remove uma história
   * @param {number} id - ID da história
   */
  deleteHistoria = async (id) => {
    this.setLoading(true);
    this.setError(null);

    try {
      await historiaService.delete(id);
      
      // Remove da lista
      this.historias = this.historias.filter(h => h.id !== id);
      
      // Limpa história atual se for a mesma
      if (this.historiaAtual && this.historiaAtual.id === id) {
        this.historiaAtual = null;
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
   * Aplica filtros às histórias
   * @param {Object} filtros - Filtros a serem aplicados
   */
  aplicarFiltros = async (filtros) => {
    this.filtros = { ...this.filtros, ...filtros };
    this.setLoading(true);
    this.setError(null);

    try {
      const historias = await historiaService.getWithFilters(this.filtros);
      this.historias = historias;
      this.notify();
    } catch (error) {
      this.setError(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Busca histórias por texto
   * @param {string} texto - Texto para busca
   */
  buscarHistorias = async (texto) => {
    this.filtros.busca = texto;
    await this.aplicarFiltros(this.filtros);
  }

  /**
   * Calcula estatísticas das histórias
   * @returns {Object} Estatísticas
   */
  getEstatisticas = () => {
    const total = this.historias.length;
    const comTemas = this.historias.filter(h => h.temas && h.temas.length > 0).length;
    const totalParticipantes = this.historias.reduce((acc, h) => acc + (h.maximo_de_participantes || 0), 0);

    return {
      total,
      comTemas,
      totalParticipantes,
      mediaParticipantes: total > 0 ? Math.round(totalParticipantes / total) : 0
    };
  }

  /**
   * Obtém histórias filtradas por tema
   * @param {number} temaId - ID do tema
   * @returns {Historia[]} Histórias do tema
   */
  getHistoriasPorTema = (temaId) => {
    return this.historias.filter(h => 
      h.temas && h.temas.includes(temaId)
    );
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
    this.historias = [];
    this.historiaAtual = null;
    this.loading = false;
    this.error = null;
    this.filtros = {
      tema: null,
      participantes: null,
      busca: ''
    };
    this.notify();
  }
}

export const historiaViewModel = new HistoriaViewModel(); 