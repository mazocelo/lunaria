import { ArrowLeft, Dices, Sparkles, Swords, Shield } from 'lucide-react';
import { useTheme } from '../../../../contexts/theme.jsx';

const SYSTEMS = [
  {
    id: 'lunaria',
    label: 'Lunaria RPG',
    desc: 'Sistema original com raças, classes, vantagens e atributos',
    icon: Sparkles,
    color: {
      active: 'border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/30',
      hover: 'hover:border-purple-400/60',
      icon: 'text-purple-400',
      label: 'text-purple-300',
      labelLight: 'text-purple-700',
    },
  },
  {
    id: 'tresdet',
    label: '3D&T Alpha',
    desc: 'Simples e versátil — baseado em conceito, sem raças ou classes',
    icon: Swords,
    color: {
      active: 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30',
      hover: 'hover:border-amber-400/60',
      icon: 'text-amber-400',
      label: 'text-amber-300',
      labelLight: 'text-amber-700',
    },
  },
  {
    id: 'dnd5e',
    label: 'D&D 5e',
    desc: 'Clássico e completo — raça, classe, background e ability scores',
    icon: Shield,
    color: {
      active: 'border-red-500 bg-red-500/10 ring-2 ring-red-500/30',
      hover: 'hover:border-red-400/60',
      icon: 'text-red-400',
      label: 'text-red-300',
      labelLight: 'text-red-700',
    },
  },
];

export default function WizardSystemPicker({ onSelect, onBack }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className={`w-full max-w-lg rounded-2xl border p-8 ${
        isLight
          ? 'border-slate-200 bg-white shadow-lg'
          : 'border-slate-700/60 bg-slate-900/80 shadow-2xl'
      }`}>
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Dices size={22} className="text-amber-400" />
            <h2 className={`text-xl font-fantasy font-bold ${isLight ? 'text-slate-800' : 'text-slate-100'}`}>
              Escolha o Sistema
            </h2>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {SYSTEMS.map((sys) => {
            const Icon = sys.icon;
            return (
              <button
                key={sys.id}
                onClick={() => onSelect(sys.id)}
                className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all cursor-pointer ${
                  isLight
                    ? `border-slate-200 bg-slate-50 hover:bg-slate-100 ${sys.color.hover}`
                    : `border-slate-700/60 bg-slate-800/50 hover:bg-slate-800 ${sys.color.hover}`
                }`}
              >
                <div className={`shrink-0 p-3 rounded-lg ${
                  isLight ? 'bg-slate-100' : 'bg-slate-700/50'
                }`}>
                  <Icon size={24} className={sys.color.icon} />
                </div>
                <div className="min-w-0">
                  <p className={`text-base font-bold font-fantasy ${
                    isLight ? sys.color.labelLight : sys.color.label
                  }`}>
                    {sys.label}
                  </p>
                  <p className={`text-sm mt-0.5 ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {sys.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
