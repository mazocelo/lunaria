// src/Pages/Personagem/Wizard/stages/criacao.ts
export type FalhaPosCriacao = 'magias' | 'retrato' | 'background';

/** Passo depois do POST: falha não desfaz a criação, mas fica registrada para o modal (A36). */
export async function passoNaoBloqueante(falhas: FalhaPosCriacao[], tipo: FalhaPosCriacao, fn: () => Promise<unknown>): Promise<boolean> {
  try { await fn(); return true; } catch (err) { console.warn(`[wizard] ${tipo} não gravado`, err); falhas.push(tipo); return false; }
}

/** O personagem já existe; erro no reload da lista não pode virar erro de criação (A35). */
export async function recarregarSemBloquear(fn: () => Promise<unknown>): Promise<void> {
  try { await fn(); } catch (err) { console.warn('[wizard] lista de personagens não recarregou', err); }
}
