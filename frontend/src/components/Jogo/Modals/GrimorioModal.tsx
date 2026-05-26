import { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';

interface ElementColorEntry {
  border: string;
  bg: string;
  text: string;
}

const ELEMENT_COLORS: Record<string, ElementColorEntry> = {
  fogo:   { border: '#f97316', bg: 'rgba(124,45,18,0.25)', text: '#fb923c' },
  agua:   { border: '#3b82f6', bg: 'rgba(30,58,138,0.25)', text: '#60a5fa' },
  terra:  { border: '#10b981', bg: 'rgba(6,78,59,0.25)',   text: '#34d399' },
  ar:     { border: '#38bdf8', bg: 'rgba(12,74,110,0.25)', text: '#7dd3fc' },
  luz:    { border: '#fbbf24', bg: 'rgba(120,53,15,0.25)', text: '#fcd34d' },
  trevas: { border: '#a855f7', bg: 'rgba(88,28,135,0.25)', text: '#c084fc' },
};

interface ElementChipDef {
  key: string;
  label: string;
  color: string;
}

const ELEMENT_CHIPS: ElementChipDef[] = [
  { key: 'fogo',   label: 'Fogo',   color: '#f97316' },
  { key: 'agua',   label: 'Agua',   color: '#3b82f6' },
  { key: 'terra',  label: 'Terra',  color: '#10b981' },
  { key: 'ar',     label: 'Ar',     color: '#38bdf8' },
  { key: 'luz',    label: 'Luz',    color: '#fbbf24' },
  { key: 'trevas', label: 'Trevas', color: '#a855f7' },
];

type FocusRequisito = Record<string, number | string>;

interface MagiaPayload {
  id?: string | number;
  nome?: string;
  descricao?: string;
  efeito?: string;
  custo_pm?: number | string;
  custo_mana?: number | string;
  focus_requisito?: FocusRequisito[];
  alcance?: string;
  duracao?: string;
  classes?: string[];
  conjuracao?: string;
  componentes?: string[];
  escola_magia?: string;
  imagem?: string;
  usa_concentracao?: boolean;
  [key: string]: unknown;
}

function FocusChips({ focusRequisito }: { focusRequisito?: FocusRequisito[] }) {
  if (!Array.isArray(focusRequisito) || focusRequisito.length === 0) return null;

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
            style={{ color: colors.text, borderColor: colors.border, background: colors.bg }}
          >
            {key} {val}
          </span>
        );
      })}
    </div>
  );
}

function parseCustoPm(magia: MagiaPayload): number {
  const raw = magia.custo_pm ?? magia.custo_mana ?? 0;
  if (typeof raw === 'number') return raw;
  const match = String(raw).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

interface GrimorioModalProps {
  isOpen: boolean;
  onClose: () => void;
  magias?: MagiaPayload[];
  manaAtual?: number;
  manaMax?: number;
  combateAtivo?: boolean;
  onUsarMagia?: (magia: MagiaPayload) => void;
  sistema?: string;
}

const GrimorioModal = ({
  isOpen,
  onClose,
  magias,
  manaAtual = 0,
  manaMax = 0,
  combateAtivo,
  onUsarMagia,
  sistema,
}: GrimorioModalProps) => {
  const [busca, setBusca] = useState('');
  const [filtroElemento, setFiltroElemento] = useState<string | null>(null);

  if (!isOpen) return null;

  const listaMagias = Array.isArray(magias) ? magias : [];

  const magiasFiltradas = useMemo(() => {
    return listaMagias.filter(m => {
      if (busca && !m.nome?.toLowerCase().includes(busca.toLowerCase())) return false;
      if (filtroElemento) {
        if (!Array.isArray(m.focus_requisito)) return false;
        const match = m.focus_requisito.some(req => Object.keys(req)[0] === filtroElemento);
        if (!match) return false;
      }
      return true;
    });
  }, [listaMagias, busca, filtroElemento]);

  const manaPercent = manaMax > 0 ? Math.min(100, (manaAtual / manaMax) * 100) : 0;
  const isTresDet = sistema === 'tresdet';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto rounded-3xl border border-white/[0.08] game-glass-solid shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-purple-200/70">Magias</p>
            <h2 className="text-2xl font-fantasy text-white">Grimorio</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full game-glass-subtle hover:bg-purple-500/20 border border-white/[0.08] text-white transition-all"
            aria-label="Fechar grimorio"
            title="Fechar grimorio"
          >
            <X size={16} />
          </button>
        </div>

        {/* PM Bar — only for 3D&T */}
        {isTresDet && (
          <div className="game-glass border border-cyan-500/20 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wide">PM</span>
              <span className="text-sm font-bold text-cyan-200">{manaAtual} / {manaMax}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-800/60 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${manaPercent}%`,
                  background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
                }}
              />
            </div>
          </div>
        )}

        {/* Search + Element Filters */}
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300/50" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar magia..."
              className="w-full pl-9 pr-3 py-2 rounded-xl game-glass border border-purple-500/20 text-sm text-white placeholder-purple-300/40 focus:outline-none focus:border-purple-400/40 bg-transparent"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFiltroElemento(null)}
              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                !filtroElemento
                  ? 'bg-purple-500/30 border-purple-400/40 text-white'
                  : 'border-white/[0.08] text-purple-200/60 hover:border-purple-400/30'
              }`}
            >
              Todos
            </button>
            {ELEMENT_CHIPS.map(el => (
              <button
                type="button"
                key={el.key}
                onClick={() => setFiltroElemento(prev => prev === el.key ? null : el.key)}
                className="px-2.5 py-1 rounded-full text-xs font-semibold border transition-all"
                style={{
                  borderColor: filtroElemento === el.key ? el.color : 'rgba(255,255,255,0.08)',
                  background: filtroElemento === el.key ? `${el.color}30` : 'transparent',
                  color: filtroElemento === el.key ? el.color : 'rgba(216,180,254,0.6)',
                }}
              >
                {el.label}
              </button>
            ))}
          </div>
        </div>

        {/* Spell Grid */}
        {magiasFiltradas.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-purple-200/60 text-sm">
              {listaMagias.length === 0
                ? 'Nenhuma magia conhecida'
                : 'Nenhuma magia encontrada com esses filtros.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {magiasFiltradas.map(magia => {
              const custo = parseCustoPm(magia);
              const semMana = custo > manaAtual;
              const escola = String(magia.escola_magia || (magia as { escola?: string }).escola || '');
              const escolaColor = escola ? ELEMENT_COLORS[escola.toLowerCase()] : null;
              const isClickable = combateAtivo && !semMana;
              const isDisabled = combateAtivo && semMana;

              const cardContent = (
                <>
                  {/* Nome + Escola */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-fantasy font-bold text-white text-sm leading-tight">{magia.nome}</span>
                    {escola && (
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border"
                        style={{
                          color: escolaColor?.text || '#c4b5fd',
                          borderColor: escolaColor?.border || 'rgba(139,92,246,0.3)',
                          background: escolaColor?.bg || 'rgba(88,28,135,0.2)',
                        }}
                      >
                        {escola}
                      </span>
                    )}
                  </div>

                  {/* Custo PM */}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-cyan-300 text-xs font-bold">{custo} PM</span>
                    {(magia.alcance || magia.duracao) && (
                      <span className="text-xs text-slate-400">
                        {[magia.alcance, magia.duracao].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </div>

                  {/* Descricao (full, no truncation) */}
                  {magia.descricao && (
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{magia.descricao}</p>
                  )}

                  {/* Focus requisito chips */}
                  <FocusChips focusRequisito={magia.focus_requisito} />

                  {/* Concentracao tag */}
                  {magia.usa_concentracao && (
                    <span className="inline-block mt-1.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30 rounded-full px-2 py-0.5">
                      Concentracao
                    </span>
                  )}

                  {/* Disabled reason in combat */}
                  {isDisabled && (
                    <p className="text-[10px] text-red-400/80 mt-1.5 font-semibold">Mana insuficiente</p>
                  )}
                </>
              );

              if (combateAtivo) {
                return (
                  <button
                    type="button"
                    key={magia.id || magia.nome}
                    disabled={isDisabled}
                    onClick={() => isClickable && onUsarMagia?.(magia)}
                    className={`text-left game-glass border rounded-xl p-3 transition-all ${
                      isDisabled
                        ? 'border-slate-600/30 opacity-50 cursor-not-allowed'
                        : 'border-purple-500/20 hover:border-purple-400/40 hover:shadow-[0_0_12px_rgba(168,85,247,0.12)] cursor-pointer'
                    }`}
                  >
                    {cardContent}
                  </button>
                );
              }

              return (
                <div
                  key={magia.id || magia.nome}
                  className="game-glass border border-purple-500/20 rounded-xl p-3"
                >
                  {cardContent}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GrimorioModal;
