import InputSimples from '../../../components/form/inputSimples';
import Button from '../../../components/form/button';
import { useTheme } from '../../../contexts/theme';
import { AlertTriangle, Save, Loader2 } from 'lucide-react';

type DesvantagemField =
  | 'nome' | 'descricao' | 'custo' | 'tipo' | 'elemento'
  | 'nivel' | 'usar' | 'dano_base';

interface EditarDesvantagemViewProps {
  nome: string;
  descricao: string;
  custo: number | string;
  tipo: string | string[];
  elemento: string | string[];
  nivel: number | string;
  usar: number | string;
  dano_base: string;
  loading: boolean;
  saving: boolean;
  error: string | null;
  setField: (name: DesvantagemField, value: string | number) => void;
  handleSubmit: (e: React.FormEvent) => void | Promise<void>;
  handleCancel: () => void;
  clearError: () => void;
}

const EditarDesvantagemView = ({
  nome, descricao, custo, tipo, elemento, nivel, usar, dano_base,
  loading, saving, error,
  setField, handleSubmit, handleCancel,
}: EditarDesvantagemViewProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const inputCls = `w-full px-4 py-3 rounded-lg font-modern transition-all duration-200 resize-none ${
    isLight
      ? 'bg-slate-100 border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500'
      : 'bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:border-purple-500'
  } focus:outline-none focus:ring-2 focus:ring-purple-500/20`;
  const labelCls = `block text-sm font-semibold font-modern mb-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`;

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="card-rpg">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse-slow">
                <AlertTriangle size={24} className="text-white" />
              </div>
              <div className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                Carregando desvantagem...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tipoStr = Array.isArray(tipo) ? tipo.join(', ') : tipo;
  const elementoStr = Array.isArray(elemento) ? elemento.join(', ') : elemento;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
          <AlertTriangle size={32} className="text-white" />
        </div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>
          Editar Desvantagem
        </h1>
        <p className="text-slate-400 font-modern">
          Atualize os dados da desvantagem
        </p>
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

        <InputSimples label="Nome" name="nome" value={nome} onChange={e => setField('nome', e.target.value)} placeholder="Nome da desvantagem" required />

        <div>
          <label className={labelCls}>Descricao</label>
          <textarea name="descricao" value={descricao} onChange={e => setField('descricao', e.target.value)} placeholder="Descricao da desvantagem..." rows={3} className={inputCls} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputSimples label="Custo" name="custo" type="number" value={custo} onChange={e => setField('custo', e.target.value)} />
          <InputSimples label="Tipo" name="tipo" value={tipoStr} onChange={e => setField('tipo', e.target.value)} placeholder="Tipo da desvantagem" />
          <InputSimples label="Elemento" name="elemento" value={elementoStr} onChange={e => setField('elemento', e.target.value)} placeholder="Elemento" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputSimples label="Nivel" name="nivel" type="number" value={nivel} onChange={e => setField('nivel', e.target.value)} min={1} />
          <InputSimples label="Usar" name="usar" type="number" value={usar} onChange={e => setField('usar', e.target.value)} min={0} />
          <InputSimples label="Dano Base" name="dano_base" value={dano_base} onChange={e => setField('dano_base', e.target.value)} placeholder="Dano base" />
        </div>

        <div className="flex space-x-4 pt-4">
          <Button variant="ghost" onClick={handleCancel} className="flex-1" type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={saving} className="flex-1">
            {saving ? (
              <div className="flex items-center space-x-2"><Loader2 size={16} className="animate-spin" /><span>Salvando...</span></div>
            ) : (
              <div className="flex items-center space-x-2"><Save size={16} /><span>Salvar Desvantagem</span></div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditarDesvantagemView;
