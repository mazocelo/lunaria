import React from 'react';
import { useTheme } from '../../contexts/theme.jsx';

/**
 * Componente DataTable reutilizável para exibição de dados em tabela
 * @param {Object} props - Propriedades do componente
 * @param {Array} props.columns - Array de colunas com {key, label, align, render}
 * @param {Array} props.data - Array de dados
 * @param {string} props.keyField - Campo chave para identificação (padrão: 'id')
 * @param {Array} props.actions - Array de ações com {label, icon, onClick, color}
 * @param {boolean} props.loading - Estado de carregamento
 * @param {string} props.emptyMessage - Mensagem quando não há dados
 * @param {React.ReactNode} props.emptyIcon - Ícone para estado vazio
 * @param {string} props.title - Título da tabela
 * @param {number} props.totalItems - Total de itens para exibir
 * @param {string} props.className - Classes CSS adicionais
 */
const DataTable = ({ 
  columns = [], 
  data = [], 
  keyField = 'id', 
  actions = [],
  loading = false,
  emptyMessage = "Nenhum dado encontrado",
  emptyIcon = "📋",
  title = "Lista de Dados",
  totalItems = null,
  className = ""
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Cores para ações
  const getActionColor = (color) => {
    const colors = {
      green: isLight ? 'hover:bg-green-500/20' : 'hover:bg-green-500/20',
      blue: isLight ? 'hover:bg-blue-500/20' : 'hover:bg-blue-500/20',
      purple: isLight ? 'hover:bg-purple-500/20' : 'hover:bg-purple-500/20',
      cyan: isLight ? 'hover:bg-cyan-500/20' : 'hover:bg-cyan-500/20',
      yellow: isLight ? 'hover:bg-yellow-500/20' : 'hover:bg-yellow-500/20',
      red: isLight ? 'hover:bg-red-500/20' : 'hover:bg-red-500/20',
      default: isLight ? 'hover:bg-slate-500/20' : 'hover:bg-slate-700/50'
    };
    return colors[color] || colors.default;
  };

  return (
    <div className={`card-rpg ${className}`}>
      {/* Header da tabela */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-fantasy font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>
          {title}
        </h2>
        {totalItems !== null && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse-slow" />
            <span className="text-sm text-slate-400 font-modern">
              {data.length} itens encontrados
            </span>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse-slow">
              <span className="text-2xl">⚡</span>
            </div>
            <div className="text-slate-300 font-modern">Carregando dados...</div>
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {!loading && data.length === 0 && (
        <div className="text-center py-12">
          <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">{emptyIcon}</span>
          </div>
          <h3 className={`text-lg font-semibold mb-2 font-modern ${isLight ? 'text-slate-700' : 'text-white'}`}>
            {emptyMessage}
          </h3>
        </div>
      )}

      {/* Tabela */}
      {!loading && data.length > 0 && (
        <div className="overflow-x-auto">
          <table className={`${isLight ? 'table-rpg-light' : 'table-rpg'} w-full`}>
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`font-fantasy px-4 py-3 ${col.align === 'center' ? 'text-center' : 'text-left'}`}
                  >
                    {col.label}
                  </th>
                ))}
                {actions.length > 0 && (
                  <th className="font-fantasy px-4 py-3 text-center">Ações</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row[keyField]} className="hover-lift">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 ${col.align === 'center' ? 'text-center' : 'text-left'}`}
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        {actions
                          .filter((action) => !action.show || action.show(row))
                          .map((action, i) => (
                            <button
                              key={i}
                              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                isLight 
                                  ? 'bg-slate-200/50' 
                                  : 'bg-slate-700/50'
                              } ${getActionColor(action.color)}`}
                              title={action.label}
                              onClick={() => action.onClick && action.onClick(row)}
                            >
                              <span className="text-lg">{action.icon}</span>
                            </button>
                          ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DataTable; 