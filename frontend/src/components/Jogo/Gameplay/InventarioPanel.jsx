import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Gem, Package, Shield, Sword, X, Zap } from 'lucide-react';
import { agregarBonusEquipamentos as agregarBonus } from '../../../utils/personagemBonus';
import { apiClient } from '../../../services/ApiClient.js';

const raridadeStyles = {
  comum: { border: 'border-slate-500/40', text: 'text-slate-400', label: 'Comum' },
  incomum: { border: 'border-green-500/40', text: 'text-green-400', label: 'Incomum' },
  raro: { border: 'border-blue-500/40', text: 'text-blue-400', label: 'Raro' },
  epico: { border: 'border-purple-500/40', text: 'text-purple-400', label: 'Epico' },
  'épico': { border: 'border-purple-500/40', text: 'text-purple-400', label: 'Epico' },
  lendario: { border: 'border-yellow-500/40', text: 'text-yellow-400', label: 'Lendario' },
  'lendário': { border: 'border-yellow-500/40', text: 'text-yellow-400', label: 'Lendario' },
  variavel: { border: 'border-slate-500/40', text: 'text-slate-400', label: 'Variavel' },
  'variável': { border: 'border-slate-500/40', text: 'text-slate-400', label: 'Variavel' },
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

const TIPOS_CONSUMIVEL = ['consumivel', 'consumível', 'pergaminho'];

function getRaridadeFromItem(item) {
  const nome =
    item.raridade?.nome?.toLowerCase() ||
    item.raridade_nome?.toLowerCase() ||
    (typeof item.raridade === 'string' ? item.raridade.toLowerCase() : null) ||
    'comum';
  return raridadeStyles[nome] || raridadeStyles.comum;
}

function isConsumivel(item) {
  const tipos = Array.isArray(item.tipo) ? item.tipo : (item.tipo ? [item.tipo] : []);
  return tipos.some((t) => TIPOS_CONSUMIVEL.includes(t?.toLowerCase()));
}

// Normalise inventario entries from both sistemas into a consistent shape
function normalizeInventarioItem(entry, sistema) {
  if (sistema === 'tresdet') {
    const item = entry.item || {};
    return {
      id: item.id,
      nome: item.nome,
      tipo: item.tipo ? [item.tipo] : [],
      raridade: item.raridade,
      imagem: item.imagem,
      bonus: {},
      dano_base: null,
      elemento: [],
      equipado: entry.equipado,
      quantidade: entry.quantidade,
      efeito: item.efeito || null,
      poderes: item.poderes || null,
      descricao: item.descricao || null,
    };
  }
  // lunaria / dnd5e
  const equip = entry.equipamentos || {};
  return {
    id: equip.id,
    nome: equip.nome,
    tipo: Array.isArray(equip.tipo) ? equip.tipo : (equip.tipo ? [equip.tipo] : []),
    raridade: equip.raridade_rel || equip.raridade,
    imagem: equip.imagem,
    bonus: equip.bonus || {},
    dano_base: equip.dano_base,
    elemento: Array.isArray(equip.elemento) ? equip.elemento : (equip.elemento ? [equip.elemento] : []),
    equipado: entry.equipado,
    quantidade: entry.quantidade,
  };
}

const InventarioPanel = ({ isOpen, onClose, equipamentos = [], personagemNome, personagemId, sistema, onUsarItem }) => {
  const [inventario, setInventario] = useState(null);
  const [moedas, setMoedas] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null); // itemId being toggled
  const [erro, setErro] = useState(null);

  const fetchInventario = useCallback(async () => {
    if (!personagemId) return;
    try {
      const [invRes, saldoRes] = await Promise.all([
        apiClient.get(`/personagens/${personagemId}/inventario`),
        apiClient.get(`/personagens/${personagemId}/saldo`),
      ]);
      if (invRes.success) setInventario(invRes.data);
      if (saldoRes.success) setMoedas(saldoRes.data.moedas);
    } catch {
      // fall back to prop-based equipamentos silently
    }
  }, [personagemId]);

  useEffect(() => {
    if (isOpen && personagemId) {
      fetchInventario();
    }
  }, [isOpen, personagemId, fetchInventario]);

  const itens = useMemo(() => {
    if (inventario && sistema) {
      return inventario.map((entry) => normalizeInventarioItem(entry, sistema));
    }
    // fallback: treat prop equipamentos as already-equipped items
    return equipamentos.map((eq) => ({ ...eq, equipado: true, quantidade: 1 }));
  }, [inventario, sistema, equipamentos]);

  const equipados = useMemo(() => itens.filter((i) => i.equipado), [itens]);
  const mochila = useMemo(() => itens.filter((i) => !i.equipado), [itens]);

  const bonus = useMemo(() => agregarBonus(equipados), [equipados]);

  const handleEquipar = useCallback(async (itemId) => {
    if (!personagemId || !sistema) return;
    setLoadingAction(itemId);
    setErro(null);
    try {
      const res = await apiClient.post(`/personagens/${personagemId}/equipar`, { itemId, sistema });
      if (res.success) await fetchInventario();
    } catch (e) {
      setErro(e.message || 'Erro ao equipar');
    } finally {
      setLoadingAction(null);
    }
  }, [personagemId, sistema, fetchInventario]);

  const handleDesequipar = useCallback(async (itemId) => {
    if (!personagemId || !sistema) return;
    setLoadingAction(itemId);
    setErro(null);
    try {
      const res = await apiClient.post(`/personagens/${personagemId}/desequipar`, { itemId, sistema });
      if (res.success) await fetchInventario();
    } catch (e) {
      setErro(e.message || 'Erro ao desequipar');
    } finally {
      setLoadingAction(null);
    }
  }, [personagemId, sistema, fetchInventario]);

  const totalItens = itens.length;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30" onClick={onClose} />
      )}

      <div className={`fixed top-0 right-0 h-full w-full sm:w-80 z-40 transform transition-transform duration-300 ease-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full game-glass-solid border-l border-white/[0.08] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-amber-400" />
              <h3 className="font-fantasy font-bold text-white text-lg">Inventario</h3>
              <span className="text-xs px-1.5 py-0.5 rounded game-glass-subtle text-amber-300 font-modern">
                {totalItens}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
              aria-label="Fechar inventario"
              title="Fechar inventario"
            >
              <X size={18} />
            </button>
          </div>

          {personagemNome && (
            <div className="px-4 py-2 text-xs text-slate-400 font-modern border-b border-white/[0.06]">
              Equipamentos de {personagemNome}
            </div>
          )}

          {/* Saldo de moedas */}
          {moedas !== null && (
            <div className="px-4 py-2 border-b border-white/[0.06] flex items-center gap-2">
              <span className="text-base">🪙</span>
              <span className="text-sm font-semibold text-amber-300 font-modern">{moedas.toLocaleString('pt-BR')}</span>
              <span className="text-xs text-slate-500 font-modern">moedas</span>
            </div>
          )}

          {erro && (
            <div className="mx-3 mt-2 px-3 py-2 rounded text-xs text-red-300 bg-red-900/30 border border-red-500/30 font-modern">
              {erro}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {totalItens === 0 ? (
              <div className="text-center py-8">
                <Package size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500 font-modern text-sm">Nenhum item no inventario</p>
              </div>
            ) : (
              <>
                {/* Equipado */}
                {equipados.length > 0 && (
                  <section>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Shield size={12} className="text-cyan-400" />
                      <span className="text-xs font-semibold text-cyan-300 font-modern uppercase tracking-wider">Equipado</span>
                    </div>
                    <div className="space-y-2">
                      {equipados.map((item, i) => (
                        <ItemCard
                          key={item.id || i}
                          item={item}
                          acao="desequipar"
                          carregando={loadingAction === item.id}
                          onAcao={() => handleDesequipar(item.id)}
                          semBotao={!personagemId}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Mochila */}
                {mochila.length > 0 && (
                  <section>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Package size={12} className="text-amber-400" />
                      <span className="text-xs font-semibold text-amber-300 font-modern uppercase tracking-wider">Mochila</span>
                    </div>
                    <div className="space-y-2">
                      {mochila.map((item, i) => (
                        <ItemCard
                          key={item.id || i}
                          item={item}
                          acao={isConsumivel(item) ? 'usar' : 'equipar'}
                          carregando={loadingAction === item.id}
                          onAcao={isConsumivel(item)
                            ? () => onUsarItem?.(item)
                            : () => handleEquipar(item.id)
                          }
                          semBotao={!personagemId || (isConsumivel(item) && !onUsarItem)}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>

          {/* Bonus totais dos itens equipados */}
          {equipados.length > 0 && (
            <div className="p-3 border-t border-white/[0.08]">
              <div className="text-xs font-semibold text-slate-300 font-modern mb-2 flex items-center gap-1.5">
                <Gem size={12} className="text-purple-400" />
                Bonus Totais
              </div>
              <div className="grid grid-cols-3 gap-2 text-[11px] font-modern">
                <div className="text-center game-glass-subtle p-1.5 rounded">
                  <div className="text-orange-300 font-bold">+{bonus.ataque ?? 0}</div>
                  <div className="text-slate-500">ATK</div>
                </div>
                <div className="text-center game-glass-subtle p-1.5 rounded">
                  <div className="text-red-300 font-bold">+{bonus.dano ?? 0}</div>
                  <div className="text-slate-500">DMG</div>
                </div>
                <div className="text-center game-glass-subtle p-1.5 rounded">
                  <div className="text-amber-300 font-bold">+{bonus.armadura ?? 0}</div>
                  <div className="text-slate-500">ARM</div>
                </div>
                <div className="text-center game-glass-subtle p-1.5 rounded col-span-3">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-green-300 font-bold">+{bonus.dc_esquiva ?? 0} DC</span>
                    <span className="text-cyan-300 font-bold">+{bonus.absorcao ?? 0} TA</span>
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

function ItemCard({ item, acao, carregando, onAcao, semBotao }) {
  const raridade = getRaridadeFromItem(item);
  const elementos = item.elemento || [];
  const tipos = item.tipo || [];
  const b = item.bonus || {};

  return (
    <div className={`game-glass-subtle p-3 rounded-lg border ${raridade.border}`}>
      <div className="flex items-start gap-2 mb-1">
        {item.imagem && (
          <img src={item.imagem} alt={item.nome} className="w-8 h-8 rounded object-cover flex-shrink-0 border border-slate-600/50" />
        )}
        <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold text-white font-modern truncate block">{item.nome}</span>
            {item.quantidade > 1 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-300 font-modern">
                x{item.quantidade}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`text-[10px] font-semibold ${raridade.text}`}>{raridade.label}</span>
            {!semBotao && (
              <button
                type="button"
                onClick={onAcao}
                disabled={carregando}
                className={`text-[10px] px-2 py-0.5 rounded font-modern transition-colors ${
                  acao === 'usar'
                    ? 'bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40'
                    : acao === 'equipar'
                      ? 'bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-600/30 hover:bg-slate-600/50 text-slate-300 border border-slate-500/40'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {carregando ? '...' : acao === 'usar' ? 'Usar' : acao === 'equipar' ? 'Equipar' : 'Desequipar'}
              </button>
            )}
          </div>
        </div>
      </div>

      {tipos.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1.5">
          {tipos.map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded game-glass-subtle text-slate-300 font-modern">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-[11px] font-modern">
        {item.dano_base && (
          <span className="flex items-center gap-0.5 text-red-300">
            <Sword size={10} /> {item.dano_base}
          </span>
        )}
        {b.ataque > 0 && <span className="text-orange-300">+{b.ataque} ATK</span>}
        {b.dano > 0 && <span className="text-red-300">+{b.dano} DMG</span>}
        {b.armadura > 0 && (
          <span className="flex items-center gap-0.5 text-amber-300">
            <Shield size={10} /> +{b.armadura}
          </span>
        )}
        {b.dc_esquiva > 0 && <span className="text-green-300">+{b.dc_esquiva} DC</span>}
        {b.absorcao > 0 && <span className="text-cyan-300">+{b.absorcao} TA</span>}
      </div>

      {elementos.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {elementos.map((el) => (
            <span key={el} className={`text-[10px] px-1.5 py-0.5 rounded font-modern ${elementoColors[el] || 'bg-slate-600/20 text-slate-400'}`}>
              <Zap size={8} className="inline mr-0.5" />
              {el}
            </span>
          ))}
        </div>
      )}

      {(item.efeito || item.poderes?.descricao) && (
        <p className="text-[10px] text-slate-400 font-modern mt-1 line-clamp-2">
          {item.efeito || item.poderes?.descricao}
        </p>
      )}
    </div>
  );
}

export default React.memo(InventarioPanel);
