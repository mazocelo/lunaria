// src/Pages/Personagem/Wizard/stages/CatalogStage.tsx
import { useMemo, useState, type CSSProperties } from 'react';
import { Check, ExternalLink, Search, Sparkles } from 'lucide-react';
import { CatalogCard, EmptyState } from '../../../../components/shared';
import '../wizard-motion.css';

export interface CatalogItem {
  id: number | string;
  nome: string;
  descricao?: string | null;
  imagem?: string | null;
  custo?: number | null;
  detalhe?: string | null;
}

export interface CatalogStageProps {
  itens: CatalogItem[];
  selecionados: Array<number | string>;
  modo: 'unica' | 'multipla';
  sugeridos?: Array<number | string>;
  enviando: boolean;
  onSelecionar: (item: CatalogItem) => void;
  catalogoHref?: string;
  rotuloBusca: string;
  isLight: boolean;
}

/** Cartas por lote. Com 40+ cartas de imagem com blur o navegador trava (visto na página Raças com 48 por página). */
const POR_LOTE = 12;

const normalizar = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const CatalogStage = ({ itens, selecionados, modo, sugeridos = [], enviando, onSelecionar, catalogoHref, rotuloBusca, isLight }: CatalogStageProps) => {
  const [busca, setBusca] = useState('');
  const [limite, setLimite] = useState(POR_LOTE);
  const visiveis = useMemo(() => {
    const q = normalizar(busca.trim());
    return q ? itens.filter((i) => normalizar(i.nome).includes(q)) : itens;
  }, [itens, busca]);
  const ordenados = useMemo(() => {
    const peso = (id: number | string) => selecionados.some((s) => String(s) === String(id)) ? 0 : sugeridos.some((s) => String(s) === String(id)) ? 1 : 2;
    return visiveis.map((item, i) => ({ item, i })).sort((a, b) => peso(a.item.id) - peso(b.item.id) || a.i - b.i).map(({ item }) => item);
  }, [visiveis, selecionados, sugeridos]);
  const exibidos = ordenados.slice(0, limite);
  const estaSelecionado = (id: number | string) => selecionados.some((s) => String(s) === String(id));
  const foiSugerido = (id: number | string) => sugeridos.some((s) => String(s) === String(id));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className={`flex flex-1 items-center gap-2 rounded-xl border px-3 py-2 ${isLight ? 'border-slate-300 bg-white' : 'border-slate-700 bg-slate-950/40'}`}>
          <Search size={16} className={isLight ? 'text-slate-400' : 'text-slate-500'} />
          <input id="catalog-busca" type="search" value={busca} onChange={(e) => { setBusca(e.target.value); setLimite(POR_LOTE); }} placeholder={rotuloBusca} className={`w-full bg-transparent font-modern text-sm outline-none ${isLight ? 'text-slate-800' : 'text-white'}`} />
        </label>
        {catalogoHref && (
          <a href={catalogoHref} target="_blank" rel="noreferrer" className={`inline-flex items-center gap-1.5 font-modern text-sm font-semibold text-[var(--primary)]`}>
            Ver catálogo completo <ExternalLink size={14} />
          </a>
        )}
        {modo === 'multipla' && (
          <span className={`font-modern text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{selecionados.length} selecionado(s)</span>
        )}
      </div>

      {visiveis.length === 0 ? (
        <EmptyState title="Nenhum item com esse nome" description="Tente outro termo ou limpe a busca." />
      ) : (
        <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 ${enviando ? 'pointer-events-none opacity-70' : ''}`} aria-busy={enviando ? 'true' : 'false'}>
          {exibidos.map((item, i) => {
            const selecionada = estaSelecionado(item.id);
            const badge = typeof item.custo === 'number'
              ? <span className={`rounded-full px-2 py-0.5 font-modern text-[11px] font-semibold tabular-nums ${item.custo === 0 ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-400/20 text-amber-500'}`}>{item.custo === 0 ? 'Gratuita' : `${item.custo} pts`}</span>
              : undefined;
            return (
              <div key={String(item.id)} data-item={String(item.id)} data-selecionada={selecionada ? 'true' : 'false'} className="wz-card-in wz-select rounded-2xl" style={{ '--wz-i': Math.min(i, 11) } as CSSProperties}>
                <CatalogCard
                  image={item.imagem || undefined}
                  icon={item.imagem ? undefined : Sparkles}
                  title={<span className="inline-flex items-center gap-2">{item.nome}{selecionada ? <Check size={14} className="text-[var(--primary)]" /> : null}</span>}
                  subtitle={item.detalhe ?? undefined}
                  headerBadge={badge}
                  onClick={() => { if (!enviando) onSelecionar(item); }}
                  className="h-full"
                >
                  {foiSugerido(item.id) && (
                    <span className={`mb-1 inline-flex items-center gap-1 font-modern text-[11px] font-semibold text-[var(--primary)]`}><Sparkles size={11} /> Sugestão do Mestre</span>
                  )}
                  {item.descricao ? <p className={`line-clamp-3 font-modern text-xs ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{item.descricao}</p> : null}
                </CatalogCard>
              </div>
            );
          })}
        </div>
      )}
      {ordenados.length > exibidos.length && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <span className={`font-modern text-xs tabular-nums ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{exibidos.length} de {ordenados.length}</span>
          <button type="button" onClick={() => setLimite((n) => n + POR_LOTE)} className="btn-rpg-secondary cursor-pointer">Mostrar mais</button>
        </div>
      )}
    </div>
  );
};

export default CatalogStage;
