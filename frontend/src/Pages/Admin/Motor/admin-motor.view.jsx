import React from 'react';

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString('pt-BR');
  } catch {
    return dateStr;
  }
}

function truncate(str, max = 80) {
  if (!str) return '-';
  const s = String(str);
  return s.length > max ? s.slice(0, max) + '...' : s;
}

function StatusBadge({ status, isDark }) {
  const colors = {
    active: 'bg-green-500/20 text-green-400',
    completed: 'bg-blue-500/20 text-blue-400',
    failed: 'bg-red-500/20 text-red-400',
    queued: 'bg-yellow-500/20 text-yellow-400',
  };
  const color = colors[status] || (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600');
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {status || 'unknown'}
    </span>
  );
}

function JsonBlock({ data, isDark }) {
  if (!data) return <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Sem dados</p>;
  return (
    <pre className={`text-xs p-3 rounded-lg overflow-auto max-h-64 ${isDark ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
      {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
    </pre>
  );
}

function SessoesTab({ sessoes, loading, isDark, fetchSessaoDetalhe, selectedRoomId }) {
  if (loading && sessoes.length === 0) {
    return <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Carregando...</div>;
  }

  if (sessoes.length === 0) {
    return <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Nenhuma sessao ativa encontrada.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className={isDark ? 'text-gray-400 border-b border-gray-700' : 'text-gray-500 border-b border-gray-200'}>
            <th className="text-left py-2 pr-4">Room ID</th>
            <th className="text-left py-2 px-2">Fase</th>
            <th className="text-center py-2 px-2">Turno</th>
            <th className="text-center py-2 px-2">Jogadores</th>
            <th className="text-center py-2 px-2">Testes Pendentes</th>
            <th className="text-left py-2 pl-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {sessoes.map((s, i) => (
            <tr
              key={s.roomId || i}
              onClick={() => fetchSessaoDetalhe(s.roomId)}
              className={`cursor-pointer transition-colors ${
                selectedRoomId === s.roomId
                  ? isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'
                  : isDark ? 'hover:bg-gray-800/50 border-b border-gray-800' : 'hover:bg-gray-50 border-b border-gray-100'
              }`}
            >
              <td className="py-2 pr-4 font-mono text-xs">{s.roomId || '-'}</td>
              <td className="py-2 px-2">{s.fase || '-'}</td>
              <td className="text-center py-2 px-2">{s.turno ?? '-'}</td>
              <td className="text-center py-2 px-2">{s.jogadores ?? '-'}</td>
              <td className="text-center py-2 px-2">{s.testesPendentes ?? 0}</td>
              <td className="py-2 pl-2"><StatusBadge status={s.status} isDark={isDark} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JobsTab({ jobs, loading, isDark, jobFilters, handleJobFilterChange, retryJob }) {
  return (
    <div>
      {/* Filter bar */}
      <div className="flex gap-3 items-end mb-4 flex-wrap">
        <div>
          <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Status</label>
          <select
            value={jobFilters.status}
            onChange={e => handleJobFilterChange('status', e.target.value)}
            className={`px-3 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="">Todos</option>
            <option value="queued">Queued</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div>
          <label className={`block text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Queue</label>
          <select
            value={jobFilters.queue}
            onChange={e => handleJobFilterChange('queue', e.target.value)}
            className={`px-3 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="">Todas</option>
            <option value="roteiro">Roteiro</option>
          </select>
        </div>
      </div>

      {loading && jobs.length === 0 && (
        <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Carregando...</div>
      )}

      {!loading && jobs.length === 0 && (
        <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Nenhum job encontrado.</div>
      )}

      {jobs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={isDark ? 'text-gray-400 border-b border-gray-700' : 'text-gray-500 border-b border-gray-200'}>
                <th className="text-left py-2 pr-2">ID</th>
                <th className="text-left py-2 px-2">Queue</th>
                <th className="text-left py-2 px-2">Status</th>
                <th className="text-left py-2 px-2">Entity Type</th>
                <th className="text-left py-2 px-2">Last Error</th>
                <th className="text-left py-2 px-2">Created At</th>
                <th className="text-center py-2 pl-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, i) => (
                <tr key={job.id || i} className={isDark ? 'border-b border-gray-800' : 'border-b border-gray-100'}>
                  <td className="py-2 pr-2 font-mono text-xs">{job.id || '-'}</td>
                  <td className="py-2 px-2">{job.queue || '-'}</td>
                  <td className="py-2 px-2"><StatusBadge status={job.status} isDark={isDark} /></td>
                  <td className="py-2 px-2">{job.entityType || '-'}</td>
                  <td className="py-2 px-2 text-xs max-w-xs" title={job.lastError || ''}>
                    {truncate(job.lastError, 80)}
                  </td>
                  <td className="py-2 px-2 text-xs">{formatDate(job.createdAt)}</td>
                  <td className="py-2 pl-2 text-center">
                    {job.status === 'failed' && (
                      <button
                        onClick={() => retryJob(job.id)}
                        className="px-3 py-1 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-colors"
                      >
                        Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DetailPanel({ sessaoDetalhe, isDark, closeSessaoDetalhe }) {
  if (!sessaoDetalhe) return null;

  return (
    <div className={`mt-6 p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold">Detalhe da Sessao</h3>
        <button
          onClick={closeSessaoDetalhe}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Fechar
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className={`text-xs uppercase tracking-wide mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Estado do Jogo</p>
          <JsonBlock data={sessaoDetalhe.estadoJogo} isDark={isDark} />
        </div>
        <div>
          <p className={`text-xs uppercase tracking-wide mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Contexto do Mestre</p>
          <JsonBlock data={sessaoDetalhe.mestreContexto} isDark={isDark} />
        </div>
        <div>
          <p className={`text-xs uppercase tracking-wide mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Testes Pendentes</p>
          <JsonBlock data={sessaoDetalhe.testesPendentes} isDark={isDark} />
        </div>
      </div>
    </div>
  );
}

export default function AdminMotorView({
  sessoes, jobs, sessaoDetalhe, loading, error,
  activeTab, setActiveTab, jobFilters, handleJobFilterChange,
  selectedRoomId, fetchSessaoDetalhe, retryJob, closeSessaoDetalhe,
  isDark
}) {
  return (
    <div className={`max-w-5xl mx-auto ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
      <h1 className="text-2xl font-bold mb-6">Admin - Motor do Jogo</h1>

      {/* Tabs */}
      <div className={`flex gap-1 mb-6 p-1 rounded-lg w-fit ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {[
          { key: 'sessoes', label: 'Sessoes Ativas' },
          { key: 'jobs', label: 'Jobs IA' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? isDark ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 shadow'
                : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {/* Tab content */}
      <div className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
        {activeTab === 'sessoes' && (
          <SessoesTab
            sessoes={sessoes}
            loading={loading}
            isDark={isDark}
            fetchSessaoDetalhe={fetchSessaoDetalhe}
            selectedRoomId={selectedRoomId}
          />
        )}
        {activeTab === 'jobs' && (
          <JobsTab
            jobs={jobs}
            loading={loading}
            isDark={isDark}
            jobFilters={jobFilters}
            handleJobFilterChange={handleJobFilterChange}
            retryJob={retryJob}
          />
        )}
      </div>

      {/* Detail panel */}
      {activeTab === 'sessoes' && (
        <DetailPanel
          sessaoDetalhe={sessaoDetalhe}
          isDark={isDark}
          closeSessaoDetalhe={closeSessaoDetalhe}
        />
      )}
    </div>
  );
}
