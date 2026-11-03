import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../../services/ApiClient';

export interface MotorSessao {
  id?: string;
  estadoJogo?: {
    fase?: string;
    turnoAtual?: number;
    testesPendentesCount?: number;
    testesPendentes?: unknown;
  };
  jogadoresCount?: number;
  status?: string;
  mestreContexto?: unknown;
}

export interface MotorJob {
  id?: string;
  queue?: string;
  status?: string;
  entity_type?: string;
  last_error?: string;
  created_at?: string;
}

type AdminMotorTab = 'sessoes' | 'jobs';
type JobFilterField = 'status' | 'queue';

export function useAdminMotorModel() {
  const [sessoes, setSessoes] = useState<MotorSessao[]>([]);
  const [jobs, setJobs] = useState<MotorJob[]>([]);
  const [sessaoDetalhe, setSessaoDetalhe] = useState<MotorSessao | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminMotorTab>('sessoes');
  const [jobFilters, setJobFilters] = useState<{ status: string; queue: string }>({ status: '', queue: '' });
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const fetchSessoes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/admin/motor/sessoes') as { success?: boolean; data?: { sessoes?: MotorSessao[] } };
      if (response.success) setSessoes(response.data?.sessoes || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar sessoes';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (jobFilters.status) params.status = jobFilters.status;
      if (jobFilters.queue) params.queue = jobFilters.queue;

      const queryString = new URLSearchParams(params).toString();
      const suffix = queryString ? `?${queryString}` : '';

      const response = await apiClient.get(`/admin/motor/jobs${suffix}`) as { success?: boolean; data?: { jobs?: MotorJob[] } };
      if (response.success) setJobs(response.data?.jobs || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar jobs';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [jobFilters]);

  const fetchSessaoDetalhe = useCallback(async (roomId: string) => {
    setSelectedRoomId(roomId);
    setError(null);
    try {
      const response = await apiClient.get(`/admin/motor/sessoes/${roomId}`) as { success?: boolean; data?: MotorSessao };
      if (response.success) setSessaoDetalhe(response.data || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar detalhe da sessao';
      setError(message);
    }
  }, []);

  const retryJob = useCallback(async (jobId: string) => {
    setError(null);
    try {
      await apiClient.post(`/admin/motor/jobs/${jobId}/retry`);
      await fetchJobs();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao reprocessar job';
      setError(message);
    }
  }, [fetchJobs]);

  const closeSessaoDetalhe = useCallback(() => {
    setSessaoDetalhe(null);
    setSelectedRoomId(null);
  }, []);

  const handleJobFilterChange = useCallback((field: JobFilterField, value: string) => {
    setJobFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  useEffect(() => {
    if (activeTab !== 'sessoes') return;
    fetchSessoes();
    const interval = setInterval(fetchSessoes, 15000);
    return () => clearInterval(interval);
  }, [activeTab, fetchSessoes]);

  useEffect(() => {
    if (activeTab === 'jobs') {
      fetchJobs();
    }
  }, [activeTab, jobFilters, fetchJobs]);

  return {
    sessoes,
    jobs,
    sessaoDetalhe,
    loading,
    error,
    activeTab,
    setActiveTab,
    jobFilters,
    handleJobFilterChange,
    selectedRoomId,
    fetchSessoes,
    fetchJobs,
    fetchSessaoDetalhe,
    retryJob,
    closeSessaoDetalhe,
  };
}
