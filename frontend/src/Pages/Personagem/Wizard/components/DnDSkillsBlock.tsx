import { useMemo } from 'react';
import { Check, Sparkles, CheckCircle2, Lock, Pencil } from 'lucide-react';
import { SKILLS } from '../../../../utils/dnd5eData';
import { configPericiasDaClasse } from '../stages/dnd';
import { FOCO } from '../../../../components/shared';

// Ordem de exibicao dos atributos e cores de chip do tema Vitral Arcano.
const ORDEM_ATRIBUTOS: readonly string[] = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

const COR_ATRIBUTO: Record<string, string> = {
  STR: 'bg-amber-400/20 text-amber-500',
  DEX: 'bg-emerald-500/15 text-emerald-500',
  CON: 'bg-amber-400/15 text-amber-600',
  INT: 'bg-[var(--primary)]/15 text-[var(--primary)]',
  WIS: 'bg-emerald-500/15 text-emerald-500',
  CHA: 'bg-pink-500/15 text-pink-300',
};

// Nomes de classe em PT-BR. A chave casa com os slugs de CLASS_SKILL_OPTIONS.
const NOME_CLASSE: Record<string, string> = {
  barbarian: 'Barbaro',
  bard: 'Bardo',
  cleric: 'Clerigo',
  druid: 'Druida',
  fighter: 'Guerreiro',
  monk: 'Monge',
  paladin: 'Paladino',
  ranger: 'Patrulheiro',
  rogue: 'Ladino',
  sorcerer: 'Feiticeiro',
  warlock: 'Bruxo',
  wizard: 'Mago',
};


const calcModificador = (valor: number) => Math.floor((valor - 10) / 2);

interface DnDSkillsBlockProps {
  selecionadas?: string[];
  classeNome?: string;
  abilityScores?: Record<string, number>;
  onToggle?: (skillId: string) => void;
  /** Reabre a escolha depois de confirmada (B04). A confirmação mora no rodapé. */
  onEditar?: () => void;
  confirmado?: boolean;
  isLight?: boolean;
}

const DnDSkillsBlock = ({
  selecionadas = [],
  classeNome = '',
  abilityScores = {},
  onToggle,
  onEditar,
  confirmado = false,
  isLight = false,
}: DnDSkillsBlockProps) => {
  const classKey = classeNome?.toLowerCase()?.trim() || '';
  const classConfig = configPericiasDaClasse(classKey);
  const maxSelecoes = classConfig.count;
  const periciasPermitidas = useMemo(() => new Set(classConfig.skills), [classConfig.skills]);
  const classLabel = NOME_CLASSE[classKey] || (classKey ? classKey.charAt(0).toUpperCase() + classKey.slice(1) : 'Sem classe');

  const selecionadasSet = useMemo(() => new Set(selecionadas), [selecionadas]);

  const agrupadas = useMemo<Record<string, typeof SKILLS[number][]>>(() => {
    const grupos: Record<string, typeof SKILLS[number][]> = {};
    ORDEM_ATRIBUTOS.forEach((ab) => {
      grupos[ab] = SKILLS.filter((s) => s.ability === ab);
    });
    return grupos;
  }, []);

  const noLimite = selecionadas.length >= maxSelecoes;

  if (confirmado) {
    return (
      <section className="border border-[var(--border)] bg-[var(--card)] rounded-xl p-5 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-emerald-500" />
          <span className={`text-base font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
            Perícias confirmadas
          </span>
          <CheckCircle2 size={16} className="text-emerald-500" />
          {onEditar && (
            <button type="button" data-acao="editar" onClick={onEditar} className={`btn-rpg-secondary ml-auto inline-flex items-center gap-1.5 cursor-pointer ${FOCO}`}>
              <Pencil size={12} />
              Editar perícias
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {selecionadas.map((skillId) => {
            const skill = SKILLS.find((s) => s.id === skillId);
            if (!skill) return null;
            const mod = abilityScores[skill.ability] != null ? calcModificador(abilityScores[skill.ability]) : 0;
            const bonusProficiencia = 2;
            const total = mod + bonusProficiencia;
            return (
              <div
                key={skillId}
                className={`rounded-xl border px-3 py-2 ${isLight ? 'border-slate-200 bg-white/75' : 'border-slate-700/50 bg-slate-900/55'}`}
              >
                <div className={`text-xs font-modern font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
                  {skill.nome}
                </div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] tabular-nums font-semibold ${COR_ATRIBUTO[skill.ability] || 'bg-[var(--primary)]/15 text-[var(--primary)]'}`}>
                    {skill.ability}
                  </span>
                  <span className={`text-xs tabular-nums ${total >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {total >= 0 ? '+' : ''}{total}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="border border-[var(--border)] bg-[var(--card)] rounded-xl p-5 md:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-[var(--primary)]/15 text-[var(--primary)] inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-modern font-semibold">
                <Sparkles size={12} />
                Pericias D&D 5e
              </span>
              <span className="bg-emerald-500/15 text-emerald-500 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-modern font-semibold">
                {classLabel}
              </span>
            </div>
            <h3 className={`mt-3 text-2xl font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Escolher Pericias Treinadas
            </h3>
            <p className={`mt-2 max-w-3xl text-sm font-modern leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Sua classe permite escolher {maxSelecoes} {maxSelecoes === 1 ? 'pericia treinada' : 'pericias treinadas'}. As
              pericias destacadas estao disponiveis para a sua classe; as demais ficam bloqueadas.
            </p>
          </div>

          <div role="status" className="bg-[var(--muted)]/40 flex shrink-0 flex-col gap-1 rounded-2xl px-4 py-3">
            <span className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
              Selecionadas
            </span>
            <span className={`text-lg font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {selecionadas.length}/{maxSelecoes}
            </span>
            <span className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-[var(--muted-foreground)]'}`}>
              {maxSelecoes - selecionadas.length} restantes
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {ORDEM_ATRIBUTOS.map((ab) => {
            const skills = agrupadas[ab];
            if (!skills || skills.length === 0) return null;

            return (
              <div key={ab}>
                <div className="mb-2 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] tabular-nums font-semibold ${COR_ATRIBUTO[ab] || 'bg-[var(--primary)]/15 text-[var(--primary)]'}`}>
                    {ab}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {skills.map((skill) => {
                    const selecionada = selecionadasSet.has(skill.id);
                    const permitida = periciasPermitidas.has(skill.id);
                    const desabilitada = !permitida || (!selecionada && noLimite);

                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => !desabilitada && onToggle?.(skill.id)}
                        disabled={desabilitada}
                        aria-pressed={selecionada}
                        title={
                          !permitida
                            ? 'Perícia indisponível para esta classe'
                            : !selecionada && noLimite
                              ? 'Limite de perícias atingido'
                              : undefined
                        }
                        className={`group relative flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                          selecionada
                            ? 'cursor-pointer border-[var(--primary)]/60 bg-[var(--primary)]/8'
                            : desabilitada
                              ? 'cursor-not-allowed opacity-40 border-[var(--border)]'
                              : isLight
                                ? 'cursor-pointer border-slate-200 bg-white/70 hover:border-[var(--primary)]/40'
                                : 'cursor-pointer border-[var(--border)] bg-black/15 hover:border-[var(--primary)]/40'
                        }`}
                      >
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                            selecionada
                              ? 'border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]'
                              : isLight
                                ? 'border-slate-300'
                                : 'border-slate-600'
                          }`}
                        >
                          {selecionada && <Check size={12} />}
                          {!selecionada && !permitida && (
                            <Lock size={11} className={isLight ? 'text-slate-400' : 'text-slate-500'} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className={`text-sm font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {skill.nome}
                          </span>
                        </div>

                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] tabular-nums font-semibold ${COR_ATRIBUTO[skill.ability] || 'bg-[var(--primary)]/15 text-[var(--primary)]'}`}>
                          {skill.ability}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-[var(--border)] pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-modern font-semibold text-[var(--muted-foreground)]">
                Pericias treinadas
              </p>
              <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                {selecionadas.length === 0
                  ? 'Selecione pericias na lista acima.'
                  : selecionadas.length < maxSelecoes
                    ? `${selecionadas.length} de ${maxSelecoes} selecionadas. Escolha mais ${maxSelecoes - selecionadas.length}.`
                    : `${selecionadas.length} de ${maxSelecoes} selecionadas. Confirme no rodapé.`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DnDSkillsBlock;
