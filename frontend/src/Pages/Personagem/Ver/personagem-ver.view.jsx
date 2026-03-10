import React from 'react';
import Button from '../../../components/form/button';
import { Badge } from '../../../components/shared';
import {
  User, ArrowLeft, BarChart3, Star, ScrollText,
  Swords, Brain, ShieldCheck, Zap, Target, Sparkles, ChevronUp,
  Package, X, Loader2
} from 'lucide-react';

const atributosConfig = [
  { key: 'forca', label: 'Forca', icon: Swords },
  { key: 'inteligencia', label: 'Inteligencia', icon: Brain },
  { key: 'constituicao', label: 'Constituicao', icon: ShieldCheck },
  { key: 'agilidade', label: 'Agilidade', icon: Zap },
  { key: 'destreza', label: 'Destreza', icon: Target },
  { key: 'carisma', label: 'Carisma', icon: Sparkles },
];

const raridadeVariant = {
  'Comum': 'slate', 'Incomum': 'green', 'Raro': 'blue',
  'Muito Raro': 'purple', 'Épico': 'pink', 'Lendário': 'amber', 'Artefato': 'red', 'Variável': 'slate',
};

const bonusLabels = {
  ataque: 'Ataque', dano: 'Dano', armadura: 'Armadura',
  esquiva_bonus: 'Esquiva', esquiva_penalidade: 'Pen. Esquiva',
  ca: 'Armadura', ca_base: 'Armadura Base'
};

const formatBonus = (bonus) => {
  if (!bonus || typeof bonus !== 'object') return null;
  return Object.entries(bonus)
    .filter(([, v]) => v !== 0 && v != null)
    .map(([k, v]) => `${v > 0 ? '+' : ''}${v} ${bonusLabels[k] || k}`)
    .join(', ');
};

const VerPersonagemView = ({
  personagem,
  evolucao,
  loading,
  error,
  isLight,
  navigate,
  distribuindo,
  pontosParaDistribuir,
  totalPontosDistribuir,
  setPontoAtributo,
  distribuirPontos,
  equipamentos,
  loadingEquipamentos,
  bonusAgregados,
  clearError,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-3">
          <Loader2 size={24} className="animate-spin text-purple-400" />
          <span className={`font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>Carregando personagem...</span>
        </div>
      </div>
    );
  }

  if (error && !personagem) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="card-rpg text-center p-8 max-w-md">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-red-500/20">
            <X size={32} className="text-red-400" />
          </div>
          <h2 className={`text-xl font-bold mb-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>Erro</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <Button variant="ghost" onClick={() => navigate('/personagens')}>Voltar</Button>
        </div>
      </div>
    );
  }

  const p = personagem;
  if (!p) return null;

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
              <User size={32} className="text-white" />
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
          <button
            onClick={() => navigate('/personagens')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-modern transition-all cursor-pointer ${
              isLight
                ? 'border border-slate-300 text-slate-600 hover:bg-slate-50'
                : 'border border-slate-600 text-slate-300 hover:bg-slate-700/50'
            }`}
          >
            <ArrowLeft size={16} />
            Voltar
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card-rpg p-4 bg-red-500/20 border border-red-500/30">
          <p className="text-red-400 font-modern text-sm">{error}</p>
          <button onClick={clearError} className="text-red-300 text-xs underline mt-1">Fechar</button>
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
            <ChevronUp size={24} className="text-yellow-400" />
            <div>
              <h2 className={`text-lg font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                Pontos para Distribuir
              </h2>
              <p className="text-yellow-400 font-modern text-sm">
                Voce tem {pontosPendentes - (totalPontosDistribuir || 0)} pontos restantes de {pontosPendentes}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {atributosConfig.map(attr => {
              const AttrIcon = attr.icon;
              return (
                <div key={attr.key} className={`flex items-center justify-between p-2 rounded-lg ${isLight ? 'bg-slate-100/50' : 'bg-slate-800/50'}`}>
                  <span className={`font-modern text-sm flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <AttrIcon size={14} /> {attr.label}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setPontoAtributo(attr.key, (pontosParaDistribuir?.[attr.key] || 0) - 1)}
                      className="w-6 h-6 rounded bg-slate-600 text-white text-xs flex items-center justify-center hover:bg-slate-500"
                      disabled={(pontosParaDistribuir?.[attr.key] || 0) <= 0}
                    >-</button>
                    <span className="w-6 text-center font-modern text-sm text-cyan-400">
                      {pontosParaDistribuir?.[attr.key] || 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPontoAtributo(attr.key, (pontosParaDistribuir?.[attr.key] || 0) + 1)}
                      className="w-6 h-6 rounded bg-purple-600 text-white text-xs flex items-center justify-center hover:bg-purple-500"
                      disabled={(totalPontosDistribuir || 0) >= pontosPendentes}
                    >+</button>
                  </div>
                </div>
              );
            })}
          </div>
          {(totalPontosDistribuir || 0) > 0 && (
            <div className="mt-4">
              <Button
                variant="primary"
                onClick={distribuirPontos}
                disabled={distribuindo}
                className="w-full"
              >
                {distribuindo ? 'Distribuindo...' : `Confirmar (+${totalPontosDistribuir} pontos)`}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Attributes */}
      <div className="card-rpg">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 gradient-secondary rounded-lg flex items-center justify-center">
            <BarChart3 size={16} className="text-white" />
          </div>
          <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
            Atributos
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {atributosConfig.map(attr => {
            const valor = p[attr.key] || p.atributos?.[attr.key] || 10;
            const mod = Math.floor((valor - 10) / 2);
            const AttrIcon = attr.icon;
            return (
              <div key={attr.key} className={`p-3 rounded-lg text-center ${isLight ? 'bg-slate-100/50' : 'bg-slate-800/50'}`}>
                <div className="mb-1 flex justify-center">
                  <AttrIcon size={20} className={isLight ? 'text-slate-500' : 'text-slate-400'} />
                </div>
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
              <Star size={16} className="text-white" />
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
              <ScrollText size={16} className="text-white" />
            </div>
            <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Background
            </h2>
          </div>
        </div>
        {p.background ? (
          <p className={`font-modern text-sm leading-relaxed whitespace-pre-wrap ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            {p.background}
          </p>
        ) : (
          <p className={`font-modern text-sm italic ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Nenhum background definido.
          </p>
        )}
      </div>

      {/* Inventario */}
      <InventarioSection
        isLight={isLight}
        equipamentos={equipamentos}
        loadingEquipamentos={loadingEquipamentos}
        bonusAgregados={bonusAgregados}
      />
    </div>
  );
};

const InventarioSection = ({
  isLight,
  equipamentos,
  loadingEquipamentos,
  bonusAgregados,
}) => {
  const bonusStr = formatBonus(bonusAgregados);

  return (
    <div className="card-rpg">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 gradient-accent rounded-lg flex items-center justify-center">
          <Package size={16} className="text-white" />
        </div>
        <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
          Inventario
        </h2>
        <span className={`text-xs font-modern ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
          ({equipamentos.length} {equipamentos.length === 1 ? 'item' : 'itens'})
        </span>
      </div>

      {loadingEquipamentos && (
        <div className="flex items-center space-x-2 mb-4">
          <Loader2 size={16} className="animate-spin text-purple-400" />
          <span className={`text-sm font-modern ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Carregando equipamentos...</span>
        </div>
      )}

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
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`font-modern text-sm font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                    {eq.nome}
                  </span>
                  <Badge variant={raridadeVariant[raridade] || 'slate'}>{raridade}</Badge>
                </div>
                {tipo && (
                  <p className={`text-xs font-modern mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{tipo}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {eq.dano_base && <span className="text-xs font-modern text-red-400">Dano: {eq.dano_base}</span>}
                  {bonusText && <span className="text-xs font-modern text-cyan-400">{bonusText}</span>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !loadingEquipamentos && (
          <p className={`font-modern text-sm italic mb-4 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}>
            Nenhum equipamento no inventario.
          </p>
        )
      )}

      {bonusStr && (
        <div className={`p-3 rounded-lg ${isLight ? 'bg-cyan-50 border border-cyan-200' : 'bg-cyan-500/10 border border-cyan-500/20'}`}>
          <span className={`font-modern text-sm font-semibold ${isLight ? 'text-cyan-800' : 'text-cyan-400'}`}>
            Bonus Totais: {bonusStr}
          </span>
        </div>
      )}
    </div>
  );
};

export default VerPersonagemView;
