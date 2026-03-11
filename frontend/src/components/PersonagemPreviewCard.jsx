import React, { useState } from 'react';
import { useTheme } from '../contexts/theme.jsx';
import { Heart, Shield, Eye, EyeOff, Sparkles, User } from 'lucide-react';

const ATTR_LABELS = {
  forca: { label: 'FOR', color: 'bg-red-500' },
  inteligencia: { label: 'INT', color: 'bg-blue-500' },
  constituicao: { label: 'CON', color: 'bg-green-500' },
  agilidade: { label: 'AGI', color: 'bg-yellow-500' },
  destreza: { label: 'DES', color: 'bg-purple-500' },
  carisma: { label: 'CAR', color: 'bg-pink-500' },
};

function calcMod(val) {
  const v = Number(val) || 10;
  return Math.floor((v - 10) / 2);
}

function calcHP(con, nivel) {
  const mod = calcMod(con);
  return 10 + mod * 2 + (nivel - 1) * (6 + mod);
}

const PersonagemPreviewCard = ({
  nome,
  raca,
  classe,
  atributos,
  vantagensSelecionadas,
  vantagensDisponiveis,
  racasDisponiveis,
  classesDisponiveis,
  imagem,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [collapsed, setCollapsed] = useState(false);

  const racaObj = racasDisponiveis?.find(r => String(r.id) === String(raca));
  const classeObj = classesDisponiveis?.find(c => String(c.id) === String(classe));
  const racaNome = racaObj?.nome;
  const classeNome = classeObj?.nome;

  // Parse bonuses from race/class
  const parseBonus = (raw) => {
    if (!raw) return null;
    try {
      const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return Array.isArray(obj) ? obj[0] : obj;
    } catch { return null; }
  };
  const racaBonus = parseBonus(racaObj?.bonus);
  const classeBonus = parseBonus(classeObj?.bonus);
  const temBonus = racaBonus || classeBonus;

  // Calcula bônus de atributo por chave (raça + classe)
  const getAttrBonus = (key) => {
    let bonus = 0;
    if (racaBonus && (typeof racaBonus[key] === 'string' || typeof racaBonus[key] === 'number')) {
      bonus += Number(racaBonus[key]) || 0;
    }
    if (classeBonus && (typeof classeBonus[key] === 'string' || typeof classeBonus[key] === 'number')) {
      bonus += Number(classeBonus[key]) || 0;
    }
    return bonus;
  };

  // Atributos efetivos (base + bônus)
  const atributosEfetivos = {};
  for (const key of Object.keys(ATTR_LABELS)) {
    atributosEfetivos[key] = (Number(atributos[key]) || 0) + getAttrBonus(key);
  }

  const hpEstimado = calcHP(atributosEfetivos.constituicao, 1);

  const vantagensNomes = (vantagensSelecionadas || []).map(id => {
    const v = vantagensDisponiveis?.find(vt => String(vt.id) === String(id));
    return v ? { nome: v.nome, tipo: v.tipo, custo: v.custo } : null;
  }).filter(Boolean);

  return (
    <div className={`${isLight ? 'glass-light' : 'glass'} rounded-xl border ${
      isLight ? 'border-purple-300/20' : 'border-purple-500/20'
    } overflow-hidden`}>
      {/* Header toggle (mobile) */}
      <button
        onClick={() => setCollapsed(prev => !prev)}
        className={`w-full flex items-center justify-between px-4 py-3 md:hidden cursor-pointer ${
          isLight ? 'hover:bg-slate-100/50' : 'hover:bg-slate-700/30'
        }`}
      >
        <span className={`text-sm font-fantasy font-bold ${isLight ? 'text-slate-700' : 'text-white'}`}>
          Preview
        </span>
        {collapsed ? <Eye size={16} className="text-slate-400" /> : <EyeOff size={16} className="text-slate-400" />}
      </button>

      <div className={`${collapsed ? 'hidden md:block' : ''}`}>
        {/* Avatar / Image */}
        <div className="relative w-full aspect-square max-h-48 bg-gradient-to-br from-purple-600/30 to-slate-800/50 flex items-center justify-center overflow-hidden">
          {imagem ? (
            <img src={imagem} alt={nome || 'Personagem'} className="w-full h-full object-cover" />
          ) : (
            <User size={48} className="text-purple-400/50" />
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* Name + Race/Class */}
          <div className="text-center">
            <h3 className={`text-lg font-fantasy font-bold truncate ${
              isLight ? 'text-slate-800' : 'text-white'
            }`}>
              {nome || 'Sem nome'}
            </h3>
            <p className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {racaNome || '???'} · {classeNome || '???'} · Nv 1
            </p>
          </div>

          {/* HP Estimate */}
          <div className="flex items-center gap-2">
            <Heart size={14} className="text-red-400 shrink-0" />
            <div className="flex-1 h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400 w-full" />
            </div>
            <span className="text-[11px] font-mono text-slate-300 shrink-0">{hpEstimado}/{hpEstimado}</span>
          </div>

          {/* Attributes bars */}
          <div className="space-y-1.5">
            {Object.entries(ATTR_LABELS).map(([key, cfg]) => {
              const base = Number(atributos[key]) || 0;
              const bonus = getAttrBonus(key);
              const efetivo = base + bonus;
              const pct = Math.min(100, (efetivo / 20) * 100);
              const mod = calcMod(efetivo);
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono w-7 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {cfg.label}
                  </span>
                  <div className={`flex-1 h-1.5 rounded-full ${isLight ? 'bg-slate-200' : 'bg-slate-700/50'}`}>
                    <div
                      className={`h-full rounded-full ${cfg.color} transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-mono text-right ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {efetivo || '-'}
                    {bonus !== 0 && (
                      <span className={bonus > 0 ? 'text-green-400' : 'text-red-400'}>
                        {` (${bonus > 0 ? '+' : ''}${bonus})`}
                      </span>
                    )}
                    {' '}
                    <span className={mod >= 0 ? 'text-green-400/70' : 'text-red-400/70'}>
                      {mod >= 0 ? '+' : ''}{mod}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* Bônus de Raça/Classe */}
          {temBonus && (() => {
            // Separate scalar bonuses (e.g. constituicao: "+1") from array bonuses (vantagens/desvantagens)
            const renderBonus = (bonus, prefix, colorPos, colorNeg, titleLabel) => {
              if (!bonus) return null;
              return Object.entries(bonus)
                .filter(([, v]) => typeof v === 'string' || typeof v === 'number')
                .map(([k, v]) => (
                  <span
                    key={`${prefix}-${k}`}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-modern ${
                      Number(v) >= 0 ? colorPos : colorNeg
                    }`}
                    title={titleLabel}
                  >
                    {k.replace(/_/g, ' ')} {Number(v) >= 0 ? '+' : ''}{v}
                  </span>
                ));
            };
            const racaTags = renderBonus(racaBonus, 'r', 'bg-purple-500/15 text-purple-400', 'bg-orange-500/15 text-orange-400', `Raça: ${racaNome}`);
            const classeTags = renderBonus(classeBonus, 'c', 'bg-blue-500/15 text-blue-400', 'bg-orange-500/15 text-orange-400', `Classe: ${classeNome}`);
            // Racial innate vantagens/desvantagens
            const racaVants = racaBonus?.vantagens || [];
            const racaDesvs = racaBonus?.desvantagens || [];
            const classeVants = classeBonus?.vantagens || [];
            const classeDesvs = classeBonus?.desvantagens || [];
            const allInnate = [
              ...racaVants.map(v => ({ ...v, tipo: 'vantagem', origem: racaNome })),
              ...classeVants.map(v => ({ ...v, tipo: 'vantagem', origem: classeNome })),
              ...racaDesvs.map(v => ({ ...v, tipo: 'desvantagem', origem: racaNome })),
              ...classeDesvs.map(v => ({ ...v, tipo: 'desvantagem', origem: classeNome })),
            ];
            const hasContent = (racaTags?.length > 0) || (classeTags?.length > 0) || allInnate.length > 0;
            if (!hasContent) return null;
            return (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Shield size={12} className="text-blue-400" />
                  <span className={`text-[10px] font-modern font-semibold uppercase tracking-wider ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    Bônus
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {racaTags}
                  {classeTags}
                  {allInnate.map((item, i) => (
                    <span
                      key={`innate-${i}`}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-modern ${
                        item.tipo === 'desvantagem'
                          ? 'bg-red-500/15 text-red-400'
                          : 'bg-green-500/15 text-green-400'
                      }`}
                      title={item.origem}
                    >
                      {item.nome}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Vantagens/Desvantagens */}
          {vantagensNomes.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles size={12} className="text-yellow-400" />
                <span className={`text-[10px] font-modern font-semibold uppercase tracking-wider ${
                  isLight ? 'text-slate-600' : 'text-slate-400'
                }`}>
                  Tracos
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {vantagensNomes.map((v, i) => (
                  <span
                    key={i}
                    className={`text-[10px] px-1.5 py-0.5 rounded font-modern ${
                      v.tipo === 'desvantagem'
                        ? 'bg-red-500/15 text-red-400'
                        : 'bg-green-500/15 text-green-400'
                    }`}
                  >
                    {v.nome}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonagemPreviewCard;
