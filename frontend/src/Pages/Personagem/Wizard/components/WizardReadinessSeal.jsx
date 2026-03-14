import React from 'react';
import { Flame, Hammer, ShieldCheck } from 'lucide-react';

const READINESS_CONFIG = {
  open: {
    label: 'Forja aberta',
    hint: 'Base em preparacao',
    icon: Flame,
    className: 'wa-readiness-open',
  },
  shaping: {
    label: 'Estrutura montada',
    hint: 'Build coerente',
    icon: Hammer,
    className: 'wa-readiness-shaping',
  },
  sealed: {
    label: 'Pronto para selar',
    hint: 'Ficha pronta',
    icon: ShieldCheck,
    className: 'wa-readiness-sealed',
  },
};

const WizardReadinessSeal = ({ readinessState = 'open', compact = false }) => {
  const config = READINESS_CONFIG[readinessState] || READINESS_CONFIG.open;
  const Icon = config.icon;

  return (
    <div className={[
      'wa-readiness-seal inline-flex items-center gap-2 rounded-full',
      compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-xs',
      config.className,
    ].join(' ')}>
      <span className="wa-readiness-core inline-flex h-7 w-7 items-center justify-center rounded-full">
        <Icon size={compact ? 13 : 14} />
      </span>
      <span className="min-w-0">
        <span className="block font-modern font-semibold leading-none">{config.label}</span>
        {!compact && <span className="mt-0.5 block opacity-75">{config.hint}</span>}
      </span>
    </div>
  );
};

export default WizardReadinessSeal;
