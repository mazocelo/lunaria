import { CheckCircle2, Circle, ListMusic, Loader2, PauseCircle, PlayCircle, Radio } from 'lucide-react';

export interface AudioQueueItem {
  trackId?: string;
  status?: 'active' | 'ready' | 'preparing' | 'completed' | string;
  isPlaying?: boolean;
  speakerLabel?: string;
  kindLabel?: string;
  label?: string;
}

interface AudioQueuePopoverProps {
  isOpen: boolean;
  onClose: () => void;
  queueItems?: AudioQueueItem[];
  title?: string;
}

const AudioQueuePopover = ({
  isOpen,
  onClose,
  queueItems = [],
  title = 'Fila de narracao',
}: AudioQueuePopoverProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed right-6 bottom-24 w-80 max-w-[calc(100vw-3rem)] z-[70]">
      <div className="game-glass-solid rounded-2xl border border-white/[0.08] shadow-[0_18px_50px_rgba(15,23,42,0.55)] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <ListMusic size={16} className="text-cyan-200" />
            <div>
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="text-[11px] text-purple-200/70">{queueItems.length} trechos na fila</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-purple-200/70 hover:text-white transition-colors text-xs"
            aria-label="Fechar fila de audio"
            title="Fechar fila de audio"
          >
            fechar
          </button>
        </div>
        <div className="max-h-72 overflow-y-auto px-3 py-3 space-y-2">
          {queueItems.length === 0 ? (
            <div className="game-glass-subtle rounded-xl border border-white/[0.08] px-3 py-4 text-center">
              <p className="text-sm text-purple-200/70">Nenhum trecho carregado na fila.</p>
            </div>
          ) : (
            queueItems.map((item, index) => {
              const statusIcon = item.status === 'active'
                ? (item.isPlaying ? <PauseCircle size={16} className="text-cyan-300" /> : <PlayCircle size={16} className="text-amber-300" />)
                : item.status === 'ready'
                  ? <CheckCircle2 size={16} className="text-emerald-300" />
                  : item.status === 'preparing'
                    ? <Loader2 size={16} className="text-purple-200 animate-spin" />
                    : item.status === 'completed'
                      ? <Radio size={16} className="text-purple-200/60" />
                      : <Circle size={16} className="text-purple-200/40" />;

              return (
                <div
                  key={item.trackId || index}
                  className={`rounded-xl border px-3 py-2.5 transition-all ${
                    item.status === 'active'
                      ? 'game-glass border-cyan-400/35 shadow-[0_0_16px_rgba(34,211,238,0.12)]'
                      : 'game-glass-subtle border-white/[0.08]'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="pt-0.5">{statusIcon}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] uppercase tracking-wide text-purple-200/60">
                        {item.speakerLabel || item.kindLabel || 'Narracao'}
                      </p>
                      <p className="text-sm text-white leading-relaxed line-clamp-2">
                        {item.label}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioQueuePopover;
