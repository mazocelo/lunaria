import { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { useTheme } from '../../../../../contexts/theme.jsx';
import { ELEMENT_COLORS } from '../../../../../constants/tresdetElements.js';

const ELEMENT_CHIPS = [
  { key: 'fogo',   label: 'Fogo',   emoji: '🔥' },
  { key: 'agua',   label: 'Agua',   emoji: '💧' },
  { key: 'terra',  label: 'Terra',  emoji: '🍃' },
  { key: 'ar',     label: 'Ar',     emoji: '🌀' },
  { key: 'luz',    label: 'Luz',    emoji: '☀️' },
  { key: 'trevas', label: 'Trevas', emoji: '🌑' },
];

function FocusReqChips({ focusRequisito, isLight }) {
  if (!focusRequisito || !Array.isArray(focusRequisito) || focusRequisito.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {focusRequisito.map((req, i) => {
        const key = Object.keys(req)[0];
        const val = req[key];
        const colors = ELEMENT_COLORS[key];
        if (!colors) return null;
        return (
          <span
            key={i}
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md border"
            style={{
              color: isLight ? colors.textLight : colors.text,
              borderColor: colors.border,
              background: isLight ? colors.bgLight : colors.bg,
            }}
          >
            {key} {val}
          </span>
        );
      })}
    </div>
  );
}

function MissingReqText({ focusRequisito, magiasDisponiveis, magiaId }) {
  if (!focusRequisito || !Array.isArray(focusRequisito)) return null;
  const isAvailable = magiasDisponiveis.some(m => String(m.id) === String(magiaId));
  if (isAvailable) return null;

  const missing = focusRequisito.map(req => {
    const key = Object.keys(req)[0];
    return `${key} ${req[key]}`;
  });

  return (
    <span className="text-[10px] font-modern italic block mt-1" style={{ color: 'var(--wa-danger, #f43f5e)' }}>
      Requer: {missing.join(', ')}
    </span>
  );
}

export default function GrimorioTresDetSection({
  magiasDisponiveis,
  magiasCatalogo,
  magiasIds,
  adicionarMagia,
  removerMagia,
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [busca, setBusca] = useState('');
  const [filtroElemento, setFiltroElemento] = useState(null);

  const disponiveisSet = useMemo(
    () => new Set(magiasDisponiveis.map(m => String(m.id))),
    [magiasDisponiveis],
  );

  const magiasFiltradas = useMemo(() => {
    return magiasCatalogo.filter(m => {
      if (busca && !m.nome.toLowerCase().includes(busca.toLowerCase())) return false;
      if (filtroElemento) {
        if (!m.focus_requisito || !Array.isArray(m.focus_requisito)) return false;
        const matchEl = m.focus_requisito.some(req => Object.keys(req)[0] === filtroElemento);
        if (!matchEl) return false;
      }
      return true;
    });
  }, [magiasCatalogo, busca, filtroElemento]);

  const selecionadasCount = magiasIds.length;

  const handleToggle = (id) => {
    const sid = String(id);
    if (!disponiveisSet.has(sid)) return;
    if (magiasIds.includes(sid)) {
      removerMagia(sid);
    } else {
      adicionarMagia(sid);
    }
  };

  return (
    <section
      className="relative rounded-2xl p-3 backdrop-blur-[18px]"
      style={{
        background: isLight
          ? 'linear-gradient(180deg, rgba(255,253,255,0.92), rgba(232,228,245,0.70))'
          : 'linear-gradient(180deg, var(--wa-panel-strong), var(--wa-panel))',
        border: '1px solid var(--wa-border)',
        boxShadow: 'var(--wa-glow)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3
          className="font-fantasy text-base font-bold uppercase tracking-widest"
          style={{ color: 'var(--wa-teal)' }}
        >
          Grimorio
        </h3>
        <span className="wa-teal-chip text-xs font-semibold px-2.5 py-1 rounded-lg">
          {selecionadasCount} selecionada{selecionadasCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Decorative line */}
      <div
        className="mb-2 rounded-full"
        style={{
          height: 2,
          width: 48,
          background: 'linear-gradient(90deg, var(--wa-teal), transparent)',
          opacity: 0.5,
        }}
      />

      {/* Search */}
      <div
        className="wa-grimorio-search flex items-center gap-2 rounded-xl border px-3 py-2 mb-2 transition-all duration-200"
        style={{
          background: 'var(--wa-panel-soft)',
          borderColor: 'var(--wa-border)',
        }}
      >
        <Search size={14} style={{ color: 'var(--wa-muted)' }} />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar magia..."
          className="wa-grimorio-input flex-1 bg-transparent outline-none text-sm font-modern"
          style={{ color: 'var(--wa-ink)' }}
        />
      </div>

      {/* Element filter chips */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        <button
          onClick={() => setFiltroElemento(null)}
          className="px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer border transition-all duration-200"
          style={filtroElemento === null
            ? { background: 'var(--wa-teal)', borderColor: 'var(--wa-teal)', color: '#fff' }
            : { background: 'var(--wa-panel-soft)', borderColor: 'var(--wa-border)', color: 'var(--wa-muted)' }
          }
        >
          Todos
        </button>
        {ELEMENT_CHIPS.map(el => {
          const active = filtroElemento === el.key;
          const colors = ELEMENT_COLORS[el.key];
          return (
            <button
              key={el.key}
              onClick={() => setFiltroElemento(active ? null : el.key)}
              className="px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer border transition-all duration-200"
              style={active
                ? { background: colors.border, borderColor: colors.border, color: '#fff' }
                : { background: 'var(--wa-panel-soft)', borderColor: 'var(--wa-border)', color: 'var(--wa-muted)' }
              }
            >
              {el.emoji} {el.label}
            </button>
          );
        })}
      </div>

      {/* Spell cards grid */}
      <div className="grid grid-cols-2 gap-2 max-[768px]:grid-cols-1">
        {magiasFiltradas.map(magia => {
          const sid = String(magia.id);
          const selecionada = magiasIds.includes(sid);
          const disponivel = disponiveisSet.has(sid);

          return (
            <button
              key={magia.id}
              type="button"
              disabled={!disponivel}
              onClick={() => handleToggle(magia.id)}
              className="wa-grimorio-card relative text-left rounded-xl border p-3 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
              style={{
                background: selecionada
                  ? isLight
                    ? 'rgba(45,212,191,0.08)'
                    : 'rgba(45,212,191,0.06)'
                  : 'var(--wa-panel-soft)',
                borderColor: selecionada ? 'var(--wa-teal)' : 'var(--wa-border)',
                boxShadow: selecionada ? '0 0 12px rgba(45,212,191,0.15)' : 'none',
                opacity: disponivel ? 1 : 0.35,
              }}
            >
              {/* Checkmark */}
              {selecionada && (
                <div
                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--wa-teal)', color: '#fff' }}
                >
                  <Check size={12} strokeWidth={3} />
                </div>
              )}

              {/* Name */}
              <div
                className="font-fantasy text-sm font-bold pr-6"
                style={{ color: 'var(--wa-ink)' }}
              >
                {magia.nome}
              </div>

              {/* School */}
              <div
                className="font-modern text-[10px] font-semibold uppercase tracking-wider mt-0.5"
                style={{ color: 'var(--wa-accent-bright, var(--wa-accent))' }}
              >
                {magia.escola}
              </div>

              {/* Cost chip + alcance/duracao */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span
                  className="wa-teal-chip text-[10px] font-bold px-1.5 py-0.5 rounded-md border"
                >
                  {magia.custo_pm} PM
                </span>
                <span className="text-[10px] font-modern" style={{ color: 'var(--wa-muted)' }}>
                  {magia.alcance} · {magia.duracao}
                </span>
              </div>

              {/* Description */}
              <p
                className="text-[11px] font-modern mt-1.5 line-clamp-2"
                style={{ color: 'var(--wa-muted)' }}
              >
                {magia.descricao && magia.descricao.length > 80
                  ? magia.descricao.slice(0, 80) + '...'
                  : magia.descricao}
              </p>

              {/* Focus requirement chips */}
              <FocusReqChips focusRequisito={magia.focus_requisito} isLight={isLight} />

              {/* Missing requirements text for disabled spells */}
              {!disponivel && (
                <MissingReqText
                  focusRequisito={magia.focus_requisito}
                  magiasDisponiveis={magiasDisponiveis}
                  magiaId={magia.id}
                />
              )}
            </button>
          );
        })}
      </div>

      {magiasFiltradas.length === 0 && (
        <p className="text-sm text-center py-6 font-modern" style={{ color: 'var(--wa-muted)' }}>
          Nenhuma magia encontrada
        </p>
      )}

      <style>{`
        .wa-grimorio-input::placeholder { color: var(--wa-muted); }
        .wa-grimorio-search:focus-within {
          border-color: var(--wa-teal) !important;
          box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.15);
        }
        .wa-grimorio-card:not(:disabled):hover {
          transform: translateY(-2px);
          border-color: color-mix(in srgb, var(--wa-teal) 50%, var(--wa-border)) !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), 0 0 10px rgba(45, 212, 191, 0.08);
        }
      `}</style>
    </section>
  );
}
