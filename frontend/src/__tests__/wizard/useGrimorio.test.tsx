// src/__tests__/wizard/useGrimorio.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { act } from 'react';
import { montar } from '../helpers/montar';
import { useGrimorio } from '../../Pages/Personagem/Wizard/hooks/useGrimorio';

const get = vi.fn();
vi.mock('../../services/index', () => ({ apiClient: { get: (url: string) => get(url) } }));

describe('useGrimorio.recarregarGrimorio', () => {
  it('"Tentar de novo" busca de novo a mesma classe, mesmo depois de carregada', async () => {
    get.mockImplementation((url: string) => Promise.resolve(url.includes('/slots') ? { slots: 2 } : [{ id: 1, nome: 'Luz' }]));
    let api: ReturnType<typeof useGrimorio> | null = null;
    const Sonda = () => { api = useGrimorio({}); return null; };
    const m = montar(<Sonda />);
    await act(async () => { await api!.carregarGrimorio(5); });
    expect(get).toHaveBeenCalledTimes(2);
    await act(async () => { await api!.carregarGrimorio(5); });
    expect(get).toHaveBeenCalledTimes(2);
    get.mockImplementation((url: string) => Promise.resolve(url.includes('/slots') ? { slots: 3 } : []));
    await act(async () => { api!.recarregarGrimorio(5); await Promise.resolve(); await Promise.resolve(); });
    expect(get).toHaveBeenCalledTimes(4);
    expect(api!.grimorioSlots).toBe(3);
    m.desmontar();
  });
});
