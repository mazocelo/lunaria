import { PersonagemService } from '../../services/PersonagemService';
import { RacaService } from '../../services/RacaService';
import { ClasseService } from '../../services/ClasseService';
import { VantagemService } from '../../services/VantagemService';
import { HistoriaService } from '../../services/HistoriaService';
import { apiClient } from '../../services/ApiClient';

const atributosIniciais = {
  forca: "",
  inteligencia: "",
  constituicao: "",
  agilidade: "",
  destreza: "",
  carisma: "",
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
      backgroundTipo: 'guiado',
      background: '',
      historia_id: null,
      atributos: { ...atributosIniciais },
      vantagens: '',
      equipamentos: '',
      nivel: 1,
      hp: 100,
      loading: false,
      error: null,
      personagemId: null,
      vantagensDisponiveis: [],
      loadingVantagens: false,
      historiasDisponiveis: [],
      loadingHistorias: false,
      racasDisponiveis: [],
      classesDisponiveis: [],
      loadingOpcoes: false
    };
    
    this.subscribers = [];
    this.personagemService = new PersonagemService(apiClient);
    this.vantagemService = new VantagemService(apiClient);
    this.historiaService = new HistoriaService(apiClient);
    this.racaService = new RacaService(apiClient);
    this.classeService = new ClasseService(apiClient);
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

  setBackgroundTipo = (backgroundTipo) => {
    this.setState({ backgroundTipo });
  };

  setBackground = (background) => {
    this.setState({ background });
  };

  setHistoriaId = (historia_id) => {
    this.setState({ historia_id });
  };

  setVantagens = (vantagens) => {
    this.setState({ vantagens });
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

  loadVantagens = async () => {
    this.setState({ loadingVantagens: true });
    try {
      const vantagens = await this.vantagemService.getAll();
      this.setState({ 
        vantagensDisponiveis: vantagens,
        loadingVantagens: false 
      });
    } catch (error) {
      // Fallback para opções estáticas caso a API não esteja disponível
      const opcoesVantagens = [
        // Vantagens
        { id: 1, nome: 'Visão Noturna', custo: 2, descricao: 'Pode ver no escuro como se fosse dia claro.', tipo: 'vantagem' },
        { id: 2, nome: 'Imunidade a Veneno', custo: 3, descricao: 'Não é afetado por venenos de qualquer tipo.', tipo: 'vantagem' },
        { id: 3, nome: 'Regeneração', custo: 4, descricao: 'Recupera pontos de vida automaticamente.', tipo: 'vantagem' },
        { id: 4, nome: 'Telepatia', custo: 3, descricao: 'Pode se comunicar mentalmente com outros.', tipo: 'vantagem' },
        { id: 5, nome: 'Voo', custo: 5, descricao: 'Pode voar livremente pelo ar.', tipo: 'vantagem' },
        // Desvantagens
        { id: 6, nome: 'Cegueira', custo: -3, descricao: 'Não pode ver, mas ganha pontos extras.', tipo: 'desvantagem' },
        { id: 7, nome: 'Fraqueza', custo: -2, descricao: 'Menos resistente a dano físico.', tipo: 'desvantagem' },
        { id: 8, nome: 'Medo de Altura', custo: -1, descricao: 'Fica paralisado em lugares altos.', tipo: 'desvantagem' },
        { id: 9, nome: 'Alergia a Metais', custo: -2, descricao: 'Não pode usar equipamentos de metal.', tipo: 'desvantagem' },
        { id: 10, nome: 'Amnésia', custo: -4, descricao: 'Esqueceu parte de seu passado.', tipo: 'desvantagem' }
      ];
      this.setState({ 
        vantagensDisponiveis: opcoesVantagens,
        loadingVantagens: false 
      });
    }
  };

  loadHistorias = async () => {
    this.setState({ loadingHistorias: true });
    try {
      const historias = await this.historiaService.getAll();
      this.setState({ 
        historiasDisponiveis: historias,
        loadingHistorias: false 
      });
    } catch (error) {
      this.setState({ 
        error: `Erro ao carregar histórias: ${error.message}`,
        loadingHistorias: false 
      });
    }
  };

  loadOpcoes = async () => {
    this.setState({ loadingOpcoes: true });
    try {
      // Buscar raças e classes separadamente
      const [racas, classes] = await Promise.all([
        this.racaService.getAll(),
        this.classeService.getAll()
      ]);
      this.setState({ 
        racasDisponiveis: racas,
        classesDisponiveis: classes,
        loadingOpcoes: false 
      });
    } catch (error) {
      this.setState({ 
        error: `Erro ao carregar opções: ${error.message}`,
        loadingOpcoes: false 
      });
    }
  };

  loadPersonagem = async (id) => {
    this.setState({ loading: true, error: null, personagemId: id });
    try {
      const personagem = await this.personagemService.getById(id);
      
      // Mapear atributos individuais para o objeto atributos
      const atributosMapeados = {
        forca: personagem.forca || personagem.atributos?.forca || 10,
        destreza: personagem.destreza || personagem.atributos?.destreza || 10,
        constituicao: personagem.constituicao || personagem.atributos?.constituicao || 10,
        inteligencia: personagem.inteligencia || personagem.atributos?.inteligencia || 10,
        agilidade: personagem.agilidade || personagem.atributos?.agilidade || 10,
        carisma: personagem.carisma || personagem.atributos?.carisma || 10,
      };
      
      this.setState({
        nome: personagem.nome || '',
        raca: personagem.raca || '',
        classe: personagem.classe || '',
        backgroundTipo: personagem.sugestao_background || 'guiado',
        background: personagem.background || '',
        historia_id: personagem.historia_id || null,
        atributos: atributosMapeados,
        vantagens: personagem.vantagens || '',
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
    
    if (!this.state.historia_id) {
      this.setState({ error: 'A história é obrigatória' });
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
        sugestao_background: this.state.backgroundTipo,
        background: this.state.background,
        historia_id: this.state.historia_id,
        // Mapear atributos individuais
        forca: Number(this.state.atributos.forca) || 10,
        destreza: Number(this.state.atributos.destreza) || 10,
        constituicao: Number(this.state.atributos.constituicao) || 10,
        inteligencia: Number(this.state.atributos.inteligencia) || 10,
        agilidade: Number(this.state.atributos.agilidade) || 10,
        carisma: Number(this.state.atributos.carisma) || 10,
        // Manter o objeto atributos para compatibilidade
        atributos: this.state.atributos,
        vantagens: this.state.vantagens,
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