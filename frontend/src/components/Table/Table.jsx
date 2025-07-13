import React from 'react';
import { useTheme } from '../../contexts/theme.jsx';

const Table = ({ columns, data, keyField = 'id', actions = [] }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className="overflow-x-auto">
      <table className={`${isLight ? 'table-rpg-light' : 'table-rpg'} w-full min-w-[1000px]`}>
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
                    {actions.map((action, i) => (
                      <button
                        key={i}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                          isLight 
                            ? 'bg-slate-200/50 hover:bg-purple-500/20' 
                            : 'bg-slate-700/50 hover:bg-purple-500/20'
                        }`}
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
  );
};

export default Table; 