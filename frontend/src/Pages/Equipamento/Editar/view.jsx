import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InputSimples from '../../../components/form/inputSimples';
import Button from '../../../components/form/button';
import { useViewModel } from '../../../shared/hooks/useViewModel';
import { editarEquipamentoViewModel } from '../../../viewmodels/Equipamentos';
import { useTheme } from '../../../contexts/theme.jsx';
import { ROUTES } from '../../../routes.jsx';

const CATEGORIAS = [
  'Espadas e Laminas', 'Machados, Martelos e Contundentes', 'Lancas, Alabardas e Armas de Haste',
  'Armas de Alcance', 'Armaduras e Escudos', 'Aneis Magicos', 'Amuletos e Colares',
  'Cajados, Varinhas e Orbes', 'Pocoes e Elixires', 'Itens de Uso e Ferramentas Magicas',
  'Artefatos Lendarios', 'Miscelanea Magica'
];

const RARIDADES = ['Comum', 'Incomum', 'Raro', 'Muito Raro', 'Lendario', 'Artefato', 'Variavel'];

const EditarEquipamentoView = () => {
  const { id } = useParams();
  const vm = useViewModel(editarEquipamentoViewModel);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const inputCls = `w-full px-4 py-3 rounded-lg font-modern transition-all duration-200 resize-none ${isLight ? 'bg-slate-100 border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500' : 'bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:border-purple-500'} focus:outline-none focus:ring-2 focus:ring-purple-500/20`;
  const labelCls = `block text-sm font-semibold font-modern mb-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`;
  const sectionCls = `text-lg font-fantasy font-bold mb-4 ${isLight ? 'text-slate-700' : 'text-slate-200'}`;

  useEffect(() => { if (id) vm.loadEquipamento(id); return () => vm.clearError(); }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const r = await vm.saveEquipamento();
    if (r.success) navigate(ROUTES.EQUIPAMENTOS);
  };

  if (vm.loading) return (
    <div className="animate-fade-in">
      <div className="card-rpg">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse-slow"><span className="text-2xl">{'⚔️'}</span></div>
            <div className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Carregando equipamento...</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center"><span className="text-3xl">{'⚔️'}</span></div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>Editar Equipamento</h1>
        <p className="text-slate-400 font-modern">Atualize os dados do equipamento</p>
      </div>
      <form onSubmit={handleSubmit} className="card-rpg space-y-6">
        {vm.error && (<div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg"><div className="flex items-start space-x-3"><div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"><span className="text-white text-sm">!</span></div><div><div className="font-semibold text-red-400 font-modern">Erro</div><p className="text-red-300 text-sm font-modern mt-1">{vm.error}</p></div></div></div>)}

        {/* Secao: Identificacao */}
        <div>
          <h3 className={sectionCls}>Identificacao</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputSimples label="Numero" name="numero" type="number" value={vm.numero} onChange={e => vm.setField('numero', e.target.value)} placeholder="Ex: 42" />
            <InputSimples label="Nome" name="nome" value={vm.nome} onChange={e => vm.setField('nome', e.target.value)} placeholder="Nome do equipamento" required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className={labelCls}>Categoria</label>
              <select name="categoria" value={vm.categoria} onChange={e => vm.setField('categoria', e.target.value)} className={inputCls}>
                {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Raridade</label>
              <select name="raridade" value={vm.raridade} onChange={e => vm.setField('raridade', e.target.value)} className={inputCls}>
                {RARIDADES.map(rar => <option key={rar} value={rar}>{rar}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Secao: Descricao */}
        <div>
          <h3 className={sectionCls}>Descricao</h3>
          <div><label className={labelCls}>Descricao</label><textarea name="descricao" value={vm.descricao} onChange={e => vm.setField('descricao', e.target.value)} placeholder="Descricao do equipamento..." rows={3} className={inputCls} /></div>
          <div className="mt-4"><label className={labelCls}>Origem / Lore</label><textarea name="origem_lore" value={vm.origem_lore} onChange={e => vm.setField('origem_lore', e.target.value)} placeholder="Historia e origem do item..." rows={3} className={inputCls} /></div>
        </div>

        {/* Secao: Sintonizacao */}
        <div>
          <h3 className={sectionCls}>Vinculo Magico (Sintonizacao)</h3>
          <p className={`text-xs font-modern mb-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Itens com vinculo criam uma conexao magica com o portador. Um personagem pode manter vinculo com no maximo 3 itens simultaneamente.
          </p>
          <div className="flex items-center space-x-3 mb-4">
            <input type="checkbox" id="sintonizacao" checked={vm.sintonizacao} onChange={e => vm.setField('sintonizacao', e.target.checked)} className="w-5 h-5 rounded border-slate-600 text-purple-500 focus:ring-purple-500" />
            <label htmlFor="sintonizacao" className={`font-modern ${isLight ? 'text-slate-700' : 'text-slate-200'}`}>Requer Vinculo Magico</label>
          </div>
          {vm.sintonizacao && (
            <InputSimples label="Restricao de Sintonizacao" name="sintonizacao_restricao" value={vm.sintonizacao_restricao} onChange={e => vm.setField('sintonizacao_restricao', e.target.value)} placeholder="Ex: Somente magos, Somente elfos..." />
          )}
        </div>

        {/* Secao: Combate */}
        <div>
          <h3 className={sectionCls}>Combate</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputSimples label="Tipo (separado por virgula)" name="tipo" value={vm.tipo} onChange={e => vm.setField('tipo', e.target.value)} placeholder="cortante, perfurante" />
            <InputSimples label="Elemento (separado por virgula)" name="elemento" value={vm.elemento} onChange={e => vm.setField('elemento', e.target.value)} placeholder="fogo, gelo" />
          </div>
          <div className="mt-4">
            <InputSimples label="Dano Base" name="dano_base" value={vm.dano_base} onChange={e => vm.setField('dano_base', e.target.value)} placeholder="Ex: 2d6+3" />
          </div>
        </div>

        {/* Secao: Propriedades */}
        <div>
          <h3 className={sectionCls}>Propriedades</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputSimples label="Propriedades (separado por virgula)" name="propriedades" value={vm.propriedades} onChange={e => vm.setField('propriedades', e.target.value)} placeholder="cargas, senciente, voo, luminoso" />
            <div className="grid grid-cols-2 gap-4">
              <InputSimples label="Cargas" name="cargas" type="number" value={vm.cargas} onChange={e => vm.setField('cargas', e.target.value)} placeholder="Ex: 7" />
              <InputSimples label="Usos/dia" name="usos_por_dia" type="number" value={vm.usos_por_dia} onChange={e => vm.setField('usos_por_dia', e.target.value)} placeholder="Ex: 3" />
            </div>
          </div>
        </div>

        {/* Secao: Dados Avancados */}
        <div>
          <h3 className={sectionCls}>Dados Avancados</h3>
          <div className="space-y-4">
            <div><label className={labelCls}>Bonus (JSON)</label><textarea name="bonus" value={vm.bonus} onChange={e => vm.setField('bonus', e.target.value)} rows={2} className={`${inputCls} font-mono text-sm`} placeholder='{"ataque": 2, "dano": 2}' /></div>
            <div><label className={labelCls}>Requisitos (JSON)</label><textarea name="requisitos" value={vm.requisitos} onChange={e => vm.setField('requisitos', e.target.value)} rows={2} className={`${inputCls} font-mono text-sm`} placeholder='{"classe": ["paladino"], "stats": {"FOR": 18}}' /></div>
          </div>
        </div>

        <div className="flex space-x-4 pt-4">
          <Button variant="ghost" onClick={() => navigate(ROUTES.EQUIPAMENTOS)} className="flex-1" type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={vm.saving} className="flex-1">{vm.saving ? (<div className="flex items-center space-x-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Salvando...</span></div>) : (<div className="flex items-center space-x-2"><span>{'💾'}</span><span>Salvar Equipamento</span></div>)}</Button>
        </div>
      </form>
    </div>
  );
};

export default EditarEquipamentoView;
