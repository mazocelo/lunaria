import { useState, useMemo } from 'react';
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
      <div className="absolute inset-0 bg-black/60" onClick={onFechar} />
      <div
        className="relative w-full max-w-md flex flex-col backdrop-blur-[24px]"
        style={{ background: 'var(--wa-panel-strong)', boxShadow: 'var(--wa-shadow)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--wa-border)' }}
        >
          <h3 className="font-fantasy text-lg font-bold" style={{ color: 'var(--wa-ink)' }}>{titulo}</h3>
          <button
            onClick={onFechar}
            className="cursor-pointer p-1 transition-colors duration-200"
            style={{ color: 'var(--wa-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--wa-ink)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--wa-muted)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 pb-2">
          <div
            className="flex items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-200 focus-within:ring-1"
            style={{
              background: 'var(--wa-panel-soft)',
              borderColor: 'var(--wa-border)',
              '--tw-ring-color': 'var(--wa-accent)',
            }}
          >
            <Search size={14} style={{ color: 'var(--wa-muted)' }} />
            <input
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar..."
              className="flex-1 bg-transparent outline-none text-sm font-modern"
              style={{ color: 'var(--wa-ink)' }}
            />
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            <button
              onClick={() => setFiltroTipo(null)}
              className="px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer font-modern transition-colors duration-200"
              style={{
                background: !filtroTipo ? 'var(--wa-accent)' : 'var(--wa-panel-soft)',
                color: !filtroTipo ? '#ffffff' : 'var(--wa-muted)',
              }}
            >
              Todos
            </button>
            {tipos.map(t => (
              <button
                key={t}
                onClick={() => setFiltroTipo(t)}
                className="px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer font-modern transition-colors duration-200"
                style={{
                  background: filtroTipo === t ? 'var(--wa-accent)' : 'var(--wa-panel-soft)',
                  color: filtroTipo === t ? '#ffffff' : 'var(--wa-muted)',
                }}
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
                className="w-full text-left rounded-xl border p-3 transition-all duration-200 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed hover:-translate-y-0.5"
                style={{
                  background: 'var(--wa-panel-soft)',
                  borderColor: 'var(--wa-border)',
                }}
                onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = 'var(--wa-accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--wa-border)'; }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-modern text-sm font-semibold" style={{ color: 'var(--wa-ink)' }}>{item.nome}</span>
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded"
                    style={{
                      background: custoNum > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(45,212,191,0.1)',
                      color: custoNum > 0 ? 'var(--wa-ember)' : 'var(--wa-teal)',
                    }}
                  >
                    {custoNum > 0 ? `${custoNum} pt` : `${custoNum} pt`}
                  </span>
                </div>
                <p className="font-modern text-xs mt-1 line-clamp-2" style={{ color: 'var(--wa-muted)' }}>{item.descricao}</p>
              </button>
            );
          })}
          {filtrados.length === 0 && (
            <p className="font-modern text-sm text-center py-8" style={{ color: 'var(--wa-muted)' }}>Nenhum item encontrado</p>
          )}
        </div>
      </div>
    </div>
  );
}
