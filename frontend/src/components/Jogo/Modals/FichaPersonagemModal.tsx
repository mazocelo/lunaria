import type { ReactNode } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '../../LoadingSpinner';
import { calcularMana, calcularHPMaximo, getDnd5eModifier, getDnd5eProficiencyBonus, formatModifier } from '../../../utils/rpgHelpers';

interface FichaPersonagemPayload {
  nome?: string;
  imagem?: string | null;
  classe?: string | { nome?: string };
  raca?: string | { nome?: string };
  sistema?: string;
  nivel?: number;
  hp?: number;
  hp_max?: number;
  hp_maximo?: number;
  hp_atual?: number;
  xp?: number;
  xp_atual?: number;
  xp_proximo_nivel?: number;
  moedas?: number;
  atributos?: Record<string, number>;
  stats_sistema?: {
    ac?: number;
    spellSlots?: number[];
    temMagia?: boolean;
    spellcasting?: unknown;
    skills?: Record<string, unknown>;
    [key: string]: unknown;
  };
  habilidades?: Array<{ nome?: string; dano_base?: string }> | Record<string, unknown>;
  vantagens?: Array<{ nome?: string }>;
  desvantagens?: Array<{ nome?: string }>;
  equipamentos?: Array<{ nome?: string; dano_base?: string }> | string;
  [key: string]: unknown;
}

interface FichaCombateStats {
  hp_atual?: number;
  hp_max?: number;
  mana_atual?: number;
  mana_max?: number;
  ac?: number;
  status?: string;
  [key: string]: unknown;
}

interface FichaPersonagemModalProps {
  isOpen: boolean;
  onClose: () => void;
  personagem?: FichaPersonagemPayload | null;
  loading?: boolean;
  error?: string | null;
  titulo?: string;
  combateAtivo?: boolean;
  combateJogadores?: Record<string, FichaCombateStats>;
  userId?: number | string | null;
}

const atributosPrincipais = [
  { key: 'forca', label: 'Forca' },
  { key: 'destreza', label: 'Destreza' },
  { key: 'constituicao', label: 'Constituicao' },
  { key: 'inteligencia', label: 'Inteligencia' },
  { key: 'agilidade', label: 'Agilidade' },
  { key: 'carisma', label: 'Carisma' }
];

const dnd5eAbilities = [
  { key: 'STR', label: 'Strength', sigla: 'STR' },
  { key: 'DEX', label: 'Dexterity', sigla: 'DEX' },
  { key: 'CON', label: 'Constitution', sigla: 'CON' },
  { key: 'INT', label: 'Intelligence', sigla: 'INT' },
  { key: 'WIS', label: 'Wisdom', sigla: 'WIS' },
  { key: 'CHA', label: 'Charisma', sigla: 'CHA' },
];

const caracteristicasTresDet = [
  { key: 'F',   label: 'Forca',        sigla: 'F' },
  { key: 'H',   label: 'Habilidade',   sigla: 'H' },
  { key: 'R',   label: 'Resistencia',  sigla: 'R' },
  { key: 'A',   label: 'Armadura',     sigla: 'A' },
  { key: 'PdF', label: 'Poder de Fogo', sigla: 'PdF' },
];

const getTresDetAtributo = (personagem: FichaPersonagemPayload | null | undefined, key: string): number => {
  const fromAtributos = personagem?.atributos?.[key];
  if (fromAtributos != null) return Number(fromAtributos) || 0;
  const fromRoot = (personagem as Record<string, unknown> | undefined)?.[key];
  return typeof fromRoot === 'number' ? fromRoot : 0;
};

type ListaItem = { nome?: string; nome_vantagem?: string; nome_desvantagem?: string } | string;

const FichaPersonagemModal = ({
  isOpen,
  onClose,
  personagem,
  loading = false,
  error = null,
  titulo = 'Ficha do Personagem',
  combateAtivo = false,
  combateJogadores = {},
  userId = null,
}: FichaPersonagemModalProps) => {
  if (!isOpen) return null;

  const renderLista = (tituloSecao: ReactNode, itens?: ListaItem[]): ReactNode => {
    if (!itens || itens.length === 0) return null;

    return (
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wide mb-2">{tituloSecao}</h4>
        <div className="flex flex-wrap gap-2">
          {itens.map((item, index) => {
            const label = typeof item === 'string'
              ? item
              : (item.nome || item.nome_vantagem || item.nome_desvantagem || '');
            return (
              <span
                key={`${tituloSecao}-${index}`}
                className="px-3 py-1 rounded-full game-glass-subtle border border-purple-400/20 text-purple-100 text-xs"
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  const renderConteudo = () => {
    if (loading) {
      return (
        <div className="py-16 flex justify-center">
          <LoadingSpinner text="Carregando ficha..." />
        </div>
      );
    }

    if (error) {
      return (
        <div className="py-8 text-center text-red-300">
          <p className="font-semibold mb-4">Nao foi possivel carregar a ficha.</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      );
    }

    if (!personagem) {
      return (
        <div className="py-8 text-center text-purple-200">
          <p>Selecione um personagem para visualizar a ficha.</p>
        </div>
      );
    }

    const vantagens = personagem.vantagens || [];
    const desvantagens = personagem.desvantagens || [];
    const equipamentos = Array.isArray(personagem.equipamentos)
      ? personagem.equipamentos
      : typeof personagem.equipamentos === 'string'
        ? personagem.equipamentos.split(',').map((item) => item.trim()).filter(Boolean)
        : [];

    const isTresDet = personagem.sistema === 'tresdet';
    const isDnd5e = personagem.sistema === 'dnd5e';
    const combateStats = combateAtivo && userId ? combateJogadores[String(userId)] : null;
    // D&D sem stats_sistema: AC/spell slots/spellcasting degradam para fallback
    // silencioso. Sinalizar a ficha incompleta em vez de esconder o problema.
    const fichaDnd5eIncompleta = isDnd5e && !personagem.stats_sistema;

    const personagemForHelpers = personagem as unknown as Parameters<typeof calcularHPMaximo>[0];
    const tresDetR = getTresDetAtributo(personagem, 'R');
    const tresDetHPMax = isTresDet ? Math.max(1, tresDetR * 5) : undefined;
    const tresDetMPMax = isTresDet && personagem.stats_sistema?.temMagia ? tresDetR * 5 : 0;
    const dnd5eHPMax = isDnd5e ? calcularHPMaximo(personagemForHelpers) : undefined;
    // Lunaria tambem tem fallback de HP fora de combate (multRaca x (nivel + modCON)).
    const lunariaHPMax = !isTresDet && !isDnd5e ? calcularHPMaximo(personagemForHelpers) : undefined;
    const hpMaxFallback = isTresDet ? tresDetHPMax : isDnd5e ? dnd5eHPMax : lunariaHPMax;

    const hpAtual = combateStats?.hp_atual ?? personagem.hp ?? personagem.hp_atual ?? hpMaxFallback;
    const hpMax = combateStats?.hp_max ?? personagem.hp_max ?? personagem.hp_maximo ?? hpMaxFallback;

    return (
      <div className="space-y-6">
        <div className="game-glass border border-cyan-500/30 rounded-2xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              {personagem.imagem && (
                <img src={personagem.imagem} alt={personagem.nome} className="w-16 h-16 rounded-full object-cover border-2 border-purple-500 flex-shrink-0" />
              )}
              <div>
                <p className="text-xs uppercase tracking-wide text-purple-200/70">Nome</p>
                <h3 className="text-2xl font-fantasy font-bold text-white">
                  {personagem.nome || 'Personagem sem nome'}
                  {personagem.sistema && personagem.sistema !== 'lunaria' && (
                    <span className="text-xs font-modern font-semibold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full ml-2 align-middle">
                      {personagem.sistema === 'tresdet' ? '3D&T' : personagem.sistema === 'dnd5e' ? 'D&D 5e' : personagem.sistema}
                    </span>
                  )}
                </h3>
                <p className="text-cyan-200 text-sm">
                  {(typeof personagem.classe === 'object' ? personagem.classe?.nome : personagem.classe) || 'Classe desconhecida'} · {(typeof personagem.raca === 'object' ? personagem.raca?.nome : personagem.raca) || 'Raca desconhecida'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-purple-200/70 uppercase tracking-wide">Nivel</p>
                <p className="text-2xl font-bold text-white">{personagem.nivel || 1}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-purple-200/70 uppercase tracking-wide">{isTresDet ? 'PV' : 'HP'}</p>
                <p className="text-2xl font-bold text-red-300">
                  {hpAtual} / {hpMax}
                </p>
              </div>
              {isDnd5e ? (
                Boolean(personagem.stats_sistema?.spellcasting) && (
                  <div className="text-center">
                    <p className="text-xs text-purple-200/70 uppercase tracking-wide">Spell Slots</p>
                    <p className="text-lg font-bold text-indigo-300">
                      {(personagem.stats_sistema?.spellSlots || []).filter((s: number) => s > 0).length > 0
                        ? (personagem.stats_sistema?.spellSlots || []).filter((s: number) => s > 0).map((s: number, i: number) => `Lv${i + 1}:${s}`).join(' ')
                        : 'None'}
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center">
                  <p className="text-xs text-purple-200/70 uppercase tracking-wide">{isTresDet ? 'PM' : 'MP'}</p>
                  <p className="text-2xl font-bold text-blue-300">
                    {isTresDet ? tresDetMPMax : calcularMana(personagemForHelpers)}
                  </p>
                </div>
              )}
            </div>
          </div>
          {personagem.moedas !== undefined && personagem.moedas !== null && (
            <div className="mt-3 flex items-center gap-2 text-yellow-400">
              <span className="text-lg">🪙</span>
              <span className="font-bold">{personagem.moedas.toLocaleString()}</span>
              <span className="text-sm text-slate-400">Moedas</span>
            </div>
          )}
        </div>

        {fichaDnd5eIncompleta && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-amber-200">
            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
            <p className="text-xs leading-relaxed">
              Ficha incompleta: dados de sistema D&amp;D 5e (CA, conjuracao, espacos de magia)
              ausentes. Os valores abaixo usam estimativas.
            </p>
          </div>
        )}

        {isTresDet ? (
          <div className="game-glass border border-purple-500/20 rounded-2xl p-4">
            <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wide mb-4">Caracteristicas</h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {caracteristicasTresDet.map((c) => {
                const valor = getTresDetAtributo(personagem, c.key);
                return (
                  <div key={c.key} className="p-3 rounded-xl game-glass-subtle border border-purple-500/20 text-center">
                    <p className="text-xs text-purple-200/70 uppercase tracking-wide">{c.sigla}</p>
                    <p className="text-2xl font-bold text-white">{valor}</p>
                    <p className="text-[10px] text-purple-300/60 mt-0.5">{c.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : isDnd5e ? (
          <div className="game-glass border border-purple-500/20 rounded-2xl p-4">
            <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wide mb-4">Ability Scores</h4>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {dnd5eAbilities.map((ab) => {
                const score = personagem?.atributos?.[ab.key] ?? 10;
                const mod = getDnd5eModifier(score);
                return (
                  <div key={ab.key} className="p-3 rounded-xl game-glass-subtle border border-purple-500/20 text-center">
                    <p className="text-xs text-purple-200/70 uppercase tracking-wide">{ab.sigla}</p>
                    <p className="text-2xl font-bold text-white">{score}</p>
                    <p className="text-sm font-semibold text-cyan-300">{formatModifier(mod)}</p>
                    <p className="text-[10px] text-purple-300/60 mt-0.5">{ab.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="game-glass border border-purple-500/20 rounded-2xl p-4">
            <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wide mb-4">Atributos Principais</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {atributosPrincipais.map((atributo) => (
                <div key={atributo.key} className="p-3 rounded-xl game-glass-subtle border border-purple-500/20 text-center">
                  <p className="text-xs text-purple-200/70 uppercase tracking-wide">{atributo.label}</p>
                  <p className="text-2xl font-bold text-white">{
                    personagem?.atributos?.[atributo.key]
                    ?? (personagem as Record<string, unknown> | undefined)?.[atributo.key] as string | number | undefined
                    ?? '-'
                  }</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="game-glass border border-purple-500/20 rounded-2xl p-4">
          <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wide mb-4">Stats de Combate</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {isTresDet ? (() => {
              const F = getTresDetAtributo(personagem, 'F');
              const H = getTresDetAtributo(personagem, 'H');
              const A = getTresDetAtributo(personagem, 'A');
              const PdF = getTresDetAtributo(personagem, 'PdF');
              const faBase = F + H;
              const fdBase = A + H;
              const faRanged = PdF + H;
              type StatEntry = { label: string; value: string | number | undefined; color: string; tooltip: string };
              const stats: StatEntry[] = [
                { label: 'FA Corpo', value: `${faBase}+d6`, color: 'text-amber-300', tooltip: `F(${F})+H(${H})+d6` },
                { label: 'FD', value: `${fdBase}+d6`, color: 'text-cyan-300', tooltip: `A(${A})+H(${H})+d6` },
              ];
              if (PdF > 0) {
                stats.push({ label: 'FA Dist.', value: `${faRanged}+d6`, color: 'text-orange-300', tooltip: `PdF(${PdF})+H(${H})+d6` });
              }
              stats.push({ label: 'PV Max', value: tresDetHPMax, color: 'text-red-300', tooltip: `R(${tresDetR}) x 5` });
              return stats.map((stat) => (
                <div key={stat.label} className="p-3 rounded-xl game-glass-subtle border border-purple-500/20 text-center cursor-help" title={stat.tooltip}>
                  <p className="text-xs text-purple-200/70 uppercase tracking-wide">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ));
            })() : isDnd5e ? (() => {
              const nivel = personagem.nivel || 1;
              const profBonus = getDnd5eProficiencyBonus(nivel);
              const modSTR = getDnd5eModifier(personagem?.atributos?.STR ?? 10);
              const modDEX = getDnd5eModifier(personagem?.atributos?.DEX ?? 10);
              const ac = personagem.stats_sistema?.ac || (10 + modDEX);
              const atkBonus = Math.max(modSTR, modDEX) + profBonus;
              const castingAbility = (personagem.stats_sistema as { castingAbility?: string } | undefined)?.castingAbility;
              const castMod = castingAbility ? getDnd5eModifier(personagem?.atributos?.[castingAbility] ?? 10) : 0;
              const spellDC = castingAbility ? 8 + profBonus + castMod : null;

              type StatEntry = { label: string; value: string | number | undefined; color: string; tooltip: string };
              const stats: StatEntry[] = [
                { label: 'Armor Class', value: ac, color: 'text-cyan-300', tooltip: `AC from armor/DEX` },
                { label: 'Attack', value: `+${atkBonus}`, color: 'text-amber-300', tooltip: `max(STR,DEX) mod + Prof(+${profBonus})` },
                { label: 'Prof. Bonus', value: `+${profBonus}`, color: 'text-green-300', tooltip: `Level ${nivel} proficiency bonus` },
                { label: 'Hit Points', value: dnd5eHPMax, color: 'text-red-300', tooltip: `HD + CON mod per level` },
              ];
              if (spellDC) {
                stats.push({ label: 'Spell DC', value: spellDC, color: 'text-indigo-300', tooltip: `8 + Prof(+${profBonus}) + ${castingAbility} mod(${formatModifier(castMod)})` });
                stats.push({ label: 'Spell Atk', value: `+${profBonus + castMod}`, color: 'text-indigo-300', tooltip: `Prof(+${profBonus}) + ${castingAbility} mod(${formatModifier(castMod)})` });
              }
              return stats.map((stat) => (
                <div key={stat.label} className="p-3 rounded-xl game-glass-subtle border border-purple-500/20 text-center cursor-help" title={stat.tooltip}>
                  <p className="text-xs text-purple-200/70 uppercase tracking-wide">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ));
            })() : (() => {
              const rootAttr = (key: string) => Number((personagem as Record<string, unknown>)[key]) || 10;
              const modAGI = Math.floor(((personagem?.atributos?.agilidade ?? rootAttr('agilidade')) - 10) / 2);
              const modDEX = Math.floor(((personagem?.atributos?.destreza ?? rootAttr('destreza')) - 10) / 2);
              const modCON = Math.floor(((personagem?.atributos?.constituicao ?? rootAttr('constituicao')) - 10) / 2);
              const modFOR = Math.floor(((personagem?.atributos?.forca ?? rootAttr('forca')) - 10) / 2);
              const nivel = personagem.nivel || 1;
              const bonusNivel = Math.floor(nivel / 2);
              const dc = 10 + modAGI;
              const atk = modDEX + bonusNivel;
              const ta = Math.max(0, modCON - 1);
              const equipamentosArr = Array.isArray(personagem.equipamentos) ? personagem.equipamentos : [];
              const temArma = equipamentosArr.some((e) => Boolean(e?.dano_base));
              const danoMod = temArma ? modFOR : modFOR - 1;
              const dano = danoMod >= 0 ? `+${danoMod}` : `${danoMod}`;
              const danoTooltip = temArma
                ? `1d6 + modFOR(${modFOR >= 0 ? '+' : ''}${modFOR})`
                : `1d6 + modFOR(${modFOR >= 0 ? '+' : ''}${modFOR}) - 1 (desarmado)`;
              return [
                { label: 'DC Esquiva', value: dc, color: 'text-cyan-300', tooltip: `10 + modAGI(${modAGI >= 0 ? '+' : ''}${modAGI})` },
                { label: 'Ataque', value: `+${atk}`, color: 'text-amber-300', tooltip: `modDEX(${modDEX >= 0 ? '+' : ''}${modDEX}) + bonusNv(+${bonusNivel})` },
                { label: 'TA', value: ta > 0 ? `${ta}d4` : '0', color: 'text-green-300', tooltip: `max(0, modCON(${modCON >= 0 ? '+' : ''}${modCON})-1)d4` },
                { label: 'Dano', value: `1d6${dano}`, color: 'text-red-300', tooltip: danoTooltip },
              ].map((stat) => (
                <div key={stat.label} className="p-3 rounded-xl game-glass-subtle border border-purple-500/20 text-center cursor-help" title={stat.tooltip}>
                  <p className="text-xs text-purple-200/70 uppercase tracking-wide">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ));
            })()}
          </div>
        </div>

        {isDnd5e && (() => {
          const sp = personagem.stats_sistema as { skillProficiencies?: string[] } | undefined;
          const skills = Array.isArray(sp?.skillProficiencies) ? sp.skillProficiencies : [];
          if (skills.length === 0) return null;
          return (
            <div className="game-glass border border-purple-500/20 rounded-2xl p-4">
              <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wide mb-2">Skill Proficiencies</h4>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill: string) => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-full game-glass-subtle border border-green-400/20 text-green-200 text-xs"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}

        {isDnd5e && Boolean(personagem.stats_sistema?.spellcasting) && (personagem.stats_sistema?.spellSlots?.length ?? 0) > 0 && (
          <div className="game-glass border border-purple-500/20 rounded-2xl p-4">
            <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wide mb-3">Spell Slots</h4>
            <div className="flex flex-wrap gap-3">
              {(personagem.stats_sistema?.spellSlots ?? []).map((slots: number, i: number) => (
                slots > 0 && (
                  <div key={i} className="p-2 rounded-lg game-glass-subtle border border-indigo-500/20 text-center min-w-[60px]">
                    <p className="text-[10px] text-indigo-300/70 uppercase">Level {i + 1}</p>
                    <p className="text-lg font-bold text-indigo-300">{slots}</p>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {Boolean(personagem.background) && (
          <div className="game-glass border border-purple-500/20 rounded-2xl p-4">
            <h4 className="text-sm font-semibold text-purple-300 uppercase tracking-wide mb-2">Historia / Background</h4>
            <p className="text-sm text-purple-100 leading-relaxed whitespace-pre-line">{personagem.background as string}</p>
          </div>
        )}

        <div className="game-glass border border-purple-500/20 rounded-2xl p-4">
          {renderLista('Vantagens', vantagens)}
          {renderLista('Desvantagens', desvantagens)}
          {renderLista('Equipamentos', equipamentos)}

          {!vantagens.length && !desvantagens.length && !equipamentos.length && (
            <p className="text-sm text-purple-200">Nenhuma vantagem, desvantagem ou equipamento registrado.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto rounded-3xl border border-white/[0.08] game-glass-solid shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-purple-200/70">Ficha</p>
            <h2 className="text-2xl font-fantasy text-white">{titulo}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full game-glass-subtle hover:bg-purple-500/20 border border-white/[0.08] text-white transition-all"
            aria-label="Fechar ficha"
            title="Fechar ficha"
          >
            <X size={16} />
          </button>
        </div>

        {renderConteudo()}
      </div>
    </div>
  );
};

export default FichaPersonagemModal;
