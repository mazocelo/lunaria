import React, { useState, useMemo } from 'react';
import { useTheme } from '../../contexts/theme.jsx';

/**
 * Componente TabelaList genérico para exibição padronizada de listas
 * 
 * @param {Object} props - Propriedades do componente
 * @param {Array} props.columns - Definição das colunas [{key, label, align?, width?, render?}]
 * @param {string|React.ReactNode} props.header - Título ou descrição da tabela (opcional)
 * @param {Array} props.data - Array de objetos que populam as linhas
 * @param {Array} props.actions - Ações customizáveis para cada linha [{label, icon?, onClick, color?, show?}]
 * @param {boolean} props.loading - Estado de carregamento (opcional)
 * @param {string} props.emptyMessage - Mensagem quando data está vazio (opcional)
 * @param {string} props.emptyIcon - Ícone para estado vazio (opcional)
 * @param {string} props.className - Classes CSS adicionais (opcional)
 * @param {string} props.keyField - Campo chave para identificação das linhas (padrão: 'id')
 * @param {boolean} props.striped - Alternar cores das linhas (opcional)
 * @param {boolean} props.hoverable - Efeito hover nas linhas (opcional)
 * @param {boolean} props.pagination - Habilitar paginação (opcional)
 * @param {number} props.initialPageSize - Tamanho inicial da página (padrão: 10)
 * @param {Array} props.pageSizeOptions - Opções de tamanho de página (padrão: [5, 10, 25, 50])
 * @param {number} props.currentPage - Página atual controlada externamente (opcional)
 * @param {number} props.pageSize - Tamanho da página controlado externamente (opcional)
 * @param {Function} props.onPageChange - Callback para mudança de página (opcional)
 * @param {Function} props.onPageSizeChange - Callback para mudança de tamanho (opcional)
 * @param {boolean} props.showPageSizeSelector - Mostrar seletor de tamanho de página (padrão: true)
 * @param {boolean} props.showPaginationInfo - Mostrar informações de paginação (padrão: true)
 */
const TabelaList = ({
  columns = [],
  header,
  data = [],
  actions = [],
  loading = false,
  emptyMessage = "Nenhum registro encontrado",
  emptyIcon = "📋",
  className = "",
  keyField = 'id',
  striped = false,
  hoverable = true,
  pagination = false,
  initialPageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  currentPage: externalCurrentPage,
  pageSize: externalPageSize,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  showPaginationInfo = true
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Estados internos de paginação (quando não controlados externamente)
  const [internalCurrentPage, setInternalCurrentPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState(initialPageSize);

  // Usar estados externos se fornecidos, senão usar internos
  const currentPage = externalCurrentPage ?? internalCurrentPage;
  const pageSize = externalPageSize ?? internalPageSize;

  // Calcular dados paginados
  const paginatedData = useMemo(() => {
    if (!pagination) return data;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, pageSize, pagination]);

  // Calcular informações de paginação
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Handlers de paginação
  const handlePageChange = (newPage) => {
    if (onPageChange) {
      onPageChange(newPage);
    } else {
      setInternalCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    const newTotalPages = Math.ceil(totalItems / newPageSize);
    const adjustedCurrentPage = Math.min(currentPage, newTotalPages);
    
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize);
      if (onPageChange && adjustedCurrentPage !== currentPage) {
        onPageChange(adjustedCurrentPage);
      }
    } else {
      setInternalPageSize(newPageSize);
      if (adjustedCurrentPage !== currentPage) {
        setInternalCurrentPage(adjustedCurrentPage);
      }
    }
  };

  // Gerar números de páginas para exibição
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const half = Math.floor(maxPagesToShow / 2);
      let start = Math.max(1, currentPage - half);
      let end = Math.min(totalPages, start + maxPagesToShow - 1);
      
      if (end - start + 1 < maxPagesToShow) {
        start = Math.max(1, end - maxPagesToShow + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  // Função para obter classes de alinhamento
  const getAlignmentClass = (align) => {
    switch (align) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      default: return 'text-left';
    }
  };

  // Função para obter classes de cores das ações (estilo RPG)
  const getActionColorClass = (color) => {
    const colors = {
      green: isLight ? 'hover:bg-green-500/20' : 'hover:bg-green-500/20',
      blue: isLight ? 'hover:bg-blue-500/20' : 'hover:bg-blue-500/20',
      purple: isLight ? 'hover:bg-purple-500/20' : 'hover:bg-purple-500/20',
      cyan: isLight ? 'hover:bg-cyan-500/20' : 'hover:bg-cyan-500/20',
      yellow: isLight ? 'hover:bg-yellow-500/20' : 'hover:bg-yellow-500/20',
      orange: isLight ? 'hover:bg-orange-500/20' : 'hover:bg-orange-500/20',
      red: isLight ? 'hover:bg-red-500/20' : 'hover:bg-red-500/20',
      warning: isLight ? 'hover:bg-yellow-500/20' : 'hover:bg-yellow-500/20',
      danger: isLight ? 'hover:bg-red-500/20' : 'hover:bg-red-500/20',
      info: isLight ? 'hover:bg-blue-500/20' : 'hover:bg-blue-500/20',
      success: isLight ? 'hover:bg-green-500/20' : 'hover:bg-green-500/20',
      default: isLight ? 'hover:bg-slate-500/20' : 'hover:bg-slate-700/50'
    };
    return colors[color] || colors.default;
  };

  // Renderizar estado de carregamento
  if (loading) {
    return (
      <div className={`card-rpg ${className}`} role="region" aria-label="Carregando dados da tabela">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 gradient-secondary rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse-slow">
              <span className="text-2xl">⚡</span>
            </div>
            <div className="text-slate-300 font-modern">Carregando dados...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card-rpg ${className}`} role="region" aria-label="Tabela de dados">
      {/* Header opcional */}
      {header && (
        <div className="flex items-center justify-between mb-6">
          {typeof header === 'string' ? (
            <h2 className={`text-xl font-fantasy font-semibold ${isLight ? 'text-slate-700' : 'text-white'}`}>
              {header}
            </h2>
          ) : (
            header
          )}
          {data.length > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse-slow" />
              <span className="text-sm text-slate-400 font-modern">
                {data.length} {data.length === 1 ? 'item encontrado' : 'itens encontrados'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Estado vazio */}
      {data.length === 0 ? (
        <div 
          className="text-center py-12"
          role="status" 
          aria-label={emptyMessage}
        >
          <div className="w-20 h-20 gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-3xl">{emptyIcon}</span>
          </div>
          <h3 className={`text-lg font-semibold mb-2 font-modern ${isLight ? 'text-slate-700' : 'text-white'}`}>
            {emptyMessage}
          </h3>
        </div>
      ) : (
        <div>
          {/* Tabela com dados */}
          <div className="overflow-x-auto">
            <table 
              className={`${isLight ? 'table-rpg-light' : 'table-rpg'} w-full`}
              role="table"
              aria-label="Dados da tabela"
            >
              {/* Cabeçalho da tabela */}
              <thead>
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={column.key || index}
                      className={`font-fantasy px-4 py-3 ${getAlignmentClass(column.align)}`}
                      style={column.width ? { width: column.width } : {}}
                      role="columnheader"
                      scope="col"
                      aria-sort="none"
                    >
                      {column.label}
                    </th>
                  ))}
                  {/* Coluna de ações */}
                  {actions.length > 0 && (
                    <th
                      className="font-fantasy px-4 py-3 text-center"
                      role="columnheader"
                      scope="col"
                    >
                      Ações
                    </th>
                  )}
                </tr>
              </thead>

              {/* Corpo da tabela */}
              <tbody>
                {paginatedData.map((row, rowIndex) => (
                  <tr
                    key={row[keyField] || rowIndex}
                    className={`${hoverable ? 'hover-lift' : ''}`}
                    role="row"
                  >
                    {/* Células de dados */}
                    {columns.map((column, colIndex) => (
                      <td
                        key={`${row[keyField] || rowIndex}-${column.key || colIndex}`}
                        className={`px-4 py-3 ${getAlignmentClass(column.align)}`}
                        role="cell"
                      >
                        {column.render 
                          ? column.render(row, rowIndex) 
                          : row[column.key] || '-'
                        }
                      </td>
                    ))}

                    {/* Célula de ações */}
                    {actions.length > 0 && (
                      <td
                        className="px-4 py-3 text-center"
                        role="cell"
                      >
                        <div 
                          className="flex items-center justify-center space-x-2"
                          role="group"
                          aria-label="Ações da linha"
                        >
                          {actions
                            .filter(action => !action.show || action.show(row))
                            .map((action, actionIndex) => (
                              <button
                                key={actionIndex}
                                type="button"
                                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                  isLight 
                                    ? 'bg-slate-200/50' 
                                    : 'bg-slate-700/50'
                                } ${getActionColorClass(action.color)}`}
                                title={action.label}
                                aria-label={`${action.label} ${row.nome || row.title || `item ${rowIndex + 1}`}`}
                                onClick={() => action.onClick && action.onClick(row, rowIndex)}
                              >
                                <span className="text-lg">{action.icon || action.label?.charAt(0)}</span>
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

          {/* Controles de paginação */}
          {pagination && data.length > 0 && (
            <div className={`mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 ${
              isLight ? 'border-t border-slate-200 pt-4' : 'border-t border-slate-700 pt-4'
            }`}>
              {/* Informações de paginação */}
              {showPaginationInfo && (
                <div className={`text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Mostrando {startItem} a {endItem} de {totalItems} {totalItems === 1 ? 'item' : 'itens'}
                </div>
              )}

              {/* Controles de navegação */}
              <div className="flex items-center gap-4">
                {/* Seletor de tamanho de página */}
                {showPageSizeSelector && (
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-modern ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Itens por página:
                    </span>
                    <select
                      value={pageSize}
                      onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                      className={`
                        px-2 py-1 rounded border text-sm font-modern
                        transition-colors duration-200
                        focus:outline-none focus:ring-2 focus:ring-purple-500
                        ${isLight
                          ? 'bg-white border-slate-300 text-slate-800 hover:border-slate-400'
                          : 'bg-slate-700 border-slate-600 text-slate-200 hover:border-slate-500'
                        }
                      `}
                      aria-label="Selecionar quantidade de itens por página"
                    >
                      {pageSizeOptions.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Navegação de páginas */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    {/* Botão Primeira Página */}
                    <button
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                      className={`
                        p-2 rounded transition-colors duration-200
                        focus:outline-none focus:ring-2 focus:ring-purple-500
                        ${currentPage === 1
                          ? 'opacity-50 cursor-not-allowed'
                          : isLight
                            ? 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                        }
                      `}
                      title="Primeira página"
                      aria-label="Ir para a primeira página"
                    >
                      <span className="text-sm">⏮️</span>
                    </button>

                    {/* Botão Página Anterior */}
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`
                        px-3 py-1 rounded text-sm font-modern
                        transition-colors duration-200
                        focus:outline-none focus:ring-2 focus:ring-purple-500
                        ${currentPage === 1
                          ? 'opacity-50 cursor-not-allowed'
                          : isLight
                            ? 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                        }
                      `}
                      aria-label="Página anterior"
                    >
                      ← Anterior
                    </button>

                    {/* Números das páginas */}
                    <div className="flex items-center gap-1">
                      {getPageNumbers().map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`
                            px-3 py-1 rounded text-sm font-modern min-w-[2rem]
                            transition-colors duration-200
                            focus:outline-none focus:ring-2 focus:ring-purple-500
                            ${pageNum === currentPage
                              ? isLight
                                ? 'bg-purple-600 text-white'
                                : 'bg-purple-500 text-white'
                              : isLight
                                ? 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                            }
                          `}
                          aria-label={`Ir para a página ${pageNum}`}
                          aria-current={pageNum === currentPage ? 'page' : undefined}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>

                    {/* Botão Próxima Página */}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`
                        px-3 py-1 rounded text-sm font-modern
                        transition-colors duration-200
                        focus:outline-none focus:ring-2 focus:ring-purple-500
                        ${currentPage === totalPages
                          ? 'opacity-50 cursor-not-allowed'
                          : isLight
                            ? 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                        }
                      `}
                      aria-label="Próxima página"
                    >
                      Próxima →
                    </button>

                    {/* Botão Última Página */}
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                      className={`
                        p-2 rounded transition-colors duration-200
                        focus:outline-none focus:ring-2 focus:ring-purple-500
                        ${currentPage === totalPages
                          ? 'opacity-50 cursor-not-allowed'
                          : isLight
                            ? 'text-slate-600 hover:text-slate-800 hover:bg-slate-100'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                        }
                      `}
                      title="Última página"
                      aria-label="Ir para a última página"
                    >
                      <span className="text-sm">⏭️</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TabelaList;