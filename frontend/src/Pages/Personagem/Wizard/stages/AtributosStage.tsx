// src/Pages/Personagem/Wizard/stages/AtributosStage.tsx
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { FOCO } from '../../../../components/shared';
import AttributeDistributor from '../components/AttributeDistributor';
import type { FonteDeBonus } from '../components/AtributoTile';

export interface AtributosStageProps {
  atributosBase: Record<string, number>;
  bonusFontes: Record<string, FonteDeBonus[]>;
  bonusAplicados: boolean;
  setAtributo: (chave: string, valor: number) => void;
  pontosDistribuidos: number;
  pontosRestantes: number;
  pontosTotais: number;
  atributosSugeridos: unknown;
  aplicarAtributosSugeridos: () => void;
  attrMin: number;
  attrMax: number;
  multRaca: number | null;
  enviando: boolean;
  onRedistribuir: () => void;
  isLight: boolean;
}

/** Etapa Atributos (Lunaria). Sem botão de confirmar: o Continuar do rodapé confirma e avança. */
const AtributosStage = (p: AtributosStageProps) => (
  <div className="space-y-4">
    {p.bonusAplicados && (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 font-fantasy text-lg font-bold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={18} aria-hidden="true" /> Atributos confirmados
        </p>
        <button type="button" data-acao="redistribuir" disabled={p.enviando} onClick={p.onRedistribuir} className={`btn-rpg-secondary inline-flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${FOCO}`}>
          <RotateCcw size={14} aria-hidden="true" /> Redistribuir
        </button>
      </div>
    )}
    <AttributeDistributor
      atributos={p.atributosBase}
      setAtributo={p.setAtributo}
      pontosDistribuidos={p.pontosDistribuidos}
      pontosRestantes={p.pontosRestantes}
      pontosTotais={p.pontosTotais}
      atributosSugeridos={p.bonusAplicados ? undefined : p.atributosSugeridos}
      aplicarAtributosSugeridos={p.aplicarAtributosSugeridos}
      bonusFontes={p.bonusFontes}
      multRaca={p.multRaca}
      isLight={p.isLight}
      disabled={p.enviando || p.bonusAplicados}
      somenteLeitura={p.bonusAplicados}
      attrMin={p.attrMin}
      attrMax={p.attrMax}
    />
  </div>
);

export default AtributosStage;
