import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import InputSimples from '../../../components/form/inputSimples';
import Button from '../../../components/form/button';
import { useViewModel } from '../../../shared/hooks/useViewModel';
import { editarMonstroViewModel } from '../../../viewmodels/Monstros';
import { useTheme } from '../../../contexts/theme.jsx';
import { Skull, Sparkles, Loader2 } from 'lucide-react';
import { ROUTES } from '../../../routes.jsx';

const NovoMonstroView = () => {
  const vm = useViewModel(editarMonstroViewModel);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const inputCls = `w-full px-4 py-3 rounded-lg font-modern transition-all duration-200 resize-none ${isLight ? 'bg-slate-100 border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500' : 'bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:border-purple-500'} focus:outline-none focus:ring-2 focus:ring-purple-500/20`;
  const sectionCls = `p-4 rounded-lg ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/30 border border-slate-700'}`;
  const labelCls = `block text-sm font-semibold font-modern mb-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`;

  useEffect(() => { vm.reset(); vm.loadCatalogos(); return () => vm.clearError(); }, []);
  const handleSubmit = async (e) => { e.preventDefault(); const r = await vm.criarMonstro(); if (r.success) navigate(ROUTES.MONSTROS); };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center"><Skull size={32} className="text-white" /></div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>Criar Novo Monstro</h1>
        <p className="text-slate-400 font-modern">Adicione um novo monstro ao bestiario</p>
      </div>
      <form onSubmit={handleSubmit} className="card-rpg space-y-6">
        {vm.error && (<div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg"><div className="flex items-start space-x-3"><div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-white text-sm">!</span></div><div><div className="font-semibold text-red-400 font-modern">Erro</div><p className="text-red-300 text-sm font-modern mt-1">{vm.error}</p></div></div></div>)}
        <InputSimples label="Nome" name="nome" value={vm.nome} onChange={e => vm.setField('nome', e.target.value)} placeholder="Nome do monstro" required />
        <div><label className={labelCls}>Descricao</label><textarea name="descricao" value={vm.descricao} onChange={e => vm.setField('descricao', e.target.value)} placeholder="Descricao do monstro..." rows={3} className={inputCls} /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputSimples label="Tipo (separado por virgula)" name="tipo" value={vm.tipo} onChange={e => vm.setField('tipo', e.target.value)} placeholder="bestial, magico" />
          <InputSimples label="Elemento" name="elemento" value={vm.elemento} onChange={e => vm.setField('elemento', e.target.value)} placeholder="fogo, sombrio" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelCls}>Categoria</label><select name="categoria_id" value={vm.categoria_id} onChange={e => vm.setField('categoria_id', e.target.value)} className={inputCls}><option value="">Selecione...</option>{vm.categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
          <div><label className={labelCls}>Raridade</label><select name="raridade_id" value={vm.raridade_id} onChange={e => vm.setField('raridade_id', e.target.value)} className={inputCls}><option value="">Selecione...</option>{vm.raridades.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InputSimples label="Nivel Min" name="nivel_min" type="number" value={vm.nivel_min} onChange={e => vm.setField('nivel_min', e.target.value)} min={1} />
          <InputSimples label="Nivel Max" name="nivel_max" type="number" value={vm.nivel_max} onChange={e => vm.setField('nivel_max', e.target.value)} min={1} />
          <InputSimples label="HP Base" name="hp_base" type="number" value={vm.hp_base} onChange={e => vm.setField('hp_base', e.target.value)} min={1} />
          <InputSimples label="XP Base" name="xp_base" type="number" value={vm.xp_base} onChange={e => vm.setField('xp_base', e.target.value)} min={0} />
        </div>
        <div className={sectionCls}>
          <h3 className={`text-sm font-semibold font-modern mb-4 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>Atributos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <InputSimples label="Forca" name="forca" type="number" value={vm.forca} onChange={e => vm.setField('forca', e.target.value)} />
            <InputSimples label="Destreza" name="destreza" type="number" value={vm.destreza} onChange={e => vm.setField('destreza', e.target.value)} />
            <InputSimples label="Constituicao" name="constituicao" type="number" value={vm.constituicao} onChange={e => vm.setField('constituicao', e.target.value)} />
            <InputSimples label="Inteligencia" name="inteligencia" type="number" value={vm.inteligencia} onChange={e => vm.setField('inteligencia', e.target.value)} />
            <InputSimples label="Sabedoria" name="sabedoria" type="number" value={vm.sabedoria} onChange={e => vm.setField('sabedoria', e.target.value)} />
            <InputSimples label="Carisma" name="carisma" type="number" value={vm.carisma} onChange={e => vm.setField('carisma', e.target.value)} />
          </div>
        </div>
        <div className={sectionCls}>
          <h3 className={`text-sm font-semibold font-modern mb-4 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>Combate</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputSimples label="Ataque" name="ataque" type="number" value={vm.ataque} onChange={e => vm.setField('ataque', e.target.value)} />
            <InputSimples label="Defesa" name="defesa" type="number" value={vm.defesa} onChange={e => vm.setField('defesa', e.target.value)} />
            <InputSimples label="Dano Base" name="dano_base" type="number" value={vm.dano_base} onChange={e => vm.setField('dano_base', e.target.value)} />
          </div>
        </div>
        <div className="flex space-x-4 pt-4">
          <Button variant="ghost" onClick={() => navigate(ROUTES.MONSTROS)} className="flex-1" type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={vm.saving} className="flex-1">{vm.saving ? (<div className="flex items-center space-x-2"><Loader2 size={16} className="animate-spin" /><span>Criando...</span></div>) : (<div className="flex items-center space-x-2"><Sparkles size={16} /><span>Criar Monstro</span></div>)}</Button>
        </div>
      </form>
    </div>
  );
};

export default NovoMonstroView;
