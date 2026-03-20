import React from 'react';
import { BookOpen, ScrollText, Sparkles, Swords, Shield, Zap, Tag, Link2, Package, Weight, Coins } from 'lucide-react';
import { useTheme } from '../../../contexts/theme.jsx';
import { CatalogDetailLayout, ChipGroup, getRaridadeConfig } from '../../../components/shared';

// ── Category icons (visual config, local to View) ────────
const CATEGORIA_ICONS = {
  'Armas Corpo a Corpo': Swords, 'Armas a Distancia': Swords,
  'Armaduras': Shield, 'Escudos': Shield,
  'Amuletos e Colares': Sparkles, 'Aneis': Sparkles,
  'Pocoes': Zap, 'Cajados e Varinhas': Zap, 'Pergaminhos': ScrollText,
};

// ── Main view ─────────────────────────────────────────────
const VerEquipamentoView = ({ equipamento: eq, loading, error, onBack, onEdit }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (loading || error || !eq) {
    return (
      <CatalogDetailLayout
        loading={loading} loadingText="Carregando equipamento..."
        error={error || (!loading && !eq ? 'Equipamento nao encontrado' : undefined)}
        icon={Package} title="" onBack={onBack} onEdit={onEdit}
      />
    );
  }

  const raridadeConfig = getRaridadeConfig(eq.raridade);

  // -- Badges --
  const badges = [
    <span key="rar" className={`relative overflow-hidden px-3 py-1 rounded-full text-xs font-semibold border ${isLight ? raridadeConfig.badgeLight : raridadeConfig.badge}`}>
      {eq.raridade}
    </span>,
    eq.categoria && (
      <span key="cat" className={`px-3 py-1 rounded-full text-xs font-modern ${isLight ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-500/15 text-indigo-400'}`}>
        {eq.categoria}
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
    eq.origemLore && {
      title: 'Origem / Lore', icon: ScrollText, color: '#c2410c',
      content: <p className={`font-modern leading-relaxed italic ${textCls}`}>{eq.origemLore}</p>,
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
    eq.tipos.length > 0 && { icon: Swords, label: 'Slot / Tipo', content: <ChipGroup items={eq.tipos} colorClass={isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-500/15 text-blue-400'} /> },
    { icon: Tag, label: 'Raridade', content: <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${isLight ? raridadeConfig.badgeLight : raridadeConfig.badge}`}>{eq.raridade}</span> },
    eq.categoria && { icon: Package, label: 'Categoria', content: eq.categoria },
    eq.vinculo && { icon: Link2, label: 'Vinculo Magico', content: (
      <span className={`inline-flex items-center gap-1.5 ${eq.vinculo.requer ? (isLight ? 'text-yellow-700' : 'text-yellow-400') : (isLight ? 'text-slate-500' : 'text-slate-400')}`}>
        {eq.vinculo.requer ? <><Sparkles size={12} /> Requerido</> : 'Nao requer'}
      </span>
    )},
    eq.elementos.length > 0 && { icon: Zap, label: 'Elemento', content: <ChipGroup items={eq.elementos} colorClass={isLight ? 'bg-purple-50 text-purple-700' : 'bg-purple-500/15 text-purple-400'} /> },
    eq.danoBase && { icon: Swords, label: 'Dano Base', content: <span className={`font-mono font-semibold ${isLight ? 'text-red-600' : 'text-red-400'}`}>{eq.danoBase}</span> },
    eq.propriedades.length > 0 && { icon: Tag, label: 'Propriedades', content: <ChipGroup items={eq.propriedades} colorClass={isLight ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-500/15 text-emerald-400'} /> },
    eq.bonus?.length > 0 && { icon: Shield, label: 'Bonus', content: monoBlock(eq.bonus, isLight ? 'text-cyan-700' : 'text-cyan-400') },
    eq.requisitos?.length > 0 && { icon: Shield, label: 'Requisitos', content: monoBlock(eq.requisitos, isLight ? 'text-amber-700' : 'text-amber-400') },
    eq.cargas && { icon: Zap, label: 'Cargas', content: eq.cargas },
    eq.usosPorDia && { icon: Zap, label: 'Usos por Dia', content: eq.usosPorDia },
    eq.peso && { icon: Weight, label: 'Peso', content: `${eq.peso} kg` },
    eq.precoSugerido && { icon: Coins, label: 'Preco Sugerido', content: eq.precoSugerido },
  ].filter(Boolean);

  return (
    <CatalogDetailLayout
      title={eq.nome}
      subtitle={eq.numero ? `#${eq.numero}` : undefined}
      image={eq.imagem}
      icon={CATEGORIA_ICONS[eq.categoria] || Package}
      rarity={eq.raridade}
      accentColor={raridadeConfig.accent}
      badges={badges}
      sections={sections}
      stats={stats}
      sidebarTitle="Ficha Tecnica"
      onBack={onBack}
      onEdit={onEdit}
    />
  );
};

export default VerEquipamentoView;
