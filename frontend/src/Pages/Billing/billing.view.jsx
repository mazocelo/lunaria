import React from 'react';

const PROVIDER_LABELS = {
  groq: 'Groq (Llama)',
  gemini: 'Gemini',
  elevenlabs: 'ElevenLabs',
  cartesia: 'Cartesia',
  leonardo: 'Leonardo AI',
};

const TIPO_LABELS = {
  text: 'Texto (LLM)',
  tts: 'Voz (TTS)',
  image: 'Imagem',
};

function formatCurrency(val) {
  return `$${(val || 0).toFixed(4)}`;
}

function formatNumber(val) {
  if (!val) return '0';
  if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
  return val.toString();
}

function StatCard({ label, value, sub, isDark }) {
  return (
    <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
      <p className={`text-xs uppercase tracking-wide ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  );
}

function ProviderTable({ data, isDark }) {
  if (!data || data.length === 0) return <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Nenhum dado</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className={isDark ? 'text-gray-400 border-b border-gray-700' : 'text-gray-500 border-b border-gray-200'}>
            <th className="text-left py-2 pr-4">Provider</th>
            <th className="text-right py-2 px-2">Chamadas</th>
            <th className="text-right py-2 px-2">Tokens</th>
            <th className="text-right py-2 px-2">Chars</th>
            <th className="text-right py-2 pl-2">Custo</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={isDark ? 'border-b border-gray-800' : 'border-b border-gray-100'}>
              <td className="py-2 pr-4 font-medium">{PROVIDER_LABELS[row.provider] || row.provider}</td>
              <td className="text-right py-2 px-2">{formatNumber(row.chamadas)}</td>
              <td className="text-right py-2 px-2">{formatNumber((row.input_tokens || 0) + (row.output_tokens || 0))}</td>
              <td className="text-right py-2 px-2">{formatNumber(row.caracteres)}</td>
              <td className="text-right py-2 pl-2 font-mono">{formatCurrency(row.custo_usd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TipoTable({ data, isDark }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className={isDark ? 'text-gray-400 border-b border-gray-700' : 'text-gray-500 border-b border-gray-200'}>
            <th className="text-left py-2 pr-4">Tipo</th>
            <th className="text-right py-2 px-2">Chamadas</th>
            <th className="text-right py-2 pl-2">Custo</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={isDark ? 'border-b border-gray-800' : 'border-b border-gray-100'}>
              <td className="py-2 pr-4 font-medium">{TIPO_LABELS[row.tipo] || row.tipo}</td>
              <td className="text-right py-2 px-2">{formatNumber(row.chamadas)}</td>
              <td className="text-right py-2 pl-2 font-mono">{formatCurrency(row.custo_usd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserTable({ data, isDark }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className={isDark ? 'text-gray-400 border-b border-gray-700' : 'text-gray-500 border-b border-gray-200'}>
            <th className="text-left py-2 pr-4">Usuario</th>
            <th className="text-right py-2 px-2">Chamadas</th>
            <th className="text-right py-2 pl-2">Custo</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={isDark ? 'border-b border-gray-800' : 'border-b border-gray-100'}>
              <td className="py-2 pr-4 font-medium">{row.nome}</td>
              <td className="text-right py-2 px-2">{formatNumber(row.chamadas)}</td>
              <td className="text-right py-2 pl-2 font-mono">{formatCurrency(row.custo_usd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DailyChart({ data, isDark }) {
  if (!data || data.length === 0) return null;
  const maxCusto = Math.max(...data.map(d => d.custo || 0), 0.001);
  const days = data.slice(0, 30).reverse();

  return (
    <div className="flex items-end gap-1 h-32">
      {days.map((d, i) => {
        const height = Math.max(2, (d.custo / maxCusto) * 100);
        return (
          <div key={i} className="flex-1 flex flex-col items-center group relative" title={`${d.dia}: ${formatCurrency(d.custo)} (${d.chamadas} chamadas)`}>
            <div
              className={`w-full rounded-t transition-colors ${isDark ? 'bg-indigo-500 hover:bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-500'}`}
              style={{ height: `${height}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

export default function BillingView({
  loading, error, usage, globalUsage,
  viewMode, setViewMode, dateRange, handleDateChange, handleApplyFilter,
  isAdmin, isDark
}) {
  const currentData = viewMode === 'global' ? globalUsage : usage;

  return (
    <div className={`max-w-4xl mx-auto ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
      <h1 className="text-2xl font-bold mb-6">Consumo de API</h1>

      {/* Tabs pessoal/global */}
      {isAdmin && (
        <div className={`flex gap-1 mb-6 p-1 rounded-lg w-fit ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          {['pessoal', 'global'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all capitalize ${
                viewMode === mode
                  ? isDark ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 shadow'
                  : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {mode === 'pessoal' ? 'Meu Consumo' : 'Global (Admin)'}
            </button>
          ))}
        </div>
      )}

      {/* Date filter */}
      <div className={`flex gap-3 items-end mb-6 flex-wrap`}>
        <div>
          <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>De</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={e => handleDateChange('from', e.target.value)}
            className={`px-3 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          />
        </div>
        <div>
          <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ate</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={e => handleDateChange('to', e.target.value)}
            className={`px-3 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          />
        </div>
        <button
          onClick={handleApplyFilter}
          className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 transition-colors"
        >
          Filtrar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Carregando...</div>
      )}

      {/* Content */}
      {!loading && currentData && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard isDark={isDark} label="Total Chamadas" value={formatNumber(currentData.totais?.chamadas)} />
            <StatCard isDark={isDark} label="Custo Total" value={formatCurrency(currentData.totais?.custo_usd)} />
            <StatCard isDark={isDark} label="Tokens" value={formatNumber((currentData.totais?.input_tokens || 0) + (currentData.totais?.output_tokens || 0))} sub={`In: ${formatNumber(currentData.totais?.input_tokens)} | Out: ${formatNumber(currentData.totais?.output_tokens)}`} />
            <StatCard isDark={isDark} label="Caracteres TTS" value={formatNumber(currentData.totais?.caracteres)} />
          </div>

          {/* Daily chart */}
          {currentData.porDia && currentData.porDia.length > 0 && (
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className="text-sm font-semibold mb-3">Custo Diario (ultimos 30 dias)</h3>
              <DailyChart data={currentData.porDia} isDark={isDark} />
            </div>
          )}

          {/* Provider breakdown */}
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="text-sm font-semibold mb-3">Por Provider</h3>
            <ProviderTable data={currentData.porProvider} isDark={isDark} />
          </div>

          {/* Type breakdown */}
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="text-sm font-semibold mb-3">Por Tipo</h3>
            <TipoTable data={currentData.porTipo} isDark={isDark} />
          </div>

          {/* User breakdown (admin global only) */}
          {viewMode === 'global' && currentData.porUsuario && (
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className="text-sm font-semibold mb-3">Por Usuario</h3>
              <UserTable data={currentData.porUsuario} isDark={isDark} />
            </div>
          )}
        </div>
      )}

      {!loading && !currentData && !error && (
        <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Nenhum dado de consumo encontrado.
        </div>
      )}
    </div>
  );
}
