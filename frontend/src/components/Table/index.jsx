import React from 'react';

const Table = ({ columns = [], data = [], className = "" }) => {
    return (
        <table className={`w-full border-collapse ${className}`}>
            <thead>
                <tr>
                    {columns.map((col) => (
                        <th
                            key={col.key}
                            className="border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-4 py-2"
                        >
                            {col.title}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.length === 0 ? (
                    <tr>
                        <td
                            colSpan={columns.length}
                            className="text-center px-4 py-2 text-zinc-700 dark:text-zinc-300"
                        >
                            Nenhum dado disponível
                        </td>
                    </tr>
                ) : (
                    data.map((row, idx) => (
                        <tr key={idx} className="even:bg-gray-50 dark:even:bg-zinc-900">
                            {columns.map((col) => (
                                <td
                                    key={col.key}
                                    className="border border-gray-300 dark:border-zinc-700 px-4 py-2 text-zinc-900 dark:text-zinc-100"
                                >
                                    {row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    );
};

export default Table;