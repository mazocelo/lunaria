import { ArrowLeft, Sparkles, Swords, Shield, Users } from 'lucide-react';
import type { ComponentType } from 'react';
import { useTheme } from '../../../../contexts/theme';
import { PageHeader } from '../../../../components/shared';

type IconComponent = ComponentType<{ size?: number; className?: string }>;

interface SystemColor {
  hover: string;
  icon: string;
}

interface SystemDef {
  id: string;
  label: string;
  desc: string;
  icon: IconComponent;
  color: SystemColor;
}

const SYSTEMS: SystemDef[] = [
  {
    id: 'lunaria',
    label: 'Lunaria RPG',
    desc: 'Sistema original com raças, classes, vantagens e atributos',
    icon: Sparkles,
    color: {
      hover: 'hover:border-[var(--primary)]/60',
      icon: 'text-[var(--primary)]',
    },
  },
  {
    id: 'tresdet',
    label: '3D&T Alpha',
    desc: 'Simples e versátil — baseado em conceito, sem raças ou classes',
    icon: Swords,
    color: {
      hover: 'hover:border-amber-400/60',
      icon: 'text-amber-400',
    },
  },
  {
    id: 'dnd5e',
    label: 'D&D 5e',
    desc: 'Clássico e completo — raça, classe, background e ability scores',
    icon: Shield,
    color: {
      hover: 'hover:border-red-400/60',
      icon: 'text-red-400',
    },
  },
];

interface WizardSystemPickerProps {
  onSelect: (id: string) => void;
  onBack: () => void;
}

export default function WizardSystemPicker({ onSelect, onBack }: WizardSystemPickerProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="animate-fade-in mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Novo personagem"
        subtitle="Escolha o sistema de regras"
        icon={Users}
        actions={
          <button type="button" onClick={onBack} className="btn-rpg-secondary inline-flex items-center gap-2 cursor-pointer">
            <ArrowLeft size={16} /> Voltar
          </button>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {SYSTEMS.map(({ id, label, desc, icon: Icon, color }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={`card-rpg hover-lift flex h-full flex-col items-start gap-3 text-left cursor-pointer ${color.hover}`}
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)]/10 ${color.icon}`}><Icon size={22} /></span>
            <span className={`font-fantasy text-xl font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{label}</span>
            <span className={`font-modern text-sm ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
