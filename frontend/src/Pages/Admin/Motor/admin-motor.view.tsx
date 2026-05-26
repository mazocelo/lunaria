import type { MotorSessao, MotorJob } from './admin-motor.model';

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  try {
    return new Date(dateStr).toLocaleString('pt-BR');
  } catch {
    return dateStr;
  }
}

function truncate(str: string | undefined, max = 80): string {
  if (!str) return '-';
  const s = String(str);
  return s.length > max ? s.slice(0, max) + '...' : s;
}

interface StatusBadgeProps { status: string | undefined; isDark: boolean }

function StatusBadge({ status, isDark }: StatusBadgeProps) {
  const colors: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    completed: 'bg-blue-500/20 text-blue-400',
    failed: 'bg-red-500/20 text-red-400',
    queued: 'bg-yellow-500/20 text-yellow-400',
  };
  const color = (status && colors[status]) || (isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600');
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {status || 'unknown'}
    </span>
  );
}

interface JsonBlockProps { data: unknown; isDark: boolean }

function JsonBlock({ data, isDark }: JsonBlockProps) {
  if (!data) return <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Sem dados</p>;
  return (
    <pre className={`text-xs p-3 rounded-lg overflow-auto max-h-64 ${isDark ? 'bg-gray-900 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
      {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
    </pre>
  );
}

interface SessoesTabProps {
  sessoes: MotorSessao[];
  loading: boolean;
  isDark: boolean;
  fetchSessaoDetalhe: (id: string) => void;
  selectedRoomId: string | null;
}

function SessoesTab({ sessoes, loading, isDark, fetchSessaoDetalhe, selectedRoomId }: SessoesTabProps) {
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
              key={s.id || i}
              onClick={() => s.id && fetchSessaoDetalhe(s.id)}
              className={`cursor-pointer transition-colors ${
                selectedRoomId === s.id
                  ? isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'
                  : isDark ? 'hover:bg-gray-800/50 border-b border-gray-800' : 'hover:bg-gray-50 border-b border-gray-100'
              }`}
            >
              <td className="py-2 pr-4 font-mono text-xs">{s.id || '-'}</td>
              <td className="py-2 px-2">{s.estadoJogo?.fase || '-'}</td>
              <td className="text-center py-2 px-2">{s.estadoJogo?.turnoAtual ?? '-'}</td>
              <td className="text-center py-2 px-2">{s.jogadoresCount ?? '-'}</td>
              <td className="text-center py-2 px-2">{s.estadoJogo?.testesPendentesCount ?? 0}</td>
              <td className="py-2 pl-2"><StatusBadge status={s.status} isDark={isDark} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface JobsTabProps {
  jobs: MotorJob[];
  loading: boolean;
  isDark: boolean;
  jobFilters: { status: string; queue: string };
  handleJobFilterChange: (field: 'status' | 'queue', value: string) => void;
  retryJob: (id: string) => void;
}

function JobsTab({ jobs, loading, isDark, jobFilters, handleJobFilterChange, retryJob }: JobsTabProps) {
  return (
    <div>
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
                  <td className="py-2 px-2">{job.entity_type || '-'}</td>
                  <td className="py-2 px-2 text-xs max-w-xs" title={job.last_error || ''}>
                    {truncate(job.last_error, 80)}
                  </td>
                  <td className="py-2 px-2 text-xs">{formatDate(job.created_at)}</td>
                  <td className="py-2 pl-2 text-center">
                    {job.status === 'failed' && job.id && (
                      <button
                        onClick={() => retryJob(job.id!)}
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

interface DetailPanelProps {
  sessaoDetalhe: MotorSessao | null;
  isDark: boolean;
  closeSessaoDetalhe: () => void;
}

function DetailPanel({ sessaoDetalhe, isDark, closeSessaoDetalhe }: DetailPanelProps) {
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
          <JsonBlock data={sessaoDetalhe.estadoJogo?.testesPendentes} isDark={isDark} />
        </div>
      </div>
    </div>
  );
}

interface AdminMotorViewProps {
  sessoes: MotorSessao[];
  jobs: MotorJob[];
  sessaoDetalhe: MotorSessao | null;
  loading: boolean;
  error: string | null;
  activeTab: 'sessoes' | 'jobs';
  setActiveTab: (tab: 'sessoes' | 'jobs') => void;
  jobFilters: { status: string; queue: string };
  handleJobFilterChange: (field: 'status' | 'queue', value: string) => void;
  selectedRoomId: string | null;
  fetchSessaoDetalhe: (id: string) => void;
  retryJob: (id: string) => void;
  closeSessaoDetalhe: () => void;
  isDark: boolean;
}

export default function AdminMotorView({
  sessoes, jobs, sessaoDetalhe, loading, error,
  activeTab, setActiveTab, jobFilters, handleJobFilterChange,
  selectedRoomId, fetchSessaoDetalhe, retryJob, closeSessaoDetalhe,
  isDark
}: AdminMotorViewProps) {
  return (
    <div className={`max-w-5xl mx-auto ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
      <h1 className="text-2xl font-bold mb-6">Admin - Motor do Jogo</h1>

      <div className={`flex gap-1 mb-6 p-1 rounded-lg w-fit ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
        {([
          { key: 'sessoes' as const, label: 'Sessoes Ativas' },
          { key: 'jobs' as const, label: 'Jobs IA' },
        ]).map(tab => (
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

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

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
