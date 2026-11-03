// src/utils/bonusTracos.ts
export interface VantagemDesvantagemRef { id?: number | string; nome?: string; }

/** Vantagens/desvantagens que uma raça ou classe concede no campo `bonus` (objeto ou JSON serializado). */
export function parseBonusVantagens(bonus: unknown): { vantagens: VantagemDesvantagemRef[]; desvantagens: VantagemDesvantagemRef[] } {
  const obj = typeof bonus === 'string'
    ? (() => { try { return JSON.parse(bonus); } catch { return null; } })()
    : bonus;
  if (!obj || typeof obj !== 'object') return { vantagens: [], desvantagens: [] };
  const o = obj as { vantagens?: unknown; desvantagens?: unknown };
  return {
    vantagens: Array.isArray(o.vantagens) ? (o.vantagens as VantagemDesvantagemRef[]) : [],
    desvantagens: Array.isArray(o.desvantagens) ? (o.desvantagens as VantagemDesvantagemRef[]) : [],
  };
}
