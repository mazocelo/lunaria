import { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { useTheme } from '../../../../../contexts/theme.jsx';

const TIPO_CHIPS = [
  { key: 'consumivel', label: 'Consumiveis', emoji: '🧪' },
  { key: 'pergaminho', label: 'Pergaminhos', emoji: '📜' },
  { key: 'arma',       label: 'Armas',       emoji: '⚔️' },
  { key: 'armadura',   label: 'Armaduras',   emoji: '🛡️' },
  { key: 'acessorio',  label: 'Acessorios',  emoji: '💍' },
];

const RARIDADE_COR = {
  comum:    'var(--wa-muted)',
  incomum:  'var(--wa-teal)',
  raro:     'var(--wa-accent-bright, var(--wa-accent))',
  lendario: 'var(--wa-forge-gold)',
};

export default function EquipamentosTresDetSection({
  itensCatalogo,
  equipamentosIds,
  adicionarEquipamento,
  removerEquipamento,
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState(null);

  const itensFiltrados = useMemo(() => {
    return itensCatalogo.filter(item => {
      if (busca && !item.nome.toLowerCase().includes(busca.toLowerCase())) return false;
      if (filtroTipo && item.tipo !== filtroTipo) return false;
      return true;
    });
  }, [itensCatalogo, busca, filtroTipo]);

  const selecionadosCount = equipamentosIds.length;

  const handleToggle = (id) => {
    const sid = String(id);
    if (equipamentosIds.includes(sid)) {
      removerEquipamento(sid);
    } else {
      adicionarEquipamento(sid);
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
          Equipamentos
        </h3>
        <span className="wa-teal-chip text-xs font-semibold px-2.5 py-1 rounded-lg">
          {selecionadosCount} selecionado{selecionadosCount !== 1 ? 's' : ''}
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
        className="wa-equip-search flex items-center gap-2 rounded-xl border px-3 py-2 mb-2 transition-all duration-200"
        style={{
          background: 'var(--wa-panel-soft)',
          borderColor: 'var(--wa-border)',
        }}
      >
        <Search size={14} style={{ color: 'var(--wa-muted)' }} />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar equipamento..."
          className="wa-equip-input flex-1 bg-transparent outline-none text-sm font-modern"
          style={{ color: 'var(--wa-ink)' }}
        />
      </div>

      {/* Type filter chips */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        <button
          onClick={() => setFiltroTipo(null)}
          className="px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer border transition-all duration-200"
          style={filtroTipo === null
            ? { background: 'var(--wa-teal)', borderColor: 'var(--wa-teal)', color: '#fff' }
            : { background: 'var(--wa-panel-soft)', borderColor: 'var(--wa-border)', color: 'var(--wa-muted)' }
          }
        >
          Todos
        </button>
        {TIPO_CHIPS.map(tipo => {
          const active = filtroTipo === tipo.key;
          return (
            <button
              key={tipo.key}
              onClick={() => setFiltroTipo(active ? null : tipo.key)}
              className="px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer border transition-all duration-200"
              style={active
                ? { background: 'var(--wa-teal)', borderColor: 'var(--wa-teal)', color: '#fff' }
                : { background: 'var(--wa-panel-soft)', borderColor: 'var(--wa-border)', color: 'var(--wa-muted)' }
              }
            >
              {tipo.emoji} {tipo.label}
            </button>
          );
        })}
      </div>

      {/* Item cards grid */}
      <div className="grid grid-cols-2 gap-2 max-[768px]:grid-cols-1">
        {itensFiltrados.map(item => {
          const sid = String(item.id);
          const selecionado = equipamentosIds.includes(sid);
          const corRaridade = RARIDADE_COR[item.raridade] || 'var(--wa-muted)';

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleToggle(item.id)}
              className="wa-equip-card relative text-left rounded-xl border p-3 transition-all duration-200 cursor-pointer"
              style={{
                background: selecionado
                  ? isLight
                    ? 'rgba(45,212,191,0.08)'
                    : 'rgba(45,212,191,0.06)'
                  : 'var(--wa-panel-soft)',
                borderColor: selecionado ? 'var(--wa-teal)' : 'var(--wa-border)',
                boxShadow: selecionado ? '0 0 12px rgba(45,212,191,0.15)' : 'none',
              }}
            >
              {/* Checkmark */}
              {selecionado && (
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
                {item.nome}
              </div>

              {/* Type */}
              <div
                className="font-modern text-[10px] font-semibold uppercase tracking-wider mt-0.5"
                style={{ color: 'var(--wa-accent-bright, var(--wa-accent))' }}
              >
                {item.tipo}
              </div>

              {/* Cost chip + raridade */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {item.custo_pe > 0 && (
                  <span className="wa-teal-chip text-[10px] font-bold px-1.5 py-0.5 rounded-md border">
                    {item.custo_pe} PE
                  </span>
                )}
                {item.raridade && (
                  <span
                    className="text-[10px] font-bold uppercase"
                    style={{ color: corRaridade }}
                  >
                    {item.raridade}
                  </span>
                )}
              </div>

              {/* Description */}
              <p
                className="text-[11px] font-modern mt-1.5 line-clamp-2"
                style={{ color: 'var(--wa-muted)' }}
              >
                {item.descricao && item.descricao.length > 80
                  ? item.descricao.slice(0, 80) + '...'
                  : item.descricao}
              </p>
            </button>
          );
        })}
      </div>

      {itensFiltrados.length === 0 && (
        <p className="text-sm text-center py-6 font-modern" style={{ color: 'var(--wa-muted)' }}>
          Nenhum equipamento encontrado
        </p>
      )}

      <style>{`
        .wa-equip-input::placeholder { color: var(--wa-muted); }
        .wa-equip-search:focus-within {
          border-color: var(--wa-teal) !important;
          box-shadow: 0 0 0 3px rgba(45, 212, 191, 0.15);
        }
        .wa-equip-card:hover {
          transform: translateY(-2px);
          border-color: color-mix(in srgb, var(--wa-teal) 50%, var(--wa-border)) !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2), 0 0 10px rgba(45, 212, 191, 0.08);
        }
      `}</style>
    </section>
  );
}
