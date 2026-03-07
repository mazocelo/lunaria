import { HistoriaService } from '../../../services/HistoriaService';
import { apiClient } from '../../../services/ApiClient';
import { getTemaStoreAPI, getMestreStoreAPI } from '../../../store/index.js';
import { runInAction } from '../../../utils/EventEmitter.js';
import { Historia } from '../../../models/Historia.js';

/**
 * ViewModel para criação de nova história
 * 📍 MIGRADO: Agora usa Tema Store ao invés de TemaService
 */
export class NovaHistoriaViewModel {
  constructor() {
    this.nome = '';
    this.temasSelecionados = [];
    this.maximo_de_participantes = 4;
    this.descricao = '';
    this.mestreSelecionado = null;
    this.loading = false;
    this.error = null;
    this.subscribers = [];

    // 🎨 TEMA STORE - API direta (sem hooks) para ViewModels
    this.temaStore = getTemaStoreAPI();
    this.mestreStore = getMestreStoreAPI();
    this.historiaService = new HistoriaService(apiClient);
  }

  setNome = (nome) => { 
    this.nome = nome; 
    this.notify();
  };

  setTemasSelecionados = (temas) => { 
    this.temasSelecionados = temas; 
    this.notify();
  };

  setMaximoDeParticipantes = (max) => { 
    this.maximo_de_participantes = max; 
    this.notify();
  };

  setDescricao = (descricao) => {
    this.descricao = descricao;
    this.notify();
  };

  setMestreSelecionado = (id) => {
    this.mestreSelecionado = id;
    this.notify();
  };

  /**
   * 🎨 MIGRADO: Carregamento de temas via Tema Store
   * Agora usa cache global e não precisa de loading local
   */
  loadTemas = async () => {
    this.loading = true;
    this.notify();
    
    try {
      // ✅ USAR TEMA STORE: Carregamento único e cache global
      await this.temaStore.carregarTemas();
      
      runInAction(() => {
        this.loading = false;
        this.notify();
      });
    } catch (error) {
      console.error('Erro ao carregar temas:', error);
      runInAction(() => {
        this.error = `Erro ao carregar temas: ${error.message}`;
        this.loading = false;
        this.notify();
      });
    }
  };

  /**
   * 🎨 GETTER: Temas para seleção (via store)
   * Substitui a propriedade 'temas' que era carregada do service
   */
  get temas() {
    return this.temaStore.getTemasParaSelecao();
  }

  get mestres() {
    return this.mestreStore.mestresAtivos || [];
  }

  loadMestres = async () => {
    await this.mestreStore.carregarMestres();
  };

  /**
   * 🎨 GETTER: Status de loading dos temas
   */
  get temasLoading() {
    return this.temaStore.loading || this.loading;
  }

  criarHistoria = async (onSuccess) => {
    this.loading = true;
    this.error = null;
    this.notify();

    try {
      const historiaData = {
        nome: this.nome,
        temas: this.temasSelecionados,
        maximo_de_participantes: this.maximo_de_participantes,
        prologo: this.descricao,
        mestre_id: this.mestreSelecionado
      };

      // Criar instância da classe Historia
      const historia = new Historia(historiaData);

      const novaHistoria = await this.historiaService.create(historia);

      runInAction(() => {
        this.loading = false;
        this.error = null;
        this.notify();
      });

      if (onSuccess) {
        onSuccess(novaHistoria);
      }

      return novaHistoria;
    } catch (error) {
      console.error('❌ Erro ao criar história:', error);
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
        this.notify();
      });
      throw error;
    }
  };

  subscribe = (observer) => {
    this.subscribers.push(observer);
    return () => {
      const index = this.subscribers.indexOf(observer);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  };

  notify = () => {
    this.subscribers.forEach(subscriber => subscriber(this.getState()));
  };

  /**
   * 🔧 MÉTODO FALTANTE: Limpa erros
   * Usado por: NovoHistoriaView no useEffect
   */
  clearError = () => {
    this.error = null;
    this.notify();
  };

  getState() {
    return {
      nome: this.nome,
      temasSelecionados: this.temasSelecionados,
      maximo_de_participantes: this.maximo_de_participantes,
      descricao: this.descricao,
      mestreSelecionado: this.mestreSelecionado,
      mestres: this.mestres,
      temas: this.temas,
      loading: this.loading,
      temasLoading: this.temasLoading, // ✅ NOVO: Loading específico dos temas
      error: this.error
    };
  }

  dispose() {
    this.subscribers = [];
  }
}

// ✅ SINGLETON INSTANCE para compatibilidade
export const novaHistoriaViewModel = new NovaHistoriaViewModel();

