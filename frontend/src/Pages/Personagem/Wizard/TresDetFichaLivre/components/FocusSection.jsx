// components/FocusSection.jsx
import { Lock } from 'lucide-react';
import { useTheme } from '../../../../../contexts/theme.jsx';

const FOCUS_FALLBACK = [
  { nome: 'fogo', label: 'Fogo', emoji: '🔥' },
  { nome: 'agua', label: 'Agua', emoji: '💧' },
  { nome: 'terra', label: 'Terra', emoji: '🍃' },
  { nome: 'ar', label: 'Ar', emoji: '🌀' },
  { nome: 'luz', label: 'Luz', emoji: '☀️' },
  { nome: 'trevas', label: 'Trevas', emoji: '🌑' },
];

export default function FocusSection({ focus, setFocusNivel, pontosFocus, pontosRestantes, temMagia, maxAttr = 3, focusCatalogo }) {
  const focusConfig = (focusCatalogo?.length > 0 ? focusCatalogo : FOCUS_FALLBACK)
    .map(f => ({ key: f.nome, label: f.label, emoji: f.emoji, descricao: f.descricao }));
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <section className={`relative rounded-2xl border p-5 ${
      isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-purple-900/30'
    } ${!temMagia ? 'opacity-40 pointer-events-none' : ''}`}>
      {!temMagia && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold ${
            isLight ? 'bg-white border border-slate-200 text-slate-500' : 'bg-slate-900 border border-purple-900/30 text-slate-400'
          }`}>
            <Lock size={14} /> Compre uma vantagem de Magia para desbloquear
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-sky-300'}`}>
          Focus Elementais
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-md ${isLight ? 'bg-sky-50 text-sky-600' : 'bg-sky-900/20 text-sky-400'}`}>
          {pontosFocus} pts
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 max-[768px]:grid-cols-2">
        {focusConfig.map(fc => {
          const val = focus[fc.key];
          const hasPoints = val > 0;
          const canInc = val < maxAttr && pontosRestantes > 0;
          return (
            <div key={fc.key} className={`rounded-xl border p-4 text-center transition-all ${
              hasPoints
                ? isLight ? 'border-sky-300 bg-sky-50/50' : 'border-sky-500/40 bg-sky-900/10'
                : isLight ? 'border-slate-200 bg-slate-50' : 'border-purple-900/20 bg-slate-800/50'
            }`}>
              <div className="text-2xl mb-1">{fc.emoji}</div>
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${hasPoints ? (isLight ? 'text-sky-600' : 'text-sky-300') : (isLight ? 'text-slate-500' : 'text-slate-400')}`}>
                {fc.label}
              </div>
              <div className={`text-2xl font-extrabold mb-2 ${hasPoints ? (isLight ? 'text-sky-700' : 'text-sky-300') : (isLight ? 'text-slate-400' : 'text-slate-500')}`}>
                {val}
              </div>
              <div className="flex justify-center gap-2">
                <button disabled={val <= 0} onClick={() => setFocusNivel(fc.key, val - 1)} className={`w-7 h-7 rounded-lg border text-sm font-bold flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isLight ? 'border-sky-200 text-sky-500 hover:bg-sky-50' : 'border-sky-800 text-sky-400 hover:bg-sky-900/30'}`}>-</button>
                <button disabled={!canInc} onClick={() => setFocusNivel(fc.key, val + 1)} className={`w-7 h-7 rounded-lg border text-sm font-bold flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${isLight ? 'border-sky-200 text-sky-500 hover:bg-sky-50' : 'border-sky-800 text-sky-400 hover:bg-sky-900/30'}`}>+</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
