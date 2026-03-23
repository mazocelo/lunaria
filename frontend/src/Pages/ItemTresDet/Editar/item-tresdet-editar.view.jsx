import React from 'react';
import { Package, Save, Loader2 } from 'lucide-react';
import InputSimples from '../../../components/form/inputSimples';
import Button from '../../../components/form/button';
import { useTheme } from '../../../contexts/theme.jsx';

const EditarItemTresDetView = ({
  nome, descricao, tipo, custo_pe, preco_moedas,
  poderes, efeito, empilhavel, raridade, magia_vinculada,
  tiposOptions, raridadeOptions,
  imagem, setImagem,
  loading, saving, error,
  setField, handleSubmit, handleCancel,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const inputCls = `w-full px-4 py-3 rounded-lg font-modern transition-all duration-200 resize-none ${isLight ? 'bg-slate-100 border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500' : 'bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:border-purple-500'} focus:outline-none focus:ring-2 focus:ring-purple-500/20`;
  const labelCls = `block text-sm font-semibold font-modern mb-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`;
  const sectionCls = `text-lg font-fantasy font-bold mb-4 ${isLight ? 'text-slate-700' : 'text-slate-200'}`;

  if (loading) return (
    <div className="animate-fade-in">
      <div className="card-rpg">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse-slow"><Package size={24} className="text-white" /></div>
            <div className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Carregando item...</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center"><Package size={32} className="text-white" /></div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>Editar Item 3D&T</h1>
        <p className="text-slate-400 font-modern">Atualize os dados do item</p>
      </div>
      <form onSubmit={handleSubmit} className="card-rpg space-y-6">
        {error && (<div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg"><div className="flex items-start space-x-3"><div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-white text-sm">!</span></div><div><div className="font-semibold text-red-400 font-modern">Erro</div><p className="text-red-300 text-sm font-modern mt-1">{error}</p></div></div></div>)}

        <div>
          <h3 className={sectionCls}>Identificacao</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputSimples label="Nome" name="nome" value={nome} onChange={e => setField('nome', e.target.value)} placeholder="Nome do item" required />
            <div>
              <label className={labelCls}>Tipo</label>
              <select name="tipo" value={tipo} onChange={e => setField('tipo', e.target.value)} className={inputCls} required>
                <option value="">Selecione...</option>
                {tiposOptions.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className={labelCls}>Raridade</label>
              <select name="raridade" value={raridade} onChange={e => setField('raridade', e.target.value)} className={inputCls}>
                <option value="">Selecione...</option>
                {raridadeOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="flex items-center space-x-3 mt-6">
              <input type="checkbox" id="empilhavel" checked={empilhavel} onChange={e => setField('empilhavel', e.target.checked)} className="w-5 h-5 rounded border-slate-600 text-purple-500 focus:ring-purple-500" />
              <label htmlFor="empilhavel" className={`font-modern ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>Empilhavel</label>
            </div>
          </div>
        </div>

        <div>
          <h3 className={sectionCls}>Descricao e Efeito</h3>
          <div><label className={labelCls}>Descricao</label><textarea name="descricao" value={descricao} onChange={e => setField('descricao', e.target.value)} placeholder="Descricao do item..." rows={3} className={inputCls} /></div>
          <div className="mt-4"><label className={labelCls}>Efeito</label><textarea name="efeito" value={efeito} onChange={e => setField('efeito', e.target.value)} placeholder="Efeito mecanico do item..." rows={3} className={inputCls} /></div>
        </div>

        <div>
          <h3 className={sectionCls}>Custos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputSimples label="Custo PE" name="custo_pe" type="number" value={custo_pe} onChange={e => setField('custo_pe', e.target.value)} placeholder="0" />
            <InputSimples label="Preco (Moedas)" name="preco_moedas" type="number" value={preco_moedas} onChange={e => setField('preco_moedas', e.target.value)} placeholder="0" />
          </div>
        </div>

        <div>
          <h3 className={sectionCls}>Dados Avancados</h3>
          <div className="space-y-4">
            <div><label className={labelCls}>Poderes (JSON)</label><textarea name="poderes" value={poderes} onChange={e => setField('poderes', e.target.value)} rows={2} className={`${inputCls} font-mono text-sm`} placeholder='{"forca": 2, "velocidade": 1}' /></div>
            <InputSimples label="Magia Vinculada" name="magia_vinculada" value={magia_vinculada} onChange={e => setField('magia_vinculada', e.target.value)} placeholder="Nome da magia vinculada (opcional)" />
          </div>
        </div>

        <div className="flex space-x-4 pt-4">
          <Button variant="ghost" onClick={handleCancel} className="flex-1" type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={saving} className="flex-1">{saving ? (<div className="flex items-center space-x-2"><Loader2 size={16} className="animate-spin" /><span>Salvando...</span></div>) : (<div className="flex items-center space-x-2"><Save size={16} /><span>Salvar Item</span></div>)}</Button>
        </div>
      </form>
    </div>
  );
};

export default EditarItemTresDetView;
