import React, { useMemo } from 'react';
import { Check, ChevronRight, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { SKILLS, CLASS_SKILL_OPTIONS } from '../../../../utils/dnd5eData.js';

// Ordem de exibicao dos atributos e cores de chip do tema Vitral Arcano.
const ORDEM_ATRIBUTOS = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'];

const COR_ATRIBUTO = {
  STR: 'wa-ember-chip',
  DEX: 'wa-emerald-chip',
  CON: 'wa-forge-chip',
  INT: 'wa-accent-chip',
  WIS: 'wa-teal-chip',
  CHA: 'bg-pink-500/15 text-pink-300',
};

// Nomes de classe em PT-BR. A chave casa com os slugs de CLASS_SKILL_OPTIONS.
const NOME_CLASSE = {
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

// Conjunto padrao para classes sem mapeamento (todas as pericias, 2 escolhas).
const CLASSE_PADRAO = { skills: SKILLS.map((s) => s.id), count: 2 };

const calcModificador = (valor) => Math.floor((valor - 10) / 2);

const DnDSkillsBlock = ({
  selecionadas = [],
  classeNome = '',
  abilityScores = {},
  onToggle,
  onConfirmar,
  confirmado = false,
  isLight = false,
}) => {
  const classKey = classeNome?.toLowerCase()?.trim() || '';
  const classConfig = CLASS_SKILL_OPTIONS[classKey] || CLASSE_PADRAO;
  const maxSelecoes = classConfig.count;
  const periciasPermitidas = useMemo(() => new Set(classConfig.skills), [classConfig.skills]);
  const classLabel = NOME_CLASSE[classKey] || (classKey ? classKey.charAt(0).toUpperCase() + classKey.slice(1) : 'Sem classe');

  const selecionadasSet = useMemo(() => new Set(selecionadas), [selecionadas]);

  const agrupadas = useMemo(() => {
    const grupos = {};
    ORDEM_ATRIBUTOS.forEach((ab) => {
      grupos[ab] = SKILLS.filter((s) => s.ability === ab);
    });
    return grupos;
  }, []);

  const noLimite = selecionadas.length >= maxSelecoes;

  if (confirmado) {
    return (
      <section className="wa-combo-block wa-stage-enter wa-stagger-2 rounded-[28px] p-5 md:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-[var(--wa-teal)]" />
          <span className={`text-base font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>
            Pericias confirmadas
          </span>
          <CheckCircle2 size={16} className="ml-auto text-[var(--wa-teal)]" />
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
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-mono font-semibold ${COR_ATRIBUTO[skill.ability] || 'wa-accent-chip'}`}>
                    {skill.ability}
                  </span>
                  <span className={`text-xs font-mono ${total >= 0 ? 'text-green-400' : 'text-red-400'}`}>
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
    <section className="wa-combo-block wa-stage-enter wa-stagger-2 rounded-[28px] p-5 md:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="wa-accent-chip inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
                <Sparkles size={12} />
                Pericias D&D 5e
              </span>
              <span className="wa-teal-chip inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-modern font-semibold uppercase tracking-[0.18em]">
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

          <div className="wa-panel-soft flex shrink-0 flex-col gap-1 rounded-2xl px-4 py-3">
            <span className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
              Selecionadas
            </span>
            <span className={`text-lg font-fantasy font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {selecionadas.length}/{maxSelecoes}
            </span>
            <span className={`text-xs font-modern ${isLight ? 'text-slate-500' : 'text-[var(--wa-muted)]'}`}>
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
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-semibold uppercase ${COR_ATRIBUTO[ab] || 'wa-accent-chip'}`}>
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
                        onClick={() => !desabilitada && onToggle(skill.id)}
                        disabled={desabilitada}
                        aria-pressed={selecionada}
                        title={
                          !permitida
                            ? 'Pericia indisponivel para esta classe'
                            : !selecionada && noLimite
                              ? 'Limite de pericias atingido'
                              : undefined
                        }
                        className={`group relative flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all ${
                          selecionada
                            ? 'cursor-pointer border-[var(--wa-accent)]/60 bg-[var(--wa-accent)]/8'
                            : desabilitada
                              ? 'cursor-not-allowed opacity-40 border-[var(--wa-border)]'
                              : isLight
                                ? 'cursor-pointer border-slate-200 bg-white/70 hover:border-[var(--wa-accent)]/40'
                                : 'cursor-pointer border-[var(--wa-border)] bg-black/15 hover:border-[var(--wa-accent)]/40'
                        }`}
                      >
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                            selecionada
                              ? 'border-[var(--wa-accent)] bg-[var(--wa-accent)] text-white'
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

                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-mono font-semibold ${COR_ATRIBUTO[skill.ability] || 'wa-accent-chip'}`}>
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

        <div className="border-t border-[var(--wa-border)] pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-modern font-semibold uppercase tracking-[0.18em] text-[var(--wa-muted)]">
                Pericias treinadas
              </p>
              <p className={`mt-1 text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                {selecionadas.length === 0
                  ? 'Selecione pericias na lista acima.'
                  : selecionadas.length < maxSelecoes
                    ? `${selecionadas.length} de ${maxSelecoes} selecionadas. Escolha mais ${maxSelecoes - selecionadas.length}.`
                    : `${selecionadas.length} de ${maxSelecoes} selecionadas. Confirme para avancar.`}
              </p>
            </div>

            <button
              type="button"
              onClick={onConfirmar}
              disabled={selecionadas.length < maxSelecoes}
              className={`inline-flex min-w-[14rem] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-modern font-semibold transition-all ${
                selecionadas.length < maxSelecoes
                  ? 'cursor-not-allowed bg-slate-600 text-slate-300 opacity-70'
                  : 'bg-gradient-to-br from-[var(--wa-accent)] to-[var(--wa-teal)] text-white shadow-lg hover:-translate-y-0.5'
              }`}
            >
              <ChevronRight size={16} />
              Confirmar pericias ({selecionadas.length}/{maxSelecoes})
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DnDSkillsBlock;
