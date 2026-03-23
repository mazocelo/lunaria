import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Coins, Package, ShoppingCart, X, Plus, Minus, Loader2 } from 'lucide-react';
import { apiClient } from '../services/ApiClient.js';

const TIPO_TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'arma', label: 'Armas' },
  { key: 'armadura', label: 'Armaduras' },
  { key: 'acessorio', label: 'Acessórios' },
  { key: 'consumivel', label: 'Consumíveis' },
  { key: 'pergaminho', label: 'Pergaminhos' },
];

const raridadeStyles = {
  comum: { text: 'text-slate-400', border: 'border-slate-500/40', bg: 'bg-slate-500/20', label: 'Comum' },
  incomum: { text: 'text-green-400', border: 'border-green-500/40', bg: 'bg-green-500/20', label: 'Incomum' },
  raro: { text: 'text-blue-400', border: 'border-blue-500/40', bg: 'bg-blue-500/20', label: 'Raro' },
  epico: { text: 'text-purple-400', border: 'border-purple-500/40', bg: 'bg-purple-500/20', label: 'Épico' },
  'épico': { text: 'text-purple-400', border: 'border-purple-500/40', bg: 'bg-purple-500/20', label: 'Épico' },
  lendario: { text: 'text-yellow-400', border: 'border-yellow-500/40', bg: 'bg-yellow-500/20', label: 'Lendário' },
  'lendário': { text: 'text-yellow-400', border: 'border-yellow-500/40', bg: 'bg-yellow-500/20', label: 'Lendário' },
};

function getRaridade(item) {
  const nome =
    item.raridade?.nome?.toLowerCase() ||
    (typeof item.raridade === 'string' ? item.raridade.toLowerCase() : null) ||
    'comum';
  return raridadeStyles[nome] || raridadeStyles.comum;
}

function getTipoNormalizado(item) {
  if (!item.tipo) return '';
  const tipo = typeof item.tipo === 'string' ? item.tipo : item.tipo[0] || '';
  return tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getDescricaoTruncada(item) {
  const texto = item.efeito || item.poderes?.descricao || '';
  if (!texto) return null;
  return texto.length > 120 ? texto.slice(0, 120) + '...' : texto;
}

const LojaMestreModal = ({ isOpen, onClose, personagemId, moedas }) => {
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabAtiva, setTabAtiva] = useState('todos');
  const [carrinho, setCarrinho] = useState({});
  const [comprando, setComprando] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setErro(null);
    apiClient.get('/itens-tresdet')
      .then(res => {
        if (res.data?.success) {
          setItens(res.data.data || []);
        } else {
          setErro('Falha ao carregar itens da loja.');
        }
      })
      .catch(() => setErro('Erro de conexão ao carregar itens.'))
      .finally(() => setLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setCarrinho({});
      setTabAtiva('todos');
      setErro(null);
    }
  }, [isOpen]);

  const itensVisiveis = useMemo(() => {
    return itens.filter(item => {
      if (!item.preco_moedas || item.preco_moedas <= 0) return false;
      if (tabAtiva === 'todos') return true;
      return getTipoNormalizado(item) === tabAtiva;
    });
  }, [itens, tabAtiva]);

  const totalCarrinho = useMemo(() => {
    return Object.entries(carrinho).reduce((sum, [itemId, qtd]) => {
      const item = itens.find(i => i.id === Number(itemId));
      return sum + (item ? item.preco_moedas * qtd : 0);
    }, 0);
  }, [carrinho, itens]);

  const saldo = moedas - totalCarrinho;

  const itensNoCarrinho = useMemo(() => {
    return Object.entries(carrinho)
      .filter(([, qtd]) => qtd > 0)
      .map(([itemId, qtd]) => {
        const item = itens.find(i => i.id === Number(itemId));
        return item ? { ...item, quantidade: qtd } : null;
      })
      .filter(Boolean);
  }, [carrinho, itens]);

  const adicionarAoCarrinho = useCallback((item) => {
    setCarrinho(prev => {
      const qtdAtual = prev[item.id] || 0;
      if (!item.empilhavel && qtdAtual >= 1) return prev;
      return { ...prev, [item.id]: qtdAtual + 1 };
    });
  }, []);

  const alterarQuantidade = useCallback((itemId, delta) => {
    setCarrinho(prev => {
      const novaQtd = (prev[itemId] || 0) + delta;
      if (novaQtd <= 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: novaQtd };
    });
  }, []);

  const confirmarCompras = useCallback(async () => {
    if (itensNoCarrinho.length === 0 || saldo < 0) return;
    setComprando(true);
    setErro(null);
    try {
      for (const item of itensNoCarrinho) {
        const res = await apiClient.post(`/personagens/${personagemId}/comprar`, {
          itemId: item.id,
          quantidade: item.quantidade,
          sistema: 'tresdet',
        });
        if (!res.data?.success) {
          throw new Error(`Falha ao comprar ${item.nome}`);
        }
      }
      onClose();
    } catch (e) {
      setErro(e.message || 'Erro ao processar compras.');
    } finally {
      setComprando(false);
    }
  }, [itensNoCarrinho, saldo, personagemId, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col rounded-3xl border border-white/[0.08] game-glass-solid shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3">
            <ShoppingCart size={20} className="text-amber-400" />
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-amber-200/70 font-modern">Loja do Mestre</p>
              <h2 className="text-xl font-fantasy text-white">Equipamentos Iniciais</h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl game-glass-subtle border border-amber-500/30">
              <Coins size={16} className="text-amber-400" />
              <span className={`text-sm font-bold font-modern ${saldo < 0 ? 'text-red-400' : 'text-amber-300'}`}>
                {saldo.toLocaleString('pt-BR')}
              </span>
              <span className="text-xs text-slate-500 font-modern">/ {moedas.toLocaleString('pt-BR')}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full game-glass-subtle hover:bg-slate-500/20 border border-white/[0.08] text-white transition-all"
              aria-label="Fechar loja"
              title="Fechar loja"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 px-5 py-3 border-b border-white/[0.06] overflow-x-auto shrink-0">
          {TIPO_TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTabAtiva(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold font-modern border transition-all whitespace-nowrap ${
                tabAtiva === tab.key
                  ? 'bg-amber-500/30 border-amber-400/40 text-white'
                  : 'border-white/[0.08] text-slate-400 hover:border-amber-400/30 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="text-amber-400 animate-spin" />
              <span className="ml-3 text-sm text-slate-400 font-modern">Carregando itens...</span>
            </div>
          ) : itensVisiveis.length === 0 ? (
            <div className="text-center py-16">
              <Package size={32} className="text-slate-600 mx-auto mb-2" />
              <p className="text-slate-500 font-modern text-sm">
                {itens.length === 0 ? 'Nenhum item disponível' : 'Nenhum item nesta categoria'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {itensVisiveis.map(item => {
                const raridade = getRaridade(item);
                const descricao = getDescricaoTruncada(item);
                const qtdNoCarrinho = carrinho[item.id] || 0;
                const podeAdicionar = item.empilhavel || qtdNoCarrinho === 0;

                return (
                  <div
                    key={item.id}
                    className={`game-glass-subtle p-3 rounded-xl border ${raridade.border} transition-all hover:border-opacity-70`}
                  >
                    <div className="flex items-start gap-2.5">
                      {item.imagem && (
                        <img
                          src={item.imagem}
                          alt={item.nome}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-slate-600/50"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="text-sm font-semibold text-white font-modern truncate block">
                            {item.nome}
                          </span>
                          <button
                            type="button"
                            onClick={() => adicionarAoCarrinho(item)}
                            disabled={!podeAdicionar}
                            className="shrink-0 p-1 rounded-md bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={podeAdicionar ? 'Adicionar ao carrinho' : 'Item já adicionado'}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {item.tipo && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded game-glass-subtle text-slate-300 font-modern">
                              {typeof item.tipo === 'string' ? item.tipo : item.tipo[0]}
                            </span>
                          )}
                          <span className={`text-[10px] font-semibold ${raridade.text}`}>
                            {raridade.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Coins size={11} className="text-amber-400" />
                          <span className="text-xs font-bold text-amber-300 font-modern">
                            {item.preco_moedas.toLocaleString('pt-BR')}
                          </span>
                        </div>

                        {descricao && (
                          <p className="text-[10px] text-slate-400 font-modern mt-1.5 leading-relaxed line-clamp-2">
                            {descricao}
                          </p>
                        )}

                        {qtdNoCarrinho > 0 && (
                          <div className="mt-1.5 flex items-center gap-1">
                            <ShoppingCart size={10} className="text-amber-400" />
                            <span className="text-[10px] text-amber-300 font-modern font-semibold">
                              x{qtdNoCarrinho} no carrinho
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {erro && (
          <div className="mx-5 mb-2 px-3 py-2 rounded-lg text-xs text-red-300 bg-red-900/30 border border-red-500/30 font-modern shrink-0">
            {erro}
          </div>
        )}

        {/* Cart footer */}
        <div className="border-t border-white/[0.08] p-5 shrink-0">
          {itensNoCarrinho.length > 0 && (
            <div className="mb-3 space-y-1.5 max-h-32 overflow-y-auto">
              {itensNoCarrinho.map(item => (
                <div key={item.id} className="flex items-center justify-between gap-2 text-sm font-modern">
                  <span className="text-slate-300 truncate flex-1">{item.nome}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => alterarQuantidade(item.id, -1)}
                      className="p-0.5 rounded bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 transition-colors"
                      title="Diminuir quantidade"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-xs text-white font-bold w-5 text-center">{item.quantidade}</span>
                    {item.empilhavel && (
                      <button
                        type="button"
                        onClick={() => alterarQuantidade(item.id, 1)}
                        className="p-0.5 rounded bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 transition-colors"
                        title="Aumentar quantidade"
                      >
                        <Plus size={10} />
                      </button>
                    )}
                    <span className="text-xs text-amber-300 font-semibold w-14 text-right">
                      {(item.preco_moedas * item.quantidade).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl font-modern text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
            >
              Pular
            </button>

            <div className="flex items-center gap-3">
              {itensNoCarrinho.length > 0 && (
                <span className="text-xs text-slate-400 font-modern">
                  Total: <span className="text-amber-300 font-bold">{totalCarrinho.toLocaleString('pt-BR')}</span>
                </span>
              )}
              <button
                type="button"
                onClick={confirmarCompras}
                disabled={comprando || itensNoCarrinho.length === 0 || saldo < 0}
                className="px-5 py-2 rounded-xl font-modern text-sm font-semibold bg-amber-600/80 hover:bg-amber-600 text-white border border-amber-500/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {comprando ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Comprando...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={14} />
                    Confirmar Compras
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LojaMestreModal);
