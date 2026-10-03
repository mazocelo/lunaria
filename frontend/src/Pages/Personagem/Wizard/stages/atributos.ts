// src/Pages/Personagem/Wizard/stages/atributos.ts
import { Brain, ShieldCheck, Sparkles, Swords, Target, Zap, type LucideIcon } from 'lucide-react';

export interface AtributoLunaria { chave: string; rotulo: string; abrev: string; icone: LucideIcon; dica: string; }

/** Ordem da ficha pronta (personagem-ver.model.ts LUNARIA_ATTRS). Tiles e radar usam a mesma. */
export const ATRIBUTOS_LUNARIA: AtributoLunaria[] = [
  { chave: 'forca', rotulo: 'Força', abrev: 'FOR', icone: Swords, dica: 'Dano corpo a corpo, carga e testes de força.' },
  { chave: 'inteligencia', rotulo: 'Inteligência', abrev: 'INT', icone: Brain, dica: 'Magia arcana, investigação e conhecimento.' },
  { chave: 'constituicao', rotulo: 'Constituição', abrev: 'CON', icone: ShieldCheck, dica: 'Pontos de vida e resistência à fadiga.' },
  { chave: 'agilidade', rotulo: 'Agilidade', abrev: 'AGI', icone: Zap, dica: 'Esquiva, iniciativa e movimento.' },
  { chave: 'destreza', rotulo: 'Destreza', abrev: 'DES', icone: Target, dica: 'Ataques à distância, furtividade e trabalhos manuais.' },
  { chave: 'carisma', rotulo: 'Carisma', abrev: 'CAR', icone: Sparkles, dica: 'Persuasão, intimidação e liderança.' },
];

export function modificadorLunaria(valor: number): number {
  return Math.floor((valor - 10) / 2);
}

/** PV no nível 1, mesma fórmula de calcularHPMaximo (src/utils/rpgHelpers.ts). mult_raca padrão 5. */
export function pvEstimado(constituicaoFinal: number, multRaca: number | null | undefined): number {
  return (multRaca ?? 5) * (1 + Math.max(1, modificadorLunaria(constituicaoFinal)));
}

const DND_FAIXA: Array<[string, string]> = [['STR', 'FOR'], ['DEX', 'DES'], ['CON', 'CON'], ['INT', 'INT'], ['WIS', 'SAB'], ['CHA', 'CAR']];

/** Pílulas da faixa do herói (N-01): D&D com FOR..CAR do próprio sistema, "—" enquanto não atribuído. */
export function siglasDaFaixa(sistema: string, lunaria: Record<string, number>, dnd: Record<string, number | null>): Array<{ sigla: string; valor: number | null }> {
  if (sistema === 'dnd5e') return DND_FAIXA.map(([k, sigla]) => ({ sigla, valor: dnd[k] ?? null }));
  return ATRIBUTOS_LUNARIA.map(({ chave, abrev }) => ({ sigla: abrev, valor: lunaria[chave] ?? null }));
}
