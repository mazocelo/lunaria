import type { ComponentType, ReactNode } from 'react';
import { useTheme } from '../../contexts/theme';

interface LucideLikeIconProps {
  size?: number | string;
  className?: string;
}

interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional Lucide icon component */
  icon?: ComponentType<LucideLikeIconProps> | null;
  /** Optional right-side content (buttons, etc) */
  actions?: ReactNode;
  className?: string;
}

const PageHeader = ({
  title,
  subtitle,
  icon: Icon = null,
  actions = null,
  className = '',
}: PageHeaderProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
            isLight ? 'bg-purple-100 text-purple-600' : 'bg-purple-900/40 text-purple-400'
          }`}>
            <Icon size={22} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className={`text-2xl font-fantasy font-bold truncate ${
            isLight ? 'text-slate-800' : 'text-white'
          }`}>
            {title}
          </h1>
          {subtitle && (
            <p className={`text-sm font-modern mt-0.5 ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
