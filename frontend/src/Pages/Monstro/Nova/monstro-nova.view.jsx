import React from 'react';
import InputSimples from '../../../components/form/inputSimples';
import Button from '../../../components/form/button';
import { useTheme } from '../../../contexts/theme.jsx';
import { Skull, Sparkles, Loader2 } from 'lucide-react';

const NovoMonstroView = ({
  nome, descricao, tipo, elemento, raridade_id, categoria_id,
  nivel_min, nivel_max, hp_base, xp_base,
  forca, destreza, constituicao, inteligencia, sabedoria, carisma,
  ataque, defesa, dano_base,
  raridades, categorias, saving, error,
  imagem, setImagem,
  setField, handleSubmit, handleCancel, clearError,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const inputCls = `w-full px-4 py-3 rounded-lg font-modern transition-all duration-200 resize-none ${isLight ? 'bg-slate-100 border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500' : 'bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:border-purple-500'} focus:outline-none focus:ring-2 focus:ring-purple-500/20`;
  const sectionCls = `p-4 rounded-lg ${isLight ? 'bg-slate-50 border border-slate-200' : 'bg-slate-800/30 border border-slate-700'}`;
  const labelCls = `block text-sm font-semibold font-modern mb-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center"><Skull size={32} className="text-white" /></div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>Criar Novo Monstro</h1>
        <p className="text-slate-400 font-modern">Adicione um novo monstro ao bestiario</p>
      </div>
      <form onSubmit={handleSubmit} className="card-rpg space-y-6">
        {error && (<div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg"><div className="flex items-start space-x-3"><div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-white text-sm">!</span></div><div><div className="font-semibold text-red-400 font-modern">Erro</div><p className="text-red-300 text-sm font-modern mt-1">{error}</p></div></div></div>)}
        <InputSimples label="Nome" name="nome" value={nome} onChange={e => setField('nome', e.target.value)} placeholder="Nome do monstro" required />
        <div><label className={labelCls}>Descricao</label><textarea name="descricao" value={descricao} onChange={e => setField('descricao', e.target.value)} placeholder="Descricao do monstro..." rows={3} className={inputCls} /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputSimples label="Tipo (separado por virgula)" name="tipo" value={tipo} onChange={e => setField('tipo', e.target.value)} placeholder="bestial, magico" />
          <InputSimples label="Elemento" name="elemento" value={elemento} onChange={e => setField('elemento', e.target.value)} placeholder="fogo, sombrio" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelCls}>Categoria</label><select name="categoria_id" value={categoria_id} onChange={e => setField('categoria_id', e.target.value)} className={inputCls}><option value="">Selecione...</option>{categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
          <div><label className={labelCls}>Raridade</label><select name="raridade_id" value={raridade_id} onChange={e => setField('raridade_id', e.target.value)} className={inputCls}><option value="">Selecione...</option>{raridades.map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InputSimples label="Nivel Min" name="nivel_min" type="number" value={nivel_min} onChange={e => setField('nivel_min', e.target.value)} min={1} />
          <InputSimples label="Nivel Max" name="nivel_max" type="number" value={nivel_max} onChange={e => setField('nivel_max', e.target.value)} min={1} />
          <InputSimples label="HP Base" name="hp_base" type="number" value={hp_base} onChange={e => setField('hp_base', e.target.value)} min={1} />
          <InputSimples label="XP Base" name="xp_base" type="number" value={xp_base} onChange={e => setField('xp_base', e.target.value)} min={0} />
        </div>
        <div className={sectionCls}>
          <h3 className={`text-sm font-semibold font-modern mb-4 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>Atributos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <InputSimples label="Forca" name="forca" type="number" value={forca} onChange={e => setField('forca', e.target.value)} />
            <InputSimples label="Destreza" name="destreza" type="number" value={destreza} onChange={e => setField('destreza', e.target.value)} />
            <InputSimples label="Constituicao" name="constituicao" type="number" value={constituicao} onChange={e => setField('constituicao', e.target.value)} />
            <InputSimples label="Inteligencia" name="inteligencia" type="number" value={inteligencia} onChange={e => setField('inteligencia', e.target.value)} />
            <InputSimples label="Sabedoria" name="sabedoria" type="number" value={sabedoria} onChange={e => setField('sabedoria', e.target.value)} />
            <InputSimples label="Carisma" name="carisma" type="number" value={carisma} onChange={e => setField('carisma', e.target.value)} />
          </div>
        </div>
        <div className={sectionCls}>
          <h3 className={`text-sm font-semibold font-modern mb-4 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>Combate</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputSimples label="Ataque" name="ataque" type="number" value={ataque} onChange={e => setField('ataque', e.target.value)} />
            <InputSimples label="Defesa" name="defesa" type="number" value={defesa} onChange={e => setField('defesa', e.target.value)} />
            <InputSimples label="Dano Base" name="dano_base" type="number" value={dano_base} onChange={e => setField('dano_base', e.target.value)} />
          </div>
        </div>
        <div className="flex space-x-4 pt-4">
          <Button variant="ghost" onClick={handleCancel} className="flex-1" type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={saving} className="flex-1">{saving ? (<div className="flex items-center space-x-2"><Loader2 size={16} className="animate-spin" /><span>Criando...</span></div>) : (<div className="flex items-center space-x-2"><Sparkles size={16} /><span>Criar Monstro</span></div>)}</Button>
        </div>
      </form>
    </div>
  );
};

export default NovoMonstroView;
