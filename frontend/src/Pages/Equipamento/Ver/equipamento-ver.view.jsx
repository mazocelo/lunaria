import React from 'react';
import { BookOpen, ScrollText, Sparkles, Swords, Shield, Zap, Tag, Link2, Package, Weight, Coins } from 'lucide-react';
import {
  CatalogDetailLayout,
  ChipGroup,
  getRaridadeConfig,
  RARIDADE_CONFIG,
  formatBonusDisplay,
  formatRequisitosDisplay,
} from '../../../components/shared';

const CATEGORIA_ICONS = {
  'Armas Corpo a Corpo': Swords, 'Armas a Distancia': Swords,
  'Armaduras': Shield, 'Escudos': Shield,
  'Amuletos e Colares': Sparkles, 'Aneis': Sparkles,
  'Pocoes': Zap, 'Cajados e Varinhas': Zap, 'Pergaminhos': ScrollText,
};

const VerEquipamentoView = ({ equipamento, loading, error, isLight, handleBack, handleEdit }) => {
  if (loading || error || !equipamento) {
    return (
      <CatalogDetailLayout
        loading={loading} loadingText="Carregando equipamento..."
        error={error || (!loading && !equipamento ? 'Equipamento nao encontrado' : undefined)}
        icon={Package} title="" onBack={handleBack} onEdit={handleEdit}
      />
    );
  }

  const eq = equipamento;
  const raridade = eq.raridade_rel?.nome || 'Comum';
  const config = getRaridadeConfig(raridade);
  const tipos = Array.isArray(eq.tipo) ? eq.tipo : [];
  const elementos = Array.isArray(eq.elemento) ? eq.elemento : [];
  const propriedades = Array.isArray(eq.propriedades) ? eq.propriedades : [];
  const bonusItems = formatBonusDisplay(eq.bonus);
  const requisitosItems = formatRequisitosDisplay(eq.requisitos);

  // -- Badges --
  const badges = [
    <span key="rar" className={`relative overflow-hidden px-3 py-1 rounded-full text-xs font-semibold border ${isLight ? config.badgeLight : config.badge}`}>
      {raridade}
    </span>,
    eq.categoria_rel?.nome && (
      <span key="cat" className={`px-3 py-1 rounded-full text-xs font-modern ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/15 text-indigo-400'}`}>
        {eq.categoria_rel.nome}
      </span>
    ),
    eq.vinculo?.requer && (
      <span key="vinc" className={`px-3 py-1 rounded-full text-xs font-modern flex items-center gap-1 ${isLight ? 'bg-yellow-50 text-yellow-700' : 'bg-yellow-500/15 text-yellow-400'}`}>
        <Sparkles size={12} /> Vinculo Magico
      </span>
    ),
  ].filter(Boolean);

  // -- Sections --
  const textCls = isLight ? 'text-slate-700' : 'text-slate-300';
  const sections = [
    eq.descricao && {
      title: 'Descricao', icon: BookOpen, color: '#d97706',
      content: <p className={`font-modern leading-relaxed ${textCls}`}>{eq.descricao}</p>,
    },
    eq.origem_lore && {
      title: 'Origem / Lore', icon: ScrollText, color: '#c2410c',
      content: <p className={`font-modern leading-relaxed italic ${textCls}`}>{eq.origem_lore}</p>,
    },
    eq.vinculo?.requer && {
      title: 'Vinculo Magico', icon: Sparkles, color: '#eab308',
      content: (
        <div className="space-y-3">
          <p className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Este item requer um vinculo magico com o portador para ativar seus poderes.
          </p>
          {eq.vinculo.descricao && (
            <div className={`p-3 rounded-lg ${isLight ? 'bg-yellow-50' : 'bg-yellow-500/[0.05]'}`}>
              <span className={`text-[10px] uppercase tracking-wider font-modern block mb-1 ${isLight ? 'text-yellow-600/70' : 'text-yellow-500/60'}`}>
                Efeito do Vinculo
              </span>
              <p className={`text-sm font-modern leading-relaxed ${isLight ? 'text-slate-700' : 'text-white'}`}>
                {eq.vinculo.descricao}
              </p>
            </div>
          )}
          {eq.vinculo.restricao_tipo && (
            <div className={`flex flex-wrap gap-2 text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              <span>Restricao: <strong className={isLight ? 'text-slate-700' : 'text-white'}>
                {eq.vinculo.restricao_tipo.charAt(0).toUpperCase() + eq.vinculo.restricao_tipo.slice(1)}
              </strong></span>
              {eq.vinculo.restricao?.length > 0 && <span>({eq.vinculo.restricao.join(', ')})</span>}
            </div>
          )}
        </div>
      ),
    },
  ].filter(Boolean);

  // -- Stats (sidebar) --
  const monoBlock = (items, cls) => (
    <div className="space-y-1">{items.map((a, i) => <span key={i} className={`block font-mono text-xs ${cls}`}>{a}</span>)}</div>
  );

  const stats = [
    tipos.length > 0 && { icon: Swords, label: 'Slot / Tipo', content: <ChipGroup items={tipos} colorClass={isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/15 text-blue-400'} /> },
    { icon: Tag, label: 'Raridade', content: <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${isLight ? config.badgeLight : config.badge}`}>{raridade}</span> },
    eq.categoria_rel?.nome && { icon: Package, label: 'Categoria', content: eq.categoria_rel.nome },
    eq.vinculo && { icon: Link2, label: 'Vinculo Magico', content: (
      <span className={`inline-flex items-center gap-1.5 ${eq.vinculo.requer ? (isLight ? 'text-yellow-700' : 'text-yellow-400') : (isLight ? 'text-slate-500' : 'text-slate-400')}`}>
        {eq.vinculo.requer ? <><Sparkles size={12} /> Requerido</> : 'Nao requer'}
      </span>
    )},
    elementos.length > 0 && { icon: Zap, label: 'Elemento', content: <ChipGroup items={elementos} colorClass={isLight ? 'bg-purple-50 text-purple-700' : 'bg-purple-500/15 text-purple-400'} /> },
    eq.dano_base && { icon: Swords, label: 'Dano Base', content: <span className={`font-mono font-semibold ${isLight ? 'text-red-600' : 'text-red-400'}`}>{eq.dano_base}</span> },
    propriedades.length > 0 && { icon: Tag, label: 'Propriedades', content: <ChipGroup items={propriedades} colorClass={isLight ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-500/15 text-emerald-400'} /> },
    bonusItems?.length > 0 && { icon: Shield, label: 'Bonus', content: monoBlock(bonusItems, isLight ? 'text-cyan-700' : 'text-cyan-400') },
    requisitosItems?.length > 0 && { icon: Shield, label: 'Requisitos', content: monoBlock(requisitosItems, isLight ? 'text-amber-700' : 'text-amber-400') },
    eq.cargas && { icon: Zap, label: 'Cargas', content: eq.cargas },
    eq.usos_por_dia && { icon: Zap, label: 'Usos por Dia', content: eq.usos_por_dia },
    eq.peso && { icon: Weight, label: 'Peso', content: `${eq.peso} kg` },
    eq.preco_sugerido && { icon: Coins, label: 'Preco Sugerido', content: eq.preco_sugerido },
  ].filter(Boolean);

  return (
    <CatalogDetailLayout
      title={eq.nome}
      subtitle={eq.numero ? `#${eq.numero}` : undefined}
      image={eq.imagem}
      icon={CATEGORIA_ICONS[eq.categoria_rel?.nome] || Package}
      rarity={raridade}
      accentColor={config.accent}
      badges={badges}
      sections={sections}
      stats={stats}
      sidebarTitle="Ficha Tecnica"
      onBack={handleBack}
      onEdit={handleEdit}
    />
  );
};

export default VerEquipamentoView;
