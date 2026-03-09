import React from 'react';
import { Sword, Save, Loader2 } from 'lucide-react';
import InputSimples from '../../../components/form/inputSimples';
import Button from '../../../components/form/button';

const EditarEquipamentoView = ({
  nome, descricao, tipo, elemento, bonus, dano_base, requisitos, numero,
  raridade_id, origem_lore, categoria_id,
  vinculo_requer, vinculo_restricao_tipo, vinculo_restricao, vinculo_descricao,
  propriedades, cargas, usos_por_dia,
  raridades, categorias, loading, saving, error, isLight,
  setField, handleSubmit, handleCancel,
}) => {
  const inputCls = `w-full px-4 py-3 rounded-lg font-modern transition-all duration-200 resize-none ${isLight ? 'bg-slate-100 border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500' : 'bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:border-purple-500'} focus:outline-none focus:ring-2 focus:ring-purple-500/20`;
  const labelCls = `block text-sm font-semibold font-modern mb-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`;
  const sectionCls = `text-lg font-fantasy font-bold mb-4 ${isLight ? 'text-slate-700' : 'text-slate-200'}`;

  if (loading) return (
    <div className="animate-fade-in">
      <div className="card-rpg">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse-slow"><Sword size={24} className="text-white" /></div>
            <div className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Carregando equipamento...</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center"><Sword size={32} className="text-white" /></div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>Editar Equipamento</h1>
        <p className="text-slate-400 font-modern">Atualize os dados do equipamento</p>
      </div>
      <form onSubmit={handleSubmit} className="card-rpg space-y-6">
        {error && (<div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg"><div className="flex items-start space-x-3"><div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-white text-sm">!</span></div><div><div className="font-semibold text-red-400 font-modern">Erro</div><p className="text-red-300 text-sm font-modern mt-1">{error}</p></div></div></div>)}

        {/* Secao: Identificacao */}
        <div>
          <h3 className={sectionCls}>Identificacao</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputSimples label="Numero" name="numero" type="number" value={numero} onChange={e => setField('numero', e.target.value)} placeholder="Ex: 42" />
            <InputSimples label="Nome" name="nome" value={nome} onChange={e => setField('nome', e.target.value)} placeholder="Nome do equipamento" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className={labelCls}>Categoria</label>
              <select name="categoria_id" value={categoria_id} onChange={e => setField('categoria_id', e.target.value)} className={inputCls}>
                <option value="">Selecione...</option>
                {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Raridade</label>
              <select name="raridade_id" value={raridade_id} onChange={e => setField('raridade_id', e.target.value)} className={inputCls}>
                <option value="">Selecione...</option>
                {raridades.map(rar => <option key={rar.id} value={rar.id}>{rar.nome}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Secao: Descricao */}
        <div>
          <h3 className={sectionCls}>Descricao</h3>
          <div><label className={labelCls}>Descricao</label><textarea name="descricao" value={descricao} onChange={e => setField('descricao', e.target.value)} placeholder="Descricao do equipamento..." rows={3} className={inputCls} /></div>
          <div className="mt-4"><label className={labelCls}>Origem / Lore</label><textarea name="origem_lore" value={origem_lore} onChange={e => setField('origem_lore', e.target.value)} placeholder="Historia e origem do item..." rows={3} className={inputCls} /></div>
        </div>

        {/* Secao: Vinculo Magico */}
        <div>
          <h3 className={sectionCls}>Vinculo Magico</h3>
          <p className={`text-xs font-modern mb-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Itens com vinculo criam uma conexao magica com o portador. Um personagem pode manter vinculo com no maximo 3 itens simultaneamente.
          </p>
          <div className="flex items-center space-x-3 mb-4">
            <input type="checkbox" id="vinculo_requer" checked={vinculo_requer} onChange={e => setField('vinculo_requer', e.target.checked)} className="w-5 h-5 rounded border-slate-600 text-purple-500 focus:ring-purple-500" />
            <label htmlFor="vinculo_requer" className={`font-modern ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>Requer Vinculo Magico</label>
          </div>
          {vinculo_requer && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Tipo de Restricao</label>
                <select name="vinculo_restricao_tipo" value={vinculo_restricao_tipo} onChange={e => setField('vinculo_restricao_tipo', e.target.value)} className={inputCls}>
                  <option value="">Sem restricao (livre)</option>
                  <option value="classe">Classe</option>
                  <option value="alinhamento">Alinhamento</option>
                  <option value="raca">Raca</option>
                  <option value="maldicao">Maldicao</option>
                  <option value="especial">Especial</option>
                  <option value="misto">Misto</option>
                </select>
              </div>
              {vinculo_restricao_tipo && (
                <InputSimples label="Restricoes (separado por virgula)" name="vinculo_restricao" value={vinculo_restricao} onChange={e => setField('vinculo_restricao', e.target.value)} placeholder="Ex: paladino, clerigo" />
              )}
              <div>
                <label className={labelCls}>Descricao do Vinculo</label>
                <textarea name="vinculo_descricao" value={vinculo_descricao} onChange={e => setField('vinculo_descricao', e.target.value)} placeholder="Efeito principal ao vincular-se ao item..." rows={2} className={inputCls} />
              </div>
            </div>
          )}
        </div>

        {/* Secao: Combate */}
        <div>
          <h3 className={sectionCls}>Combate</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputSimples label="Tipo (separado por virgula)" name="tipo" value={tipo} onChange={e => setField('tipo', e.target.value)} placeholder="cortante, perfurante" />
            <InputSimples label="Elemento (separado por virgula)" name="elemento" value={elemento} onChange={e => setField('elemento', e.target.value)} placeholder="fogo, gelo" />
          </div>
          <div className="mt-4">
            <InputSimples label="Dano Base" name="dano_base" value={dano_base} onChange={e => setField('dano_base', e.target.value)} placeholder="Ex: 2d6+3" />
          </div>
        </div>

        {/* Secao: Propriedades */}
        <div>
          <h3 className={sectionCls}>Propriedades</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputSimples label="Propriedades (separado por virgula)" name="propriedades" value={propriedades} onChange={e => setField('propriedades', e.target.value)} placeholder="cargas, senciente, voo, luminoso" />
            <div className="grid grid-cols-2 gap-4">
              <InputSimples label="Cargas" name="cargas" type="number" value={cargas} onChange={e => setField('cargas', e.target.value)} placeholder="Ex: 7" />
              <InputSimples label="Usos/dia" name="usos_por_dia" type="number" value={usos_por_dia} onChange={e => setField('usos_por_dia', e.target.value)} placeholder="Ex: 3" />
            </div>
          </div>
        </div>

        {/* Secao: Dados Avancados */}
        <div>
          <h3 className={sectionCls}>Dados Avancados</h3>
          <div className="space-y-4">
            <div><label className={labelCls}>Bonus (JSON)</label><textarea name="bonus" value={bonus} onChange={e => setField('bonus', e.target.value)} rows={2} className={`${inputCls} font-mono text-sm`} placeholder='{"ataque": 2, "dano": 2}' /></div>
            <div><label className={labelCls}>Requisitos (JSON)</label><textarea name="requisitos" value={requisitos} onChange={e => setField('requisitos', e.target.value)} rows={2} className={`${inputCls} font-mono text-sm`} placeholder='{"classe": ["paladino"], "stats": {"FOR": 18}}' /></div>
          </div>
        </div>

        <div className="flex space-x-4 pt-4">
          <Button variant="ghost" onClick={handleCancel} className="flex-1" type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={saving} className="flex-1">{saving ? (<div className="flex items-center space-x-2"><Loader2 size={16} className="animate-spin" /><span>Salvando...</span></div>) : (<div className="flex items-center space-x-2"><Save size={16} /><span>Salvar Equipamento</span></div>)}</Button>
        </div>
      </form>
    </div>
  );
};

export default EditarEquipamentoView;
