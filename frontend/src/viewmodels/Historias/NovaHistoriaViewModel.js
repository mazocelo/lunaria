import { makeAutoObservable, runInAction } from 'mobx';
import { TemaService } from '../../services/TemaService';
import { HistoriaService } from '../../services/HistoriaService';
import { Historia } from '../../models/Historia';
import { apiClient } from '../../services/ApiClient';

export class NovaHistoriaViewModel {
  nome = '';
  temasSelecionados = [];
  maximo_de_participantes = 3;
  temas = [];
  loading = false;
  error = null;
  subscribers = [];

  temaService = new TemaService(apiClient);
  historiaService = new HistoriaService(apiClient);

  constructor() {
    makeAutoObservable(this, {
      subscribers: false,
      temaService: false,
      historiaService: false,
      subscribe: false,
      notify: false,
      getState: false
    });
  }

  getState() {
    return {
      nome: this.nome,
      temasSelecionados: this.temasSelecionados,
      maximo_de_participantes: this.maximo_de_participantes,
      temas: this.temas,
      loading: this.loading,
      error: this.error
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

  setNome = (nome) => { 
    this.nome = nome; 
    this.notify();
  };

  setTemasSelecionados = (temas) => { 
    console.log('Temas selecionados:', temas);
    this.temasSelecionados = temas; 
    this.notify();
  };

  setMaximoDeParticipantes = (max) => { 
    this.maximo_de_participantes = max; 
    this.notify();
  };

  loadTemas = async () => {
    this.loading = true;
    this.notify();
    try {
      const temasData = await this.temaService.getAll();
      console.log('Temas carregados:', temasData);
      runInAction(() => {
        this.temas = temasData || [];
        this.notify();
      });
    } catch (error) {
      console.error('Erro ao carregar temas:', error);
      runInAction(() => {
        this.error = `Erro ao carregar temas: ${error.message}`;
        this.notify();
      });
    } finally {
      runInAction(() => {
        this.loading = false;
        this.notify();
      });
    }
  };

  criarHistoria = async (onSuccess) => {
    if (!this.nome.trim()) {
      this.error = 'O nome da história é obrigatório';
      this.notify();
      return;
    }

    if (!this.temasSelecionados || this.temasSelecionados.length === 0) {
      this.error = 'Selecione pelo menos um tema';
      this.notify();
      return;
    }

    this.loading = true;
    this.error = null;
    this.notify();
    try {
      const historia = new Historia({
        nome: this.nome,
        temas: this.temasSelecionados,
        maximo_de_participantes: this.maximo_de_participantes,
      });
      await this.historiaService.create(historia);
      if (onSuccess) onSuccess();
    } catch (error) {
      this.error = error.message || 'Erro ao criar história';
      this.notify();
    } finally {
      this.loading = false;
      this.notify();
    }
  };

  clearError = () => { 
    this.error = null; 
    this.notify();
  };
}

export const novaHistoriaViewModel = new NovaHistoriaViewModel(); 