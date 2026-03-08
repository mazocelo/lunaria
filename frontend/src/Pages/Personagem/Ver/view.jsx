import React, { useEffect } from 'react';
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

      {/* Equipamentos */}
      {p.equipamentos && (
        <div className="card-rpg">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 gradient-accent rounded-lg flex items-center justify-center">
              <span className="text-sm">🗡️</span>
            </div>
            <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
              Equipamentos
            </h2>
          </div>
          <p className={`font-modern text-sm ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            {Array.isArray(p.equipamentos)
              ? p.equipamentos.map(e => typeof e === 'object' ? e.nome : e).join(', ')
              : p.equipamentos}
          </p>
        </div>
      )}
    </div>
  );
};

export default VerPersonagemView;
