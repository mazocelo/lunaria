import React from 'react';
import { useTheme } from '../../contexts/theme.jsx';

/**
 * EmptyState - Placeholder for empty lists/pages
 *
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Lucide icon component
 * @param {string} props.title - Title text
 * @param {string} props.description - Description text
 * @param {React.ReactNode} props.action - Optional action button/link
 * @param {string} props.className - Additional classes
 */
const EmptyState = ({
  icon: Icon = null,
  title = 'Nenhum item encontrado',
  description = '',
  action = null,
  className = ''
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className={`empty-state ${className}`}>
      {Icon && (
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
          isLight ? 'bg-slate-100 text-slate-400' : 'bg-slate-800/60 text-slate-500'
        }`}>
          <Icon size={32} />
        </div>
      )}
      <h3 className={isLight ? 'text-slate-700' : 'text-slate-300'}>{title}</h3>
      {description && (
        <p className={isLight ? 'text-slate-500' : 'text-slate-500'}>{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

export default EmptyState;
