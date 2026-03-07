import { vantagemService } from '../../services/index.js';

class EditarVantagemViewModel {
  constructor() {
    this.service = vantagemService;
    this.state = {
      id: null, nome: '', descricao: '', custo: 0, tipo: '', elemento: '', nivel: 1,
      dano_base: '', usar: '', bonus: '', restricao: '', efeito: '', requisitos: '',
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

  loadVantagem = async (id) => {
    this.setState({ loading: true, error: null });
    try {
      const { data } = await this.service.getById(id);
      this.setState({
        id: data.id, nome: data.nome || '', descricao: data.descricao || '',
        custo: data.custo ?? 0, tipo: this._arrToStr(data.tipo), elemento: this._arrToStr(data.elemento),
        nivel: data.nivel ?? 1, dano_base: data.dano_base ?? '', usar: data.usar ?? '',
        bonus: this._jsonToStr(data.bonus), restricao: this._jsonToStr(data.restricao),
        efeito: this._jsonToStr(data.efeito), requisitos: this._jsonToStr(data.requisitos),
        loading: false,
      });
    } catch (error) { this.setState({ loading: false, error: `Erro ao carregar vantagem: ${error.message}` }); }
  };

  _parseJson(str) { if (!str) return null; try { return JSON.parse(str); } catch { return str; } }
  _parseArr(str) { if (!str) return []; return str.split(',').map(s => s.trim()).filter(Boolean); }

  _buildData() {
    return {
      nome: this.state.nome, descricao: this.state.descricao || null,
      custo: parseInt(this.state.custo) || 0, tipo: this._parseArr(this.state.tipo),
      elemento: this._parseArr(this.state.elemento), nivel: parseInt(this.state.nivel) || 1,
      dano_base: this.state.dano_base ? parseInt(this.state.dano_base) : null,
      usar: this.state.usar ? parseInt(this.state.usar) : null,
      bonus: this._parseJson(this.state.bonus), restricao: this._parseJson(this.state.restricao),
      efeito: this._parseJson(this.state.efeito), requisitos: this._parseJson(this.state.requisitos),
    };
  }

  criarVantagem = async () => {
    if (!this.state.nome.trim()) { this.setState({ error: 'Nome e obrigatorio' }); return { success: false }; }
    this.setState({ saving: true, error: null });
    try { await this.service.create(this._buildData()); this.setState({ saving: false }); return { success: true }; }
    catch (error) { this.setState({ saving: false, error: `Erro ao criar vantagem: ${error.message}` }); return { success: false }; }
  };

  saveVantagem = async () => {
    if (!this.state.nome.trim()) { this.setState({ error: 'Nome e obrigatorio' }); return { success: false }; }
    this.setState({ saving: true, error: null });
    try { await this.service.update(this.state.id, this._buildData()); this.setState({ saving: false }); return { success: true }; }
    catch (error) { this.setState({ saving: false, error: `Erro ao salvar vantagem: ${error.message}` }); return { success: false }; }
  };

  reset = () => { this.setState({ id: null, nome: '', descricao: '', custo: 0, tipo: '', elemento: '', nivel: 1, dano_base: '', usar: '', bonus: '', restricao: '', efeito: '', requisitos: '', loading: false, saving: false, error: null }); };
  clearError = () => this.setState({ error: null });

  get nome() { return this.state.nome; }
  get descricao() { return this.state.descricao; }
  get custo() { return this.state.custo; }
  get tipo() { return this.state.tipo; }
  get elemento() { return this.state.elemento; }
  get nivel() { return this.state.nivel; }
  get dano_base() { return this.state.dano_base; }
  get usar() { return this.state.usar; }
  get bonus() { return this.state.bonus; }
  get restricao() { return this.state.restricao; }
  get efeito() { return this.state.efeito; }
  get requisitos() { return this.state.requisitos; }
  get loading() { return this.state.loading; }
  get saving() { return this.state.saving; }
  get error() { return this.state.error; }
}

export const editarVantagemViewModel = new EditarVantagemViewModel();
export default EditarVantagemViewModel;
