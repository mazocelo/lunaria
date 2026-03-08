import React from 'react';
import { useTheme } from '../../contexts/theme.jsx';

/**
 * PageHeader - Consistent page title + subtitle + actions
 *
 * @param {Object} props
 * @param {string} props.title - Page title
 * @param {string} props.subtitle - Optional subtitle/description
 * @param {React.ReactNode} props.icon - Optional Lucide icon component
 * @param {React.ReactNode} props.actions - Optional right-side content (buttons, etc)
 * @param {string} props.className - Additional classes
 */
const PageHeader = ({
  title,
  subtitle,
  icon: Icon = null,
  actions = null,
  className = ''
}) => {
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
