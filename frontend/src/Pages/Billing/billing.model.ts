import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/ApiClient';
import { useAuth } from '../../contexts/AuthContext';

export interface BillingUsageRow {
  provider?: string;
  tipo?: string;
  nome?: string;
  chamadas?: number;
  input_tokens?: number;
  output_tokens?: number;
  caracteres?: number;
  custo_usd?: number;
  dia?: string;
  custo?: number;
}

export interface BillingUsage {
  totais?: {
    chamadas?: number;
    custo_usd?: number;
    input_tokens?: number;
    output_tokens?: number;
    caracteres?: number;
  };
  porDia?: BillingUsageRow[];
  porProvider?: BillingUsageRow[];
  porTipo?: BillingUsageRow[];
  porUsuario?: BillingUsageRow[];
}

type ViewMode = 'pessoal' | 'global';
type DateField = 'from' | 'to';

export function useBillingModel() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<BillingUsage | null>(null);
  const [globalUsage, setGlobalUsage] = useState<BillingUsage | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('pessoal');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });

  const carregarUsage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;

      const queryString = new URLSearchParams(params).toString();
      const suffix = queryString ? `?${queryString}` : '';

      const response = await apiClient.get(`/billing/usage${suffix}`) as { success?: boolean; data?: BillingUsage };
      if (response.success) setUsage(response.data || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar consumo';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  const carregarGlobal = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;

      const queryString = new URLSearchParams(params).toString();
      const suffix = queryString ? `?${queryString}` : '';

      const response = await apiClient.get(`/billing/global${suffix}`) as { success?: boolean; data?: BillingUsage };
      if (response.success) setGlobalUsage(response.data || null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar consumo global';
      setError(message);
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

  const handleDateChange = (field: DateField, value: string) => {
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
