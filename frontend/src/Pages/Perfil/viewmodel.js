import { apiClient } from '../../services/ApiClient';

export class PerfilViewModel {
  constructor() {
    this.state = {
      nome: '',
      email: '',
      senhaAtual: '',
      novaSenha: '',
      confirmarSenha: '',
      estatisticas: null,
      loading: false,
      loadingStats: false,
      savingProfile: false,
      savingPassword: false,
      error: null,
      successMessage: null,
    };
    this.subscribers = [];
  }

  getState() {
    return { ...this.state };
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notify() {
    this.subscribers.forEach(cb => cb(this.getState()));
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  // Setters
  setNome = (nome) => this.setState({ nome });
  setEmail = (email) => this.setState({ email });
  setSenhaAtual = (senhaAtual) => this.setState({ senhaAtual });
  setNovaSenha = (novaSenha) => this.setState({ novaSenha });
  setConfirmarSenha = (confirmarSenha) => this.setState({ confirmarSenha });

  clearError = () => this.setState({ error: null });
  clearSuccess = () => this.setState({ successMessage: null });

  initFromUser = (user) => {
    if (user) {
      this.setState({
        nome: user.nome || '',
        email: user.email || '',
      });
    }
  };

  loadEstatisticas = async (userId) => {
    this.setState({ loadingStats: true });
    try {
      const response = await apiClient.get(`/usuarios/${userId}/estatisticas`);
      this.setState({ estatisticas: response.data || response, loadingStats: false });
    } catch (error) {
      this.setState({ loadingStats: false });
    }
  };

  salvarPerfil = async (userId, onSuccess) => {
    if (!this.state.nome.trim()) {
      this.setState({ error: 'Nome é obrigatório' });
      return;
    }

    this.setState({ savingProfile: true, error: null, successMessage: null });
    try {
      const response = await apiClient.put(`/usuarios/${userId}`, {
        nome: this.state.nome,
        email: this.state.email,
      });
      this.setState({
        savingProfile: false,
        successMessage: 'Perfil atualizado com sucesso!',
      });
      if (onSuccess) onSuccess({ nome: this.state.nome, email: this.state.email });
    } catch (error) {
      this.setState({
        savingProfile: false,
        error: error.message || 'Erro ao atualizar perfil',
      });
    }
  };

  alterarSenha = async (userId) => {
    if (!this.state.senhaAtual) {
      this.setState({ error: 'Senha atual é obrigatória' });
      return;
    }
    if (!this.state.novaSenha || this.state.novaSenha.length < 8) {
      this.setState({ error: 'Nova senha deve ter pelo menos 8 caracteres' });
      return;
    }
    if (this.state.novaSenha !== this.state.confirmarSenha) {
      this.setState({ error: 'Senhas não conferem' });
      return;
    }

    this.setState({ savingPassword: true, error: null, successMessage: null });
    try {
      await apiClient.put(`/usuarios/${userId}`, {
        senha_atual: this.state.senhaAtual,
        senha: this.state.novaSenha,
      });
      this.setState({
        savingPassword: false,
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: '',
        successMessage: 'Senha alterada com sucesso!',
      });
    } catch (error) {
      this.setState({
        savingPassword: false,
        error: error.message || 'Erro ao alterar senha',
      });
    }
  };
}

export const perfilViewModel = new PerfilViewModel();
