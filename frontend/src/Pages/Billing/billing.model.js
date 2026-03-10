import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/ApiClient';
import { useAuth } from '../../contexts/AuthContext';

export function useBillingModel() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usage, setUsage] = useState(null);
  const [globalUsage, setGlobalUsage] = useState(null);
  const [viewMode, setViewMode] = useState('pessoal'); // 'pessoal' | 'global'
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const carregarUsage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;

      const queryString = new URLSearchParams(params).toString();
      const suffix = queryString ? `?${queryString}` : '';

      const { data } = await apiClient.get(`/billing/usage${suffix}`);
      if (data.success) setUsage(data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar consumo');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  const carregarGlobal = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;

      const queryString = new URLSearchParams(params).toString();
      const suffix = queryString ? `?${queryString}` : '';

      const { data } = await apiClient.get(`/billing/global${suffix}`);
      if (data.success) setGlobalUsage(data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar consumo global');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, dateRange]);

  useEffect(() => {
    if (viewMode === 'pessoal') {
      carregarUsage();
    } else if (viewMode === 'global' && isAdmin) {
      carregarGlobal();
    }
  }, [viewMode, carregarUsage, carregarGlobal, isAdmin]);

  const handleDateChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilter = () => {
    if (viewMode === 'pessoal') carregarUsage();
    else carregarGlobal();
  };

  return {
    loading,
    error,
    usage,
    globalUsage,
    viewMode,
    setViewMode,
    dateRange,
    handleDateChange,
    handleApplyFilter,
    isAdmin,
  };
}
