import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import CatalogoModal from './CatalogoModal.jsx';

function ItemCard({ item, onRemover }) {
  if (!item) return null;
  const custo = item.custo || 0;
  const isPositive = custo > 0;

  return (
    <div
      className="wa-item-card group flex items-center gap-3 rounded-xl border px-4 py-3 backdrop-blur-[18px] transition-all duration-200"
      style={{
        background: 'var(--wa-panel-soft)',
        borderColor: 'var(--wa-border)',
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="font-modern text-sm font-semibold" style={{ color: 'var(--wa-ink)' }}>
          {item.nome}
        </div>
        <div className="font-modern text-xs truncate" style={{ color: 'var(--wa-muted)' }}>
          {item.descricao}
        </div>
      </div>

      <span
        className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-md border ${isPositive ? 'wa-forge-chip' : 'wa-teal-chip'}`}
      >
        {custo > 0 ? `${custo} pt` : `${custo} pt`}
      </span>

      <button
        onClick={() => onRemover(item.id)}
        className="wa-item-remove shrink-0 cursor-pointer rounded-md p-1 transition-all duration-200"
        style={{ color: 'rgba(244,63,94,0.4)' }}
      >
        <X size={14} />
      </button>

      <style>{`
        .wa-item-card:hover {
          transform: translateY(-1px);
          border-color: color-mix(in srgb, var(--wa-accent) 35%, var(--wa-border)) !important;
        }
        .wa-item-remove:hover {
          color: var(--wa-danger) !important;
          background: rgba(244, 63, 94, 0.1);
          box-shadow: 0 0 8px rgba(244, 63, 94, 0.2);
        }
      `}</style>
    </div>
  );
}

export default function VantagensDesvantagensSection({
  vantagensIds, desvantagensIds,
  vantagensCatalogo, desvantagensCatalogo,
  adicionarVantagem, removerVantagem,
  adicionarDesvantagem, removerDesvantagem,
  pontosVantagens, pontosDesvantagens, pontosRestantes,
}) {
  const [modalAberto, setModalAberto] = useState(null);

  const vantagensSelecionadas = vantagensIds.map(id => vantagensCatalogo.find(v => String(v.id) === id)).filter(Boolean);
  const desvantagensSelecionadas = desvantagensIds.map(id => desvantagensCatalogo.find(d => String(d.id) === id)).filter(Boolean);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 max-[900px]:grid-cols-1 wa-stage-enter wa-stagger-2">
        {/* Vantagens */}
        <section
          className="wa-panel rounded-2xl border p-5 backdrop-blur-[18px]"
          style={{ background: 'var(--wa-panel)', borderColor: 'var(--wa-border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="font-fantasy text-sm font-bold uppercase tracking-wider"
              style={{ color: 'var(--wa-ember)' }}
            >
              Vantagens
            </h3>
            <span className="wa-forge-chip text-xs font-bold px-2.5 py-1 rounded-md border">
              {pontosVantagens} pts
            </span>
          </div>

          <div className="space-y-2">
            {vantagensSelecionadas.map(v => (
              <ItemCard key={v.id} item={v} onRemover={removerVantagem} />
            ))}

            <button
              onClick={() => setModalAberto('vantagens')}
              className="wa-add-btn w-full rounded-xl border border-dashed p-3 text-center text-sm cursor-pointer transition-all duration-200 font-modern"
              style={{ borderColor: 'color-mix(in srgb, var(--wa-accent) 40%, transparent)', color: 'var(--wa-muted)' }}
            >
              <Plus size={14} className="inline mr-1" /> Adicionar vantagem
            </button>
          </div>
        </section>

        {/* Desvantagens */}
        <section
          className="wa-panel rounded-2xl border p-5 backdrop-blur-[18px]"
          style={{ background: 'var(--wa-panel)', borderColor: 'var(--wa-border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="font-fantasy text-sm font-bold uppercase tracking-wider"
              style={{ color: 'var(--wa-teal)' }}
            >
              Desvantagens
            </h3>
            <span className="wa-teal-chip text-xs font-bold px-2.5 py-1 rounded-md border">
              {pontosDesvantagens} pt
            </span>
          </div>

          <div className="space-y-2">
            {desvantagensSelecionadas.map(d => (
              <ItemCard key={d.id} item={d} onRemover={removerDesvantagem} />
            ))}

            <button
              onClick={() => setModalAberto('desvantagens')}
              className="wa-add-btn w-full rounded-xl border border-dashed p-3 text-center text-sm cursor-pointer transition-all duration-200 font-modern"
              style={{ borderColor: 'color-mix(in srgb, var(--wa-accent) 40%, transparent)', color: 'var(--wa-muted)' }}
            >
              <Plus size={14} className="inline mr-1" /> Adicionar desvantagem
            </button>
          </div>
        </section>
      </div>

      <style>{`
        .wa-add-btn:hover {
          border-color: var(--wa-accent) !important;
          color: var(--wa-accent) !important;
          background: color-mix(in srgb, var(--wa-accent) 6%, transparent);
          animation: wa-addPulse 1.5s ease infinite;
        }
        @keyframes wa-addPulse {
          0%, 100% { box-shadow: none; }
          50% { box-shadow: 0 0 12px rgba(139, 92, 246, 0.12); }
        }
      `}</style>

      <CatalogoModal
        aberto={modalAberto === 'vantagens'}
        onFechar={() => setModalAberto(null)}
        itens={vantagensCatalogo}
        selecionados={vantagensIds}
        onAdicionar={adicionarVantagem}
        titulo="Catalogo de Vantagens"
        pontosRestantes={pontosRestantes}
      />
      <CatalogoModal
        aberto={modalAberto === 'desvantagens'}
        onFechar={() => setModalAberto(null)}
        itens={desvantagensCatalogo}
        selecionados={desvantagensIds}
        onAdicionar={adicionarDesvantagem}
        titulo="Catalogo de Desvantagens"
        pontosRestantes={999}
      />
    </>
  );
}
