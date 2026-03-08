import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useViewModel } from '../../../shared/hooks/useViewModel';
import { verPersonagemViewModel } from './viewmodel';
import Button from '../../../components/form/button';
import { useTheme } from '../../../contexts/theme.jsx';

const atributosConfig = [
  { key: 'forca', label: 'Forca', icon: '💪' },
  { key: 'inteligencia', label: 'Inteligencia', icon: '🧠' },
  { key: 'constituicao', label: 'Constituicao', icon: '🛡️' },
  { key: 'agilidade', label: 'Agilidade', icon: '⚡' },
  { key: 'destreza', label: 'Destreza', icon: '🎯' },
  { key: 'carisma', label: 'Carisma', icon: '✨' },
];

const raridadeColors = (raridade, isLight) => {
  const map = {
    'Comum': isLight ? 'bg-gray-100 text-gray-800' : 'bg-gray-500/20 text-gray-400',
    'Incomum': isLight ? 'bg-green-100 text-green-800' : 'bg-green-500/20 text-green-400',
    'Raro': isLight ? 'bg-blue-100 text-blue-800' : 'bg-blue-500/20 text-blue-400',
    'Muito Raro': isLight ? 'bg-purple-100 text-purple-800' : 'bg-purple-500/20 text-purple-400',
    'Lendario': isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-400',
    'Artefato': isLight ? 'bg-red-100 text-red-800' : 'bg-red-500/20 text-red-400',
  };
  return map[raridade] || (isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-700/50 text-slate-300');
};

const formatBonus = (bonus) => {
  if (!bonus || typeof bonus !== 'object') return null;
  return Object.entries(bonus)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${k}`)
    .join(', ');
};

const VerPersonagemView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const vm = useViewModel(verPersonagemViewModel);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  useEffect(() => {
    if (id) {
      vm.loadPersonagem(id);
    }
  }, [id]);

  if (vm.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
          <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Carregando personagem...</span>
        </div>
      </div>
    );
  }

  if (vm.error && !vm.personagem) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card-rpg text-center p-8 max-w-md">
          <span className="text-4xl mb-4 block">❌</span>
          <h2 className={`text-xl font-bold mb-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>Erro</h2>
          <p className="text-slate-400 mb-4">{vm.error}</p>
          <Button variant="ghost" onClick={() => navigate('/personagens')}>Voltar</Button>
        </div>
      </div>
    );
  }

  const p = vm.personagem;
  if (!p) return null;

  const evolucao = vm.evolucao;
  const xpAtual = p.xp_atual || evolucao?.xp_atual || 0;
  const xpProximo = p.xp_proximo_nivel || evolucao?.xp_proximo_nivel || 100;
  const xpPercent = Math.min(100, Math.round((xpAtual / xpProximo) * 100));
  const pontosPendentes = p.pontos_atributo_pendentes || evolucao?.pontos_atributo_pendentes || 0;

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card-rpg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center">
              <span className="text-3xl">🧝</span>
            </div>
            <div>
              <h1 className={`text-2xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                {p.nome}
              </h1>
              <p className={`font-modern text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {p.raca || 'Humano'} - {p.classe || 'Aventureiro'} - Nivel {p.nivel || 1}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" onClick={() => navigate('/personagens')}>Voltar</Button>
            <Button variant="secondary" onClick={() => navigate(`/editar-personagem/${p.id}`)}>Editar</Button>
          </div>
        </div>
      </div>

      {/* Error */}
      {vm.error && (
        <div className="card-rpg p-4 bg-red-500/20 border border-red-500/30">
          <p className="text-red-400 font-modern text-sm">{vm.error}</p>
          <button onClick={() => vm.clearError()} className="text-red-300 text-xs underline mt-1">Fechar</button>
        </div>
      )}

      {/* XP Bar */}
      <div className="card-rpg">
        <div className="flex items-center justify-between mb-2">
          <span className={`font-modern text-sm font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>
            Experiencia
          </span>
          <span className="font-modern text-sm text-cyan-400">
            {xpAtual} / {xpProximo} XP
          </span>
        </div>
        <div className={`w-full h-3 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-700'}`}>
          <div
            className="h-full rounded-full gradient-primary transition-all duration-500"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 font-modern mt-1">
          {xpPercent}% para o nivel {(p.nivel || 1) + 1}
        </p>
      </div>

      {/* Distribute Points (if pending) */}
      {pontosPendentes > 0 && (
        <div className="card-rpg border border-yellow-500/30 bg-yellow-500/10">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">⬆️</span>
            <div>
              <h2 className={`text-lg font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                Pontos para Distribuir
              </h2>
              <p className="text-yellow-400 font-modern text-sm">
                Voce tem {pontosPendentes - (vm.totalPontosDistribuir || 0)} pontos restantes de {pontosPendentes}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {atributosConfig.map(attr => (
              <div key={attr.key} className={`flex items-center justify-between p-2 rounded-lg ${isLight ? 'bg-slate-100/50' : 'bg-slate-800/50'}`}>
                <span className={`font-modern text-sm ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  {attr.icon} {attr.label}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => vm.setPontoAtributo(attr.key, (vm.pontosParaDistribuir?.[attr.key] || 0) - 1)}
                    className="w-6 h-6 rounded bg-slate-600 text-white text-xs flex items-center justify-center hover:bg-slate-500"
                    disabled={(vm.pontosParaDistribuir?.[attr.key] || 0) <= 0}
                  >-</button>
                  <span className="w-6 text-center font-modern text-sm text-cyan-400">
                    {vm.pontosParaDistribuir?.[attr.key] || 0}
                  </span>
                  <button
                    type="button"
                    onClick={() => vm.setPontoAtributo(attr.key, (vm.pontosParaDistribuir?.[attr.key] || 0) + 1)}
                    className="w-6 h-6 rounded bg-purple-600 text-white text-xs flex items-center justify-center hover:bg-purple-500"
                    disabled={(vm.totalPontosDistribuir || 0) >= pontosPendentes}
                  >+</button>
                </div>
              </div>
            ))}
          </div>
          {(vm.totalPontosDistribuir || 0) > 0 && (
            <div className="mt-4">
              <Button
                variant="primary"
                onClick={() => vm.distribuirPontos()}
                disabled={vm.distribuindo}
                className="w-full"
              >
                {vm.distribuindo ? 'Distribuindo...' : `Confirmar (+${vm.totalPontosDistribuir} pontos)`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Attributes */}
      <div className="card-rpg">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 gradient-secondary rounded-lg flex items-center justify-center">
            <span className="text-sm">📊</span>
          </div>
          <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
            Atributos
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {atributosConfig.map(attr => {
            const valor = p[attr.key] || p.atributos?.[attr.key] || 10;
            const mod = Math.floor((valor - 10) / 2);
            return (
              <div key={attr.key} className={`p-3 rounded-lg text-center ${isLight ? 'bg-slate-100/50' : 'bg-slate-800/50'}`}>
                <div className="text-lg mb-1">{attr.icon}</div>
                <div className={`font-modern text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{attr.label}</div>
                <div className={`text-2xl font-bold font-modern ${isLight ? 'text-slate-800' : 'text-white'}`}>{valor}</div>
                <div className={`text-xs font-modern ${mod >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {mod >= 0 ? '+' : ''}{mod}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Vantagens & Desvantagens */}
      {((p.vantagens && p.vantagens.length > 0) || (p.desvantagens && p.desvantagens.length > 0)) && (
        <div className="card-rpg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 gradient-accent rounded-lg flex items-center justify-center">
              <span className="text-sm">⭐</span>
            </div>
            <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Vantagens & Desvantagens
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {p.vantagens && p.vantagens.length > 0 && (
              <div>
                <h3 className="text-cyan-400 font-modern text-sm font-semibold mb-2">Vantagens</h3>
                <ul className="space-y-1">
                  {p.vantagens.map((v, i) => (
                    <li key={i} className={`text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      + {typeof v === 'object' ? v.nome : v}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {p.desvantagens && p.desvantagens.length > 0 && (
              <div>
                <h3 className="text-red-400 font-modern text-sm font-semibold mb-2">Desvantagens</h3>
                <ul className="space-y-1">
                  {p.desvantagens.map((d, i) => (
                    <li key={i} className={`text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      - {typeof d === 'object' ? d.nome : d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Background */}
      <div className="card-rpg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-sm">📜</span>
            </div>
            <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Background
            </h2>
          </div>
          <Button
            variant="secondary"
            size="small"
            onClick={() => vm.gerarBackground()}
            disabled={vm.gerandoBackground}
          >
            {vm.gerandoBackground ? (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Gerando...</span>
              </div>
            ) : (
              'Gerar com IA'
            )}
          </Button>
        </div>
        {p.background ? (
          <p className={`font-modern text-sm leading-relaxed whitespace-pre-wrap ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            {p.background}
          </p>
        ) : (
          <p className={`font-modern text-sm italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Nenhum background definido. Clique em "Gerar com IA" para criar um automaticamente.
          </p>
        )}
      </div>

      {/* Validation */}
      <div className="card-rpg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 gradient-secondary rounded-lg flex items-center justify-center">
              <span className="text-sm">🔍</span>
            </div>
            <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Validacao de Coerencia
            </h2>
          </div>
          <Button
            variant="secondary"
            size="small"
            onClick={() => vm.validarCoerencia()}
            disabled={vm.validando}
          >
            {vm.validando ? (
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Validando...</span>
              </div>
            ) : (
              'Validar Personagem'
            )}
          </Button>
        </div>
        {vm.validacao ? (
          <div className="space-y-3">
            <div className={`flex items-center space-x-2 ${vm.validacao.valido ? 'text-green-400' : 'text-yellow-400'}`}>
              <span>{vm.validacao.valido ? '✅' : '⚠️'}</span>
              <span className="font-modern text-sm font-semibold">
                {vm.validacao.valido ? 'Personagem coerente!' : 'Avisos encontrados'}
              </span>
            </div>
            {vm.validacao.avisos && vm.validacao.avisos.length > 0 && (
              <div>
                <h4 className="text-yellow-400 font-modern text-xs font-semibold mb-1">Avisos:</h4>
                <ul className="space-y-1">
                  {vm.validacao.avisos.map((a, i) => (
                    <li key={i} className="text-sm text-yellow-300 font-modern">- {a}</li>
                  ))}
                </ul>
              </div>
            )}
            {vm.validacao.sugestoes && vm.validacao.sugestoes.length > 0 && (
              <div>
                <h4 className="text-cyan-400 font-modern text-xs font-semibold mb-1">Sugestoes:</h4>
                <ul className="space-y-1">
                  {vm.validacao.sugestoes.map((s, i) => (
                    <li key={i} className="text-sm text-cyan-300 font-modern">- {s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className={`font-modern text-sm italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Clique em "Validar Personagem" para verificar a coerencia narrativa.
          </p>
        )}
      </div>

      {/* Inventario */}
      <InventarioSection vm={vm} isLight={isLight} personagem={p} />
    </div>
  );
};

const InventarioSection = ({ vm, isLight, personagem }) => {
  const [confirmRemove, setConfirmRemove] = useState(null);
  const equipamentos = vm.equipamentos || [];
  const bonusAgregados = vm.getBonusAgregados ? vm.getBonusAgregados() : {};
  const bonusStr = formatBonus(bonusAgregados);

  const catalogoFiltrado = vm.getCatalogoFiltrado ? vm.getCatalogoFiltrado() : [];

  return (
    <div className="card-rpg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 gradient-accent rounded-lg flex items-center justify-center">
            <span className="text-sm">🗡️</span>
          </div>
          <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
            Inventario
          </h2>
          <span className={`text-xs font-modern ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            ({equipamentos.length} {equipamentos.length === 1 ? 'item' : 'itens'})
          </span>
        </div>
        <Button
          variant="secondary"
          size="small"
          onClick={() => vm.toggleCatalogo()}
        >
          {vm.mostrarCatalogo ? 'Fechar Catalogo' : 'Adicionar Equipamento'}
        </Button>
      </div>

      {/* Loading */}
      {vm.loadingEquipamentos && (
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-4 h-4 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
          <span className={`text-sm font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Carregando equipamentos...</span>
        </div>
      )}

      {/* Equipment Cards */}
      {equipamentos.length > 0 ? (
        <div className="space-y-3 mb-4">
          {equipamentos.map(eq => {
            const raridade = eq.raridade_rel?.nome || 'Comum';
            const tipo = Array.isArray(eq.tipo) ? eq.tipo.join(', ') : eq.tipo || '';
            const bonusText = formatBonus(eq.bonus);

            return (
              <div
                key={eq.id}
                className={`p-3 rounded-lg border ${isLight ? 'bg-white/50 border-slate-200' : 'bg-slate-800/50 border-slate-700'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`font-modern text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                        {eq.nome}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${raridadeColors(raridade, isLight)}`}>
                        {raridade}
                      </span>
                    </div>
                    {tipo && (
                      <p className={`text-xs font-modern mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {tipo}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {eq.dano_base && (
                        <span className="text-xs font-modern text-red-400">
                          Dano: {eq.dano_base}
                        </span>
                      )}
                      {bonusText && (
                        <span className="text-xs font-modern text-cyan-400">
                          {bonusText}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    {confirmRemove === eq.id ? (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => { vm.removerEquipamento(eq.id); setConfirmRemove(null); }}
                          className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 font-modern"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setConfirmRemove(null)}
                          className="px-2 py-1 text-xs bg-slate-500/20 text-slate-400 rounded hover:bg-slate-500/30 font-modern"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemove(eq.id)}
                        className={`px-2 py-1 text-xs rounded font-modern ${isLight ? 'text-red-600 hover:bg-red-100' : 'text-red-400 hover:bg-red-500/20'}`}
                      >
                        Remover
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !vm.loadingEquipamentos && (
          <p className={`font-modern text-sm italic mb-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Nenhum equipamento no inventario. Clique em "Adicionar Equipamento" para equipar itens.
          </p>
        )
      )}

      {/* Bonus Agregados */}
      {bonusStr && (
        <div className={`p-3 rounded-lg mb-4 ${isLight ? 'bg-cyan-50 border border-cyan-200' : 'bg-cyan-500/10 border border-cyan-500/20'}`}>
          <span className={`font-modern text-sm font-semibold ${isLight ? 'text-cyan-800' : 'text-cyan-400'}`}>
            Bonus Totais: {bonusStr}
          </span>
        </div>
      )}

      {/* Catalogo Panel */}
      {vm.mostrarCatalogo && (
        <div className={`mt-4 p-4 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-slate-700'}`}>
          <h3 className={`font-modern text-sm font-semibold mb-3 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            Catalogo de Equipamentos
          </h3>
          <input
            type="text"
            placeholder="Buscar equipamento..."
            value={vm.buscaCatalogo || ''}
            onChange={(e) => vm.setBuscaCatalogo(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg text-sm font-modern mb-3 border ${
              isLight
                ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
                : 'bg-slate-800 border-slate-600 text-white placeholder-slate-500'
            }`}
          />
          {catalogoFiltrado.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {catalogoFiltrado.map(eq => {
                const raridade = eq.raridade_rel?.nome || 'Comum';
                const tipo = Array.isArray(eq.tipo) ? eq.tipo.join(', ') : eq.tipo || '';
                const reqClasse = eq.requisitos?.classe;
                const reqRaca = eq.requisitos?.raca;
                const classeOk = !reqClasse || reqClasse.some(c => c.toLowerCase() === personagem.classe?.toLowerCase());
                const racaOk = !reqRaca || reqRaca.some(r => r.toLowerCase() === personagem.raca?.toLowerCase());
                const compativel = classeOk && racaOk;

                return (
                  <div
                    key={eq.id}
                    className={`p-2 rounded-lg flex items-center justify-between ${
                      eq.jaEquipado
                        ? isLight ? 'bg-slate-100 opacity-50' : 'bg-slate-800/30 opacity-50'
                        : isLight ? 'bg-white border border-slate-200' : 'bg-slate-800/50 border border-slate-700'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`font-modern text-xs font-semibold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>
                          {eq.nome}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${raridadeColors(raridade, isLight)}`}>
                          {raridade}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tipo && <span className={`text-[10px] font-modern ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>{tipo}</span>}
                        {eq.dano_base && <span className="text-[10px] font-modern text-red-400">Dano: {eq.dano_base}</span>}
                      </div>
                      {!compativel && (
                        <span className="text-[10px] font-modern text-yellow-400">
                          Requisitos: {reqClasse ? `Classe: ${reqClasse.join('/')}` : ''}{reqClasse && reqRaca ? ' | ' : ''}{reqRaca ? `Raca: ${reqRaca.join('/')}` : ''}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => vm.adicionarEquipamento(eq.id)}
                      disabled={eq.jaEquipado || !compativel || vm.loadingEquipamentos}
                      className={`ml-2 px-2 py-1 text-xs rounded font-modern whitespace-nowrap ${
                        eq.jaEquipado
                          ? 'bg-slate-500/20 text-slate-500 cursor-not-allowed'
                          : !compativel
                            ? 'bg-yellow-500/20 text-yellow-500 cursor-not-allowed'
                            : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                      }`}
                    >
                      {eq.jaEquipado ? 'Equipado' : !compativel ? 'Incompativel' : 'Adicionar'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className={`text-sm font-modern italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
              Nenhum equipamento encontrado.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default VerPersonagemView;
