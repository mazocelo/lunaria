import { useState, useCallback, type ComponentType } from 'react';
import { useTheme } from '../contexts/theme';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Sword, BookOpen, Users,
  ChevronRight, ChevronLeft, X,
} from 'lucide-react';

const STORAGE_KEY = 'lunaria_onboarding_completed';

interface OnboardingStep {
  icon: ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  tip: string;
  route?: string;
}

const STEPS: OnboardingStep[] = [
  {
    icon: Sparkles,
    iconColor: 'text-yellow-400',
    iconBg: 'bg-yellow-500/20',
    title: 'Bem-vindo ao Lunaria!',
    description: 'Lunaria é um RPG de mesa digital com um Mestre IA que narra aventuras em tempo real. Jogue sozinho ou com amigos!',
    tip: 'Tudo acontece por texto — descreva suas ações e o Mestre responde.',
  },
  {
    icon: Sword,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/20',
    title: 'Crie seu Personagem',
    description: 'Escolha raça, classe e distribua atributos para criar um herói único. Passe o mouse nos atributos para ver o que cada um faz.',
    tip: 'Acesse "Personagens" no menu lateral para começar.',
    route: '/personagens',
  },
  {
    icon: BookOpen,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/20',
    title: 'Entre em uma História',
    description: 'Crie sua própria aventura ou entre em uma existente. Cada história tem temas, cenários e desafios únicos.',
    tip: 'A página inicial mostra suas histórias. Clique em "Nova História" para criar.',
    route: '/',
  },
  {
    icon: Users,
    iconColor: 'text-green-400',
    iconBg: 'bg-green-500/20',
    title: 'Convide Amigos',
    description: 'Compartilhe o link da história ou envie convites por email. Joguem juntos em tempo real!',
    tip: 'Na página da história, use "Copiar link de convite" para compartilhar.',
    route: '/amigos',
  },
];

/**
 * Verifica se o onboarding ja foi concluido
 */
export function isOnboardingCompleted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Marca o onboarding como concluido
 */
export function markOnboardingCompleted(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch { /* ignore */ }
}

interface OnboardingTourProps {
  onComplete?: () => void;
}

const OnboardingTour = ({ onComplete }: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isLight = theme === 'light';

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const isFirst = currentStep === 0;
  const Icon = step.icon;

  const handleComplete = useCallback(() => {
    markOnboardingCompleted();
    onComplete?.();
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  const handleNext = useCallback(() => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [isLast, handleComplete]);

  const handlePrev = useCallback(() => {
    if (!isFirst) setCurrentStep(prev => prev - 1);
  }, [isFirst]);

  const handleGoTo = useCallback(() => {
    if (step.route) {
      handleComplete();
      navigate(step.route);
    }
  }, [step.route, handleComplete, navigate]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Card */}
      <div className={`relative max-w-lg w-full ${isLight ? 'glass-light' : 'glass'} rounded-xl border ${
        isLight ? 'border-purple-300/30' : 'border-purple-500/30'
      } animate-scale-in overflow-hidden`}>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          className={`absolute top-3 right-3 p-1.5 rounded-lg transition-colors cursor-pointer ${
            isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-700 text-slate-400'
          }`}
          title="Pular tutorial"
        >
          <X size={18} />
        </button>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? 'w-8 bg-purple-500'
                  : i < currentStep
                    ? 'w-4 bg-purple-500/50'
                    : `w-4 ${isLight ? 'bg-slate-300' : 'bg-slate-600'}`
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-8 pt-5 text-center">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl ${step.iconBg} flex items-center justify-center mx-auto mb-5`}>
            <Icon size={32} className={step.iconColor} />
          </div>

          {/* Title */}
          <h2 className={`text-2xl font-bold font-fantasy mb-3 ${
            isLight ? 'text-slate-800' : 'text-white'
          }`}>
            {step.title}
          </h2>

          {/* Description */}
          <p className={`text-sm font-modern mb-4 leading-relaxed ${
            isLight ? 'text-slate-600' : 'text-slate-300'
          }`}>
            {step.description}
          </p>

          {/* Tip */}
          <div className={`inline-block px-4 py-2 rounded-lg text-xs font-modern ${
            isLight ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/15 text-purple-300'
          }`}>
            💡 {step.tip}
          </div>
        </div>

        {/* Actions */}
        <div className={`flex items-center justify-between px-8 pb-6 ${
          isFirst ? 'justify-end' : ''
        }`}>
          {/* Left: Back or Go To */}
          <div className="flex gap-2">
            {!isFirst && (
              <button
                onClick={handlePrev}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-modern transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                <ChevronLeft size={16} />
                Voltar
              </button>
            )}
            {step.route && (
              <button
                onClick={handleGoTo}
                className={`px-4 py-2 rounded-lg text-sm font-modern transition-colors cursor-pointer ${
                  isLight
                    ? 'text-purple-600 hover:bg-purple-100'
                    : 'text-purple-400 hover:bg-purple-500/15'
                }`}
              >
                Ir para lá →
              </button>
            )}
          </div>

          {/* Right: Next / Finish */}
          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-5 py-2 rounded-lg text-sm font-modern bg-purple-600 hover:bg-purple-700 text-white transition-colors cursor-pointer"
          >
            {isLast ? 'Começar a jogar!' : 'Próximo'}
            {!isLast && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTour;
