import React from 'react';
import { Minus, Plus, Wand2 } from 'lucide-react';

const ATTR_CONFIG = {
  forca: { label: 'Força', abbr: 'FOR', bar: 'bg-red-500' },
  destreza: { label: 'Destreza', abbr: 'DES', bar: 'bg-purple-500' },
  constituicao: { label: 'Constituição', abbr: 'CON', bar: 'bg-green-500' },
  inteligencia: { label: 'Inteligência', abbr: 'INT', bar: 'bg-blue-500' },
  agilidade: { label: 'Agilidade', abbr: 'AGI', bar: 'bg-yellow-500' },
  carisma: { label: 'Carisma', abbr: 'CAR', bar: 'bg-pink-500' },
};

const AttributeDistributor = ({
  atributos,
  setAtributo,
  pontosDistribuidos,
  pontosRestantes,
  pontosTotais,
  atributosSugeridos,
  aplicarAtributosSugeridos,
  isLight,
}) => {
  return (
    <div className={`rounded-lg border p-4 ${
      isLight ? 'border-slate-200 bg-white/80' : 'border-slate-700/50 bg-slate-800/30'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className={`text-sm font-fantasy font-bold ${isLight ? 'text-slate-700' : 'text-white'}`}>
          Distribuir Atributos
        </h4>
        <span className={`text-xs font-mono px-2 py-0.5 rounded ${
          pontosRestantes === 0
            ? 'bg-green-500/15 text-green-400'
            : pontosRestantes < 0
              ? 'bg-red-500/15 text-red-400'
              : 'bg-amber-500/15 text-amber-400'
        }`}>
          {pontosDistribuidos}/{pontosTotais}
        </span>
      </div>

      {/* Sugestão da IA */}
      {atributosSugeridos && (
        <button
          onClick={aplicarAtributosSugeridos}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 mb-3 rounded-lg text-xs font-modern transition-all cursor-pointer ${
            isLight
              ? 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'
              : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20'
          }`}
        >
          <Wand2 size={12} />
          Aplicar sugestão do Mestre
        </button>
      )}

      {/* Atributos */}
      <div className="space-y-2">
        {Object.entries(ATTR_CONFIG).map(([key, cfg]) => {
          const val = atributos[key] || 0;
          const mod = Math.floor((val - 10) / 2);

          return (
            <div key={key} className="flex items-center gap-2">
              <span className={`text-[11px] font-mono w-8 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {cfg.abbr}
              </span>

              <button
                onClick={() => setAtributo(key, val - 1)}
                disabled={val <= 1}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  val <= 1
                    ? 'opacity-30 cursor-not-allowed'
                    : isLight
                      ? 'hover:bg-slate-100 text-slate-600'
                      : 'hover:bg-slate-700 text-slate-400'
                }`}
              >
                <Minus size={12} />
              </button>

              <div className={`w-10 text-center text-sm font-mono font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                {val}
              </div>

              <button
                onClick={() => setAtributo(key, val + 1)}
                disabled={val >= 20 || pontosRestantes <= 0}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  val >= 20 || pontosRestantes <= 0
                    ? 'opacity-30 cursor-not-allowed'
                    : isLight
                      ? 'hover:bg-slate-100 text-slate-600'
                      : 'hover:bg-slate-700 text-slate-400'
                }`}
              >
                <Plus size={12} />
              </button>

              <span className={`text-[10px] font-mono ${mod >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ({mod >= 0 ? '+' : ''}{mod})
              </span>

              {/* Bar */}
              <div className={`flex-1 h-1.5 rounded-full ${isLight ? 'bg-slate-200' : 'bg-slate-700/50'}`}>
                <div
                  className={`h-full rounded-full ${cfg.bar} transition-all duration-200`}
                  style={{ width: `${Math.min(100, (val / 20) * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttributeDistributor;
