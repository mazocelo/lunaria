import { Sparkles, Save, Loader2 } from 'lucide-react';
import InputSimples from '../../../components/form/inputSimples';
import Button from '../../../components/form/button';
import { useTheme } from '../../../contexts/theme';

type MagiaField =
  | 'nome' | 'descricao' | 'escola' | 'custo_pm' | 'alcance' | 'duracao'
  | 'tipo' | 'exigencias' | 'focus_requisito' | 'efeito' | 'nivel_minimo';

const escolaOptions = [
  { value: 'branca', label: 'Branca' },
  { value: 'negra', label: 'Negra' },
  { value: 'elemental', label: 'Elemental' },
];

const alcanceOptions = [
  { value: 'pessoal', label: 'Pessoal' },
  { value: 'toque', label: 'Toque' },
  { value: 'curto', label: 'Curto' },
  { value: 'medio', label: 'Medio' },
  { value: 'longo', label: 'Longo' },
];

const tipoOptions = [
  { value: 'dano', label: 'Dano' },
  { value: 'cura', label: 'Cura' },
  { value: 'suporte', label: 'Suporte' },
  { value: 'controle', label: 'Controle' },
  { value: 'utilidade', label: 'Utilidade' },
];

interface EditarMagiaTresDetViewProps {
  nome: string;
  descricao: string;
  escola: string;
  custo_pm: string;
  alcance: string;
  duracao: string;
  tipo: string;
  exigencias: string;
  focus_requisito: string;
  efeito: string;
  nivel_minimo: number | string;
  loading: boolean;
  saving: boolean;
  error: string | null;
  setField: (name: MagiaField, value: string | number) => void;
  handleSubmit: (e: React.FormEvent) => void | Promise<void>;
  handleCancel: () => void;
  clearError: () => void;
}

const EditarMagiaTresDetView = ({
  nome, descricao, escola, custo_pm, alcance, duracao, tipo,
  exigencias, focus_requisito, efeito, nivel_minimo,
  loading, saving, error,
  setField, handleSubmit, handleCancel,
}: EditarMagiaTresDetViewProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const inputCls = `w-full px-4 py-3 rounded-lg font-modern transition-all duration-200 resize-none ${isLight ? 'bg-slate-100 border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500' : 'bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:border-purple-500'} focus:outline-none focus:ring-2 focus:ring-purple-500/20`;
  const selectCls = `${inputCls} cursor-pointer`;
  const labelCls = `block text-sm font-semibold font-modern mb-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`;
  const sectionCls = `text-lg font-fantasy font-bold mb-4 ${isLight ? 'text-slate-700' : 'text-slate-200'}`;

  if (loading) return (
    <div className="animate-fade-in">
      <div className="card-rpg">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse-slow">
              <Sparkles size={24} className="text-white" />
            </div>
            <div className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Carregando magia...</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
          <Sparkles size={32} className="text-white" />
        </div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>Editar Magia</h1>
        <p className="text-slate-400 font-modern">Atualize os dados da magia</p>
      </div>
      <form onSubmit={handleSubmit} className="card-rpg space-y-6">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm">!</span>
              </div>
              <div>
                <div className="font-semibold text-red-400 font-modern">Erro</div>
                <p className="text-red-300 text-sm font-modern mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <h3 className={sectionCls}>Identificacao</h3>
          <InputSimples label="Nome" name="nome" value={nome} onChange={e => setField('nome', e.target.value)} placeholder="Nome da magia" required />
          <div className="mt-4">
            <label className={labelCls}>Descricao</label>
            <textarea name="descricao" value={descricao} onChange={e => setField('descricao', e.target.value)} placeholder="Descricao da magia e seus efeitos narrativos..." rows={4} className={inputCls} />
          </div>
        </div>

        <div>
          <h3 className={sectionCls}>Classificacao</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Escola</label>
              <select value={escola} onChange={e => setField('escola', e.target.value)} className={selectCls}>
                {escolaOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Tipo</label>
              <select value={tipo} onChange={e => setField('tipo', e.target.value)} className={selectCls}>
                {tipoOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <InputSimples label="Nivel Minimo" name="nivel_minimo" type="number" value={nivel_minimo} onChange={e => setField('nivel_minimo', e.target.value)} min={1} />
          </div>
        </div>

        <div>
          <h3 className={sectionCls}>Mecanica</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputSimples label="Custo PM" name="custo_pm" value={custo_pm} onChange={e => setField('custo_pm', e.target.value)} placeholder="Ex: 1 PM, 2 PM por turno" required />
            <div>
              <label className={labelCls}>Alcance</label>
              <select value={alcance} onChange={e => setField('alcance', e.target.value)} className={selectCls}>
                {alcanceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <InputSimples label="Duracao" name="duracao" value={duracao} onChange={e => setField('duracao', e.target.value)} placeholder="Ex: instantanea, 1 turno" required />
          </div>
        </div>

        <div>
          <h3 className={sectionCls}>Requisitos e Efeitos</h3>
          <InputSimples label="Exigencias" name="exigencias" value={exigencias} onChange={e => setField('exigencias', e.target.value)} placeholder="Ex: Magia Branca, Focus Fogo 1" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className={labelCls}>Focus Requisito (JSON)</label>
              <textarea name="focus_requisito" value={focus_requisito} onChange={e => setField('focus_requisito', e.target.value)} rows={2} className={`${inputCls} font-mono text-sm`} placeholder='{"fogo": 1}' />
            </div>
            <div>
              <label className={labelCls}>Efeito (JSON)</label>
              <textarea name="efeito" value={efeito} onChange={e => setField('efeito', e.target.value)} rows={2} className={`${inputCls} font-mono text-sm`} placeholder='{"dano": "2d6", "tipo": "fogo"}' />
            </div>
          </div>
        </div>

        <div className="flex space-x-4 pt-4">
          <Button variant="ghost" onClick={handleCancel} className="flex-1" type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={saving} className="flex-1">
            {saving ? (
              <div className="flex items-center space-x-2"><Loader2 size={16} className="animate-spin" /><span>Salvando...</span></div>
            ) : (
              <div className="flex items-center space-x-2"><Save size={16} /><span>Salvar Magia</span></div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditarMagiaTresDetView;
