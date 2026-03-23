import { useState, useMemo, useEffect } from 'react';
import { X, Search } from 'lucide-react';

const TIPO_LABELS = {
  ofensiva: 'Ofensiva', defensiva: 'Defensiva', magico: 'Magica',
  passiva: 'Passiva', movimento: 'Movimento', social: 'Social',
  comportamental: 'Comportamental', sobrenatural: 'Sobrenatural',
  mental: 'Mental', fisica: 'Fisica',
};

export default function CatalogoModal({ aberto, onFechar, itens, selecionados, onAdicionar, titulo, pontosRestantes }) {
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (aberto) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [aberto]);

  const tipos = useMemo(() => {
    const set = new Set();
    itens.forEach(i => {
      const t = Array.isArray(i.tipo) ? i.tipo : [i.tipo];
      t.forEach(x => x && set.add(x));
    });
    return [...set].sort();
  }, [itens]);

  const filtrados = useMemo(() => {
    return itens.filter(i => {
      if (selecionados.includes(String(i.id))) return false;
      if (busca && !i.nome.toLowerCase().includes(busca.toLowerCase())) return false;
      if (filtroTipo) {
        const t = Array.isArray(i.tipo) ? i.tipo : [i.tipo];
        if (!t.includes(filtroTipo)) return false;
      }
      return true;
    });
  }, [itens, selecionados, busca, filtroTipo]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          background: 'rgba(0, 0, 0, 0.70)',
          backdropFilter: 'blur(4px)',
          opacity: visible ? 1 : 0,
        }}
        onClick={onFechar}
      />

      {/* Drawer panel */}
      <div
        className="wa-catalogo-drawer relative w-full max-w-md flex flex-col backdrop-blur-[24px] border-l transition-transform duration-300 ease-out"
        style={{
          background: 'linear-gradient(180deg, color-mix(in srgb, var(--wa-panel-strong) 95%, transparent), color-mix(in srgb, var(--wa-panel) 92%, transparent))',
          borderColor: 'var(--wa-border)',
          boxShadow: 'var(--wa-glow), -8px 0 32px rgba(0, 0, 0, 0.4)',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5 border-b"
          style={{ borderColor: 'var(--wa-border)' }}
        >
          <h3
            className="font-fantasy text-base font-bold uppercase tracking-wider"
            style={{ color: 'var(--wa-accent-bright)' }}
          >
            {titulo}
          </h3>
          <button
            onClick={onFechar}
            className="wa-catalogo-close cursor-pointer p-1.5 rounded-lg transition-all duration-200"
            style={{ color: 'var(--wa-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 pb-2">
          <div
            className="wa-catalogo-search flex items-center gap-2 rounded-xl border px-3 py-2.5 backdrop-blur-[18px] transition-all duration-200"
            style={{
              background: 'var(--wa-panel-soft)',
              borderColor: 'var(--wa-border)',
            }}
          >
            <Search size={14} style={{ color: 'var(--wa-muted)' }} />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar..."
              className="wa-catalogo-input flex-1 bg-transparent outline-none text-sm font-modern"
              style={{ color: 'var(--wa-ink)' }}
            />
          </div>

          {/* Filter chips */}
          <div className="flex gap-1.5 mt-3 flex-wrap">
            <button
              onClick={() => setFiltroTipo(null)}
              className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer border transition-all duration-200 ${!filtroTipo ? 'wa-violet-chip' : ''}`}
              style={filtroTipo ? {
                background: 'var(--wa-panel-soft)',
                borderColor: 'var(--wa-border)',
                color: 'var(--wa-muted)',
              } : undefined}
            >
              Todos
            </button>
            {tipos.map(t => (
              <button
                key={t}
                onClick={() => setFiltroTipo(t)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer border transition-all duration-200 ${filtroTipo === t ? 'wa-violet-chip' : ''}`}
                style={filtroTipo !== t ? {
                  background: 'var(--wa-panel-soft)',
                  borderColor: 'var(--wa-border)',
                  color: 'var(--wa-muted)',
                } : undefined}
              >
                {TIPO_LABELS[t] || t}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 pt-2 space-y-2">
          {filtrados.map(item => {
            const custoNum = item.custo || 0;
            const semPontos = custoNum > 0 && custoNum > pontosRestantes;
            return (
              <button
                key={item.id}
                disabled={semPontos}
                onClick={() => { onAdicionar(item.id); onFechar(); }}
                className="wa-catalogo-item wa-choice-card w-full text-left rounded-xl border p-3.5 cursor-pointer backdrop-blur-[18px] disabled:cursor-not-allowed"
                style={{
                  background: 'var(--wa-panel)',
                  borderColor: 'var(--wa-border)',
                  ...(semPontos ? { opacity: 0.3, filter: 'grayscale(1)' } : {}),
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold font-modern" style={{ color: 'var(--wa-ink)' }}>
                    {item.nome}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-md border ${custoNum > 0 ? 'wa-forge-chip' : 'wa-teal-chip'}`}
                  >
                    {custoNum > 0 ? `${custoNum} pt` : `${custoNum} pt`}
                  </span>
                </div>
                <p className="text-xs mt-1.5 line-clamp-2 font-modern" style={{ color: 'var(--wa-muted)' }}>
                  {item.descricao}
                </p>
              </button>
            );
          })}
          {filtrados.length === 0 && (
            <p className="text-sm text-center py-8 font-modern" style={{ color: 'var(--wa-muted)' }}>
              Nenhum item encontrado
            </p>
          )}
        </div>
      </div>

      <style>{`
        .wa-catalogo-close:hover {
          color: var(--wa-ink) !important;
          background: var(--wa-panel-soft);
        }
        .wa-catalogo-input::placeholder { color: var(--wa-muted); }
        .wa-catalogo-search:focus-within {
          border-color: var(--wa-accent) !important;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.15);
        }
        .wa-catalogo-item:not(:disabled):hover {
          transform: translateY(-2px);
          border-color: color-mix(in srgb, var(--wa-accent) 50%, var(--wa-border)) !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), 0 0 12px rgba(139, 92, 246, 0.1);
        }
      `}</style>
    </div>
  );
}
