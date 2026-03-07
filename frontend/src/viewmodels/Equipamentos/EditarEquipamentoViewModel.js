import { equipamentoService, catalogoService } from '../../services/index.js';

class EditarEquipamentoViewModel {
  constructor() {
    this.service = equipamentoService;
    this.state = {
      id: null, nome: '', descricao: '', tipo: '', elemento: '', bonus: '',
      dano_base: '', requisitos: '', numero: '', raridade_id: '',
      origem_lore: '', categoria_id: '',
      vinculo_requer: false, vinculo_restricao_tipo: '', vinculo_restricao: '', vinculo_descricao: '',
      propriedades: '', cargas: '', usos_por_dia: '',
      raridades: [], categorias: [],
      loading: false, saving: false, error: null,
    };
    this.subscribers = [];
  }

  subscribe(callback) { this.subscribers.push(callback); return () => { this.subscribers = this.subscribers.filter(s => s !== callback); }; }
  notify() { this.subscribers.forEach(cb => cb(this.getState())); }
  setState(newState) { this.state = { ...this.state, ...newState }; this.notify(); }
  getState() { return { ...this.state }; }
  setField = (name, value) => { this.setState({ [name]: value }); };

  _jsonToStr(val) { if (!val) return ''; return typeof val === 'string' ? val : JSON.stringify(val, null, 2); }
  _arrToStr(val) { if (!val) return ''; return Array.isArray(val) ? val.join(', ') : String(val); }
  _parseJson(str) { if (!str) return null; try { return JSON.parse(str); } catch { return str; } }
  _parseArr(str) { if (!str) return []; return str.split(',').map(s => s.trim()).filter(Boolean); }

  _loadVinculo(vinculo) {
    if (!vinculo) return { vinculo_requer: false, vinculo_restricao_tipo: '', vinculo_restricao: '', vinculo_descricao: '' };
    return {
      vinculo_requer: vinculo.requer || false,
      vinculo_restricao_tipo: vinculo.restricao_tipo || '',
      vinculo_restricao: Array.isArray(vinculo.restricao) ? vinculo.restricao.join(', ') : '',
      vinculo_descricao: vinculo.descricao || '',
    };
  }

  _buildVinculo() {
    if (!this.state.vinculo_requer) return null;
    const vinculo = { requer: true };
    if (this.state.vinculo_restricao_tipo) vinculo.restricao_tipo = this.state.vinculo_restricao_tipo;
    const restricao = this.state.vinculo_restricao ? this.state.vinculo_restricao.split(',').map(s => s.trim()).filter(Boolean) : [];
    if (restricao.length > 0) vinculo.restricao = restricao;
    if (this.state.vinculo_descricao) vinculo.descricao = this.state.vinculo_descricao;
    return vinculo;
  }

  loadCatalogos = async () => {
    try {
      const [rarRes, catRes] = await Promise.all([
        catalogoService.getRaridades(),
        catalogoService.getCategoriasEquipamento(),
      ]);
      this.setState({
        raridades: rarRes.data || [],
        categorias: catRes.data || [],
      });
    } catch (e) {
      console.error('Erro ao carregar catalogos:', e.message);
    }
  };

  loadEquipamento = async (id) => {
    this.setState({ loading: true, error: null });
    try {
      await this.loadCatalogos();
      const { data } = await this.service.getById(id);
      this.setState({
        id: data.id, nome: data.nome || '', descricao: data.descricao || '',
        tipo: this._arrToStr(data.tipo), elemento: this._arrToStr(data.elemento),
        bonus: this._jsonToStr(data.bonus),
        dano_base: data.dano_base ?? '',
        requisitos: this._jsonToStr(data.requisitos), numero: data.numero ?? '',
        propriedades: this._arrToStr(data.propriedades),
        cargas: data.cargas ?? '', usos_por_dia: data.usos_por_dia ?? '',
        raridade_id: data.raridade_id ?? '', origem_lore: data.origem_lore || '',
        ...this._loadVinculo(data.vinculo),
        categoria_id: data.categoria_id ?? '',
        loading: false,
      });
    } catch (error) {
      this.setState({ loading: false, error: `Erro ao carregar equipamento: ${error.message}` });
    }
  };

  _buildData() {
    return {
      nome: this.state.nome, descricao: this.state.descricao || null,
      tipo: this._parseArr(this.state.tipo), elemento: this._parseArr(this.state.elemento),
      bonus: this._parseJson(this.state.bonus),
      dano_base: this.state.dano_base ? String(this.state.dano_base) : null,
      requisitos: this._parseJson(this.state.requisitos),
      propriedades: this._parseArr(this.state.propriedades),
      cargas: this.state.cargas ? parseInt(this.state.cargas) : null,
      usos_por_dia: this.state.usos_por_dia ? parseInt(this.state.usos_por_dia) : null,
      numero: this.state.numero ? parseInt(this.state.numero) : null,
      raridade_id: this.state.raridade_id ? parseInt(this.state.raridade_id) : null,
      origem_lore: this.state.origem_lore || null,
      vinculo: this._buildVinculo(),
      categoria_id: this.state.categoria_id ? parseInt(this.state.categoria_id) : null,
    };
  }

  criarEquipamento = async () => {
    if (!this.state.nome.trim()) { this.setState({ error: 'Nome e obrigatorio' }); return { success: false }; }
    this.setState({ saving: true, error: null });
    try {
      await this.service.create(this._buildData());
      this.setState({ saving: false });
      return { success: true };
    } catch (error) {
      this.setState({ saving: false, error: `Erro ao criar equipamento: ${error.message}` });
      return { success: false };
    }
  };

  saveEquipamento = async () => {
    if (!this.state.nome.trim()) { this.setState({ error: 'Nome e obrigatorio' }); return { success: false }; }
    this.setState({ saving: true, error: null });
    try {
      await this.service.update(this.state.id, this._buildData());
      this.setState({ saving: false });
      return { success: true };
    } catch (error) {
      this.setState({ saving: false, error: `Erro ao salvar equipamento: ${error.message}` });
      return { success: false };
    }
  };

  reset = () => {
    this.setState({
      id: null, nome: '', descricao: '', tipo: '', elemento: '', bonus: '',
      dano_base: '', requisitos: '', numero: '', raridade_id: '',
      origem_lore: '', categoria_id: '',
      vinculo_requer: false, vinculo_restricao_tipo: '', vinculo_restricao: '', vinculo_descricao: '',
      propriedades: '', cargas: '', usos_por_dia: '',
      loading: false, saving: false, error: null,
    });
  };

  clearError = () => this.setState({ error: null });

  get id() { return this.state.id; }
  get nome() { return this.state.nome; }
  get descricao() { return this.state.descricao; }
  get tipo() { return this.state.tipo; }
  get elemento() { return this.state.elemento; }
  get bonus() { return this.state.bonus; }
  get dano_base() { return this.state.dano_base; }
  get requisitos() { return this.state.requisitos; }
  get propriedades() { return this.state.propriedades; }
  get cargas() { return this.state.cargas; }
  get usos_por_dia() { return this.state.usos_por_dia; }
  get numero() { return this.state.numero; }
  get raridade_id() { return this.state.raridade_id; }
  get origem_lore() { return this.state.origem_lore; }
  get vinculo_requer() { return this.state.vinculo_requer; }
  get vinculo_restricao_tipo() { return this.state.vinculo_restricao_tipo; }
  get vinculo_restricao() { return this.state.vinculo_restricao; }
  get vinculo_descricao() { return this.state.vinculo_descricao; }
  get categoria_id() { return this.state.categoria_id; }
  get raridades() { return this.state.raridades; }
  get categorias() { return this.state.categorias; }
  get loading() { return this.state.loading; }
  get saving() { return this.state.saving; }
  get error() { return this.state.error; }
}

export const editarEquipamentoViewModel = new EditarEquipamentoViewModel();
export default EditarEquipamentoViewModel;
