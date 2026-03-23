// components/CaracteristicasSection.jsx
import { useTheme } from '../../../../../contexts/theme.jsx';

const ATTRS = [
  { key: 'F', label: 'Forca', sigla: 'F' },
  { key: 'H', label: 'Habilidade', sigla: 'H' },
  { key: 'R', label: 'Resistencia', sigla: 'R' },
  { key: 'A', label: 'Armadura', sigla: 'A' },
  { key: 'PdF', label: 'Poder de Fogo', sigla: 'PdF' },
];

export default function CaracteristicasSection({
  caracteristicas, setCaracteristica, pontosCaracteristicas,
  pontosRestantes, pv, pm, temMagia, maxAttr = 3,
}) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <section className={`rounded-2xl border p-5 ${
      isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-purple-900/30'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-sm font-bold uppercase tracking-wider ${isLight ? 'text-slate-700' : 'text-purple-300'}`}>
          Caracteristicas
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-md ${isLight ? 'bg-slate-100 text-slate-500' : 'bg-slate-800 text-slate-400'}`}>
          {pontosCaracteristicas} pts
        </span>
      </div>

      <div className="grid grid-cols-5 gap-3 max-[768px]:grid-cols-3">
        {ATTRS.map(attr => {
          const val = caracteristicas[attr.key];
          const canInc = val < maxAttr && pontosRestantes > 0;
          const canDec = val > 0;
          return (
            <div key={attr.key} className={`rounded-xl border p-4 text-center ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-purple-900/20'
            }`}>
              <div className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {attr.label}
              </div>
              <div className={`text-3xl font-extrabold mb-2 ${isLight ? 'text-slate-800' : 'text-purple-200'}`}>
                {val}
              </div>
              <div className="flex justify-center gap-2">
                <button
                  disabled={!canDec}
                  onClick={() => setCaracteristica(attr.key, val - 1)}
                  className={`w-8 h-8 rounded-lg border text-sm font-bold flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    isLight
                      ? 'border-slate-300 hover:bg-purple-50 text-purple-600'
                      : 'border-purple-800 hover:bg-purple-900/50 text-purple-400'
                  }`}
                >-</button>
                <button
                  disabled={!canInc}
                  onClick={() => setCaracteristica(attr.key, val + 1)}
                  className={`w-8 h-8 rounded-lg border text-sm font-bold flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                    isLight
                      ? 'border-slate-300 hover:bg-purple-50 text-purple-600'
                      : 'border-purple-800 hover:bg-purple-900/50 text-purple-400'
                  }`}
                >+</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 mt-3">
        <div className={`rounded-lg border px-3 py-2 text-xs ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-800/50 border-purple-900/20 text-slate-400'}`}>
          PV: <strong className={isLight ? 'text-slate-800' : 'text-purple-200'}>{pv}</strong>
        </div>
        <div className={`rounded-lg border px-3 py-2 text-xs ${isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-800/50 border-purple-900/20 text-slate-400'}`}>
          PM: <strong className={isLight ? 'text-slate-800' : 'text-purple-200'}>{pm}</strong>
          {!temMagia && <span className="ml-1 opacity-50">(sem magia)</span>}
        </div>
      </div>
    </section>
  );
}
