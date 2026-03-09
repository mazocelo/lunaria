import React from 'react';
import InputSimples from '../../../components/form/inputSimples';
import Button from '../../../components/form/button';
import { Sparkles, Loader2 } from 'lucide-react';

const NovaVantagemView = ({
  nome, descricao, custo, tipo, elemento, nivel, dano_base, usar,
  bonus, efeito, saving, error, isLight,
  setField, handleSubmit, handleCancel,
}) => {
  const inputCls = `w-full px-4 py-3 rounded-lg font-modern transition-all duration-200 resize-none ${isLight ? 'bg-slate-100 border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500' : 'bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:border-purple-500'} focus:outline-none focus:ring-2 focus:ring-purple-500/20`;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center"><Sparkles size={32} className="text-white" /></div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>Criar Nova Vantagem</h1>
        <p className="text-slate-400 font-modern">Adicione uma nova vantagem ao catalogo</p>
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
        <InputSimples label="Nome" name="nome" value={nome} onChange={e => setField('nome', e.target.value)} placeholder="Nome da vantagem" required />
        <div>
          <label className={`block text-sm font-semibold font-modern mb-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>Descricao</label>
          <textarea name="descricao" value={descricao} onChange={e => setField('descricao', e.target.value)} placeholder="Descricao da vantagem..." rows={3} className={inputCls} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputSimples label="Custo" name="custo" type="number" value={custo} onChange={e => setField('custo', e.target.value)} />
          <InputSimples label="Nivel" name="nivel" type="number" value={nivel} onChange={e => setField('nivel', e.target.value)} min={1} />
          <InputSimples label="Usar (vezes)" name="usar" type="number" value={usar} onChange={e => setField('usar', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputSimples label="Tipo (separado por virgula)" name="tipo" value={tipo} onChange={e => setField('tipo', e.target.value)} placeholder="ativa, passiva" />
          <InputSimples label="Elemento (separado por virgula)" name="elemento" value={elemento} onChange={e => setField('elemento', e.target.value)} placeholder="fogo, agua" />
        </div>
        <InputSimples label="Dano Base" name="dano_base" type="number" value={dano_base} onChange={e => setField('dano_base', e.target.value)} />
        <div>
          <label className={`block text-sm font-semibold font-modern mb-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>Bonus (JSON)</label>
          <textarea name="bonus" value={bonus} onChange={e => setField('bonus', e.target.value)} rows={2} className={`${inputCls} font-mono text-sm`} placeholder='{"forca": 2}' />
        </div>
        <div>
          <label className={`block text-sm font-semibold font-modern mb-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>Efeito (JSON)</label>
          <textarea name="efeito" value={efeito} onChange={e => setField('efeito', e.target.value)} rows={2} className={`${inputCls} font-mono text-sm`} placeholder='{}' />
        </div>
        <div className="flex space-x-4 pt-4">
          <Button variant="ghost" onClick={handleCancel} className="flex-1" type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={saving} className="flex-1">
            {saving ? (
              <div className="flex items-center space-x-2"><Loader2 size={16} className="animate-spin" /><span>Criando...</span></div>
            ) : (
              <div className="flex items-center space-x-2"><Sparkles size={16} /><span>Criar Vantagem</span></div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NovaVantagemView;
