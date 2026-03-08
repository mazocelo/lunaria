import { PersonagemService } from '../../services/PersonagemService';
import { HistoriaService } from '../../services/HistoriaService';
import { EquipamentoService } from '../../services/EquipamentoService';
import { apiClient } from '../../services/ApiClient';
import {
  getVantagemStoreAPI,
  getDesvantagemStoreAPI,
  getRacaStoreAPI,
  getClasseStoreAPI
} from '../../store/index.js';

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
      historias: [], // Array de IDs de histórias selecionadas
      atributos: { ...atributosIniciais },
      vantagens: [], // Deve ser array, não string
      equipamentos: [],
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
      loadingOpcoes: false,
      equipamentosDisponiveis: [],
      loadingEquipamentos: false
    };
    
    this.subscribers = [];
    
    // 🎯 Services para CRUD de personagens, histórias e equipamentos
    this.personagemService = new PersonagemService(apiClient);
    this.historiaService = new HistoriaService(apiClient);
    this.equipamentoService = new EquipamentoService(apiClient);
    
    // 🏪 APIs diretas dos stores para dados estáticos (sem hooks!)
    this.vantagemStore = getVantagemStoreAPI();
    this.desvantagemStore = getDesvantagemStoreAPI();
    this.racaStore = getRacaStoreAPI();
    this.classeStore = getClasseStoreAPI();
    
    // 🔄 Subscribir a mudanças nos stores para sincronizar estado local
    this.unsubscribers = [
      this.vantagemStore.subscribe(() => this.updateVantagensFromStore()),
      this.racaStore.subscribe(() => this.updateRacasFromStore()),
      this.classeStore.subscribe(() => this.updateClassesFromStore())
    ];
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

  // ===== HANDLERS DE SINCRONIZAÇÃO COM STORES =====
  updateVantagensFromStore = () => {
    const storeState = this.vantagemStore.getState();
    if (storeState.vantagensCarregadas && storeState.vantagens.length > 0) {
      this.setState({ 
        vantagensDisponiveis: storeState.vantagens,
        loadingVantagens: storeState.loading
      });
    }
  };

  updateRacasFromStore = () => {
    const storeState = this.racaStore.getState();
    if (storeState.racasCarregadas && storeState.racas.length > 0) {
      this.setState({ 
        racasDisponiveis: storeState.racas,
        loadingOpcoes: storeState.loading
      });
    }
  };

  updateClassesFromStore = () => {
    const storeState = this.classeStore.getState();
    if (storeState.classesCarregadas && storeState.classes.length > 0) {
      this.setState({ 
        classesDisponiveis: storeState.classes,
        loadingOpcoes: storeState.loading
      });
    }
  };

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

  setHistorias = (historias) => {
    this.setState({ historias: Array.isArray(historias) ? historias : [] });
  };

  setVantagens = (vantagens) => {
    this.setState({ vantagens });
  };

  setEquipamentos = (equipamentos) => {
    this.setState({ equipamentos: Array.isArray(equipamentos) ? equipamentos : [] });
  };

  loadEquipamentos = async () => {
    this.setState({ loadingEquipamentos: true });
    try {
      const response = await this.equipamentoService.getAll();
      const lista = response?.data || response || [];
      this.setState({
        equipamentosDisponiveis: Array.isArray(lista) ? lista : [],
        loadingEquipamentos: false
      });
    } catch (error) {
      console.warn('Erro ao carregar equipamentos:', error.message);
      this.setState({ equipamentosDisponiveis: [], loadingEquipamentos: false });
    }
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
    try {
      // 🔻 CACHE FIRST: Verificar se já existem dados no store
      const vantagemState = this.vantagemStore.getState();
      const desvantagemState = this.desvantagemStore.getState();
      
      if (vantagemState.vantagensCarregadas && vantagemState.vantagens.length > 0 &&
          desvantagemState.desvantagensCarregadas && desvantagemState.desvantagens.length > 0) {
        // Combinar vantagens e desvantagens para o EditarPersonagem
        const todasVantagens = [...vantagemState.vantagens, ...desvantagemState.desvantagens];
        this.setState({ 
          vantagensDisponiveis: todasVantagens,
          loadingVantagens: false
        });
        return;
      }
      
      // 📡 FALLBACK: Se não há cache, carregar do backend
      this.setState({ loadingVantagens: true });
      
      await Promise.all([
        this.vantagemStore.carregarVantagens(),
        this.desvantagemStore.carregarDesvantagens()
      ]);
      
      // Estado será atualizado via updateVantagensFromStore
    } catch (error) {
      console.error('❌ EditarPersonagemViewModel: Erro ao carregar vantagens:', error);
      
      // Fallback para opções estáticas
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
      const response = await this.historiaService.getAll();
      // Garantir que seja sempre um array
      const historias = response.data || [];
      this.setState({ 
        historiasDisponiveis: historias,
        loadingHistorias: false 
      });
    } catch (error) {
      this.setState({ 
        error: `Erro ao carregar histórias: ${error.message}`,
        historiasDisponiveis: [], // Garantir que seja array mesmo em erro
        loadingHistorias: false 
      });
    }
  };

  loadOpcoes = async () => {
    try {
      // 🔻 CACHE FIRST: Verificar se já existem dados nos stores
      const racaState = this.racaStore.getState();
      const classeState = this.classeStore.getState();
      
      const racasJaCarregadas = racaState.racasCarregadas && racaState.racas.length > 0;
      const classesJaCarregadas = classeState.classesCarregadas && classeState.classes.length > 0;
      
      if (racasJaCarregadas && classesJaCarregadas) {
        this.updateRacasFromStore();
        this.updateClassesFromStore();
        return;
      }
      
      // 📡 FALLBACK: Se não há cache, carregar do backend
      this.setState({ loadingOpcoes: true });
      
      // Carregar em paralelo apenas os que não estão carregados
      const promises = [];
      if (!racasJaCarregadas) {
        promises.push(this.racaStore.carregarRacas());
      }
      if (!classesJaCarregadas) {
        promises.push(this.classeStore.carregarClasses());
      }
      
      await Promise.all(promises);
      
      // Estados serão atualizados via updateRacasFromStore e updateClassesFromStore
    } catch (error) {
      console.error('❌ EditarPersonagemViewModel: Erro ao carregar opções:', error);
      this.setState({ 
        error: `Erro ao carregar opções: ${error.message}`,
        loadingOpcoes: false 
      });
    }
  };

  loadPersonagem = async (id) => {
    this.setState({ loading: true, error: null, personagemId: id });
    try {
      // Garantir que as opções estejam carregadas antes de mapear
      await this.loadOpcoes();
      
      // Aguardar um pouco para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const personagem = await this.personagemService.getById(id);
      
      // Obter estado atual após carregar opções
      const currentState = this.getState();
      
      // Mapear atributos individuais para o objeto atributos
      const atributosMapeados = {
        forca: personagem.forca || personagem.atributos?.forca || 10,
        destreza: personagem.destreza || personagem.atributos?.destreza || 10,
        constituicao: personagem.constituicao || personagem.atributos?.constituicao || 10,
        inteligencia: personagem.inteligencia || personagem.atributos?.inteligencia || 10,
        agilidade: personagem.agilidade || personagem.atributos?.agilidade || 10,
        carisma: personagem.carisma || personagem.atributos?.carisma || 10,
      };
      
      // Mapear vantagens: se for array de objetos, extrair IDs; se for array de IDs, usar direto
      // Combinar vantagens e desvantagens em um único array para o FormVantagem
      let vantagensMapeadas = [];
      if (personagem.vantagens) {
        if (Array.isArray(personagem.vantagens)) {
          vantagensMapeadas = personagem.vantagens.map(v => {
            // Se for objeto, pegar o ID; se for número, usar direto
            return typeof v === 'object' ? String(v.id) : String(v);
          });
        }
      }
      
      // Adicionar desvantagens ao array de vantagens (FormVantagem mistura tudo)
      if (personagem.desvantagens) {
        if (Array.isArray(personagem.desvantagens)) {
          const desvantagensIds = personagem.desvantagens.map(d => {
            return typeof d === 'object' ? String(d.id) : String(d);
          });
          vantagensMapeadas = [...vantagensMapeadas, ...desvantagensIds];
        }
      }
      
      // Mapear equipamentos: extrair IDs para array
      let equipamentosMapeados = [];
      if (personagem.equipamentos) {
        if (Array.isArray(personagem.equipamentos)) {
          equipamentosMapeados = personagem.equipamentos.map(e =>
            typeof e === 'object' ? String(e.id) : String(e)
          );
        }
      }
      
      // Garantir que raça e classe sejam IDs numéricos
      // A API pode retornar raca_id/classe_id ou raca/classe (nomes)
      let racaId = personagem.raca_id || null;
      let classeId = personagem.classe_id || null;
      
      // Se não tiver IDs diretos, tentar buscar pelos nomes nas opções disponíveis
      if (!racaId && personagem.raca) {
        const racaEncontrada = currentState.racasDisponiveis?.find(r => r.nome === personagem.raca);
        if (racaEncontrada) {
          racaId = racaEncontrada.id;
        }
      }
      
      if (!classeId && personagem.classe) {
        const classeEncontrada = currentState.classesDisponiveis?.find(c => c.nome === personagem.classe);
        if (classeEncontrada) {
          classeId = classeEncontrada.id;
        }
      }
      
      // Converter IDs para o tipo correto (string para os selects)
      const racaValue = racaId ? String(racaId) : '';
      const classeValue = classeId ? String(classeId) : '';
      
      // Mapear histórias: se for array de objetos, extrair IDs
      let historiasIds = [];
      if (Array.isArray(personagem.historias) && personagem.historias.length > 0) {
        historiasIds = personagem.historias.map(h => {
          return typeof h === 'object' ? String(h.id) : String(h);
        });
      }
      
      this.setState({
        nome: personagem.nome || '',
        // Usar IDs como strings para os selects
        raca: racaValue,
        classe: classeValue,
        backgroundTipo: personagem.sugestao_background || personagem.backgroundTipo || 'guiado',
        background: personagem.background || '',
        historias: historiasIds, // Array de IDs de histórias
        atributos: atributosMapeados,
        vantagens: vantagensMapeadas,
        equipamentos: equipamentosMapeados,
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
    
    // historia_id não é validado pois não pode ser alterado após criação
    
    if (!this.state.personagemId) {
      this.setState({ error: 'ID do personagem não encontrado' });
      return;
    }
    
    this.setState({ loading: true, error: null });
    try {
      // Separar vantagens de desvantagens (FormVantagem mistura tudo)
      const vantagensIds = [];
      const desvantagensIds = [];
      
      if (Array.isArray(this.state.vantagens)) {
        this.state.vantagens.forEach(id => {
          // Buscar nas opções disponíveis para determinar o tipo
          const vantagem = this.state.vantagensDisponiveis?.find(v => String(v.id) === String(id));
          if (vantagem) {
            if (vantagem.tipo === 'desvantagem') {
              desvantagensIds.push(Number(id));
            } else {
              vantagensIds.push(Number(id));
            }
          } else {
            // Se não encontrar, assumir que é vantagem (fallback)
            vantagensIds.push(Number(id));
          }
        });
      }
      
      // Converter histórias para números
      const historiasIds = Array.isArray(this.state.historias) ? this.state.historias.map(id => Number(id)) : [];
      
      // Montar apenas campos permitidos para atualização
      const dadosAtualizacao = {
        nome: this.state.nome,
        // classe_id e raca_id não são enviados pois não podem ser alterados
        background: this.state.background,
        historias: historiasIds, // Array de IDs de histórias
        // Mapear atributos individuais
        forca: Number(this.state.atributos.forca) || 10,
        destreza: Number(this.state.atributos.destreza) || 10,
        constituicao: Number(this.state.atributos.constituicao) || 10,
        inteligencia: Number(this.state.atributos.inteligencia) || 10,
        agilidade: Number(this.state.atributos.agilidade) || 10,
        carisma: Number(this.state.atributos.carisma) || 10,
        vantagens: vantagensIds,
        desvantagens: desvantagensIds,
        equipamentos: Array.isArray(this.state.equipamentos)
          ? this.state.equipamentos.map(id => Number(id))
          : [],
        nivel: this.state.nivel
        // hp não existe no schema do Prisma
      };
      
      // Enviar dados para atualização
      await this.personagemService.update(this.state.personagemId, dadosAtualizacao);
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

  // 🧹 Cleanup para evitar memory leaks
  destroy() {
    if (this.unsubscribers) {
      this.unsubscribers.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      this.unsubscribers = [];
    }
    this.subscribers = [];
  }
}

export const editarPersonagemViewModel = new EditarPersonagemViewModel(); 