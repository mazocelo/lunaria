import React, { useState } from 'react';
import { Minus, Plus, Wand2, Info } from 'lucide-react';

const ATTR_CONFIG = {
  forca: {
    label: 'Força', abbr: 'FOR', bar: 'bg-red-500',
    desc: 'Poder físico bruto. Afeta dano corpo-a-corpo, carregar peso e testes de força.',
  },
  destreza: {
    label: 'Destreza', abbr: 'DES', bar: 'bg-purple-500',
    desc: 'Precisão e coordenação. Afeta ataques à distância, furtividade e trabalhos manuais.',
  },
  constituicao: {
    label: 'Constituição', abbr: 'CON', bar: 'bg-green-500',
    desc: 'Resistência e vitalidade. Aumenta pontos de vida, resistência a venenos e fadiga.',
  },
  inteligencia: {
    label: 'Inteligência', abbr: 'INT', bar: 'bg-blue-500',
    desc: 'Raciocínio e conhecimento. Afeta magia arcana, investigação e idiomas.',
  },
  agilidade: {
    label: 'Agilidade', abbr: 'AGI', bar: 'bg-yellow-500',
    desc: 'Velocidade e reflexos. Afeta esquiva, iniciativa e movimentação em combate.',
  },
  carisma: {
    label: 'Carisma', abbr: 'CAR', bar: 'bg-pink-500',
    desc: 'Presença e influência. Afeta persuasão, intimidação e liderança.',
  },
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
  const [infoAberta, setInfoAberta] = useState(null);

  return (
    <div className={`rounded-xl border p-4 ${
      isLight ? 'border-slate-200 bg-white/80' : 'border-slate-700/50 bg-slate-800/30'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className={`text-base font-fantasy font-bold ${isLight ? 'text-slate-700' : 'text-white'}`}>
          Distribuir Atributos
        </h4>
        <span className={`text-sm font-mono px-2.5 py-1 rounded-lg font-bold ${
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
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 mb-4 rounded-lg text-sm font-modern font-medium transition-all cursor-pointer ${
            isLight
              ? 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'
              : 'bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20'
          }`}
        >
          <Wand2 size={14} />
          Aplicar sugestão do Mestre
        </button>
      )}

      {/* Atributos */}
      <div className="space-y-3">
        {Object.entries(ATTR_CONFIG).map(([key, cfg]) => {
          const val = atributos[key] || 0;
          const mod = Math.floor((val - 10) / 2);
          const showInfo = infoAberta === key;

          return (
            <div key={key}>
              <div className="flex items-center gap-2">
                {/* Label + Info */}
                <div className="flex items-center gap-1 w-12">
                  <span className={`text-xs font-mono font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {cfg.abbr}
                  </span>
                  <button
                    type="button"
                    onClick={() => setInfoAberta(showInfo ? null : key)}
                    className={`p-0.5 rounded transition-colors cursor-pointer ${
                      showInfo
                        ? 'text-purple-400'
                        : isLight ? 'text-slate-300 hover:text-slate-500' : 'text-slate-600 hover:text-slate-400'
                    }`}
                  >
                    <Info size={12} />
                  </button>
                </div>

                {/* Controls */}
                <button
                  onClick={() => setAtributo(key, val - 1)}
                  disabled={val <= 1}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    val <= 1
                      ? 'opacity-30 cursor-not-allowed'
                      : isLight
                        ? 'hover:bg-slate-100 text-slate-600'
                        : 'hover:bg-slate-700 text-slate-400'
                  }`}
                >
                  <Minus size={14} />
                </button>

                <div className={`w-10 text-center text-base font-mono font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  {val}
                </div>

                <button
                  onClick={() => setAtributo(key, val + 1)}
                  disabled={val >= 20 || pontosRestantes <= 0}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    val >= 20 || pontosRestantes <= 0
                      ? 'opacity-30 cursor-not-allowed'
                      : isLight
                        ? 'hover:bg-slate-100 text-slate-600'
                        : 'hover:bg-slate-700 text-slate-400'
                  }`}
                >
                  <Plus size={14} />
                </button>

                {/* Modifier */}
                <span className={`text-xs font-mono w-8 text-center ${mod >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {mod >= 0 ? '+' : ''}{mod}
                </span>

                {/* Bar */}
                <div className={`flex-1 h-2 rounded-full ${isLight ? 'bg-slate-200' : 'bg-slate-700/50'}`}>
                  <div
                    className={`h-full rounded-full ${cfg.bar} transition-all duration-200`}
                    style={{ width: `${Math.min(100, (val / 20) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Info tooltip expandido */}
              {showInfo && (
                <div className={`ml-12 mt-1 px-3 py-2 rounded-lg text-xs font-modern leading-relaxed ${
                  isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-700/40 text-slate-400'
                }`}>
                  <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{cfg.label}</span>
                  {' — '}{cfg.desc}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttributeDistributor;
