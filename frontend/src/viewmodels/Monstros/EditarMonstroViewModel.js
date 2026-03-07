import { monstroService, catalogoService } from '../../services/index.js';

class EditarMonstroViewModel {
  constructor() {
    this.service = monstroService;
    this.state = {
      id: null, nome: '', descricao: '', tipo: '', raridade_id: '', categoria_id: '',
      nivel_min: 1, nivel_max: 1, hp_base: 10,
      forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, carisma: 10,
      ataque: 0, defesa: 0, dano_base: 0, xp_base: 10, elemento: '',
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

  _arrToStr(val) { if (!val) return ''; return Array.isArray(val) ? val.join(', ') : String(val); }
  _parseArr(str) { if (!str) return []; return str.split(',').map(s => s.trim()).filter(Boolean); }

  loadCatalogos = async () => {
    try {
      const [rarRes, catRes] = await Promise.all([
        catalogoService.getRaridades(),
        catalogoService.getCategoriasMonstro(),
      ]);
      this.setState({
        raridades: rarRes.data || [],
        categorias: catRes.data || [],
      });
    } catch (e) {
      console.error('Erro ao carregar catalogos:', e.message);
    }
  };

  loadMonstro = async (id) => {
    this.setState({ loading: true, error: null });
    try {
      await this.loadCatalogos();
      const { data } = await this.service.getById(id);
      this.setState({
        id: data.id, nome: data.nome || '', descricao: data.descricao || '',
        tipo: this._arrToStr(data.tipo),
        raridade_id: data.raridade_id ?? '', categoria_id: data.categoria_id ?? '',
        nivel_min: data.nivel_min ?? 1, nivel_max: data.nivel_max ?? 1, hp_base: data.hp_base ?? 10,
        forca: data.forca ?? 10, destreza: data.destreza ?? 10, constituicao: data.constituicao ?? 10,
        inteligencia: data.inteligencia ?? 10, sabedoria: data.sabedoria ?? 10, carisma: data.carisma ?? 10,
        ataque: data.ataque_base ?? 0, defesa: data.defesa_base ?? 0, dano_base: data.dano_base ?? 0,
        xp_base: data.xp_base ?? 10, elemento: this._arrToStr(data.elemento),
        loading: false,
      });
    } catch (error) { this.setState({ loading: false, error: `Erro ao carregar monstro: ${error.message}` }); }
  };

  _buildData() {
    const int = (v) => parseInt(v) || 0;
    return {
      nome: this.state.nome, descricao: this.state.descricao || null,
      tipo: this._parseArr(this.state.tipo),
      raridade_id: this.state.raridade_id ? parseInt(this.state.raridade_id) : null,
      categoria_id: this.state.categoria_id ? parseInt(this.state.categoria_id) : null,
      nivel_min: int(this.state.nivel_min), nivel_max: int(this.state.nivel_max), hp_base: int(this.state.hp_base),
      forca: int(this.state.forca), destreza: int(this.state.destreza), constituicao: int(this.state.constituicao),
      inteligencia: int(this.state.inteligencia), sabedoria: int(this.state.sabedoria), carisma: int(this.state.carisma),
      ataque_base: int(this.state.ataque), defesa_base: int(this.state.defesa), dano_base: String(this.state.dano_base),
      xp_base: int(this.state.xp_base), elemento: this._parseArr(this.state.elemento),
    };
  }

  criarMonstro = async () => {
    if (!this.state.nome.trim()) { this.setState({ error: 'Nome e obrigatorio' }); return { success: false }; }
    this.setState({ saving: true, error: null });
    try { await this.service.create(this._buildData()); this.setState({ saving: false }); return { success: true }; }
    catch (error) { this.setState({ saving: false, error: `Erro ao criar monstro: ${error.message}` }); return { success: false }; }
  };

  saveMonstro = async () => {
    if (!this.state.nome.trim()) { this.setState({ error: 'Nome e obrigatorio' }); return { success: false }; }
    this.setState({ saving: true, error: null });
    try { await this.service.update(this.state.id, this._buildData()); this.setState({ saving: false }); return { success: true }; }
    catch (error) { this.setState({ saving: false, error: `Erro ao salvar monstro: ${error.message}` }); return { success: false }; }
  };

  reset = () => {
    this.setState({ id: null, nome: '', descricao: '', tipo: '', raridade_id: '', categoria_id: '', nivel_min: 1, nivel_max: 1, hp_base: 10, forca: 10, destreza: 10, constituicao: 10, inteligencia: 10, sabedoria: 10, carisma: 10, ataque: 0, defesa: 0, dano_base: 0, xp_base: 10, elemento: '', loading: false, saving: false, error: null });
  };
  clearError = () => this.setState({ error: null });

  get id() { return this.state.id; }
  get nome() { return this.state.nome; }
  get descricao() { return this.state.descricao; }
  get tipo() { return this.state.tipo; }
  get raridade_id() { return this.state.raridade_id; }
  get categoria_id() { return this.state.categoria_id; }
  get raridades() { return this.state.raridades; }
  get categorias() { return this.state.categorias; }
  get nivel_min() { return this.state.nivel_min; }
  get nivel_max() { return this.state.nivel_max; }
  get hp_base() { return this.state.hp_base; }
  get forca() { return this.state.forca; }
  get destreza() { return this.state.destreza; }
  get constituicao() { return this.state.constituicao; }
  get inteligencia() { return this.state.inteligencia; }
  get sabedoria() { return this.state.sabedoria; }
  get carisma() { return this.state.carisma; }
  get ataque() { return this.state.ataque; }
  get defesa() { return this.state.defesa; }
  get dano_base() { return this.state.dano_base; }
  get xp_base() { return this.state.xp_base; }
  get elemento() { return this.state.elemento; }
  get loading() { return this.state.loading; }
  get saving() { return this.state.saving; }
  get error() { return this.state.error; }
}

export const editarMonstroViewModel = new EditarMonstroViewModel();
export default EditarMonstroViewModel;
