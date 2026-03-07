import { getMestreStoreAPI } from '../../store/index.js';

class MestreViewModel {
  constructor() {
    this.mestreStore = getMestreStoreAPI();
    this.state = {
      mestres: [],
      mestreAtual: null,
      loading: false,
      error: null,
    };
    this.subscribers = [];
    this.unsubscribe = this.mestreStore.subscribe((storeState) => {
      this.handleStoreChange(storeState);
    });
  }

  handleStoreChange = (storeState) => {
    this.setState({
      mestres: storeState.mestresAtivos || storeState.mestres,
      loading: storeState.loading,
      error: storeState.error,
    });
  };

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(cb => cb(this.getState()));
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  getState() {
    return { ...this.state };
  }

  loadMestres = async () => {
    await this.mestreStore.carregarMestres();
  };

  getMestreById = (id) => {
    return this.mestreStore.getMestreById(id);
  };

  deleteMestre = async (id) => {
    const { mestreService } = await import('../../services/index.js');
    await mestreService.delete(id);
    await this.mestreStore.recarregarMestres();
    return { success: true };
  };

  clearError = () => this.setState({ error: null });

  destroy() {
    if (this.unsubscribe) this.unsubscribe();
    this.subscribers = [];
  }
}

export const mestreViewModel = new MestreViewModel();
export default MestreViewModel;
