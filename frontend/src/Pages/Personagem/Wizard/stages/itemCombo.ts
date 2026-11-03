// src/Pages/Personagem/Wizard/stages/itemCombo.ts
export interface ItemCombo { nome: string; motivo: string | null; raridade: string | null; tipo: string | null; dano: string | null; preco: number | null; peso: number | null; }

const texto = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const numero = (v: unknown) => { const n = Number(v); return v != null && v !== '' && Number.isFinite(n) ? n : null; };

/**
 * Item do combo-preview (payload `unknown`): lê só o que existir (G-07/L-18).
 * O combo traz só `{ id, nome, motivo }`; raridade, tipo, dano, preço e peso vêm do
 * `catalogo_editavel.equipamentos` da mesma resposta (nomes `categoria`, `dano_base`, `preco_sugerido`).
 */
export function lerItemCombo(b: Record<string, unknown>): ItemCombo {
  return {
    nome: texto(b.nome) ?? 'Item',
    motivo: texto(b.motivo),
    raridade: texto(b.raridade),
    tipo: texto(b.tipo) ?? texto(b.categoria),
    dano: texto(b.dano) ?? texto(b.dano_base),
    preco: numero(b.preco ?? b.valor ?? b.preco_sugerido),
    peso: numero(b.peso),
  };
}
