import React from 'react';

/**
 * Skeleton que imita linhas de tabela para loading states em listas.
 * @param {number} rows - Número de linhas skeleton (default 5)
 * @param {number} cols - Número de colunas por linha (default 4)
 */
const TableSkeleton = ({ rows = 5, cols = 4 }) => {
  return (
    <div className="animate-fade-in">
      <div className="card-rpg">
        {/* Header skeleton */}
        <div className="flex items-center gap-4 mb-6">
          <div className="skeleton h-8 w-48 rounded" />
          <div className="skeleton h-8 w-32 rounded ml-auto" />
        </div>

        {/* Table rows */}
        <div className="space-y-3">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-white/5">
              {Array.from({ length: cols }, (_, j) => (
                <div
                  key={j}
                  className="skeleton h-4 rounded"
                  style={{
                    width: j === 0 ? '40px' : j === 1 ? '30%' : `${Math.floor(60 / (cols - 2))}%`,
                    animationDelay: `${(i * cols + j) * 50}ms`
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TableSkeleton;
