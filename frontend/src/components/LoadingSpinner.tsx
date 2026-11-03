import { useTheme } from '../contexts/theme';

type LoadingSpinnerSize = 'sm' | 'small' | 'medium' | 'large' | 'lg' | 'xl';
type LoadingSpinnerVariant = 'primary' | 'secondary' | 'accent';

interface LoadingSpinnerProps {
  size?: LoadingSpinnerSize;
  text?: string;
  showText?: boolean;
  variant?: LoadingSpinnerVariant;
}

const LoadingSpinner = ({
  size = 'medium',
  text = 'Carregando...',
  showText = true,
  variant = 'primary',
}: LoadingSpinnerProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const sizeClasses: Record<LoadingSpinnerSize, string> = {
    sm: 'w-4 h-4',
    small: 'w-6 h-6',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const variantClasses: Record<LoadingSpinnerVariant, string> = {
    primary: 'border-purple-500',
    secondary: 'border-cyan-500',
    accent: 'border-green-500',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className={`${sizeClasses[size]} border-2 rounded-full animate-spin ${variantClasses[variant]} ${
        isLight ? 'border-slate-300' : 'border-slate-700'
      }`} />
      {showText && (
        <p className={`font-modern text-sm animate-pulse ${
          isLight ? 'text-slate-600' : 'text-slate-400'
        }`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
