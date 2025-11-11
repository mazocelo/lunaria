import { Historia } from '../../models/Historia';
import { HistoriaService } from '../../services/HistoriaService';
import { getTemaStoreAPI } from '../../store/index.js';
import { apiClient } from '../../services/ApiClient';

const historiaService = new HistoriaService(apiClient);

/**
 * ViewModel para gerenciar o estado e lógica de negócio das Histórias
 * Responsável pela comunicação entre View e services
 * 📍 MIGRADO: Agora usa Tema Store ao invés de TemaService
 */
export class HistoriaViewModel {
  constructor() {
    this.historias = [];
    this.historiaAtual = null;
    this.loading = false;
    this.error = null;

    // 🎨 TEMA STORE - API direta (sem hooks) para ViewModels
    this.temaStore = getTemaStoreAPI();

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
   */
  getState = () => {
    return {
      historias: this.historiasComTemasMapeados, // ✅ NOVO: Histórias com nomes de temas
      historiaAtual: this.historiaAtualComTemas, // ✅ NOVO: História atual com nomes
      loading: this.loading,
      error: this.error,
      temas: this.temaStore.getTemasParaFiltro(), // ✅ MIGRADO: Temas para filtros
      filtros: this.filtros,
      totalHistorias: this.historias.length
    };
  }

  /**
   * 🎨 GETTER: Histórias com temas mapeados para nomes
   * Substitui o processamento manual feito antes
   */
  get historiasComTemasMapeados() {
    return this.historias.map(historia => ({
      ...historia,
      temasNomes: this.temaStore.mapearTemasDeHistoria(historia)
    }));
  }

  /**
   * 🎨 GETTER: História atual com temas mapeados
   */
  get historiaAtualComTemas() {
    if (!this.historiaAtual) return null;

    return {
      ...this.historiaAtual,
      temasNomes: this.temaStore.mapearTemasDeHistoria(this.historiaAtual)
    };
  }

  /**
   * 🔧 GETTER FALTANTE: Estatísticas das histórias
   * Usado por: Views de listagem para exibir estatísticas
   */
  get estatisticas() {
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
   * 🎨 GETTER: Temas para filtro com cache do store
   */
  get temasParaFiltro() {
    return this.temaStore.getTemasParaFiltro();
  }

  /**
   * Define estado de loading
   */
  setLoading = (loading) => {
    this.loading = loading;
    this.notify();
  }

  /**
   * Define erro
   */
  setError = (error) => {
    this.error = error;
    this.notify();
  }

  /**
   * 🎨 MIGRADO: Carrega todas as histórias e inicializa temas
   * Agora os temas são carregados via store global
   */
  loadHistorias = async () => {
    this.setLoading(true);
    this.setError(null);

    try {

      // Carregar temas se necessário (cache global)
      await this.temaStore.carregarTemas();

      // Carregar histórias
      const { data } = await historiaService.getAll();
      this.historias = data;


      this.notify();
    } catch (error) {
      this.setError(error.message);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * 🎨 MIGRADO: Carrega uma história específica
   * Agora usa o mapeamento de temas do store
   */
  loadHistoria = async (id) => {
    this.setLoading(true);
    this.setError(null);

    try {
      // Garantir que os temas estejam carregados
      await this.temaStore.carregarTemas();

      // Carregar a história
      const historia = await historiaService.getById(id);

      this.historiaAtual = historia;

      this.notify();
    } catch (error) {
      console.error('❌ Erro ao carregar história:', error);
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


      const novaHistoria = await historiaService.create(dados);

      // Recarregar lista após criação
      await this.loadHistorias();

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

      const historiaAtualizada = await historiaService.update(id, dados);

      // Atualizar na lista local
      const index = this.historias.findIndex(h => h.id === id);
      if (index !== -1) {
        this.historias[index] = historiaAtualizada;
      }

      // Atualizar história atual se for a mesma
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
   * Exclui uma história
   * @param {number} id - ID da história
   */
  deleteHistoria = async (id) => {
    this.setLoading(true);
    this.setError(null);

    try {
      await historiaService.delete(id);

      // Remover da lista local
      this.historias = this.historias.filter(h => h.id !== id);

      // Limpar história atual se for a mesma
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
   * Resetar/zerar sessão de jogo ativa
   * @param {number} historiaId - ID da história
   */
  resetarSessao = async (historiaId) => {
    this.setLoading(true);
    this.setError(null);

    try {
      const response = await historiaService.resetarSessao(historiaId);

      if (response.success) {
        console.log('✅ Sessão resetada com sucesso no ViewModel');
        
        // Recarregar histórias para atualizar status
        await this.loadHistorias();
      }

      this.notify();
      return response;
    } catch (error) {
      this.setError(error.message || 'Erro ao resetar sessão');
      this.notify();
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * 🎨 MIGRADO: Aplicar filtros com suporte a nomes de temas
   */
  aplicarFiltros = (filtros) => {
    this.filtros = { ...this.filtros, ...filtros };


    this.notify();
  }

  /**
   * 🎨 GETTER: Histórias filtradas com temas por nome
   */
  get historiasFiltradasComTemas() {
    let historiasFiltradas = this.historiasComTemasMapeados;

    // Filtro por tema
    if (this.filtros.tema) {
      historiasFiltradas = historiasFiltradas.filter(historia =>
        historia.temas && historia.temas.includes(this.filtros.tema)
      );
    }

    // Filtro por participantes
    if (this.filtros.participantes) {
      historiasFiltradas = historiasFiltradas.filter(historia =>
        historia.maximo_de_participantes >= this.filtros.participantes
      );
    }

    // Filtro por busca (nome ou temas)
    if (this.filtros.busca) {
      const termoBusca = this.filtros.busca.toLowerCase();
      historiasFiltradas = historiasFiltradas.filter(historia =>
        historia.nome.toLowerCase().includes(termoBusca) ||
        (historia.temasNomes && historia.temasNomes.some(tema =>
          tema.toLowerCase().includes(termoBusca)
        ))
      );
    }

    return historiasFiltradas;
  }

  /**
   * Limpa filtros
   */
  limparFiltros = () => {
    this.filtros = {
      tema: null,
      participantes: null,
      busca: ''
    };
    this.notify();
  }

  /**
   * 🔧 MÉTODO FALTANTE: Limpa erros
   * Usado por: VerHistoriaView no useEffect
   */
  clearError = () => {
    this.setError(null);
  }

  /**
   * 🔧 MÉTODO FALTANTE: Obter nomes dos temas de uma história
   * Usado por: VerHistoriaView para exibir temas por nome
   */
  getNomesTemas = (historia) => {
    if (!historia) return [];
    return this.temaStore.mapearTemasDeHistoria(historia);
  }

  /**
   * Envia convite por email para uma história
   * @param {number} historia_id - ID da história
   * @param {string} email - Email do jogador a ser convidado
   * @returns {Promise<Object>} Resultado do convite
   */
  enviarConvite = async (historia_id, email) => {
    this.setLoading(true);
    this.setError(null);

    try {
      const resultado = await historiaService.enviarConvite(historia_id, email);


      return resultado;
    } catch (error) {
      console.error('❌ HistoriaViewModel: Erro ao enviar convite:', error);
      this.setError(error.message);
      throw error;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Reset completo do estado
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