import type { ComponentType, ReactNode } from 'react';
import { useTheme } from '../contexts/theme';

type StatCardVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger';
type TrendDirection = 'up' | 'down' | 'neutral';

interface StatCardTrend {
  direction: TrendDirection;
  value: string;
}

interface StatCardProps {
  title: ReactNode;
  value: ReactNode;
  icon?: ReactNode | ComponentType<{ size?: number; className?: string }>;
  variant?: StatCardVariant;
  trend?: StatCardTrend | null;
  subtitle?: ReactNode;
  className?: string;
}

const variantClasses: Record<StatCardVariant, string> = {
  primary: 'gradient-primary',
  secondary: 'gradient-secondary',
  accent: 'gradient-accent',
  success: 'bg-green-600',
  warning: 'bg-yellow-600',
  danger: 'bg-red-600',
};

const StatCard = ({
  title,
  value,
  icon,
  variant = 'primary',
  trend = null,
  subtitle = null,
  className = '',
}: StatCardProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const trendColors: Record<TrendDirection, string> = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: isLight ? 'text-slate-500' : 'text-slate-400',
  };

  // Support both emoji/text icons and Lucide-like components.
  const isComponentIcon = typeof icon === 'function';
  const IconComponent = isComponentIcon
    ? (icon as ComponentType<{ size?: number; className?: string }>)
    : null;

  return (
    <div className={`card-rpg hover-lift ${className}`}>
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 ${variantClasses[variant]} rounded-xl flex items-center justify-center flex-shrink-0`}>
          {IconComponent ? (
            <IconComponent size={22} className="text-white" />
          ) : (
            <span className="text-xl">{icon as ReactNode}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-2xl font-bold font-modern ${
            isLight ? 'text-slate-800' : 'text-white'
          }`}>
            {value}
          </div>
          <div className={`text-sm font-modern ${
            isLight ? 'text-slate-600' : 'text-slate-400'
          }`}>
            {title}
          </div>
          {subtitle && (
            <div className={`text-xs font-modern mt-1 ${
              isLight ? 'text-slate-500' : 'text-slate-500'
            }`}>
              {subtitle}
            </div>
          )}
          {trend && (
            <div className={`text-xs font-semibold mt-1 ${trendColors[trend.direction]}`}>
              {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'}
              {trend.value}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
