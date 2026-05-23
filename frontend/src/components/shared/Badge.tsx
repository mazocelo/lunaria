import type { ComponentType, ReactNode } from 'react';
import { useTheme } from '../../contexts/theme';

type BadgeVariant =
  | 'purple'
  | 'blue'
  | 'green'
  | 'amber'
  | 'red'
  | 'slate'
  | 'indigo'
  | 'cyan'
  | 'pink';

type BadgeSize = 'sm' | 'md';

interface LucideLikeIconProps {
  size?: number | string;
  className?: string;
}

interface BadgeProps {
  children?: ReactNode;
  /** Color variant */
  variant?: BadgeVariant;
  /** Size variant */
  size?: BadgeSize;
  /** Show colored dot before text */
  dot?: boolean;
  /** Optional Lucide icon component */
  icon?: ComponentType<LucideLikeIconProps> | null;
  className?: string;
}

const Badge = ({
  children,
  variant = 'purple',
  size = 'sm',
  dot = false,
  icon: Icon = null,
  className = '',
}: BadgeProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const colors: Record<BadgeVariant, string> = {
    purple: isLight ? 'bg-purple-100 text-purple-800' : 'bg-purple-500/20 text-purple-400',
    blue: isLight ? 'bg-blue-100 text-blue-800' : 'bg-blue-500/20 text-blue-400',
    green: isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-500/20 text-emerald-400',
    amber: isLight ? 'bg-amber-100 text-amber-800' : 'bg-amber-500/20 text-amber-400',
    red: isLight ? 'bg-red-100 text-red-800' : 'bg-red-500/20 text-red-400',
    slate: isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-700/50 text-slate-300',
    indigo: isLight ? 'bg-indigo-100 text-indigo-800' : 'bg-indigo-500/20 text-indigo-400',
    cyan: isLight ? 'bg-cyan-100 text-cyan-800' : 'bg-cyan-500/20 text-cyan-400',
    pink: isLight ? 'bg-pink-100 text-pink-800' : 'bg-pink-500/20 text-pink-400',
  };

  const dotColors: Record<BadgeVariant, string> = {
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
    slate: 'bg-slate-500',
    indigo: 'bg-indigo-500',
    cyan: 'bg-cyan-500',
    pink: 'bg-pink-500',
  };

  const sizes: Record<BadgeSize, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${colors[variant]} ${sizes[size]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {Icon && <Icon size={size === 'sm' ? 12 : 14} />}
      {children}
    </span>
  );
};

export default Badge;
