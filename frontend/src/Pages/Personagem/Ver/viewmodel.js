import { PersonagemService } from '../../../services/PersonagemService';
import { EquipamentoService } from '../../../services/EquipamentoService';
import { apiClient } from '../../../services/ApiClient';

const personagemService = new PersonagemService(apiClient);
const equipamentoService = new EquipamentoService(apiClient);

class VerPersonagemViewModel {
  constructor() {
    this.state = {
      personagem: null,
      evolucao: null,
      loading: false,
      error: null,
      gerandoBackground: false,
      validacao: null,
      validando: false,
      distribuindo: false,
      pontosParaDistribuir: {},
      equipamentos: [],
      catalogoEquipamentos: [],
      loadingEquipamentos: false,
      mostrarCatalogo: false,
      buscaCatalogo: '',
    };
    this.subscribers = [];
  }

  getState() {
    const totalPontosDistribuir = Object.values(this.state.pontosParaDistribuir)
      .reduce((a, b) => a + b, 0);
    return {
      ...this.state,
      totalPontosDistribuir,
    };
  }

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

  loadPersonagem = async (id) => {
    this.setState({ loading: true, error: null });
    try {
      const response = await personagemService.getById(id);
      // getById may return nested or flat — handle both
      const personagem = response?.data || response;
      this.setState({ personagem, loading: false });

      // Load evolution and equipment data in parallel
      this.loadEvolucao(id);
      this.loadEquipamentos(id);
    } catch (error) {
      this.setState({ error: error.message, loading: false });
    }
  };

  loadEvolucao = async (id) => {
    try {
      const evolucao = await personagemService.obterEvolucao(id);
      this.setState({ evolucao });
    } catch (error) {
      console.warn('Evolucao not available:', error.message);
    }
  };

  gerarBackground = async (sugestao = '') => {
    const id = this.state.personagem?.id;
    if (!id) return;

    this.setState({ gerandoBackground: true });
    try {
      const resultado = await personagemService.gerarBackground(id, sugestao);
      if (resultado?.background) {
        this.setState({
          personagem: {
            ...this.state.personagem,
            background: resultado.background,
          },
        });
      }
    } catch (error) {
      this.setState({ error: `Erro ao gerar background: ${error.message}` });
    } finally {
      this.setState({ gerandoBackground: false });
    }
  };

  validarCoerencia = async () => {
    const id = this.state.personagem?.id;
    if (!id) return;

    this.setState({ validando: true });
    try {
      const validacao = await personagemService.validarCoerencia(id);
      this.setState({ validacao });
    } catch (error) {
      this.setState({ error: `Erro ao validar: ${error.message}` });
    } finally {
      this.setState({ validando: false });
    }
  };

  setPontoAtributo = (atributo, valor) => {
    this.setState({
      pontosParaDistribuir: {
        ...this.state.pontosParaDistribuir,
        [atributo]: Math.max(0, valor),
      },
    });
  };

  distribuirPontos = async () => {
    const id = this.state.personagem?.id;
    const pontos = this.state.pontosParaDistribuir;
    const total = Object.values(pontos).reduce((a, b) => a + b, 0);
    if (!id || total === 0) return;

    this.setState({ distribuindo: true });
    try {
      await personagemService.distribuirPontos(id, pontos);
      this.setState({ pontosParaDistribuir: {} });
      // Reload character + evolution
      await this.loadPersonagem(id);
    } catch (error) {
      this.setState({ error: `Erro ao distribuir pontos: ${error.message}` });
    } finally {
      this.setState({ distribuindo: false });
    }
  };

  loadEquipamentos = async (personagemId) => {
    const id = personagemId || this.state.personagem?.id;
    if (!id) return;

    this.setState({ loadingEquipamentos: true });
    try {
      const equipamentos = await personagemService.listarEquipamentos(id);
      this.setState({ equipamentos: equipamentos || [], loadingEquipamentos: false });
    } catch (error) {
      console.warn('Erro ao carregar equipamentos:', error.message);
      this.setState({ equipamentos: [], loadingEquipamentos: false });
    }
  };

  loadCatalogo = async () => {
    try {
      const response = await equipamentoService.getAll();
      const catalogo = response?.data || response || [];
      this.setState({ catalogoEquipamentos: Array.isArray(catalogo) ? catalogo : [] });
    } catch (error) {
      console.warn('Erro ao carregar catálogo:', error.message);
    }
  };

  adicionarEquipamento = async (equipamentoId) => {
    const id = this.state.personagem?.id;
    if (!id) return;

    this.setState({ loadingEquipamentos: true });
    try {
      await personagemService.adicionarEquipamento(id, equipamentoId);
      await this.loadEquipamentos(id);
    } catch (error) {
      this.setState({ error: `Erro ao adicionar equipamento: ${error.message}`, loadingEquipamentos: false });
    }
  };

  removerEquipamento = async (equipamentoId) => {
    const id = this.state.personagem?.id;
    if (!id) return;

    this.setState({ loadingEquipamentos: true });
    try {
      await personagemService.removerEquipamento(id, equipamentoId);
      await this.loadEquipamentos(id);
    } catch (error) {
      this.setState({ error: `Erro ao remover equipamento: ${error.message}`, loadingEquipamentos: false });
    }
  };

  toggleCatalogo = () => {
    const mostrar = !this.state.mostrarCatalogo;
    this.setState({ mostrarCatalogo: mostrar });
    if (mostrar && this.state.catalogoEquipamentos.length === 0) {
      this.loadCatalogo();
    }
  };

  setBuscaCatalogo = (termo) => {
    this.setState({ buscaCatalogo: termo });
  };

  getCatalogoFiltrado = () => {
    const { catalogoEquipamentos, equipamentos, buscaCatalogo } = this.state;
    const idsEquipados = new Set(equipamentos.map(e => e.id));

    return catalogoEquipamentos
      .filter(eq => {
        if (buscaCatalogo) {
          const termo = buscaCatalogo.toLowerCase();
          return eq.nome?.toLowerCase().includes(termo) ||
                 eq.descricao?.toLowerCase().includes(termo);
        }
        return true;
      })
      .map(eq => ({
        ...eq,
        jaEquipado: idsEquipados.has(eq.id),
      }));
  };

  getBonusAgregados = () => {
    const { equipamentos } = this.state;
    if (!equipamentos?.length) return {};

    const totais = {};
    equipamentos.forEach(eq => {
      if (eq.bonus && typeof eq.bonus === 'object') {
        Object.entries(eq.bonus).forEach(([key, value]) => {
          totais[key] = (totais[key] || 0) + Number(value);
        });
      }
    });
    return totais;
  };

  clearError = () => {
    this.setState({ error: null });
  };
}

export const verPersonagemViewModel = new VerPersonagemViewModel();
