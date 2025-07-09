import { PersonagemService } from '../../services/PersonagemService';
import { apiClient } from '../../services/ApiClient';

const atributosIniciais = {
  forca: "",
  inteligencia: "",
  carisma: "",
  destreza: "",
  constituicao: "",
  sabedoria: "",
};

const backgroundsGuiados = [
  "Aventureiro",
  "Nobre",
  "Mercador",
  "Artesão",
  "Mago Aprendiz",
  "Outro",
];

function somaAtributos(atributos) {
  return Object.values(atributos)
    .map((v) => Number(v) || 0)
    .reduce((a, b) => a + b, 0);
}

export class EditarPersonagemViewModel {
  constructor() {
    this.state = {
      nome: '',
      raca: '',
      classe: '',
      profissao: '',
      backgroundTipo: 'guiado',
      background: '',
      atributos: { ...atributosIniciais },
      habilidades: '',
      equipamentos: '',
      nivel: 1,
      hp: 100,
      loading: false,
      error: null,
      personagemId: null
    };
    
    this.subscribers = [];
    this.personagemService = new PersonagemService(apiClient);
  }

  getState() {
    return { 
      ...this.state,
      pontosDistribuidos: somaAtributos(this.state.atributos),
      backgroundsGuiados
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

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  setNome = (nome) => {
    this.setState({ nome });
  };

  setRaca = (raca) => {
    this.setState({ raca });
  };

  setClasse = (classe) => {
    this.setState({ classe });
  };

  setProfissao = (profissao) => {
    this.setState({ profissao });
  };

  setBackgroundTipo = (backgroundTipo) => {
    this.setState({ backgroundTipo });
  };

  setBackground = (background) => {
    this.setState({ background });
  };

  setHabilidades = (habilidades) => {
    this.setState({ habilidades });
  };

  setEquipamentos = (equipamentos) => {
    this.setState({ equipamentos });
  };

  setNivel = (nivel) => {
    this.setState({ nivel: Number(nivel) });
  };

  setHP = (hp) => {
    this.setState({ hp: Number(hp) });
  };

  setAtributo = (atributo, valor) => {
    this.setState({
      atributos: { ...this.state.atributos, [atributo]: valor }
    });
  };

  loadPersonagem = async (id) => {
    this.setState({ loading: true, error: null, personagemId: id });
    try {
      const personagem = await this.personagemService.getById(id);
      this.setState({
        nome: personagem.nome || '',
        raca: personagem.raca || '',
        classe: personagem.classe || '',
        profissao: personagem.profissao || '',
        backgroundTipo: personagem.backgroundTipo || 'guiado',
        background: personagem.background || '',
        atributos: personagem.atributos || { ...atributosIniciais },
        habilidades: personagem.habilidades || '',
        equipamentos: personagem.equipamentos || '',
        nivel: personagem.nivel || 1,
        hp: personagem.hp || 100,
        loading: false
      });
    } catch (error) {
      this.setState({ 
        error: error.message || 'Erro ao carregar personagem',
        loading: false 
      });
    }
  };

  atualizarPersonagem = async (onSuccess) => {
    if (!this.state.nome.trim()) {
      this.setState({ error: 'O nome do personagem é obrigatório' });
      return;
    }
    
    if (!this.state.personagemId) {
      this.setState({ error: 'ID do personagem não encontrado' });
      return;
    }
    
    this.setState({ loading: true, error: null });
    try {
      await this.personagemService.update(this.state.personagemId, {
        nome: this.state.nome,
        raca: this.state.raca,
        classe: this.state.classe,
        profissao: this.state.profissao,
        backgroundTipo: this.state.backgroundTipo,
        background: this.state.background,
        atributos: this.state.atributos,
        habilidades: this.state.habilidades,
        equipamentos: this.state.equipamentos,
        nivel: this.state.nivel,
        hp: this.state.hp,
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      this.setState({ 
        error: error.message || 'Erro ao atualizar personagem'
      });
    } finally {
      this.setState({ loading: false });
    }
  };

  clearError = () => {
    this.setState({ error: null });
  };
}

export const editarPersonagemViewModel = new EditarPersonagemViewModel(); 