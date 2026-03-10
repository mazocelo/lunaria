import React, { useMemo } from 'react';
import { X, Package, Sword, Shield, Zap, Gem } from 'lucide-react';
import { agregarBonus } from '../../../utils/bonusHelper';

const raridadeStyles = {
  comum: { border: 'border-slate-500/40', text: 'text-slate-400', label: 'Comum' },
  incomum: { border: 'border-green-500/40', text: 'text-green-400', label: 'Incomum' },
  raro: { border: 'border-blue-500/40', text: 'text-blue-400', label: 'Raro' },
  epico: { border: 'border-purple-500/40', text: 'text-purple-400', label: 'Épico' },
  'épico': { border: 'border-purple-500/40', text: 'text-purple-400', label: 'Épico' },
  lendario: { border: 'border-yellow-500/40', text: 'text-yellow-400', label: 'Lendário' },
  'lendário': { border: 'border-yellow-500/40', text: 'text-yellow-400', label: 'Lendário' },
  'variável': { border: 'border-slate-500/40', text: 'text-slate-400', label: 'Variável' },
  artefato: { border: 'border-red-500/40', text: 'text-red-400', label: 'Artefato' },
  'muito raro': { border: 'border-purple-500/40', text: 'text-purple-400', label: 'Muito Raro' },
};

const elementoColors = {
  fogo: 'bg-red-500/20 text-red-300',
  gelo: 'bg-cyan-500/20 text-cyan-300',
  eletrico: 'bg-yellow-500/20 text-yellow-300',
  veneno: 'bg-green-500/20 text-green-300',
  necrotico: 'bg-purple-500/20 text-purple-300',
  radiante: 'bg-amber-500/20 text-amber-300',
  arcano: 'bg-indigo-500/20 text-indigo-300',
  sombrio: 'bg-slate-500/20 text-slate-300',
  psiquico: 'bg-pink-500/20 text-pink-300',
  divino: 'bg-yellow-300/20 text-yellow-200',
  natureza: 'bg-emerald-500/20 text-emerald-300',
  agua: 'bg-blue-500/20 text-blue-300',
  terra: 'bg-amber-700/20 text-amber-400',
  vento: 'bg-teal-500/20 text-teal-300',
  sonico: 'bg-violet-500/20 text-violet-300',
  acido: 'bg-lime-500/20 text-lime-300',
  contundente: 'bg-orange-500/20 text-orange-300',
  cortante: 'bg-red-400/20 text-red-300',
  perfurante: 'bg-slate-400/20 text-slate-300',
};

function getRaridadeFromEquip(equip) {
  const nome = equip.raridade?.nome?.toLowerCase() || equip.raridade_nome?.toLowerCase() || 'comum';
  return raridadeStyles[nome] || raridadeStyles.comum;
}

/**
 * Painel lateral de inventario durante o jogo
 */
const InventarioPanel = ({ isOpen, onClose, equipamentos = [], personagemNome }) => {
  const bonus = useMemo(() => agregarBonus(equipamentos), [equipamentos]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-30" onClick={onClose} />
      )}

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-80 z-40 transform transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full bg-slate-900/95 backdrop-blur-md border-l border-purple-500/20 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-amber-400" />
              <h3 className="font-fantasy font-bold text-white text-lg">Inventário</h3>
              <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-modern">
                {equipamentos.length}
              </span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Subtitle */}
          {personagemNome && (
            <div className="px-4 py-2 text-xs text-slate-400 font-modern border-b border-slate-800/50">
              Equipamentos de {personagemNome}
            </div>
          )}

          {/* Equipment List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {equipamentos.length === 0 ? (
              <div className="text-center py-8">
                <Package size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 font-modern text-sm">Nenhum equipamento</p>
              </div>
            ) : (
              equipamentos.map((equip, i) => {
                const raridade = getRaridadeFromEquip(equip);
                const elementos = Array.isArray(equip.elemento) ? equip.elemento : (equip.elemento ? [equip.elemento] : []);
                const tipos = Array.isArray(equip.tipo) ? equip.tipo : (equip.tipo ? [equip.tipo] : []);
                const b = equip.bonus || {};

                return (
                  <div key={equip.id || i} className={`glass p-3 rounded-lg border ${raridade.border}`}>
                    {/* Nome + Raridade */}
                    <div className="flex items-start justify-between mb-1">
                      <span className="text-sm font-semibold text-white font-modern">{equip.nome}</span>
                      <span className={`text-[10px] font-semibold ${raridade.text}`}>
                        {raridade.label}
                      </span>
                    </div>

                    {/* Tipos */}
                    {tipos.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1.5">
                        {tipos.map(t => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300 font-modern">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Stats inline */}
                    <div className="flex flex-wrap gap-2 text-[11px] font-modern">
                      {equip.dano_base && (
                        <span className="flex items-center gap-0.5 text-red-300">
                          <Sword size={10} /> {equip.dano_base}
                        </span>
                      )}
                      {b.ataque > 0 && (
                        <span className="text-orange-300">+{b.ataque} ATK</span>
                      )}
                      {b.dano > 0 && (
                        <span className="text-red-300">+{b.dano} DMG</span>
                      )}
                      {b.armadura > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-300">
                          <Shield size={10} /> +{b.armadura}
                        </span>
                      )}
                      {b.esquiva_bonus > 0 && (
                        <span className="text-green-300">+{b.esquiva_bonus}% ESQ</span>
                      )}
                      {b.esquiva_penalidade > 0 && (
                        <span className="text-red-400">-{b.esquiva_penalidade}% ESQ</span>
                      )}
                    </div>

                    {/* Elementos */}
                    {elementos.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {elementos.map(el => (
                          <span key={el} className={`text-[10px] px-1.5 py-0.5 rounded font-modern ${elementoColors[el] || 'bg-slate-600/20 text-slate-400'}`}>
                            <Zap size={8} className="inline mr-0.5" />{el}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Bonus Totais */}
          {equipamentos.length > 0 && (
            <div className="p-3 border-t border-slate-700/50">
              <div className="text-xs font-semibold text-slate-300 font-modern mb-2 flex items-center gap-1.5">
                <Gem size={12} className="text-purple-400" />
                Bônus Totais
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-modern">
                <div className="text-center glass p-1.5 rounded">
                  <div className="text-orange-300 font-bold">+{bonus.ataque}</div>
                  <div className="text-slate-500">ATK</div>
                </div>
                <div className="text-center glass p-1.5 rounded">
                  <div className="text-red-300 font-bold">+{bonus.dano}</div>
                  <div className="text-slate-500">DMG</div>
                </div>
                <div className="text-center glass p-1.5 rounded">
                  <div className="text-amber-300 font-bold">+{bonus.armadura}</div>
                  <div className="text-slate-500">ARM</div>
                </div>
                <div className="text-center glass p-1.5 rounded col-span-3">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-green-300 font-bold">+{bonus.esquiva_bonus}% ESQ</span>
                    {bonus.esquiva_penalidade > 0 && (
                      <span className="text-red-400 font-bold">-{bonus.esquiva_penalidade}% ESQ</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default React.memo(InventarioPanel);
