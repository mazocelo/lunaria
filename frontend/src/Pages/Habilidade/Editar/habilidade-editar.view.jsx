import React from 'react';
import InputSimples from '../../../components/form/inputSimples';
import Button from '../../../components/form/button';
import LoadingSpinner from '../../../components/LoadingSpinner.jsx';
import { Zap, Loader2 } from 'lucide-react';

const categoriaOptions = [
  { value: 'combate_fisico', label: 'Combate Fisico' },
  { value: 'magia_ofensiva', label: 'Magia Ofensiva' },
  { value: 'magia_defensiva', label: 'Magia Defensiva' },
  { value: 'cura', label: 'Cura' },
  { value: 'suporte', label: 'Suporte' },
  { value: 'controle', label: 'Controle' },
  { value: 'utilidade', label: 'Utilidade' },
  { value: 'social', label: 'Social' },
  { value: 'crafting', label: 'Crafting' },
  { value: 'racial', label: 'Racial' },
  { value: 'passiva', label: 'Passiva' },
];

const tipoOptions = ['dano', 'cura', 'buff', 'debuff', 'controle', 'invocacao', 'utilidade', 'crafting'];
const alcanceOptions = ['pessoal', 'toque', 'curto', 'medio', 'longo', 'extremo'];
const tempoOptions = ['acao', 'acao_bonus', 'reacao', 'ritual', '1_minuto', '10_minutos'];
const alvoOptions = ['inimigo', 'aliado', 'self', 'area', 'todos_inimigos', 'todos_aliados'];

const EditarHabilidadeView = ({
  nome, descricao, custo_mana, dano_base, tipo, elemento, nivel_requerido,
  cooldown_turnos, classe_id, alvo, alcance, tempo_conjuracao, usa_concentracao,
  categoria, escola_magia, raca_id, usos_por_descanso, saving_throw,
  efeito, escalamento, pre_requisito, area_efeito, componente_material,
  loading, saving, error, isLight,
  setField, handleSubmit, handleCancel,
}) => {
  const inputCls = `w-full px-4 py-3 rounded-lg font-modern transition-all duration-200 resize-none ${isLight ? 'bg-slate-100 border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-purple-500' : 'bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:border-purple-500'} focus:outline-none focus:ring-2 focus:ring-purple-500/20`;
  const selectCls = `${inputCls} cursor-pointer`;
  const labelCls = `block text-sm font-semibold font-modern mb-2 ${isLight ? 'text-slate-700' : 'text-slate-200'}`;

  if (loading) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto">
        <div className="card-rpg">
          <LoadingSpinner size="xl" text="Carregando habilidade..." variant="primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center"><Zap size={32} className="text-white" /></div>
        <h1 className={`text-3xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'} mb-2`}>Editar Habilidade</h1>
        <p className="text-slate-400 font-modern">Atualize os dados da habilidade</p>
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

        {/* Basic Info */}
        <InputSimples label="Nome" name="nome" value={nome} onChange={e => setField('nome', e.target.value)} placeholder="Nome da habilidade" required />
        <div>
          <label className={labelCls}>Descricao</label>
          <textarea name="descricao" value={descricao} onChange={e => setField('descricao', e.target.value)} placeholder="Descricao da habilidade..." rows={3} className={inputCls} />
        </div>

        {/* Category & Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Categoria</label>
            <select value={categoria} onChange={e => setField('categoria', e.target.value)} className={selectCls}>
              {categoriaOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tipo</label>
            <select value={tipo} onChange={e => setField('tipo', e.target.value)} className={selectCls}>
              {tipoOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Combat Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <InputSimples label="Custo Mana" name="custo_mana" type="number" value={custo_mana} onChange={e => setField('custo_mana', e.target.value)} min={0} />
          <InputSimples label="Nivel Requerido" name="nivel_requerido" type="number" value={nivel_requerido} onChange={e => setField('nivel_requerido', e.target.value)} min={1} />
          <InputSimples label="Cooldown (turnos)" name="cooldown_turnos" type="number" value={cooldown_turnos} onChange={e => setField('cooldown_turnos', e.target.value)} min={0} />
          <InputSimples label="Dano Base" name="dano_base" value={dano_base} onChange={e => setField('dano_base', e.target.value)} placeholder="2d6+3" />
        </div>

        {/* Targeting */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Alvo</label>
            <select value={alvo} onChange={e => setField('alvo', e.target.value)} className={selectCls}>
              {alvoOptions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Alcance</label>
            <select value={alcance} onChange={e => setField('alcance', e.target.value)} className={selectCls}>
              {alcanceOptions.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Tempo Conjuracao</label>
            <select value={tempo_conjuracao} onChange={e => setField('tempo_conjuracao', e.target.value)} className={selectCls}>
              {tempoOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Magic Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputSimples label="Elemento" name="elemento" value={elemento} onChange={e => setField('elemento', e.target.value)} placeholder="fogo, gelo, etc." />
          <InputSimples label="Escola de Magia" name="escola_magia" value={escola_magia} onChange={e => setField('escola_magia', e.target.value)} placeholder="evocacao, abjuracao..." />
          <InputSimples label="Saving Throw" name="saving_throw" value={saving_throw} onChange={e => setField('saving_throw', e.target.value)} placeholder="constituicao, destreza..." />
        </div>

        {/* IDs and toggles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputSimples label="Classe ID" name="classe_id" type="number" value={classe_id} onChange={e => setField('classe_id', e.target.value)} placeholder="Opcional" />
          <InputSimples label="Raca ID" name="raca_id" type="number" value={raca_id} onChange={e => setField('raca_id', e.target.value)} placeholder="Opcional" />
          <InputSimples label="Usos por Descanso" name="usos_por_descanso" type="number" value={usos_por_descanso} onChange={e => setField('usos_por_descanso', e.target.value)} placeholder="Opcional" />
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="usa_concentracao" checked={usa_concentracao} onChange={e => setField('usa_concentracao', e.target.checked)} className="w-4 h-4 rounded border-slate-600 text-purple-500 focus:ring-purple-500" />
          <label htmlFor="usa_concentracao" className={labelCls + ' mb-0'}>Usa Concentracao</label>
        </div>

        {/* JSON fields */}
        <div>
          <label className={labelCls}>Efeito (JSON)</label>
          <textarea name="efeito" value={efeito} onChange={e => setField('efeito', e.target.value)} rows={2} className={`${inputCls} font-mono text-sm`} placeholder='{"tipo": "dano_continuo", "valor": "1d4"}' />
        </div>
        <div>
          <label className={labelCls}>Escalamento (JSON)</label>
          <textarea name="escalamento" value={escalamento} onChange={e => setField('escalamento', e.target.value)} rows={2} className={`${inputCls} font-mono text-sm`} placeholder='{"nivel_5": "3d6", "nivel_10": "5d6"}' />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Area de Efeito (JSON)</label>
            <textarea name="area_efeito" value={area_efeito} onChange={e => setField('area_efeito', e.target.value)} rows={2} className={`${inputCls} font-mono text-sm`} placeholder='{"formato": "cone", "tamanho": "9m"}' />
          </div>
          <div>
            <label className={labelCls}>Pre-requisito (JSON)</label>
            <textarea name="pre_requisito" value={pre_requisito} onChange={e => setField('pre_requisito', e.target.value)} rows={2} className={`${inputCls} font-mono text-sm`} placeholder='{"nivel_minimo": 5}' />
          </div>
        </div>
        <div>
          <label className={labelCls}>Componente Material (JSON)</label>
          <textarea name="componente_material" value={componente_material} onChange={e => setField('componente_material', e.target.value)} rows={2} className={`${inputCls} font-mono text-sm`} placeholder='{"item": "cristal", "consumido": true}' />
        </div>

        <div className="flex space-x-4 pt-4">
          <Button variant="ghost" onClick={handleCancel} className="flex-1" type="button">Cancelar</Button>
          <Button variant="primary" type="submit" disabled={saving} className="flex-1">
            {saving ? (
              <div className="flex items-center space-x-2"><Loader2 size={16} className="animate-spin" /><span>Salvando...</span></div>
            ) : (
              <div className="flex items-center space-x-2"><Zap size={16} /><span>Salvar Habilidade</span></div>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditarHabilidadeView;
