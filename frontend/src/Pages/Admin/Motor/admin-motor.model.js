import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../../services/ApiClient';

export function useAdminMotorModel() {
  const [sessoes, setSessoes] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [sessaoDetalhe, setSessaoDetalhe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('sessoes');
  const [jobFilters, setJobFilters] = useState({ status: '', queue: '' });
  const [selectedRoomId, setSelectedRoomId] = useState(null);

  const fetchSessoes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/admin/motor/sessoes');
      if (response.success) setSessoes(response.data || []);
    } catch (err) {
      setError(err.message || 'Erro ao carregar sessoes');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (jobFilters.status) params.status = jobFilters.status;
      if (jobFilters.queue) params.queue = jobFilters.queue;

      const queryString = new URLSearchParams(params).toString();
      const suffix = queryString ? `?${queryString}` : '';

      const response = await apiClient.get(`/admin/motor/jobs${suffix}`);
      if (response.success) setJobs(response.data || []);
    } catch (err) {
      setError(err.message || 'Erro ao carregar jobs');
    } finally {
      setLoading(false);
    }
  }, [jobFilters]);

  const fetchSessaoDetalhe = useCallback(async (roomId) => {
    setSelectedRoomId(roomId);
    setError(null);
    try {
      const response = await apiClient.get(`/admin/motor/sessoes/${roomId}`);
      if (response.success) setSessaoDetalhe(response.data || null);
    } catch (err) {
      setError(err.message || 'Erro ao carregar detalhe da sessao');
    }
  }, []);

  const retryJob = useCallback(async (jobId) => {
    setError(null);
    try {
      await apiClient.post(`/admin/motor/jobs/${jobId}/retry`);
      await fetchJobs();
    } catch (err) {
      setError(err.message || 'Erro ao reprocessar job');
    }
  }, [fetchJobs]);

  const closeSessaoDetalhe = useCallback(() => {
    setSessaoDetalhe(null);
    setSelectedRoomId(null);
  }, []);

  const handleJobFilterChange = useCallback((field, value) => {
    setJobFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  // Poll sessoes every 15 seconds when tab is active
  useEffect(() => {
    if (activeTab !== 'sessoes') return;
    fetchSessoes();
    const interval = setInterval(fetchSessoes, 15000);
    return () => clearInterval(interval);
  }, [activeTab, fetchSessoes]);

  // Fetch jobs when tab switches to jobs or filters change
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
